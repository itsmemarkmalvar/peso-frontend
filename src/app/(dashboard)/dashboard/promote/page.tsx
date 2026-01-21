"use client";

import { useEffect, useState } from "react";
import { UserCheck, CheckCircle2, XCircle, Clock } from "lucide-react";

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

type PendingUser = {
  id: number;
  name: string;
  email: string;
  student_id: string;
  company_name: string;
  registered_date: string;
  status: "Pending" | "Approved" | "Rejected";
};

function buildPendingUsers(interns: AdminIntern[]): PendingUser[] {
  if (!interns.length) return [];

  const statuses: PendingUser["status"][] = ["Pending", "Pending", "Pending", "Approved", "Rejected"];

  return interns.slice(0, 20).map((intern, index) => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - index);

    return {
      id: intern.id,
      name: intern.name,
      email: intern.email,
      student_id: intern.student_id,
      company_name: intern.company_name,
      registered_date: baseDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: statuses[index % statuses.length],
    };
  });
}

export default function NewUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAdminInterns()
      .then((data) => {
        if (!active) return;
        setPendingUsers(buildPendingUsers(data));
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load pending users.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const pendingCount = pendingUsers.filter((u) => u.status === "Pending").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">New User Registrations</h1>
        <p className="text-sm text-slate-600">
          Review and approve new account signups before users can complete their registration.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Pending account approvals</CardTitle>
            <CardDescription>
              Users who have signed up are awaiting admin approval to complete their registration.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-50 text-amber-800 ring-1 ring-amber-200">
              <Clock className="mr-1 h-3 w-3" />
              {pendingCount} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
          {isLoading && (
            <p className="text-[11px] text-slate-500">Loading pending registrations…</p>
          )}

          {error && !isLoading && (
            <p className="text-[11px] text-red-600">
              {error} Unable to load pending users.
            </p>
          )}

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {!isLoading &&
              !error &&
              pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {user.email}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {user.student_id} · {user.company_name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Registered: {user.registered_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.status === "Pending" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 rounded-full border-green-200 bg-green-50 text-xs text-green-800 hover:bg-green-100"
                          disabled
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Accept
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 rounded-full border-red-200 bg-red-50 text-xs text-red-800 hover:bg-red-100"
                          disabled
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Badge
                        className={
                          user.status === "Approved"
                            ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                            : "bg-red-50 text-red-800 ring-1 ring-red-200"
                        }
                      >
                        {user.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

            {!isLoading && !error && pendingUsers.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No pending registrations. New signups will appear here for your review.
              </p>
            )}
          </div>

          <p className="flex items-center gap-2 text-[11px] text-slate-500">
            <UserCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>
              Wire the Accept/Reject buttons to your backend API to approve or decline new user registrations.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

