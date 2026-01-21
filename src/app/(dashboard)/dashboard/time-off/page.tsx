"use client";

import { useEffect, useState } from "react";
import { Plane, SunMedium } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminInterns, type AdminIntern } from "@/lib/api/intern";

type TimeOffRow = {
  intern: string;
  id: string;
  date: string;
  reason: string;
  type: "Leave" | "Holiday";
  status: "Approved" | "Pending" | "Rejected";
};

function buildTimeOffRows(interns: AdminIntern[]): TimeOffRow[] {
  if (!interns.length) return [];

  const statuses: TimeOffRow["status"][] = ["Pending", "Approved", "Rejected"];

  return interns.slice(0, 20).map((intern, index) => {
    const status = statuses[index % statuses.length];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + index);

    return {
      intern: intern.name,
      id: intern.id.toString(),
      date: baseDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      reason: "Sample time off request",
      type: "Leave",
      status,
    };
  });
}

export default function TimeOffPage() {
  const [rows, setRows] = useState<TimeOffRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAdminInterns()
      .then((interns) => {
        if (!active) return;
        setRows(buildTimeOffRows(interns));
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load interns.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Time off requests</h1>
        <p className="text-sm text-slate-600">
          View OJT employees&apos; time off requests submitted for review.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">OJT employee requests</CardTitle>
          <CardDescription>
            Live list of OJT accounts. Replace the mock reasons and dates with
            real data from your time off tables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <p className="text-[11px] text-slate-500">Loading requests…</p>
          )}
          {error && !isLoading && (
            <p className="text-[11px] text-red-600">
              {error} Unable to load time off requests.
            </p>
          )}
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {!isLoading &&
              !error &&
              rows.map((item) => (
                <div
                  key={item.id + item.date}
                  className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 rounded-full bg-slate-100 p-1 text-slate-500">
                      {item.type === "Leave" ? (
                        <Plane className="h-3.5 w-3.5" />
                      ) : (
                        <SunMedium className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-slate-900">
                        {item.intern}
                      </p>
                      <p className="text-[11px] text-slate-500">{item.id}</p>
                      <p className="text-[11px] text-slate-500">
                        Reason: {item.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <Badge
                      className={
                        item.status === "Approved"
                          ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                          : item.status === "Pending"
                          ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                          : "bg-red-50 text-red-800 ring-1 ring-red-200"
                      }
                    >
                      {item.status}
                    </Badge>
                    <span className="text-[11px] font-medium text-slate-600">
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            {!isLoading && !error && rows.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No time off requests yet. Once interns start submitting, they will
                appear here.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

