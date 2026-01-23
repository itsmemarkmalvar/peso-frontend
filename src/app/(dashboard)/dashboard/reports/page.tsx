"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, FileText, Calendar } from "lucide-react";

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

export default function ReportsPage() {
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

  // Mock attendance summary data
  const attendanceSummary = {
    present: 85,
    late: 12,
    absent: 3,
    total: 100,
  };

  const handlePreview = (reportType: "dtr" | "attendance" | "hours") => {
    setSelectedReport(reportType);
    setIsPreview(true);
    setIsDialogOpen(true);
  };

  const handleExportClick = (reportType: "dtr" | "attendance" | "hours") => {
    setSelectedReport(reportType);
    setIsPreview(false);
    setIsDialogOpen(true);
  };

  const handleExport = async (reportType: "dtr" | "attendance" | "hours", format: "pdf" | "excel") => {
    setIsExporting(true);
    try {
      const blob = await exportReport(reportType, format, {
        start_date: startDate,
        end_date: endDate,
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!selectedReport) return;
    
    try {
      let response;
      if (selectedReport === "dtr") {
        response = await getDTRReport({ start_date: startDate, end_date: endDate, format: "json" });
      } else if (selectedReport === "attendance") {
        response = await getAttendanceReport({ start_date: startDate, end_date: endDate, format: "json" });
      } else {
        response = await getHoursReport({ start_date: startDate, end_date: endDate, format: "json" });
      }
      
      // In a real implementation, you would display the preview data
      alert(`Preview generated for ${selectedReport} report from ${startDate} to ${endDate}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate preview");
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-600">
          Generate attendance summaries, DTRs, and export-ready files.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2.8fr)]">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Attendance summary</CardTitle>
              <CardDescription>
                Overview of present, late, and absent trends for the current period.
              </CardDescription>
            </div>
            <Badge className="bg-blue-600 text-white">Live Data</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Quick export options</CardTitle>
            <CardDescription>
              One-click access to the most common attendance reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ExportRow
              title="Daily Time Record (DTR)"
              description="Per intern or per group, ready for printing or digital submission."
              onPreview={() => handlePreview("dtr")}
              onExport={() => handleExportClick("dtr")}
            />
            <ExportRow
              title="Late / Absent Summary"
              description="List of late arrivals and absences for a selected period."
              onPreview={() => handlePreview("attendance")}
              onExport={() => handleExportClick("attendance")}
            />
            <ExportRow
              title="Hours Rendered"
              description="Total hours per intern per date range, grouped by company or supervisor."
              onPreview={() => handlePreview("hours")}
              onExport={() => handleExportClick("hours")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Report Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isPreview ? "Preview" : "Export"} {getReportTitle()}</DialogTitle>
            <DialogDescription>
              {isPreview 
                ? "Configure the report parameters and preview the data."
                : "Configure the report parameters and choose export format."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            {!isPreview && (
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
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(selectedReport!, "excel")}
                    disabled={isExporting}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            {isPreview && (
              <Button
                onClick={handleGeneratePreview}
                disabled={isExporting}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Generate Preview
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
}: {
  title: string;
  description: string;
  onPreview: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-3 py-3 text-xs text-slate-700 md:flex-row md:items-center md:justify-between">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500">{description}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-full border-slate-200 text-xs"
          onClick={onPreview}
        >
          <FileText className="h-3.5 w-3.5" />
          Preview
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-full border-slate-200 text-xs"
          onClick={onExport}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>
    </div>
  );
}

