"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Users,
  CalendarDays,
  AlertTriangle,
} from "lucide-react"

import { getAdminInterns, type AdminIntern } from "@/lib/api/intern"
import { getTodayAttendanceAll, type Attendance } from "@/lib/api/attendance"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type StatTrend = "up" | "down" | "neutral"

type StatCard = {
  label: string
  value: string
  sub: string
  trend: StatTrend
}

const defaultStats: StatCard[] = [
  {
    label: "Assigned interns",
    value: "0",
    sub: "No data yet",
    trend: "neutral" as const,
  },
  {
    label: "Pending approvals",
    value: "0",
    sub: "Waiting for requests",
    trend: "neutral" as const,
  },
  {
    label: "Today's clock-ins",
    value: "0",
    sub: "No activity yet",
    trend: "neutral" as const,
  },
  {
    label: "Schedules",
    value: "0",
    sub: "No changes",
    trend: "neutral" as const,
  },
]

type SupervisorInternRow = {
  name: string
  course: string
  status: string
  hours: string
}

const approvals: {
  id: string
  intern: string
  type: string
  date: string
  status: string
}[] = []

const scheduleAlerts: { title: string; detail: string }[] = []

const quickLinks = [
  {
    label: "Review approvals",
    href: "/dashboard/supervisor/approvals",
    icon: CheckCircle2,
  },
  {
    label: "Timesheets",
    href: "/dashboard/supervisor/timesheets",
    icon: FileSpreadsheet,
  },
  {
    label: "Work schedules",
    href: "/dashboard/supervisor/work-schedules",
    icon: CalendarDays,
  },
  { label: "People", href: "/dashboard/supervisor/people", icon: Users },
] as const

function statusTone(status: string) {
  if (status === "On shift") return "bg-blue-50 text-blue-700 border-blue-200"
  if (status === "On break") return "bg-amber-50 text-amber-700 border-amber-200"
  if (status === "Late") return "bg-red-50 text-red-700 border-red-200"
  return "bg-slate-50 text-slate-600 border-slate-200"
}

function formatHours(value: number | null) {
  if (!value) return "—"
  return `${value}h`
}

function buildSupervisorInternRows(
  interns: AdminIntern[],
  todayRecords: Attendance[]
): SupervisorInternRow[] {
  const byInternId = new Map<number, Attendance>()
  todayRecords.forEach((record) => byInternId.set(record.intern_id, record))

  return interns.map((intern) => {
    const record = byInternId.get(intern.id)
    if (!record) {
      return {
        name: intern.name,
        course: intern.course,
        status: "Not clocked in",
        hours: "—",
      }
    }
    const hasClockIn = Boolean(record.clock_in_time)
    const hasClockOut = Boolean(record.clock_out_time)
    const onBreak = hasClockIn && !hasClockOut && Boolean(record.break_start) && !record.break_end
    let status = "Clocked in"
    if (!hasClockIn) {
      status = "Not clocked in"
    } else if (onBreak) {
      status = "On break"
    } else if (record.is_late) {
      status = "Late"
    } else if (hasClockOut) {
      status = "Off shift"
    }

    return {
      name: intern.name,
      course: intern.course,
      status,
      hours: formatHours(record.total_hours),
    }
  })
}

export default function SupervisorPage() {
  const [stats, setStats] = useState<StatCard[]>(defaultStats)
  const [interns, setInterns] = useState<SupervisorInternRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    setIsLoading(true)

    Promise.all([getAdminInterns(), getTodayAttendanceAll()])
      .then(([assignedInterns, todayResponse]) => {
        if (!active) return
        const todayRecords = todayResponse.data ?? []
        const assignedIds = new Set(assignedInterns.map((intern) => intern.id))
        const rows = buildSupervisorInternRows(assignedInterns, todayRecords)
        setInterns(rows)

        const assignedCount = assignedInterns.length
        const clockedInCount = todayRecords.filter(
          (record) => assignedIds.has(record.intern_id) && record.clock_in_time
        ).length

        setStats((prev) => [
          { ...prev[0], value: assignedCount.toString(), sub: `${assignedCount} total` },
          prev[1],
          { ...prev[2], value: clockedInCount.toString(), sub: `${clockedInCount} clocked in` },
          prev[3],
        ])
        setIsLoading(false)
      })
      .catch(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
            Supervisor overview
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Intern supervision</h1>
          <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
            Track assigned interns, review attendance, and manage schedules.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]"
          >
            <Link href="/dashboard/supervisor/approvals">Review approvals</Link>
          </Button>
          <Button variant="outline" className="border-[color:var(--dash-border)]">
            Assign interns
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
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
                <span>{stat.sub}</span>
              </div>
              <span className="hidden text-[11px] text-slate-500 sm:inline">
                Supervisor view
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Assigned interns</CardTitle>
              <CardDescription>Live status for today's shift.</CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-slate-200 text-xs"
            >
              <Link href="/dashboard/supervisor/people">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <p className="text-xs text-slate-500">Loading assigned interns...</p>
            )}
            {!isLoading && interns.length === 0 && (
              <p className="text-xs text-slate-500">
                No assigned interns yet. Once interns are linked to you, they will appear here.
              </p>
            )}
            {interns.map((intern) => (
              <div
                key={intern.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {intern.name}
                  </p>
                  <p className="text-[11px] text-slate-500">{intern.course}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${statusTone(
                      intern.status
                    )}`}
                  >
                    {intern.status}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {intern.hours}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Schedule alerts</CardTitle>
            <CardDescription>Items needing attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduleAlerts.length === 0 && (
              <p className="text-xs text-slate-500">No schedule alerts right now.</p>
            )}
            {scheduleAlerts.map((alert) => (
              <div
                key={alert.title}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      {alert.title}
                    </p>
                    <p className="text-xs text-amber-800">{alert.detail}</p>
                  </div>
                </div>
              </div>
            ))}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-slate-200 text-xs"
            >
              <Link href="/dashboard/supervisor/work-schedules">Open schedules</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Pending approvals</CardTitle>
            <CardDescription>Attendance corrections waiting on your review.</CardDescription>
          </div>
          <Badge variant="secondary">{approvals.length} pending</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {approvals.length === 0 && (
            <p className="text-xs text-slate-500">No pending approvals right now.</p>
          )}
          {approvals.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.intern}</p>
                <p className="text-[11px] text-slate-500">
                  {item.type} · {item.date}
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
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{link.label}</p>
                <Icon className="h-4 w-4 text-[color:var(--dash-accent)]" />
              </div>
              <p className="mt-2 text-xs text-[color:var(--dash-muted)]">
                Open to manage updates.
              </p>
            </Link>
          )
        })}
      </div>

      <Card className="border-slate-200 bg-slate-50/80">
        <CardContent className="flex flex-col gap-3 px-4 py-3 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-700" />
            <p>Supervisor dashboard layout matches the admin card system.</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <AlertCircle className="h-3 w-3" />
            <span>Data shown here is sample-only for now.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
