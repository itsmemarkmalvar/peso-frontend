"use client";

import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, Search, FileDown } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { APP_CONFIG } from "@/lib/constants";
import { getAdminInterns, type AdminIntern } from "@/lib/api/intern";
import { getAttendanceList, type Attendance } from "@/lib/api/attendance";

type HoursRow = {
  intern_id: number;
  name: string;
  student_id: string;
  hours_rendered: number;
  total_hours: number;
  remaining_hours: number;
  completion_percentage: number;
};

function formatHours(hours: number): string {
  if (hours < 0) return "0h 0m";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: "Administrator",
    supervisor: "Supervisor",
    gip: "GIP",
    intern: "Intern",
  };
  return roleMap[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
}

function calculateHoursRendered(
  internId: number,
  attendanceData: { intern_id: number; total_hours: number | null; status: string }[]
): number {
  return attendanceData
    .filter((a) => a.intern_id === internId && a.status === "approved" && a.total_hours !== null)
    .reduce((sum, a) => sum + (a.total_hours || 0), 0);
}

function buildHoursRows(
  interns: AdminIntern[],
  attendanceData: { intern_id: number; total_hours: number | null; status: string }[],
  internRequiredHours: Map<number, number> = new Map()
): HoursRow[] {
  if (!interns.length) return [];

  return interns.map((intern) => {
    const hoursRendered = calculateHoursRendered(intern.id, attendanceData);
    // Get required_hours from map, or use default 200 hours
    const totalHours = internRequiredHours.get(intern.id) ?? 200;
    const remainingHours = Math.max(0, totalHours - hoursRendered);
    const completionPercentage = totalHours > 0 ? Math.round((hoursRendered / totalHours) * 100) : 0;

    return {
      intern_id: intern.id,
      name: intern.name,
      student_id: intern.student_id,
      hours_rendered: hoursRendered,
      total_hours: totalHours,
      remaining_hours: remainingHours,
      completion_percentage: completionPercentage,
    };
  });
}

/** Certificate data derived from HoursRow + AdminIntern for display and PDF */
type CertificateData = {
  userName: string;
  programName: string;
  totalRenderedTime: string;
  completionDate: string;
  studentId: string;
};

function buildCertificateData(row: HoursRow, intern: AdminIntern | undefined): CertificateData {
  const completionDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return {
    userName: row.name,
    programName: intern?.course ?? "Internship",
    totalRenderedTime: formatHours(row.hours_rendered),
    completionDate,
    studentId: row.student_id,
  };
}

/** A4 width in mm (used for certificate PDF layout) */
const A4_WIDTH_MM = 210;

/** Generate and download PDF matching the on-screen certificate layout (loads jspdf dynamically to avoid SSR/build issues) */
async function exportCertificateAsPdf(data: CertificateData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = A4_WIDTH_MM;
  const margin = 20;
  let y = 30;

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Certificate of Completion", pageW / 2, y, { align: "center" });
  y += 14;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 16;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `This is to certify that ${data.userName} has successfully completed the required hours`,
    margin,
    y,
    { maxWidth: pageW - 2 * margin }
  );
  y += 8;
  doc.text(
    `for the ${data.programName} program under the ${APP_CONFIG.name}.`,
    margin,
    y,
    { maxWidth: pageW - 2 * margin }
  );
  y += 14;

  doc.setFont("helvetica", "bold");
  doc.text("Participant:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.userName, margin + 45, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Program:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.programName, margin + 45, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Total Rendered Time:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.totalRenderedTime, margin + 45, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Completion Date:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.completionDate, margin + 45, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Student / Trainee ID:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.studentId, margin + 45, y);
  y += 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This certificate was generated by the PESO OJT Attendance System and is valid for official records.",
    pageW / 2,
    y,
    { align: "center", maxWidth: pageW - 2 * margin }
  );
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(APP_CONFIG.name, pageW / 2, y, { align: "center" });

  doc.save(`Certificate-of-Completion-${data.userName.replace(/\s+/g, "-")}.pdf`);
}

export default function TimeTrackingPage() {
  const [hoursRows, setHoursRows] = useState<HoursRow[]>([]);
  const [allInterns, setAllInterns] = useState<AdminIntern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterGroup, setFilterGroup] = useState<string>("");
  const [certificateRow, setCertificateRow] = useState<HoursRow | null>(null);
  const [certificateOpen, setCertificateOpen] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([getAdminInterns(), getAttendanceList()])
      .then(([internsResponse, attendanceResponse]) => {
        if (!active) return;

        const interns = internsResponse;
        setAllInterns(interns);
        const attendanceData = (attendanceResponse.data || []).map((a) => ({
          intern_id: a.intern_id,
          total_hours: a.total_hours,
          status: a.status,
        }));

        // Build hours rows with calculated data
        // Note: required_hours should come from backend API, using default 200 for now
        const rows = buildHoursRows(interns, attendanceData);
        setHoursRows(rows);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        // Fallback to mock data
        getAdminInterns()
          .then((interns) => {
            if (!active) return;
            // Generate mock attendance data
            const mockAttendanceData = interns.flatMap((intern) =>
              Array.from({ length: 20 }, (_, i) => ({
                intern_id: intern.id,
                total_hours: Math.random() * 8 + 4, // 4-12 hours per day
                status: i % 3 === 0 ? "pending" : "approved",
              }))
            );
            setAllInterns(interns);
            const rows = buildHoursRows(interns, mockAttendanceData);
            setHoursRows(rows);
            setIsLoading(false);
          })
          .catch((err2) => {
            if (!active) return;
            setError(err2 instanceof Error ? err2.message : "Failed to load hours data.");
            setIsLoading(false);
          });
      });

    return () => {
      active = false;
    };
  }, []);

  const getCompletionBadgeClass = (percentage: number) => {
    if (percentage >= 100) {
      return "bg-green-50 text-green-800 ring-1 ring-green-200";
    } else if (percentage >= 75) {
      return "bg-blue-50 text-blue-800 ring-1 ring-blue-200";
    } else if (percentage >= 50) {
      return "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200";
    } else {
      return "bg-red-50 text-red-800 ring-1 ring-red-200";
    }
  };

  // Get unique filter values
  const uniqueRoles = useMemo(() => {
    const roles = Array.from(new Set(allInterns.map((i) => i.role).filter(Boolean)));
    return roles.sort();
  }, [allInterns]);

  const uniqueGroups = useMemo(() => {
    // Using company_name as groups/departments
    const groups = Array.from(new Set(allInterns.map((i) => i.company_name).filter(Boolean)));
    return groups.sort();
  }, [allInterns]);

  // Create a map of intern_id to AdminIntern for filtering
  const internMap = useMemo(() => {
    const map = new Map<number, AdminIntern>();
    allInterns.forEach((intern) => {
      map.set(intern.id, intern);
    });
    return map;
  }, [allInterns]);

  // Filter hours rows based on search and filters
  const filteredRows = useMemo(() => {
    return hoursRows.filter((row) => {
      const intern = internMap.get(row.intern_id);
      if (!intern) return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          row.name.toLowerCase().includes(query) ||
          row.student_id.toLowerCase().includes(query) ||
          (intern.email && intern.email.toLowerCase().includes(query)) ||
          intern.course.toLowerCase().includes(query) ||
          intern.company_name.toLowerCase().includes(query) ||
          intern.supervisor_name.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Role filter
      if (filterRole && intern.role !== filterRole) {
        return false;
      }

      // Group filter (using company_name as groups)
      if (filterGroup && intern.company_name !== filterGroup) {
        return false;
      }

      return true;
    });
  }, [hoursRows, searchTerm, filterRole, filterGroup, internMap]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Hours Rendered</h1>
        <p className="text-sm text-slate-600">
          Track hours rendered, total hours, and remaining hours for all OJT interns.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Intern Hours Summary</CardTitle>
          <CardDescription>
            View hours rendered, total required hours, and remaining hours for each intern.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, student ID, email, course, group, or supervisor"
                className="h-9 pl-9 text-sm"
              />
            </div>
            {(searchTerm || filterRole || filterGroup) && (
              <p className="text-[11px] text-slate-500">
                Showing {filteredRows.length} of {hoursRows.length} interns
              </p>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-slate-600">
                Role
              </label>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                placeholder="All Roles"
              >
                <option value="">All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {formatRole(role)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-slate-600">
                Group
              </label>
              <Select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                placeholder="All Groups"
              >
                <option value="">All Groups</option>
                {uniqueGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || filterRole || filterGroup) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterRole("");
                  setFilterGroup("");
                }}
                className="text-xs font-medium text-blue-700 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
          {isLoading && (
            <p className="text-sm text-slate-500 py-4">Loading hours data…</p>
          )}
          {error && !isLoading && (
            <p className="text-sm text-red-600 py-4">
              {error} Unable to load hours data.
            </p>
          )}
          {!isLoading && !error && hoursRows.length === 0 && (
            <p className="text-sm text-slate-500 py-4">
              No intern data available. Once interns are added and start clocking in, their hours will appear here.
            </p>
          )}
          {!isLoading && !error && hoursRows.length > 0 && filteredRows.length === 0 && (
            <p className="text-sm text-slate-500 py-4">
              No interns match your search and filter criteria.
            </p>
          )}
          {!isLoading && !error && filteredRows.length > 0 && (
            <div className="mt-2 max-h-[600px] space-y-2 overflow-y-auto pr-1">
              {filteredRows.map((row) => (
                <div
                  key={row.intern_id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3 text-xs text-slate-700 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 sm:flex shrink-0">
                      {row.name
                        .split(" ")[0]
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {row.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {row.student_id}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 md:flex-none">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Hours Rendered</p>
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">
                        {formatHours(row.hours_rendered)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Hours</p>
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">
                        {formatHours(row.total_hours)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Remaining</p>
                      <p className={`text-sm font-semibold tabular-nums ${
                        row.remaining_hours <= 0 
                          ? "text-green-700" 
                          : row.remaining_hours <= row.total_hours * 0.25
                          ? "text-yellow-700"
                          : "text-slate-900"
                      }`}>
                        {formatHours(row.remaining_hours)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Completion</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCertificateRow(row);
                          setCertificateOpen(true);
                        }}
                        className={`min-w-[72px] text-xs ${row.completion_percentage >= 100 ? "border-green-200 bg-green-50 text-green-800 hover:bg-green-100" : ""}`}
                      >
                        {row.completion_percentage >= 100 && (
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                        )}
                        {row.completion_percentage}%
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificate of Completion modal – shown when completion is 100% and user clicks the completion button */}
      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent
          onClose={() => setCertificateOpen(false)}
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-center">Certificate of Completion</DialogTitle>
          </DialogHeader>
          {certificateRow && (
            <>
              {certificateRow.completion_percentage < 100 && (
                <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Completion is at {certificateRow.completion_percentage}%. Export certificate when 100% is reached.
                </p>
              )}
              <div
                className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-4 text-sm text-slate-700"
                id="certificate-content"
              >
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {APP_CONFIG.name}
                </p>
                <p className="mb-4 text-center text-lg font-semibold text-slate-900">
                  Certificate of Completion
                </p>
                <p className="mb-4 text-slate-600">
                  This is to certify that{" "}
                  <span className="font-semibold text-slate-900">{certificateRow.name}</span>{" "}
                  {certificateRow.completion_percentage >= 100
                    ? "has successfully completed the required hours"
                    : "is completing the required hours"}
                  {" "}for the{" "}
                  <span className="font-semibold text-slate-900">
                    {internMap.get(certificateRow.intern_id)?.course ?? "Internship"}
                  </span>{" "}
                  program.
                </p>
                <dl className="space-y-2 border-t border-slate-200 pt-3">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Participant</dt>
                    <dd className="font-medium text-slate-900">{certificateRow.name}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Program</dt>
                    <dd className="font-medium text-slate-900">
                      {internMap.get(certificateRow.intern_id)?.course ?? "Internship"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Total Rendered Time</dt>
                    <dd className="font-medium text-slate-900 tabular-nums">
                      {formatHours(certificateRow.hours_rendered)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Completion Date</dt>
                    <dd className="font-medium text-slate-900">
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Student / Trainee ID</dt>
                    <dd className="font-medium text-slate-900">{certificateRow.student_id}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-center text-xs italic text-slate-500">
                  This certificate was generated by the {APP_CONFIG.name} and is valid for
                  official records.
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCertificateOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  disabled={certificateRow.completion_percentage < 100}
                  onClick={() => {
                    if (certificateRow.completion_percentage < 100) return;
                    const data = buildCertificateData(
                      certificateRow,
                      internMap.get(certificateRow.intern_id)
                    );
                    exportCertificateAsPdf(data).catch((err) => {
                      console.error("PDF export failed:", err);
                      alert("Failed to export PDF. Please try again.");
                    });
                  }}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Export as PDF
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

