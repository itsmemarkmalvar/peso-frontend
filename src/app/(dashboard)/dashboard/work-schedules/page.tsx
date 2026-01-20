"use client";

import { CalendarClock, Clock3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SCHEDULES = [
  {
    name: "Standard OJT Shift",
    details: "Mon – Fri · 8:00 AM – 5:00 PM · 1 hr break",
    tag: "Default",
  },
  {
    name: "Flexible Shift",
    details: "Mon – Sat · 6:00 AM – 8:00 PM · 8 hrs required",
    tag: "Flexible",
  },
];

export default function WorkSchedulesPage() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Work schedules</h1>
        <p className="text-sm text-slate-600">
          Define schedule templates and assign them to interns.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Schedule templates</CardTitle>
          <CardDescription>
            Sample definitions for standard and flexible shifts. Later, connect
            this to your schedules endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-700">
          {SCHEDULES.map((schedule) => (
            <div
              key={schedule.name}
              className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-white px-3 py-2 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 rounded-full bg-slate-100 p-1 text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900">
                    {schedule.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {schedule.details}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[11px]">
                  {schedule.tag}
                </Badge>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 ring-1 ring-slate-200">
                  <CalendarClock className="h-3 w-3" />
                  Template
                </span>
              </div>
            </div>
          ))}
          <p className="mt-2 text-[11px] text-slate-500">
            When wired to the backend, allow coordinators to add, edit, and
            assign these templates to interns and groups.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

