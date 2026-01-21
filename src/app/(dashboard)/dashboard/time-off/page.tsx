"use client";

import { Plane, SunMedium } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TIME_OFF_REQUESTS = [
  {
    intern: "Santos, Maria",
    id: "INT-2026-032",
    date: "Jan 23, 2026",
    reason: "Personal errand",
    type: "Leave",
    status: "Pending" as const,
  },
  {
    intern: "Dela Cruz, Juan",
    id: "INT-2026-014",
    date: "Jan 30, 2026",
    reason: "Medical check-up",
    type: "Leave",
    status: "Approved" as const,
  },
  {
    intern: "Garcia, Paulo",
    id: "INT-2026-041",
    date: "Feb 2, 2026",
    reason: "Family event",
    type: "Leave",
    status: "Rejected" as const,
  },
];

export default function TimeOffPage() {
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
            Mock entries showing how interns&apos; time off requests will appear.
            Connect this list to your Laravel API for real data and actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {TIME_OFF_REQUESTS.map((item) => (
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
        </CardContent>
      </Card>
    </div>
  );
}

