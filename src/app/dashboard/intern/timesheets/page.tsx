"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  getInternTimesheets,
  type InternTimesheetData,
  type InternTimesheetEntry,
} from "@/lib/api/intern"
import { Button } from "@/components/ui/button"

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function InternTimesheetsPage() {
  const [startOfWeek, setStartOfWeek] = useState<Date>(() =>
    getStartOfWeek(new Date())
  )
  const [timesheet, setTimesheet] = useState<InternTimesheetData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const weekStartStr = toLocalDateString(startOfWeek)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)

    getInternTimesheets({ week_start: weekStartStr })
      .then((data) => {
        if (!active) {
          return
        }
        setTimesheet(data)
      })
      .catch((err) => {
        if (!active) {
          return
        }
        setError(
          err instanceof Error ? err.message : "Failed to load timesheets."
        )
        setTimesheet(null)
      })
      .finally(() => {
        if (!active) {
          return
        }
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [weekStartStr])

  const weekLabel = timesheet?.weekLabel?.trim() ? timesheet.weekLabel : "-"
  const totalLabel = timesheet?.totalLabel?.trim()
    ? timesheet.totalLabel
    : "Total: -"
  const entries: InternTimesheetEntry[] = timesheet?.entries ?? []

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
          Timesheets
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Weekly log</h1>
        <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
          Review your daily hours before submitting for approval.
        </p>
      </header>

      <div className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
              {weekLabel}
            </p>
            <p className="mt-2 text-lg font-semibold">{totalLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border-[color:var(--dash-border)]"
              onClick={() =>
                setStartOfWeek((prev) => {
                  const d = new Date(prev)
                  d.setDate(prev.getDate() - 7)
                  return getStartOfWeek(d)
                })
              }
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border-[color:var(--dash-border)]"
              onClick={() =>
                setStartOfWeek((prev) => {
                  const d = new Date(prev)
                  d.setDate(prev.getDate() + 7)
                  return getStartOfWeek(d)
                })
              }
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button className="bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]">
              Submit Timesheet
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          {isLoading ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              Loading timesheets...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-dashed border-red-200 bg-red-50 px-4 py-6 text-center text-xs text-red-600">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No timesheet entries yet.
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.day}
                className="flex items-center justify-between rounded-xl border border-[color:var(--dash-border)] bg-white px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{entry.day}</p>
                  <p className="text-xs text-[color:var(--dash-muted)]">
                    {entry.hours}
                  </p>
                </div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    entry.status === "Approved"
                      ? "bg-blue-100 text-blue-700"
                      : entry.status === "Rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700",
                  ].join(" ")}
                >
                  {entry.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
