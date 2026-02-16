"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
import { getAdminInterns, getAdminFilterOptions, type AdminIntern, type AdminFilterOptions } from "@/lib/api/intern";
import { getApprovedHoursSummary } from "@/lib/api/attendance";
import certTemplatePng from "@/assets/images/CertOfCompletion.png";

type HoursRow = {
  intern_id: number;
  name: string;
  student_id: string;
  hours_rendered: number;
  /** From intern onboarding (required_hours). Null = not set yet by user. */
  total_hours: number | null;
  remaining_hours: number;
  completion_percentage: number | null;
};

function formatHours(hours: number): string {
  if (hours < 0) return "0h 0m";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function calculateHoursRendered(
  internId: number,
  approvedHoursByIntern: Map<number, number>
): number {
  return approvedHoursByIntern.get(internId) ?? 0;
}

function buildHoursRows(
  interns: AdminIntern[],
  internRequiredHours: Map<number, number> = new Map(),
  approvedHoursByIntern: Map<number, number> = new Map()
): HoursRow[] {
  if (!interns.length) return [];

  return interns.map((intern) => {
    const hoursRendered = calculateHoursRendered(intern.id, approvedHoursByIntern);
    // Required hours come only from intern onboarding (saved to intern.required_hours). No fallback.
    const totalHours = internRequiredHours.get(intern.id) ?? null;
    const remainingHours =
      totalHours !== null ? Math.max(0, totalHours - hoursRendered) : 0;
    const completionPercentage =
      totalHours != null && totalHours > 0
        ? Math.round((hoursRendered / totalHours) * 100)
        : null;

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

/** Certificate data for display and PDF export (PESO COC spec) */
type CertificateData = {
  userName: string;
  programName: string;
  totalRenderedTime: string;
  totalRenderedHours: number;
  completionDate: string;
  startDate: string;
  endDate: string;
  studentId: string;
};

function buildCertificateData(row: HoursRow, intern: AdminIntern | undefined): CertificateData {
  const internWithDates = intern as (AdminIntern & { start_date?: string | null; end_date?: string | null }) | undefined;
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";
  return {
    userName: String(row.name ?? ""),
    programName: String(intern?.course ?? "Internship"),
    totalRenderedTime: formatHours(row.hours_rendered),
    totalRenderedHours: row.hours_rendered,
    completionDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    startDate: formatDate(internWithDates?.start_date ?? null),
    endDate: formatDate(internWithDates?.end_date ?? null),
    studentId: String(row.student_id ?? ""),
  };
}

/** A4 landscape (PESO COC print-ready) */
const A4_LANDSCAPE_W_MM = 297;
const A4_LANDSCAPE_H_MM = 210;

/** Try JPG from public first, then PNG from assets. Returns dataUrl, format, and dimensions for aspect-ratio fit. */
function loadCertificateTemplate(): Promise<{
  dataUrl: string;
  format: "JPEG" | "PNG";
  width: number;
  height: number;
} | null> {
  const jpgUrl = typeof window !== "undefined" ? `${window.location.origin}/images/CertOfCompletion.jpg` : "";
  const pngUrl = certTemplatePng.src;

  const tryLoad = (url: string, format: "JPEG" | "PNG"): Promise<{ dataUrl: string; format: "JPEG" | "PNG"; width: number; height: number } | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const mime = format === "JPEG" ? "image/jpeg" : "image/png";
          resolve({
            dataUrl: canvas.toDataURL(mime),
            format,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  if (jpgUrl) {
    return tryLoad(jpgUrl, "JPEG").then((r) => r ?? tryLoad(pngUrl, "PNG"));
  }
  return tryLoad(pngUrl, "PNG");
}

async function exportCertificateAsPdf(data: CertificateData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = A4_LANDSCAPE_W_MM;
  const pageH = A4_LANDSCAPE_H_MM;
  const centerX = pageW / 2;
  // Fine-tune overlay alignment to the template (mm)
  // Negative X moves left; positive Y moves down.
  const textOffsetX = -25;
  const textOffsetY = -1;
  const textX = centerX + textOffsetX;

  // --- LAYOUT: Safe zones (mm). Middle content BELOW "CERTIFICATE OF COMPLETION" title; footer in lower zone. ---
  const middleTop = 100;
  const footerTop = 168;
  const lineHeight = 7.5;
  const lineHeightSmall = 6.5;
  const nameToBodyGap = 10;
  // Fixed Y for intern name (and all content below). Change this without affecting the intro line.
  const nameBlockTop = middleTop + textOffsetY;
  // Intro line position only — change these without moving the name or other text.
  const introLineY = nameBlockTop - 18;
  const introLineX = textX;
  const introFontSize = 19;

  const template = await loadCertificateTemplate();
  if (template) {
    const pxToMm = 25.4 / 96;
    const wMm = template.width * pxToMm;
    const hMm = template.height * pxToMm;
    const scale = Math.min(pageW / wMm, pageH / hMm);
    const drawW = wMm * scale;
    const drawH = hMm * scale;
    const x = (pageW - drawW) / 2;
    const yImg = (pageH - drawH) / 2;
    doc.addImage(template.dataUrl, template.format, x, yImg, drawW, drawH);
  }

  doc.setTextColor(30, 30, 30);

  // Format hours for display (integer or one decimal; no long decimals)
  const hoursDisplay =
    data.totalRenderedHours % 1 === 0
      ? String(Math.round(data.totalRenderedHours))
      : data.totalRenderedHours.toFixed(1);

  // --- MIDDLE CONTENT (strict order, all centered; below template title) ---

  // Intro line — independent position; change introLineY / introLineX / introFontSize without moving name or rest.
  doc.setFont("sans-serif", "normal");
  doc.setFontSize(introFontSize);
  doc.text("This is to certify that", introLineX, introLineY, { align: "center" });

  // Name and all content below use a fixed starting Y (nameBlockTop).
  let y = nameBlockTop;
  // 1. Intern Name — BOLD, ALL CAPS, dominant
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text(data.userName.toUpperCase(), textX, y, { align: "center" });
  y += lineHeight + nameToBodyGap;

  // 2. Completion statement  
  doc.setFont("sans-serif", "normal");
  doc.setFontSize(19);
  doc.text(
    `has complete ${hoursDisplay} hours of On-the-Job Training`,
    textX,
    y,
    { align: "center" }
  );
  y += lineHeight;

  // 3. Office line
  doc.text("at the Public Employment Service Office (PESO) Cabuyao", textX, y, { align: "center" });
  y += lineHeight;

  // 4. Date range
  doc.text(`from ${data.startDate} to ${data.endDate}`, textX, y, { align: "center" });
  y += lineHeight;

  // 5. Issuance statement
  doc.text(
    `Given this ${data.completionDate} at 3rd Floor, Retail Plaza, Poblacion Dos,`,
    textX,
    y,
    { align: "center" }
  );
  y += lineHeightSmall;

  // 6. Location line
  doc.text("City of Cabuyao Laguna.", textX, y, { align: "center" });
  y += lineHeight;

  // 7. Purpose statement
  doc.text("This Certification is issued for whatever purpose it may serve.", textX, y, { align: "center" });
  y = footerTop;

  // --- FOOTER SECTION — Signatory (bottom center, lower safe zone) ---
  doc.setFont("sans-serif", "bold");
  doc.setFontSize(17);
  doc.text("JOSE KARLOS B. HAIN, CPS, CEMP, CEC, CLC", textX, y, { align: "center" });
  y += lineHeightSmall + 3;

  doc.setFont("sans-serif", "normal");
  doc.text("EXECUTIVE ASSISTANT V", textX, y, { align: "center" });
  y += lineHeightSmall;

  doc.text("PESO Officer-in-Charge", textX, y, { align: "center" });

  doc.save(`Certificate-of-Completion-${data.userName.replace(/\s+/g, "-")}.pdf`);
}

export default function TimeTrackingPage() {
  const [hoursRows, setHoursRows] = useState<HoursRow[]>([]);
  const [allInterns, setAllInterns] = useState<AdminIntern[]>([]);
  const [filterOptions, setFilterOptions] = useState<AdminFilterOptions>({ roles: [], groups: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterGroup, setFilterGroup] = useState<string>("");
  const [certificateRow, setCertificateRow] = useState<HoursRow | null>(null);
  const [certificateOpen, setCertificateOpen] = useState(false);

  const fetchHoursData = useCallback((setLoading = false) => {
    let active = true;
    if (setLoading) {
      setIsLoading(true);
      setError(null);
    }

    Promise.all([getAdminInterns(), getApprovedHoursSummary(), getAdminFilterOptions()])
      .then(([internsResponse, approvedHoursResponse, options]) => {
        if (!active) return;

        const interns = internsResponse;
        setAllInterns(interns);
        setFilterOptions(options ?? { roles: [], groups: [] });

        // Required hours come from intern onboarding only (saved via POST /interns/me).
        const requiredHoursByIntern = new Map<number, number>();
        interns.forEach((intern) => {
          if (typeof intern.required_hours === "number" && intern.required_hours > 0) {
            requiredHoursByIntern.set(intern.id, intern.required_hours);
          }
        });

        const approvedHoursByIntern = new Map<number, number>();
        (approvedHoursResponse.data || []).forEach((item) => {
          approvedHoursByIntern.set(item.intern_id, item.hours_rendered);
        });

        // Build hours rows with calculated data
        const rows = buildHoursRows(interns, requiredHoursByIntern, approvedHoursByIntern);
        setHoursRows(rows);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load hours data.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = fetchHoursData(true);
    const refreshIntervalMs = 5000;
    const intervalId = window.setInterval(() => fetchHoursData(false), refreshIntervalMs);
    const handleFocus = () => fetchHoursData(false);
    window.addEventListener("focus", handleFocus);

    return () => {
      cleanup?.();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchHoursData]);

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

  // Roles and groups from backend (controllers: UserRole enum + distinct company_name)
  const uniqueRoles = filterOptions.roles;
  const uniqueGroups = filterOptions.groups;

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

      // Department filter (groups = departments from backend)
      if (filterGroup && intern.department_name !== filterGroup) {
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
                placeholder="Search by name, student ID, email, course, department, or supervisor"
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
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-slate-600">
                Department
              </label>
              <Select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                placeholder="All Departments"
              >
                <option value="">All Departments</option>
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
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {row.total_hours != null ? formatHours(row.total_hours) : "Not set"}
                      </p>
                      {row.total_hours == null && (
                        <p className="text-[10px] text-amber-600">Set in intern onboarding</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Remaining</p>
                      <p className={`text-sm font-semibold tabular-nums ${
                        row.total_hours == null
                          ? "text-slate-500"
                          : row.remaining_hours <= 0
                          ? "text-green-700"
                          : row.remaining_hours <= row.total_hours * 0.25
                          ? "text-yellow-700"
                          : "text-slate-900"
                      }`}>
                        {row.total_hours != null ? formatHours(row.remaining_hours) : "—"}
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
                        className={`min-w-[72px] text-xs ${
                          row.completion_percentage != null && row.completion_percentage >= 100
                            ? "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                            : row.completion_percentage == null
                            ? "border-slate-200 text-slate-500"
                            : ""
                        }`}
                      >
                        {row.completion_percentage != null && row.completion_percentage >= 100 && (
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                        )}
                        {row.completion_percentage != null ? `${row.completion_percentage}%` : "Not set"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent
          onClose={() => setCertificateOpen(false)}
          className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0"
        >
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-center text-xl">Certificate of Completion</DialogTitle>
          </DialogHeader>
          {certificateRow && (
            <>
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <div className="rounded-xl border-2 border-amber-200/80 bg-gradient-to-b from-amber-50/80 to-white shadow-inner p-6 sm:p-8">
                  <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-amber-700/90">
                    {APP_CONFIG.name}
                  </p>
                  <p className="mb-6 text-center text-2xl font-bold tracking-tight text-slate-800">
                    Certificate of Completion
                  </p>
                  <p className="mb-6 text-base leading-relaxed text-slate-600">
                    This is to certify that{" "}
                    <span className="font-semibold text-slate-900">{certificateRow.name}</span> has successfully
                    completed the required hours for the{" "}
                    <span className="font-semibold text-slate-900">
                      {internMap.get(certificateRow.intern_id)?.course ?? "Internship"}
                    </span>{" "}
                    program.
                  </p>
                  <dl className="grid gap-3 border-t-2 border-amber-200/60 pt-4 sm:grid-cols-2">
                    <div className="flex justify-between gap-3 rounded-md bg-white/60 px-3 py-2">
                      <dt className="text-slate-500">Participant</dt>
                      <dd className="font-medium text-slate-900 text-right">{certificateRow.name}</dd>
                    </div>
                    <div className="flex justify-between gap-3 rounded-md bg-white/60 px-3 py-2">
                      <dt className="text-slate-500">Program</dt>
                      <dd className="font-medium text-slate-900 text-right">
                        {internMap.get(certificateRow.intern_id)?.course ?? "Internship"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 rounded-md bg-white/60 px-3 py-2">
                      <dt className="text-slate-500">Total Rendered Time</dt>
                      <dd className="font-medium text-slate-900 tabular-nums text-right">
                        {formatHours(certificateRow.hours_rendered)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 rounded-md bg-white/60 px-3 py-2">
                      <dt className="text-slate-500">Completion Date</dt>
                      <dd className="font-medium text-slate-900 text-right">
                        {buildCertificateData(certificateRow, internMap.get(certificateRow.intern_id)).completionDate}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 rounded-md bg-white/60 px-3 py-2 sm:col-span-2">
                      <dt className="text-slate-500">Student / Trainee ID</dt>
                      <dd className="font-medium text-slate-900 text-right">{certificateRow.student_id}</dd>
                    </div>
                  </dl>
                  <p className="mt-6 text-center text-xs italic text-slate-500">
                    This certificate was generated by the {APP_CONFIG.name} and is valid for official records.
                  </p>
                </div>
              </div>
              <DialogFooter className="flex-shrink-0 gap-2 border-t border-slate-200 bg-slate-50/50 px-6 py-4 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setCertificateOpen(false)}>
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const data = buildCertificateData(certificateRow, internMap.get(certificateRow.intern_id));
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
