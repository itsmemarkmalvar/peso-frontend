"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart3, Download, FileText, Calendar, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getDTRReport,
  getAttendanceReport,
  getHoursReport,
  exportReport,
} from "@/lib/api/reports";
import { getAttendanceList } from "@/lib/api/attendance";

type PeriodType = "daily" | "weekly" | "monthly";

/** Format date as YYYY-MM-DD in local time (avoids UTC shift from toISOString). */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD as local date (avoids UTC interpretation of new Date(s)). */
function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export default function ReportsPage() {
  const { user } = useAuth();
  const canExport = user?.role === "admin";
  const [selectedReport, setSelectedReport] = useState<"dtr" | "attendance" | "hours" | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Attendance summary state
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 0,
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Calculate date range based on period type (local timezone-safe)
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start: Date;
    const end = new Date(today);

    switch (periodType) {
      case "daily":
        start = new Date(today);
        break;
      case "weekly": {
        // Week starts Monday (ISO weekday); Sunday = 0 in getDay() → treat as end of previous week
        start = new Date(today);
        const dayOfWeek = start.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(start.getDate() - daysToMonday);
        start.setHours(0, 0, 0, 0);
        break;
      }
      case "monthly":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    return {
      start: toLocalDateString(start),
      end: toLocalDateString(end),
    };
  }, [periodType]);

  // Fetch attendance summary data
  useEffect(() => {
    let active = true;
    setIsLoadingSummary(true);
    setSummaryError(null);

    getAttendanceList({
      start_date: dateRange.start,
      end_date: dateRange.end,
    })
      .then((response) => {
        if (!active) return;
        
        // Handle paginated response (data.data) or direct array (data)
        let attendanceData: any[] = [];
        const rawData: unknown = response.data as unknown;
        if (Array.isArray(rawData)) {
          // Direct array response
          attendanceData = rawData;
        } else if (rawData && typeof rawData === "object") {
          // Check if it's a paginated response (Laravel pagination)
          const objectData = rawData as { data?: unknown; records?: unknown };
          if (Array.isArray(objectData.data)) {
            // Paginated response - extract the data array
            attendanceData = objectData.data;
          } else if (Array.isArray(objectData.records)) {
            // Alternative pagination structure
            attendanceData = objectData.records;
          } else {
            // Not an array, set empty array
            attendanceData = [];
          }
        }
        
        // Calculate summary statistics
        let present = 0;
        let late = 0;
        let absent = 0;
        
        if (Array.isArray(attendanceData)) {
          attendanceData.forEach((record) => {
            if (record.status === "approved") {
              // Use is_late field from the API if available
              if (record.is_late) {
                late++;
              } else {
                present++;
              }
            } else if (record.status === "rejected") {
              absent++;
            }
            // Pending records are not counted in summary
          });
        }
        
        const total = attendanceData.length;
        
        // Calculate percentages
        const presentPercent = total > 0 ? Math.round((present / total) * 100) : 0;
        const latePercent = total > 0 ? Math.round((late / total) * 100) : 0;
        const absentPercent = total > 0 ? Math.round((absent / total) * 100) : 0;
        
        setAttendanceSummary({
          present: presentPercent,
          late: latePercent,
          absent: absentPercent,
          total,
        });
        setIsLoadingSummary(false);
      })
      .catch((err) => {
        if (!active) return;
        setSummaryError(err instanceof Error ? err.message : "Failed to load attendance summary");
        setIsLoadingSummary(false);
        // Set default values on error
        setAttendanceSummary({
          present: 0,
          late: 0,
          absent: 0,
          total: 0,
        });
      });

    return () => {
      active = false;
    };
  }, [dateRange.start, dateRange.end]);

  // Quick export with default date ranges
  const handleQuickExport = async (
    reportType: "dtr" | "attendance" | "hours",
    format: "pdf" | "excel",
    period?: "today" | "week" | "month"
  ) => {
    setIsExporting(true);
    try {
      let exportStartDate = startDate;
      let exportEndDate = endDate;

      // Use period-based dates if provided
      if (period) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (period) {
          case "today":
            exportStartDate = today.toISOString().split("T")[0];
            exportEndDate = today.toISOString().split("T")[0];
            break;
          case "week":
            const weekStart = new Date(today);
            const dayOfWeek = weekStart.getDay();
            const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            weekStart.setDate(diff);
            exportStartDate = weekStart.toISOString().split("T")[0];
            exportEndDate = today.toISOString().split("T")[0];
            break;
          case "month":
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            exportStartDate = monthStart.toISOString().split("T")[0];
            exportEndDate = today.toISOString().split("T")[0];
            break;
        }
      }

      const blob = await exportReport(reportType, format, {
        start_date: exportStartDate,
        end_date: exportEndDate,
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const periodLabel = period ? `-${period}` : "";
      a.download = `${reportType}-report${periodLabel}-${exportStartDate}-to-${exportEndDate}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Close dialog if open
      setIsDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to export report";
      // Console diagnostic (use warn so Next.js doesn't show error overlay; cause already logged by exportReport)
      if (typeof console !== "undefined") {
        const log = console.warn ?? console.error;
        log(`[PESO Reports Export] UI caught: ${reportType} ${format} — ${errorMessage}`);
      }
      // Show user-friendly error message
      const isBackendNotImplemented = errorMessage.includes("not be fully implemented") || 
                                      errorMessage.includes("returned an error response");
      
      if (isBackendNotImplemented) {
        alert(`Export Failed\n\n${errorMessage}\n\nThe backend export functionality needs to be implemented. Please contact the development team.`);
      } else {
        alert(`Export Failed\n\n${errorMessage}\n\nPlease check:\n- Your internet connection\n- Backend server status\n- Date range validity`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = (reportType: "dtr" | "attendance" | "hours") => {
    setSelectedReport(reportType);
    setIsPreview(true);
    setIsDialogOpen(true);
    // Set default dates to current month
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(monthStart.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  const handleExportClick = (reportType: "dtr" | "attendance" | "hours") => {
    setSelectedReport(reportType);
    setIsPreview(false);
    setIsDialogOpen(true);
    // Set default dates to current month
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(monthStart.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  const handleExport = async (reportType: "dtr" | "attendance" | "hours", format: "pdf" | "excel") => {
    await handleQuickExport(reportType, format);
  };

  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleGeneratePreview = async () => {
    if (!selectedReport) return;
    
    setIsLoadingPreview(true);
    setPreviewData(null);
    
    try {
      let response;
      if (selectedReport === "dtr") {
        response = await getDTRReport({ start_date: startDate, end_date: endDate, format: "json" });
      } else if (selectedReport === "attendance") {
        response = await getAttendanceReport({ start_date: startDate, end_date: endDate, format: "json" });
      } else {
        response = await getHoursReport({ start_date: startDate, end_date: endDate, format: "json" });
      }
      
      setPreviewData(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate preview";
      alert(`Preview failed: ${errorMessage}\n\nNote: The backend report endpoints may not be fully implemented yet.`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const getReportTitle = () => {
    switch (selectedReport) {
      case "dtr":
        return "Daily Time Record (DTR)";
      case "attendance":
        return "Late / Absent Summary";
      case "hours":
        return "Hours Rendered";
      default:
        return "Report";
    }
  };

  const renderPreviewTable = (reportType: "dtr" | "attendance" | "hours" | null, data: any) => {
    if (!data || !reportType) return null;

    // Extract the actual data array from the response
    const reportData = Array.isArray(data.data) ? data.data : data;
    const summary = data.summary || {};

    if (!Array.isArray(reportData) || reportData.length === 0) {
      return (
        <div className="p-4 text-center text-sm text-slate-500">
          No data available for the selected date range.
        </div>
      );
    }

    if (reportType === "dtr") {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Day</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Intern Name</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Student ID</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Clock In</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Clock Out</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Hours</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.slice(0, 20).map((record: any, index: number) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700">{record.date || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-600">{record.day || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-700">{record.intern_name || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-600">{record.student_id || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-600">{record.clock_in || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-600">{record.clock_out || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-700">{record.total_hours || 0}</td>
                  <td className="px-3 py-2">
                    <Badge variant={record.status === "approved" ? "default" : "secondary"} className="text-xs">
                      {record.status || "N/A"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reportData.length > 20 && (
            <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
              Showing first 20 of {reportData.length} records
            </div>
          )}
        </div>
      );
    }

    if (reportType === "attendance") {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Intern Name</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Student ID</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Clock In</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Clock Out</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Late</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.slice(0, 20).map((record: any, index: number) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700">{record.date || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-700">{record.intern_name || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-600">{record.student_id || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-600">{record.clock_in || "N/A"}</td>
                  <td className="px-3 py-2 text-slate-600">{record.clock_out || "N/A"}</td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={
                        record.status === "present" || record.status === "approved"
                          ? "default"
                          : record.status === "absent"
                          ? "outline"
                          : "secondary"
                      }
                      className={
                        record.status === "absent"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "text-xs"
                      }
                    >
                      {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : "N/A"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {record.is_late ? (
                      <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reportData.length > 20 && (
            <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
              Showing first 20 of {reportData.length} records
            </div>
          )}
        </div>
      );
    }

    if (reportType === "hours") {
      // Hours report can have different structures based on group_by
      const firstRecord = reportData[0];
      const hasGroupBy = firstRecord && (firstRecord.intern_name || firstRecord.company || firstRecord.date);

      if (firstRecord?.intern_name) {
        // Grouped by intern
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Intern Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Student ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Total Hours</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Total Days</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Avg Hours/Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.slice(0, 20).map((record: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{record.intern_name || "N/A"}</td>
                    <td className="px-3 py-2 text-slate-600">{record.student_id || "N/A"}</td>
                    <td className="px-3 py-2 text-slate-700 font-medium">{record.total_hours || 0}</td>
                    <td className="px-3 py-2 text-slate-600">{record.total_days || 0}</td>
                    <td className="px-3 py-2 text-slate-600">{record.average_hours_per_day || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.length > 20 && (
              <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                Showing first 20 of {reportData.length} records
              </div>
            )}
          </div>
        );
      } else if (firstRecord?.company) {
        // Grouped by company
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Company</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Total Hours</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Total Days</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Intern Count</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Avg Hours/Intern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.slice(0, 20).map((record: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{record.company || "N/A"}</td>
                    <td className="px-3 py-2 text-slate-700 font-medium">{record.total_hours || 0}</td>
                    <td className="px-3 py-2 text-slate-600">{record.total_days || 0}</td>
                    <td className="px-3 py-2 text-slate-600">{record.intern_count || 0}</td>
                    <td className="px-3 py-2 text-slate-600">{record.average_hours_per_intern || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.length > 20 && (
              <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                Showing first 20 of {reportData.length} records
              </div>
            )}
          </div>
        );
      } else {
        // Daily breakdown
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Intern Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Student ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.slice(0, 20).map((record: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{record.date || "N/A"}</td>
                    <td className="px-3 py-2 text-slate-700">{record.intern_name || "N/A"}</td>
                    <td className="px-3 py-2 text-slate-600">{record.student_id || "N/A"}</td>
                    <td className="px-3 py-2 text-slate-700 font-medium">{record.hours || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.length > 20 && (
              <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                Showing first 20 of {reportData.length} records
              </div>
            )}
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-600">
          Generate attendance summaries, DTRs, and export-ready files.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex-1">
            <CardTitle className="text-base">Attendance summary</CardTitle>
            <CardDescription>
              Overview of present, late, and absent trends for the selected period.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white">Live Data</Badge>
          </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              {/* Period Selector */}
              <div className="space-y-2">
                <Label htmlFor="period-type" className="text-xs font-semibold text-slate-700">
                  Report Period
                </Label>
                <Select
                  id="period-type"
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                  className="text-sm"
                >
                  <option value="daily">Daily (Today)</option>
                  <option value="weekly">Weekly (This Week)</option>
                  <option value="monthly">Monthly (This Month)</option>
                </Select>
                <p className="text-[11px] text-slate-500">
                  {periodType === "daily" && `Showing data for ${parseLocalDate(dateRange.end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                  {periodType === "weekly" && `Showing data from ${parseLocalDate(dateRange.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${parseLocalDate(dateRange.end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                  {periodType === "monthly" && `Showing data from ${parseLocalDate(dateRange.start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} to ${parseLocalDate(dateRange.end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                </p>
              </div>

              {/* Loading State */}
              {isLoadingSummary && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-slate-600">Loading attendance data...</span>
                </div>
              )}

              {/* Error State */}
              {summaryError && !isLoadingSummary && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                  <p className="text-sm text-red-800">{summaryError}</p>
                </div>
              )}

              {/* Summary Cards */}
              {!isLoadingSummary && !summaryError && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                      <p className="text-2xl font-bold text-green-900">{attendanceSummary.present}%</p>
                      <p className="text-xs text-green-700 mt-1">Present</p>
                    </div>
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-900">{attendanceSummary.late}%</p>
                      <p className="text-xs text-yellow-700 mt-1">Late</p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                      <p className="text-2xl font-bold text-red-900">{attendanceSummary.absent}%</p>
                      <p className="text-xs text-red-700 mt-1">Absent</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700">Total Records</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{attendanceSummary.total}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Attendance Reports</CardTitle>
          <CardDescription>
            Generate and preview attendance reports with custom date ranges.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ExportRow
            title="Daily Time Record (DTR)"
            description="Per intern or per group, ready for printing or digital submission."
            onPreview={() => handlePreview("dtr")}
            onExport={() => handleExportClick("dtr")}
            isExporting={isExporting}
            canExport={canExport}
          />
          <ExportRow
            title="Late / Absent Summary"
            description="List of late arrivals and absences for a selected period."
            onPreview={() => handlePreview("attendance")}
            onExport={() => handleExportClick("attendance")}
            isExporting={isExporting}
            canExport={canExport}
          />
          <ExportRow
            title="Hours Rendered"
            description="Total hours per intern per date range, grouped by company or supervisor."
            onPreview={() => handlePreview("hours")}
            onExport={() => handleExportClick("hours")}
            isExporting={isExporting}
            canExport={canExport}
          />
        </CardContent>
      </Card>

      {/* Report Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          onClose={() => setIsDialogOpen(false)}
          className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>{isPreview ? "Preview" : "Export"} {getReportTitle()}</DialogTitle>
            <DialogDescription>
              {isPreview 
                ? "Configure the report parameters and preview the data."
                : "Configure the report parameters and choose export format."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-xs font-semibold text-slate-700">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-xs font-semibold text-slate-700">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            {!isPreview && canExport && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Export Format</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(selectedReport!, "pdf")}
                    disabled={isExporting}
                    className="flex-1"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(selectedReport!, "excel")}
                    disabled={isExporting}
                    className="flex-1"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Excel
                  </Button>
                </div>
              </div>
            )}
            
            {/* Preview Data Display */}
            {isPreview && previewData && (
              <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                <Label className="text-xs font-semibold text-slate-700">Preview Data</Label>
                <div className="min-h-[400px] max-h-[60vh] overflow-y-auto overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  {renderPreviewTable(selectedReport, previewData)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setPreviewData(null);
              }}
              disabled={isExporting || isLoadingPreview}
            >
              Cancel
            </Button>
            {isPreview && (
              <Button
                onClick={handleGeneratePreview}
                disabled={isExporting || isLoadingPreview}
                className="gap-2"
              >
                {isLoadingPreview ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Generate Preview
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExportRow({
  title,
  description,
  onPreview,
  onExport,
  isExporting,
  canExport = true,
}: {
  title: string;
  description: string;
  onPreview: () => void;
  onExport: () => void;
  isExporting?: boolean;
  canExport?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-3 text-xs text-slate-700">
      <div className="flex flex-col gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-[11px] text-slate-500">{description}</p>
        </div>
        <div className={`grid gap-2 ${canExport ? "grid-cols-2" : "grid-cols-1"}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-full border-slate-200 text-xs"
            onClick={onPreview}
            disabled={isExporting}
          >
            <FileText className="h-3.5 w-3.5" />
            Preview
          </Button>
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full border-slate-200 text-xs"
              onClick={onExport}
              disabled={isExporting}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

