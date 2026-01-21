"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminInterns, type AdminIntern } from "@/lib/api/intern";

export default function PromotePage() {
  const [candidates, setCandidates] = useState<AdminIntern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAdminInterns()
      .then((data) => {
        if (!active) return;
        setCandidates(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load users.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Promote users</h1>
        <p className="text-sm text-slate-600">
          Elevate trusted OJT users to have administrator access.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">OJT accounts eligible for promotion</CardTitle>
            <CardDescription>
              Live data from your interns &amp; users tables. Wire the Promote
              button to an admin-only API that updates the user&apos;s role.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>Only active non-admin users should appear here.</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
          {isLoading && (
            <p className="text-[11px] text-slate-500">Loading users…</p>
          )}

          {error && !isLoading && (
            <p className="text-[11px] text-red-600">
              {error} Unable to load promotion candidates.
            </p>
          )}

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {!isLoading &&
              !error &&
              candidates.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {user.company_name} · {user.email}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge className="bg-blue-50 text-blue-800 ring-1 ring-blue-200">
                          Intern
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 rounded-full border-slate-200 bg-white text-xs"
                      disabled
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Promote to admin
                    </Button>
                  </div>
                </div>
              ))}

            {!isLoading && !error && candidates.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No eligible users found. New OJT accounts will appear here once
                they are created in the system.
              </p>
            )}
          </div>

          <p className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>
              When wired to the backend, ensure only super-admins can promote other
              users and log all changes to the activity log.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

