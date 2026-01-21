"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Users,
  AlertCircle,
  CalendarDays,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATS = [
  {
    label: "Total interns",
    value: "128",
    delta: "+12 this month",
    trend: "up",
  },
  {
    label: "Active today",
    value: "94",
    delta: "87% clocked in",
    trend: "up",
  },
  {
    label: "Pending approvals",
    value: "18",
    delta: "7 overtime · 11 corrections",
    trend: "neutral",
  },
  {
    label: "Attendance rate",
    value: "96.2%",
    delta: "vs 94.8% last week",
    trend: "up",
  },
];

const TODAY_ATTENDANCE: Array<{
  name: string;
  id: string;
  timeIn: string;
  timeOut: string;
  status: string;
  statusTone: "success" | "warning" | "destructive";
}> = [
  {
    name: "Dela Cruz, Juan",
    id: "INT-2026-014",
    timeIn: "08:02 AM",
    timeOut: "05:01 PM",
    status: "On time",
    statusTone: "success",
  },
  {
    name: "Santos, Maria",
    id: "INT-2026-032",
    timeIn: "08:17 AM",
    timeOut: "—",
    status: "Late",
    statusTone: "warning",
  },
  {
    name: "Garcia, Paulo",
    id: "INT-2026-041",
    timeIn: "—",
    timeOut: "—",
    status: "Absent",
    statusTone: "destructive",
  },
];

const PENDING_ITEMS = [
  {
    id: "APP-2026-0041",
    type: "Overtime",
    intern: "Dela Cruz, Juan",
    submitted: "Today · 4:12 PM",
  },
  {
    id: "APP-2026-0039",
    type: "Correction",
    intern: "Santos, Maria",
    submitted: "Today · 9:34 AM",
  },
  {
    id: "APP-2026-0036",
    type: "Undertime",
    intern: "Reyes, Carla",
    submitted: "Yesterday · 5:48 PM",
  },
];

const QUICK_LINKS = [
  {
    title: "Manage interns",
    description: "View profiles, assignments, and status.",
    href: "/dashboard/people",
  },
  {
    title: "Attendance & schedules",
    description: "Review logs, adjust shifts, and manage holidays.",
    href: "/dashboard/work-schedules",
  },
  {
    title: "Reports & DTR",
    description: "Generate attendance reports for submission.",
    href: "/dashboard/reports",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <Card
            key={stat.label}
            className="border-slate-200 bg-gradient-to-br from-white to-slate-50/60"
          >
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide text-slate-500">
                {stat.label}
              </CardDescription>
              <CardTitle className="mt-1 text-2xl tabular-nums text-slate-900">
                {stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0 text-xs text-slate-600">
              <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 ring-1 ring-blue-200">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : stat.trend === "down" ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <Clock3 className="h-3 w-3" />
                )}
                <span>{stat.delta}</span>
              </div>
              <span className="hidden text-[11px] text-slate-500 sm:inline">
                Mock data for layout
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Today’s attendance snapshot */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Today&apos;s attendance</CardTitle>
              <CardDescription>
                Snapshot of recent clock-ins from interns.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full border-slate-200 text-xs"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              View calendar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-x-auto">
              <div className="grid min-w-[640px] grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)] gap-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
                <span>Intern</span>
                <span className="text-right">Time in</span>
                <span className="text-right">Time out</span>
                <span className="text-right">Status</span>
              </div>
              <div className="mt-2 space-y-2 min-w-[640px]">
                {TODAY_ATTENDANCE.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)] items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700"
                  >
                    <div className="space-y-0.5">
                      <p className="truncate font-medium text-slate-900">
                        {row.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{row.id}</p>
                    </div>
                    <div className="text-right tabular-nums text-slate-900">
                      {row.timeIn}
                    </div>
                    <div className="text-right tabular-nums text-slate-900">
                      {row.timeOut}
                    </div>
                    <div className="text-right">
                      <StatusChip tone={row.statusTone}>{row.status}</StatusChip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending approvals */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Pending approvals</CardTitle>
              <CardDescription>
                Corrections, overtime, and undertime awaiting action.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full border-slate-200 text-xs"
            >
              <FileText className="h-3.5 w-3.5" />
              Open queue
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {PENDING_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-500">
                        {item.id}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-red-200 bg-red-50 text-[11px] font-medium text-red-900"
                      >
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-slate-900">{item.intern}</p>
                    <p className="text-[11px] text-slate-500">
                      Submitted: {item.submitted}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full border-slate-200 text-[11px]"
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              These are sample items for layout only. Hook this card to the
              approvals API and detail view.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Card key={link.title} className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{link.title}</CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-slate-200 text-xs"
              >
                Open section
              </Button>
              <p className="text-[11px] text-slate-500">
                Ready to connect to routes.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-slate-50/80">
        <CardContent className="flex flex-col gap-3 px-4 py-3 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-700" />
            <p>
              This admin dashboard shows mock data only. Connect it to the
              Laravel API for real interns, attendance, and approvals.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <AlertCircle className="h-3 w-3" />
            <span>Design tuned for full-width content and minimal dead space.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusChip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "warning" | "destructive";
}) {
  const base =
    "inline-flex items-center justify-end gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium";

  if (tone === "success") {
    return (
      <span className={`${base} bg-blue-50 text-blue-800 ring-1 ring-blue-200`}>
        <CheckCircle2 className="h-3 w-3 text-blue-700" />
        {children}
      </span>
    );
  }
  if (tone === "warning") {
    return (
      <span className={`${base} bg-red-50 text-red-800 ring-1 ring-red-200`}>
        <Clock3 className="h-3 w-3 text-red-700" />
        {children}
      </span>
    );
  }
  return (
    <span className={`${base} bg-red-50 text-red-800 ring-1 ring-red-200`}>
      <AlertCircle className="h-3 w-3 text-red-700" />
      {children}
    </span>
  );
}

