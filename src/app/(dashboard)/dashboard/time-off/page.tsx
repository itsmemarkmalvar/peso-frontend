"use client";

import { CalendarDays, Plane, SunMedium } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const UPCOMING_TIME_OFF = [
  {
    label: "Special Non-Working Holiday",
    date: "Feb 25, 2026",
    description: "EDSA People Power Revolution Anniversary",
    type: "Holiday",
  },
  {
    label: "Approved OJT leave",
    date: "Jan 23, 2026",
    description: "Santos, Maria · Personal errand",
    type: "Leave",
  },
  {
    label: "Company event",
    date: "Jan 30, 2026",
    description: "No duty · Company-wide orientation",
    type: "Holiday",
  },
];

export default function TimeOffPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Time off</h1>
        <p className="text-sm text-slate-600">
          Track holidays, approved leaves, and upcoming absences.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2.8fr)]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">
              Upcoming holidays &amp; leaves
            </CardTitle>
            <CardDescription>
              Mock entries that show how approved absences and holidays will be
              summarized.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {UPCOMING_TIME_OFF.map((item) => (
              <div
                key={item.label + item.date}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 rounded-full bg-slate-100 p-1 text-slate-500">
                    {item.type === "Holiday" ? (
                      <SunMedium className="h-3.5 w-3.5" />
                    ) : (
                      <Plane className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    className={
                      item.type === "Holiday"
                        ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                        : "bg-red-50 text-red-800 ring-1 ring-red-200"
                    }
                  >
                    {item.type}
                  </Badge>
                  <span className="text-[11px] font-medium text-slate-600">
                    {item.date}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Leave calendar</CardTitle>
            <CardDescription>
              Placeholder for a calendar component that overlays holidays,
              approved leaves, and attendance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
              <div className="flex flex-col items-center gap-2 text-center">
                <CalendarDays className="h-5 w-5 text-slate-400" />
                <p>
                  Calendar component goes here. Integrate with your schedules
                  and attendance data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

