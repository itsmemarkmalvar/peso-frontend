"use client";

import { FileDown, Filter, FileSpreadsheet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TIMESHEET_ROWS = [
  {
    intern: "Dela Cruz, Juan",
    id: "INT-2026-014",
    date: "Jan 20, 2026",
    timeIn: "08:03 AM",
    timeOut: "05:02 PM",
    breakDuration: "01:00",
    status: "On time",
    tone: "success" as const,
  },
  {
    intern: "Santos, Maria",
    id: "INT-2026-032",
    date: "Jan 20, 2026",
    timeIn: "08:19 AM",
    timeOut: "05:01 PM",
    breakDuration: "00:48",
    status: "Late",
    tone: "warning" as const,
  },
  {
    intern: "Garcia, Paulo",
    id: "INT-2026-041",
    date: "Jan 20, 2026",
    timeIn: "—",
    timeOut: "—",
    breakDuration: "—",
    status: "Absent",
    tone: "destructive" as const,
  },
];

export default function TimesheetsPage() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Timesheets</h1>
          <p className="text-sm text-slate-600">
            Review intern Daily Time Records (DTR) and export for submission.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-full border-slate-200 text-xs"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-full border-slate-200 text-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-full border-slate-200 text-xs"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Daily Time Record</CardTitle>
          <CardDescription>
            Grid-style view with intern, date, in/out, breaks, and status. Hook
            this to your Laravel API for real records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)] gap-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
            <span>Intern</span>
            <span>Date</span>
            <span className="text-right">Time in</span>
            <span className="text-right">Time out</span>
            <span className="text-right">Break</span>
            <span className="text-right">Status</span>
          </div>
          <div className="space-y-2">
            {TIMESHEET_ROWS.map((row) => (
              <div
                key={`${row.id}-${row.date}`}
                className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)] items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700"
              >
                <div className="space-y-0.5">
                  <p className="truncate font-medium text-slate-900">
                    {row.intern}
                  </p>
                  <p className="text-[11px] text-slate-500">{row.id}</p>
                </div>
                <div className="text-slate-900">{row.date}</div>
                <div className="text-right tabular-nums text-slate-900">
                  {row.timeIn}
                </div>
                <div className="text-right tabular-nums text-slate-900">
                  {row.timeOut}
                </div>
                <div className="text-right tabular-nums text-slate-900">
                  {row.breakDuration}
                </div>
                <div className="flex justify-end">
                  <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            This is a layout-only grid. Replace with a virtualized table or
            paginated list when connected to real data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "warning" | "destructive";
}) {
  if (tone === "success") {
    return (
      <Badge className="bg-blue-50 text-blue-800 ring-1 ring-blue-200">
        {children}
      </Badge>
    );
  }
  if (tone === "warning") {
    return (
      <Badge className="bg-red-50 text-red-800 ring-1 ring-red-200">
        {children}
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-50 text-rose-800 ring-1 ring-rose-100">
      {children}
    </Badge>
  );
}

