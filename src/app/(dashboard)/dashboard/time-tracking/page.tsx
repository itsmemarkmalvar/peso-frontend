"use client";

import { useEffect, useState, useMemo } from "react";
import { Clock3, TrendingUp, TrendingDown, CheckCircle2, Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

export default function TimeTrackingPage() {
  const [hoursRows, setHoursRows] = useState<HoursRow[]>([]);
  const [allInterns, setAllInterns] = useState<AdminIntern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterGroup, setFilterGroup] = useState<string>("");

  useEffect(() => {
    let active = true;

    Promise.all([getAdminInterns(), getAttendanceList()])
      .then(([internsResponse, attendanceResponse]) => {
        if (!active) return;

        const interns = internsResponse;
        setAllInterns(interns);
        // API may return { data: [...] } or { data: { data: [...], ... } } (paginated)
        const raw = (attendanceResponse as { data?: { data?: Attendance[] } | Attendance[] }).data;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        const attendanceData = list.map((a) => ({
          intern_id: a.intern_id,
          total_hours: a.total_hours,
          status: a.status,
        }));

        const rows = buildHoursRows(interns, attendanceData);
        setHoursRows(rows);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setHoursRows([]);
        setAllInterns([]);
        setError(err instanceof Error ? err.message : "Failed to load hours data.");
        setIsLoading(false);
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
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getCompletionBadgeClass(row.completion_percentage)}`}>
                          {row.completion_percentage}%
                        </Badge>
                        {row.completion_percentage >= 100 && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

