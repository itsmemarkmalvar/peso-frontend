"use client"

import { useEffect, useState } from "react"
import { jsPDF } from "jspdf"

import {
  getInternTimesheets,
  type InternTimesheetData,
  type InternTimesheetEntry,
} from "@/lib/api/intern"
import { getDTRReport } from "@/lib/api/reports"
import { Button } from "@/components/ui/button"

const DTR_HEADERS = ["Date", "Day", "Clock In", "Clock Out", "Hours", "Status"]

type DtrRecord = {
  date?: string
  day?: string
  intern_name?: string
  student_id?: string
  clock_in?: string | null
  clock_out?: string | null
  total_hours?: number | string | null
  status?: string
}

type DtrReportPayload = {
  report_type?: string
  start_date?: string
  end_date?: string
  total_records?: number
  data?: DtrRecord[]
}

function formatTime(value?: string | null) {
  if (!value) return "-"
  if (value.length >= 5) {
    return value.slice(0, 5)
  }
  return value
}

function formatStatus(value?: string) {
  if (!value) return "-"
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatHours(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "0.00"
  const num = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(num)) return String(value)
  return num.toFixed(2)
}

function buildDtrPdf(records: DtrRecord[], meta: {
  startDate: string
  endDate: string
  internName?: string
  studentId?: string
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 12
  let y = 14

  doc.setFontSize(16)
  doc.text("Daily Time Record (DTR)", marginX, y)
  y += 7

  doc.setFontSize(10)
  if (meta.internName) {
    doc.text(`Intern: ${meta.internName}`, marginX, y)
    y += 5
  }
  if (meta.studentId) {
    doc.text(`Student ID: ${meta.studentId}`, marginX, y)
    y += 5
  }
  doc.text(`Period: ${meta.startDate} to ${meta.endDate}`, marginX, y)
  y += 7

  const columnX = {
    date: marginX,
    day: marginX + 26,
    in: marginX + 52,
    out: marginX + 78,
    hours: marginX + 104,
    status: marginX + 128,
  }

  const renderHeader = () => {
    doc.setFont("helvetica", "bold")
    doc.text(DTR_HEADERS[0], columnX.date, y)
    doc.text(DTR_HEADERS[1], columnX.day, y)
    doc.text(DTR_HEADERS[2], columnX.in, y)
    doc.text(DTR_HEADERS[3], columnX.out, y)
    doc.text(DTR_HEADERS[4], columnX.hours, y)
    doc.text(DTR_HEADERS[5], columnX.status, y)
    doc.setFont("helvetica", "normal")
    y += 4
    doc.line(marginX, y, 200, y)
    y += 4
  }

  renderHeader()

  records.forEach((record) => {
    if (y > pageHeight - 12) {
      doc.addPage()
      y = 14
      renderHeader()
    }

    const dayLabel = record.day ? record.day.slice(0, 3) : "-"

    doc.text(record.date ?? "-", columnX.date, y)
    doc.text(dayLabel, columnX.day, y)
    doc.text(formatTime(record.clock_in), columnX.in, y)
    doc.text(formatTime(record.clock_out), columnX.out, y)
    doc.text(formatHours(record.total_hours), columnX.hours, y)
    doc.text(formatStatus(record.status), columnX.status, y)
    y += 6
  })

  return doc
}

export default function InternTimesheetsPage() {
  const [timesheet, setTimesheet] = useState<InternTimesheetData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)

    getInternTimesheets()
      .then((data) => {
        if (!active) {
          return
        }
        setTimesheet(data)
      })
      .catch((err) => {
        if (!active) return
        setError(
          err instanceof Error ? err.message : "Failed to load timesheets."
        )
        setTimesheet(null)
      })
      .finally(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const weekLabel = timesheet?.weekLabel?.trim() ? timesheet.weekLabel : "-"
  const totalLabel = timesheet?.totalLabel?.trim()
    ? timesheet.totalLabel
    : "Total: -"
  const entries: InternTimesheetEntry[] = timesheet?.entries ?? []

  const handleSubmitTimesheet = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await getDTRReport({ format: "json" })
      const payload = (response as { data?: DtrReportPayload }).data
      const records = payload?.data ?? []

      if (!records.length) {
        setSubmitError("No attendance records found to include in the DTR PDF.")
        return
      }

      const firstRecord = records[0]
      const doc = buildDtrPdf(records, {
        startDate: payload?.start_date ?? records[0].date ?? "-",
        endDate: payload?.end_date ?? records[records.length - 1].date ?? "-",
        internName: firstRecord.intern_name,
        studentId: firstRecord.student_id,
      })

      const todayLabel = new Date().toISOString().split("T")[0]
      doc.save(`dtr-${todayLabel}.pdf`)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to generate DTR PDF."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
          Timesheets
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Weekly log</h1>
        <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
          Review your daily hours and submit to generate your Daily Time Record (DTR).
        </p>
      </header>

      <div className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
              {weekLabel}
            </p>
            <p className="mt-2 text-lg font-semibold">{totalLabel}</p>
            <p className="mt-1 text-xs text-[color:var(--dash-muted)]">
              Generates a DTR PDF with all attended days to date.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={handleSubmitTimesheet}
              disabled={isSubmitting || isLoading}
              className="bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]"
            >
              {isSubmitting ? "Creating DTR..." : "Submit Timesheet"}
            </Button>
            {submitError && (
              <p className="text-xs text-red-600">{submitError}</p>
            )}
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
                    entry.status === "Recorded"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600",
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
