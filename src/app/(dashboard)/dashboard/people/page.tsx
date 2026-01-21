"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminInterns, type AdminIntern } from "@/lib/api/intern";

export default function PeoplePage() {
  const [people, setPeople] = useState<AdminIntern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAdminInterns()
      .then((data) => {
        if (!active) return;
        setPeople(data);
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
            Live list of intern accounts from the backend. Use filters and
            search later as needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
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
              people.map((person) => (
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
                      Intern
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
              This directory is powered by the Laravel `interns` and `users`
              tables. You can later add filters for company, course, or status.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

