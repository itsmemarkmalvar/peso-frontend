"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Users,
  AlertCircle,
  CalendarDays,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getAdminInterns, type AdminIntern } from "@/lib/api/intern";
import { getPendingApprovals, type ApprovalRequest } from "@/lib/api/approvals";
import { getLeaves, type LeaveRequest } from "@/lib/api/leaves";
import { getExcusedInterns } from "@/lib/api/schedule";
import { getTodayAttendanceAll, type Attendance } from "@/lib/api/attendance";

type AttendanceRow = {
  name: string;
  student_id: string;
  timeIn: string;
  timeOut: string;
  breakStart: string;
  breakEnd: string;
  status: string;
  statusTone: "success" | "warning" | "destructive";
};

type ExcusedRow = {
  name: string;
  student_id: string;
  reason: string;
  date: string;
};

type StatCard = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "neutral";
};

const DEFAULT_STATS: StatCard[] = [
  {
    label: "Total interns",
    value: "0",
    delta: "+0 this month",
    trend: "neutral" as const,
  },
  {
    label: "Active today",
    value: "0",
    delta: "Mock metric",
    trend: "neutral" as const,
  },
  {
    label: "Pending approvals",
    value: "0",
    delta: "Mock metric",
    trend: "neutral" as const,
  },
  {
    label: "Attendance rate",
    value: "0%",
    delta: "Mock metric",
    trend: "neutral" as const,
  },
];

/** Format time in Philippine timezone (Asia/Manila) - API sends UTC ISO strings */
function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    });
  } catch {
    return "—";
  }
}

function buildTodayAttendanceFromApi(
  interns: AdminIntern[],
  todayRecords: Attendance[]
): AttendanceRow[] {
  const byInternId = new Map<number, Attendance>();
  todayRecords.forEach((a) => byInternId.set(a.intern_id, a));

  return interns.slice(0, 20).map((intern) => {
    const att = byInternId.get(intern.id);
    if (!att) {
      return {
        name: intern.name,
        student_id: intern.student_id,
        timeIn: "—",
        timeOut: "—",
        breakStart: "—",
        breakEnd: "—",
        status: "Absent",
        statusTone: "destructive" as const,
      };
    }
    const hasClockIn = Boolean(att.clock_in_time);
    const hasClockOut = Boolean(att.clock_out_time);
    const onBreak = hasClockIn && !hasClockOut && Boolean(att.break_start) && !att.break_end;
    let status: string;
    let statusTone: "success" | "warning" | "destructive";
    if (!hasClockIn) {
      status = "Absent";
      statusTone = "destructive";
    } else if (onBreak) {
      status = "On break";
      statusTone = "warning";
    } else if (hasClockOut) {
      status = att.is_late ? "Late" : "On time";
      statusTone = att.is_late ? "warning" : "success";
    } else {
      status = att.is_late ? "Late" : "Clocked in";
      statusTone = att.is_late ? "warning" : "success";
    }
    return {
      name: intern.name,
      student_id: intern.student_id,
      timeIn: formatTime(att.clock_in_time),
      timeOut: formatTime(att.clock_out_time),
      breakStart: formatTime(att.break_start),
      breakEnd: formatTime(att.break_end),
      status,
      statusTone,
    };
  });
}

// Helper function to get day name from day of week number
function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}

const QUICK_LINKS = [
  {
    title: "Manage interns",
    description: "View profiles, assignments, and status.",
    href: "/dashboard/people",
  },
  {
    title: "Attendance & schedules",
    description: "Review logs, adjust shifts, and manage holidays.",
    href: "/dashboard/work-schedules",
  },
  {
    title: "Reports & DTR",
    description: "Generate attendance reports for submission.",
    href: "/dashboard/reports",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRow[]>([]);
  const [excusedRows, setExcusedRows] = useState<ExcusedRow[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(true);
  const [isLoadingExcused, setIsLoadingExcused] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);
  const [excusedError, setExcusedError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Load interns and today's attendance (real clock-in/out and break data from API)
    Promise.all([getAdminInterns(), getTodayAttendanceAll()])
      .then(([interns, todayResponse]) => {
        if (!active) return;
        const internCount = interns.length;
        const todayRecords = todayResponse.data ?? [];

        setStats((prev) => [
          { ...prev[0], value: internCount.toString() },
          prev[1],
          prev[2],
          prev[3],
        ]);

        const attendance = buildTodayAttendanceFromApi(interns, todayRecords);
        setTodayAttendance(attendance);

        // Calculate stats from real data
        const activeToday = attendance.filter((a) => a.timeIn !== "—").length;
        const totalInterns = interns.length;
        const attendanceRate = totalInterns > 0 ? Math.round((activeToday / totalInterns) * 100) : 0;

        setStats((prev) => [
          { ...prev[0], value: internCount.toString() },
          { ...prev[1], value: activeToday.toString(), delta: `${activeToday} clocked in today` },
          prev[2],
          { ...prev[3], value: `${attendanceRate}%`, delta: `${activeToday} of ${totalInterns} interns` },
        ]);

        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load attendance.");
        setIsLoading(false);
      });

    // Load pending approvals (attendance needing approval - real API only, no mock)
    getPendingApprovals()
      .then((response) => {
        if (!active) return;
        // API returns { data: { data: [...], pagination } } or { data: [...] }
        const raw = (response as { data?: { data?: ApprovalRequest[] } | ApprovalRequest[] }).data;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        const pending = list.filter((a) => a.status === "Pending");
        setPendingApprovals(pending.slice(0, 10));
        setStats((prev) => [
          prev[0],
          prev[1],
          { ...prev[2], value: pending.length.toString() },
          prev[3],
        ]);
        setIsLoadingApprovals(false);
      })
      .catch((err) => {
        if (!active) return;
        setPendingApprovals([]);
        setApprovalsError(err instanceof Error ? err.message : "Failed to load approvals.");
        setIsLoadingApprovals(false);
      });

    // Load today's excused interns with school classes
    // This checks intern school schedules, not leave requests
    // Leave requests (examinations, events, etc.) are handled separately
    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const todayString = today.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    getExcusedInterns(todayDayOfWeek)
      .then((excusedInterns) => {
        if (!active) return;
        // Map excused interns to ExcusedRow format
        const rows: ExcusedRow[] = excusedInterns.map((intern) => ({
          name: intern.name,
          student_id: intern.student_id,
          reason: `School class: ${getDayName(todayDayOfWeek)}`,
          date: todayString,
        }));
        setExcusedRows(rows);
        setIsLoadingExcused(false);
      })
      .catch((err) => {
        if (!active) return;
        setExcusedError(err instanceof Error ? err.message : "Failed to load excused interns.");
        setIsLoadingExcused(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-slate-200 bg-gradient-to-br from-white to-slate-50/60"
          >
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide text-slate-500">
                {stat.label}
              </CardDescription>
              <CardTitle className="mt-1 text-2xl tabular-nums text-slate-900">
                {stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0 text-xs text-slate-600">
              <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 ring-1 ring-blue-200">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : stat.trend === "down" ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <Clock3 className="h-3 w-3" />
                )}
                <span>{stat.delta}</span>
              </div>
              {stat.label === "Total interns" && (
                <span className="hidden text-[11px] text-slate-500 sm:inline">
                  From API
                </span>
              )}
              {stat.label === "Active today" && (
                <span className="hidden text-[11px] text-slate-500 sm:inline">
                  Clocked in
                </span>
              )}
              {stat.label === "Pending approvals" && (
                <span className="hidden text-[11px] text-slate-500 sm:inline">
                  Awaiting review
                </span>
              )}
              {stat.label === "Attendance rate" && (
                <span className="hidden text-[11px] text-slate-500 sm:inline">
                  Today&apos;s rate
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {/* Today’s attendance snapshot */}
        <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Today&apos;s attendance</CardTitle>
              <CardDescription>
                Live clock-in, clock-out, and break start/end from interns.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full border-slate-200 text-xs"
              onClick={() => router.push("/dashboard/timesheets")}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              View calendar
            </Button>
          </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && (
                <p className="text-[11px] text-slate-500">Loading attendance…</p>
              )}
              {error && !isLoading && (
                <p className="text-[11px] text-red-600">
                  {error} Unable to load today&apos;s attendance.
                </p>
              )}
            <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
                {!isLoading &&
                  !error &&
                  todayAttendance.map((row, index) => (
                  <div
                    key={`${row.name}-${index}`}
                    onClick={() => router.push("/dashboard/timesheets")}
                    className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700 cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 sm:flex shrink-0">
                      {row.name
                        .split(" ")[0]
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {row.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{row.student_id}</p>
                    </div>
                    <div className="text-right tabular-nums text-slate-900 text-sm shrink-0" title="Clock in">
                      {row.timeIn}
                    </div>
                    <div className="text-right tabular-nums text-slate-900 text-sm shrink-0" title="Clock out">
                      {row.timeOut}
                    </div>
                    <div className="text-right tabular-nums text-slate-500 text-[11px] shrink-0" title="Break start – Break end">
                      {row.breakStart === "—" && row.breakEnd === "—" ? "—" : `${row.breakStart} – ${row.breakEnd}`}
                    </div>
                    <div className="shrink-0">
                      <StatusChip tone={row.statusTone}>{row.status}</StatusChip>
                    </div>
                  </div>
                ))}
                {!isLoading && !error && todayAttendance.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    No attendance data yet. This will update once interns start
                    clocking in.
                  </p>
                )}
              </div>
          </CardContent>
        </Card>

        {/* Excused due to school schedule */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Excused due to school schedule</CardTitle>
              <CardDescription>
                OJT employees with scheduled school classes today.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full border-slate-200 text-xs"
              onClick={() => router.push("/dashboard/work-schedules")}
            >
              <FileText className="h-3.5 w-3.5" />
              View schedules
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingExcused && (
              <p className="text-[11px] text-slate-500">Loading excused interns…</p>
            )}
            {excusedError && !isLoadingExcused && (
              <p className="text-[11px] text-red-600">
                {excusedError} Unable to load excused interns.
              </p>
            )}
            {!isLoadingExcused && !excusedError && excusedRows.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No excused interns today.
              </p>
            )}
            {!isLoadingExcused && !excusedError && excusedRows.length > 0 && (
              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
                {excusedRows.map((row, index) => (
                  <div
                    key={`${row.name}-${index}`}
                    onClick={() => router.push("/dashboard/work-schedules")}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700 cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 sm:flex shrink-0">
                      {row.name
                        .split(" ")[0]
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {row.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{row.student_id}</p>
                    </div>
                    <div className="flex-1 min-w-0 text-sm text-slate-700 truncate">
                      {row.reason}
                    </div>
                    <div className="shrink-0 text-sm text-slate-600">
                      {row.date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending approvals */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Pending approvals</CardTitle>
              <CardDescription>
                Corrections, overtime, and undertime awaiting action.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full border-slate-200 text-xs"
              onClick={() => router.push("/dashboard/approvals")}
            >
              <FileText className="h-3.5 w-3.5" />
              Open queue
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingApprovals && (
              <p className="text-[11px] text-slate-500">Loading approvals…</p>
            )}
            {approvalsError && !isLoadingApprovals && (
              <p className="text-[11px] text-red-600">
                {approvalsError} Unable to load pending approvals.
              </p>
            )}
            {!isLoadingApprovals && !approvalsError && pendingApprovals.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No pending approvals yet. Once interns start sending requests,
                they will appear here.
              </p>
            )}
            {!isLoadingApprovals && !approvalsError && pendingApprovals.length > 0 && (
              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
                {pendingApprovals.map((item) => {
                  const getTypeBadgeClass = (type: string) => {
                    switch (type) {
                      case "Overtime":
                        return "border-blue-200 bg-blue-50 text-blue-900";
                      case "Correction":
                        return "border-amber-200 bg-amber-50 text-amber-900";
                      case "Late":
                        return "border-orange-200 bg-orange-50 text-orange-900";
                      case "Early out":
                        return "border-red-200 bg-red-50 text-red-900";
                      case "Undertime":
                        return "border-red-200 bg-red-50 text-red-900";
                      default:
                        return "border-slate-200 bg-slate-50 text-slate-900";
                    }
                  };
                  return (
                    <div
                      key={item.id}
                      onClick={() => router.push("/dashboard/approvals")}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700 cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 sm:flex shrink-0">
                        {item.intern_name
                          .split(" ")[0]
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.intern_name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.intern_student_id}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${getTypeBadgeClass(item.type)}`}
                        >
                          {item.type}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0 text-sm text-slate-700 truncate">
                        {item.reason_title || "No reason provided"}
                      </div>
                      <div className="shrink-0">
                        <Badge className="text-xs bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Card key={link.title} className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{link.title}</CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-slate-200 text-xs"
                onClick={() => router.push(link.href)}
              >
                Open section
              </Button>
              <p className="text-[11px] text-slate-500">
                {link.title}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-slate-50/80">
        <CardContent className="flex flex-col gap-3 px-4 py-3 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-700" />
            <p>
              Dashboard connected to API. All routes are functional and ready to use.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <AlertCircle className="h-3 w-3" />
            <span>All navigation links and buttons are connected to their respective pages.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusChip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "warning" | "destructive";
}) {
  const base =
    "inline-flex items-center justify-end gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium";

  if (tone === "success") {
    return (
      <span className={`${base} bg-blue-50 text-blue-800 ring-1 ring-blue-200`}>
        <CheckCircle2 className="h-3 w-3 text-blue-700" />
        {children}
      </span>
    );
  }
  if (tone === "warning") {
    return (
      <span className={`${base} bg-red-50 text-red-800 ring-1 ring-red-200`}>
        <Clock3 className="h-3 w-3 text-red-700" />
        {children}
      </span>
    );
  }
  return (
    <span className={`${base} bg-red-50 text-red-800 ring-1 ring-red-200`}>
      <AlertCircle className="h-3 w-3 text-red-700" />
      {children}
    </span>
  );
}

