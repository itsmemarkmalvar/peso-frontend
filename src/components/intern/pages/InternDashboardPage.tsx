"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
} from "lucide-react"

import {
  getInternDashboard,
  type InternActivityItem,
  type InternDashboardStat,
} from "@/lib/api/intern"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type StatCard = {
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "neutral"
}

type ActivityRow = InternActivityItem & {
  status: string
  tone: "success" | "warning" | "destructive"
}

type ActivityStatus = Pick<ActivityRow, "status" | "tone">

type RequestItem = {
  id: string
  type: string
  status: "Pending" | "Approved" | "Rejected"
  submitted: string
}

const fallbackStats: InternDashboardStat[] = [
  { label: "Hours logged", value: "18h 40m", sub: "This week" },
  { label: "Last clock", value: "08:10 AM", sub: "Today" },
  { label: "Timesheets", value: "2 pending", sub: "Awaiting review" },
  { label: "Attendance rate", value: "96%", sub: "Last 30 days" },
]

const fallbackTimeline: InternActivityItem[] = [
  { time: "08:10 AM", title: "Clocked in", detail: "Main office" },
  { time: "12:05 PM", title: "Break start", detail: "Lunch" },
  { time: "12:45 PM", title: "Break end", detail: "Back to work" },
  { time: "05:02 PM", title: "Clocked out", detail: "Main office" },
]

const fallbackRequests: RequestItem[] = [
  {
    id: "REQ-2026-012",
    type: "Time correction",
    status: "Pending",
    submitted: "Today at 4:12 PM",
  },
  {
    id: "REQ-2026-009",
    type: "Overtime approval",
    status: "Approved",
    submitted: "Yesterday at 6:05 PM",
  },
  {
    id: "REQ-2026-007",
    type: "Undertime request",
    status: "Rejected",
    submitted: "Jan 18 at 9:30 AM",
  },
]

const quickLinks = [
  {
    title: "Time and clock",
    description: "Clock in, breaks, and daily shift details.",
    href: "/dashboard/intern/time",
  },
  {
    title: "Timesheets",
    description: "Review weekly logs and submit updates.",
    href: "/dashboard/intern/timesheets",
  },
  {
    title: "Approvals",
    description: "Track corrections and overtime status.",
    href: "/dashboard/intern/approvals",
  },
] as const

const trendSequence: StatCard["trend"][] = ["up", "neutral", "up", "down"]

function getActivityStatus(title: string): ActivityStatus {
  const lowerTitle = title.toLowerCase()
  if (lowerTitle.includes("break")) {
    return {
      status: "Break",
      tone: "warning",
    }
  }
  if (lowerTitle.includes("clocked out")) {
    return {
      status: "Complete",
      tone: "success",
    }
  }
  if (lowerTitle.includes("late") || lowerTitle.includes("missed")) {
    return {
      status: "Issue",
      tone: "destructive",
    }
  }
  return {
    status: "Logged",
    tone: "success",
  }
}

function getRequestBadgeClass(status: RequestItem["status"]) {
  if (status === "Approved") {
    return "border-blue-200 bg-blue-50 text-blue-900"
  }
  if (status === "Rejected") {
    return "border-red-200 bg-red-50 text-red-900"
  }
  return "border-yellow-200 bg-yellow-50 text-yellow-900"
}

export default function InternDashboardPage() {
  const [stats, setStats] = useState<InternDashboardStat[]>(fallbackStats)
  const [timeline, setTimeline] =
    useState<InternActivityItem[]>(fallbackTimeline)

  useEffect(() => {
    let active = true

    getInternDashboard()
      .then((data) => {
        if (!active) {
          return
        }
        if (data?.stats?.length) {
          setStats(data.stats)
        }
        if (data?.recentActivity?.length) {
          setTimeline(data.recentActivity)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  const statCards = useMemo(
    () =>
      (stats.length ? stats : fallbackStats).map((stat, index) => ({
        label: stat.label,
        value: stat.value,
        delta: stat.sub,
        trend: trendSequence[index % trendSequence.length],
      })),
    [stats]
  )

  const activityRows = useMemo(() => {
    const source = timeline.length ? timeline : fallbackTimeline
    return source.map((entry) => {
      const status = getActivityStatus(entry.title)
      return {
        time: entry.time,
        title: entry.title,
        detail: entry.detail,
        status: status.status,
        tone: status.tone,
      }
    })
  }, [timeline])

  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
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
                Syncs when API is connected
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Today&apos;s log</CardTitle>
              <CardDescription>
                Recent time entries for your current shift.
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full border-slate-200 text-xs"
            >
              <Link href="/dashboard/intern/time">
                <CalendarDays className="h-3.5 w-3.5" />
                Open time clock
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
              <span>Activity</span>
              <span className="text-right">Time</span>
              <span className="text-right">Status</span>
            </div>
            <div className="space-y-2">
              {activityRows.map((row) => (
                <div
                  key={`${row.time}-${row.title}`}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700"
                >
                  <div className="space-y-0.5">
                    <p className="truncate font-medium text-slate-900">
                      {row.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {row.detail}
                    </p>
                  </div>
                  <div className="text-right tabular-nums text-slate-900">
                    {row.time}
                  </div>
                  <div className="text-right">
                    <StatusChip tone={row.tone}>{row.status}</StatusChip>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">My requests</CardTitle>
              <CardDescription>
                Corrections and overtime requests waiting on review.
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full border-slate-200 text-xs"
            >
              <Link href="/dashboard/intern/approvals">
                <FileText className="h-3.5 w-3.5" />
                View approvals
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {fallbackRequests.map((item) => (
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
                        className={`text-[11px] font-medium ${getRequestBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-slate-900">{item.type}</p>
                    <p className="text-[11px] text-slate-500">
                      Submitted: {item.submitted}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full border-slate-200 text-[11px]"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              These are sample items while approvals API is in testing.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => (
          <Card key={link.title} className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{link.title}</CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0">
              <Button
                asChild
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-slate-200 text-xs"
              >
                <Link href={link.href}>Open section</Link>
              </Button>
              <p className="text-[11px] text-slate-500">
                Opens in this dashboard
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
              This intern dashboard uses sample data only. Connect it to the
              Laravel API for live time logs and approvals.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <AlertCircle className="h-3 w-3" />
            <span>Layout now mirrors the admin dashboard cards.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusChip({
  children,
  tone,
}: {
  children: ReactNode
  tone: "success" | "warning" | "destructive"
}) {
  const base =
    "inline-flex items-center justify-end gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"

  if (tone === "success") {
    return (
      <span className={`${base} bg-blue-50 text-blue-800 ring-1 ring-blue-200`}>
        <CheckCircle2 className="h-3 w-3 text-blue-700" />
        {children}
      </span>
    )
  }
  if (tone === "warning") {
    return (
      <span
        className={`${base} bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200`}
      >
        <Clock3 className="h-3 w-3 text-yellow-700" />
        {children}
      </span>
    )
  }
  return (
    <span className={`${base} bg-red-50 text-red-800 ring-1 ring-red-200`}>
      <AlertCircle className="h-3 w-3 text-red-700" />
      {children}
    </span>
  )
}
