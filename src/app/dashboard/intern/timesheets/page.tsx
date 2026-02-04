"use client"

import { useEffect, useState } from "react"

import {
  getInternTimesheets,
  type InternTimesheetData,
  type InternTimesheetEntry,
} from "@/lib/api/intern"
import { Button } from "@/components/ui/button"

const fallbackEntries: InternTimesheetEntry[] = [
  { day: "Mon", hours: "7h 50m", status: "Approved" },
  { day: "Tue", hours: "6h 15m", status: "Approved" },
  { day: "Wed", hours: "4h 35m", status: "Pending" },
  { day: "Thu", hours: "0h 00m", status: "Pending" },
  { day: "Fri", hours: "0h 00m", status: "Pending" },
] as const

const fallbackTimesheet: InternTimesheetData = {
  weekLabel: "Week of Jan 15 - Jan 19",
  totalLabel: "Total: 18h 40m",
  entries: fallbackEntries,
}

export default function InternTimesheetsPage() {
  const [timesheet, setTimesheet] =
    useState<InternTimesheetData>(fallbackTimesheet)

  useEffect(() => {
    let active = true

    getInternTimesheets()
      .then((data) => {
        if (!active) {
          return
        }
        if (data?.entries?.length) {
          setTimesheet(data)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

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
              {timesheet.weekLabel}
            </p>
            <p className="mt-2 text-lg font-semibold">{timesheet.totalLabel}</p>
          </div>
          <Button className="bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]">
            Submit Timesheet
          </Button>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          {timesheet.entries.map((entry) => (
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
          ))}
        </div>
      </div>
    </div>
  )
}
