"use client";

import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, Search, Users, Loader2, UserCircle2 } from "lucide-react";

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
import { getAdminInterns, getAdminFilterOptions, type AdminIntern, type AdminFilterOptions } from "@/lib/api/intern";

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case "admin":
      return "bg-slate-100 text-slate-800 ring-1 ring-slate-200";
    case "supervisor":
      return "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200";
    case "gip":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    default:
      return "bg-[color:var(--dash-accent-soft)] text-[color:var(--dash-accent-strong)] ring-1 ring-[color:var(--dash-border)]";
  }
}

export default function PeoplePage() {
  const [people, setPeople] = useState<AdminIntern[]>([]);
  const [filterOptions, setFilterOptions] = useState<AdminFilterOptions>({ roles: [], groups: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterGroup, setFilterGroup] = useState<string>("");

  useEffect(() => {
    let active = true;

    Promise.all([getAdminInterns(), getAdminFilterOptions()])
      .then(([data, options]) => {
        if (!active) return;
        setPeople(data);
        setFilterOptions(options ?? { roles: [], groups: [] });
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load people.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          person.name.toLowerCase().includes(q) ||
          (person.email && person.email.toLowerCase().includes(q)) ||
          person.student_id.toLowerCase().includes(q) ||
          person.course.toLowerCase().includes(q) ||
          person.company_name.toLowerCase().includes(q) ||
          person.supervisor_name.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filterRole && person.role !== filterRole) return false;
      if (filterGroup && person.department_name !== filterGroup) return false;
      return true;
    });
  }, [people, searchTerm, filterRole, filterGroup]);

  const roleLabel = (role: string) =>
    filterOptions.roles.find((r) => r.value === role)?.label ?? (role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "—");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">People</h1>
        <p className="text-sm text-slate-600">
          Directory of OJT interns and accounts. Search and filter by role or department.
        </p>
      </div>

      <Card className="overflow-hidden border-[color:var(--dash-border)] bg-[color:var(--dash-card)] shadow-sm">
        <CardHeader className="border-b border-[color:var(--dash-border)] pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Directory</CardTitle>
              <CardDescription className="mt-1 text-sm text-slate-600">
                Live list from the backend. Filter by role and department.
              </CardDescription>
            </div>
            {!isLoading && !error && (
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                <Users className="h-4 w-4 text-slate-500" />
                <span>{people.length} total</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Search and filters */}
          {!isLoading && !error && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div className="relative flex-1 min-w-0 max-w-md">
                <label className="sr-only" htmlFor="people-search">Search directory</label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="people-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, email, student ID, course, company, supervisor…"
                  className="h-10 pl-10 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[140px] space-y-1.5">
                  <label htmlFor="people-role" className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </label>
                  <Select
                    id="people-role"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    placeholder="All roles"
                    className="h-10 text-sm"
                  >
                    <option value="">All roles</option>
                    {filterOptions.roles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="min-w-[160px] space-y-1.5">
                  <label htmlFor="people-dept" className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Department
                  </label>
                  <Select
                    id="people-dept"
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    placeholder="All departments"
                    className="h-10 text-sm"
                  >
                    <option value="">All departments</option>
                    {filterOptions.groups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </Select>
                </div>
                {(searchTerm || filterRole || filterGroup) && (
                  <span className="text-xs text-slate-500 sm:self-center">
                    Showing {filteredPeople.length} of {people.length}
                  </span>
                )}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <p className="text-sm text-slate-600">Loading directory…</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error} Showing empty directory.
            </div>
          )}

          {!isLoading && !error && people.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12">
              <UserCircle2 className="h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No people yet</p>
              <p className="text-xs text-slate-500">Seed the database or add OJT records to see them here.</p>
            </div>
          )}

          {!isLoading && !error && people.length > 0 && filteredPeople.length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
              No one matches your filters. Try changing search or filters.
            </div>
          )}

          {!isLoading && !error && filteredPeople.length > 0 && (
            <div className="space-y-1.5">
              <div className="max-h-[480px] space-y-1.5 overflow-y-auto pr-1" role="list">
                {filteredPeople.map((person) => (
                  <article
                    key={person.id}
                    role="listitem"
                    className="flex items-center gap-4 rounded-xl border border-[color:var(--dash-border)] bg-white p-3 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-accent-soft)] text-sm font-semibold text-[color:var(--dash-accent-strong)]">
                      {person.name.trim().charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {person.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {person.company_name || "—"} {person.student_id && `· ${person.student_id}`}
                      </p>
                      {person.email && (
                        <p className="truncate text-[11px] text-slate-400">{person.email}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <Badge className={`text-[11px] font-medium ${getRoleBadgeClass(person.role ?? "")}`}>
                        {roleLabel(person.role ?? "")}
                      </Badge>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                          person.is_active
                            ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                        }`}
                      >
                        <CheckCircle2 className={`h-3 w-3 ${person.is_active ? "text-emerald-600" : "text-slate-400"}`} />
                        {person.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {!isLoading && !error && people.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--dash-border)] bg-slate-50/50 px-3 py-2 text-[11px] text-slate-600">
              <Users className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span>Roles and departments are loaded from the backend.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

