"use client"

import { useEffect, useState } from "react"

import {
  getInternTimeClock,
  type InternActivityItem,
  type InternDashboardStat,
  type InternTimeClockHeader,
  type InternTimeClockSnapshot,
  type InternTimeClockWeekItem,
} from "@/lib/api/intern"
import { Button } from "@/components/ui/button"

const fallbackSummary: InternDashboardStat[] = [
  { label: "Today", value: "2h 10m", sub: "In progress" },
  { label: "This week", value: "18h 40m", sub: "40h target" },
  { label: "Overtime", value: "0h 00m", sub: "No overtime" },
] as const

const fallbackLogs: InternActivityItem[] = [
  { time: "08:10 AM", title: "Clocked in", detail: "Main office" },
  { time: "12:05 PM", title: "Break start", detail: "Lunch" },
  { time: "12:45 PM", title: "Break end", detail: "Back to work" },
] as const

const fallbackWeek: InternTimeClockWeekItem[] = [
  { day: "Mon", hours: "7h 50m" },
  { day: "Tue", hours: "6h 15m" },
  { day: "Wed", hours: "4h 35m" },
  { day: "Thu", hours: "0h 00m" },
  { day: "Fri", hours: "0h 00m" },
] as const

const fallbackHeader: InternTimeClockHeader = {
  currentTime: "08:10",
  meridiem: "AM",
  dateLabel: "Tuesday, Jan 20",
  statusLabel: "On shift",
  statusTone: "active",
  shiftLabel: "Shift 8:00 AM - 5:00 PM",
}

const fallbackSnapshot: InternTimeClockSnapshot = {
  lastClock: "08:10 AM",
  breakLabel: "1h lunch",
  locationLabel: "Main office",
}

export default function InternTimePage() {
  const [header, setHeader] = useState<InternTimeClockHeader>(fallbackHeader)
  const [snapshot, setSnapshot] =
    useState<InternTimeClockSnapshot>(fallbackSnapshot)
  const [summary, setSummary] =
    useState<InternDashboardStat[]>(fallbackSummary)
  const [week, setWeek] =
    useState<InternTimeClockWeekItem[]>(fallbackWeek)
  const [logs, setLogs] = useState<InternActivityItem[]>(fallbackLogs)

  useEffect(() => {
    let active = true

    getInternTimeClock()
      .then((data) => {
        if (!active) {
          return
        }
        if (data?.header) {
          setHeader(data.header)
        }
        if (data?.snapshot) {
          setSnapshot(data.snapshot)
        }
        if (data?.summary?.length) {
          setSummary(data.summary)
        }
        if (data?.week?.length) {
          setWeek(data.week)
        }
        if (data?.recentActivity?.length) {
          setLogs(data.recentActivity)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  const statusClassName =
    header.statusTone === "active"
      ? "bg-blue-100 text-blue-700"
      : "bg-red-100 text-red-700"

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
          Time and Clock
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Time clock</h1>
        <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
          Clock in, manage breaks, and review your day in one screen.
        </p>
      </header>

      <section className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
              Current time
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-tight">
                {header.currentTime}
              </span>
              <span className="pb-2 text-sm font-semibold text-[color:var(--dash-muted)]">
                {header.meridiem}
              </span>
            </div>
            <p className="mt-2 text-sm text-[color:var(--dash-muted)]">
              {header.dateLabel}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}
              >
                {header.statusLabel}
              </span>
              <span className="text-xs text-[color:var(--dash-muted)]">
                {header.shiftLabel}
              </span>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-[color:var(--dash-border)] bg-white px-4 py-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[color:var(--dash-muted)]">Last clock</span>
              <span className="font-semibold">{snapshot.lastClock}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[color:var(--dash-muted)]">Break</span>
              <span className="font-semibold">{snapshot.breakLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[color:var(--dash-muted)]">Location</span>
              <span className="font-semibold">{snapshot.locationLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Button className="h-12 w-full bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]">
            Clock In
          </Button>
          <Button className="h-12 w-full bg-yellow-300 text-yellow-900 hover:bg-yellow-400">
            Start Break
          </Button>
          <Button className="h-12 w-full bg-red-600 text-white hover:bg-red-700">
            Clock Out
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
              {item.label}
            </p>
            <p className="mt-3 text-2xl font-semibold">{item.value}</p>
            <p className="mt-2 text-xs text-[color:var(--dash-muted)]">
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
            Recent activity
          </p>
          <div className="mt-4 space-y-4">
            {logs.map((entry) => (
              <div key={entry.time} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-[color:var(--dash-accent)]" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{entry.title}</span>
                    <span className="text-xs text-[color:var(--dash-muted)]">
                      {entry.time}
                    </span>
                  </div>
                  <p className="text-xs text-[color:var(--dash-muted)]">
                    {entry.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
            This week logs
          </p>
          <div className="mt-4 space-y-3">
            {week.map((entry) => (
              <div
                key={entry.day}
                className="flex items-center justify-between rounded-xl border border-[color:var(--dash-border)] bg-white px-4 py-3 text-sm"
              >
                <span className="font-semibold">{entry.day}</span>
                <span className="text-[color:var(--dash-muted)]">
                  {entry.hours}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
