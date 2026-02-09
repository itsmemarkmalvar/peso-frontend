"use client";

import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, Search, Users } from "lucide-react";

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">People</h1>
        <p className="text-sm text-slate-600">
          Directory of OJT interns connected to the Laravel database.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Directory</CardTitle>
          <CardDescription>
            Live list of intern accounts from the backend. Filter by role and department (from backend controllers).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
          {/* Search and filters from backend (roles + groups) */}
          {!isLoading && !error && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, student ID, course, department, supervisor"
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase text-slate-600">Role</label>
                  <Select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    placeholder="All Roles"
                  >
                    <option value="">All Roles</option>
                    {filterOptions.roles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase text-slate-600">Department</label>
                  <Select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    placeholder="All Departments"
                  >
                    <option value="">All Departments</option>
                    {filterOptions.groups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          )}
          {(searchTerm || filterRole || filterGroup) && !isLoading && !error && (
            <p className="text-[11px] text-slate-500">
              Showing {filteredPeople.length} of {people.length}
            </p>
          )}
          {isLoading && (
            <p className="text-[11px] text-slate-500">Loading people…</p>
          )}

          {error && !isLoading && (
            <p className="text-[11px] text-red-600">
              {error} Showing empty directory.
            </p>
          )}

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {!isLoading &&
              !error &&
              filteredPeople.map((person) => (
                <div
                  key={person.id}
                  className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-white px-3 py-2 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900">
                      {person.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {person.company_name} · {person.student_id}
                    </p>
                    {person.email && (
                      <p className="text-[11px] text-slate-500">{person.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[11px]">
                      {filterOptions.roles.find((r) => r.value === person.role)?.label ?? person.role ?? "—"}
                    </Badge>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 ring-1 ring-blue-200">
                      <CheckCircle2 className="h-3 w-3 text-blue-700" />
                      {person.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}

            {!isLoading && !error && people.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No interns found yet. Seed the database or add new OJT records.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>
              Roles and departments for filters come from the backend (UserRole enum and Department model).
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

