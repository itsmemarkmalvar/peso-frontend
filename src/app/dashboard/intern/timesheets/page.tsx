"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  getInternTimesheets,
  getInternProfile,
  type InternTimesheetData,
  type InternTimesheetEntry,
} from "@/lib/api/intern"
import { Button } from "@/components/ui/button"
import {
  getInternTimesheetDetail,
  type InternTimesheetDetail,
} from "@/lib/api/timesheets"

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const manilaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
})

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

const getManilaDateString = (date: Date = new Date()): string =>
  manilaDateFormatter.format(date)

const dateToManila = (dateStr: string): Date =>
  new Date(`${dateStr}T00:00:00+08:00`)

const formatShortDate = (dateStr: string): string =>
  dateToManila(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  })

const formatDayShort = (dateStr: string): string =>
  dateToManila(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "Asia/Manila",
  })

const buildDateRange = (start: string, end: string): string[] => {
  const [sy, sm, sd] = start.split("-").map(Number)
  const [ey, em, ed] = end.split("-").map(Number)
  if (!sy || !sm || !sd || !ey || !em || !ed) return []
  const startUtc = new Date(Date.UTC(sy, sm - 1, sd))
  const endUtc = new Date(Date.UTC(ey, em - 1, ed))
  if (startUtc > endUtc) return [end]
  const dates: string[] = []
  const cursor = new Date(startUtc)
  while (cursor <= endUtc) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

type DtrRow = {
  date: string
  dateLabel: string
  dayLabel: string
  clockIn: string
  clockOut: string
  hours: string
}

const buildDtrRows = (
  detail: InternTimesheetDetail,
  startDate: string,
  endDate: string
): DtrRow[] => {
  const recordsByDate = new Map(
    (detail.records ?? []).map((record) => [record.date, record])
  )
  return buildDateRange(startDate, endDate).map((date) => {
    const record = recordsByDate.get(date)
    return {
      date,
      dateLabel: formatShortDate(date),
      dayLabel: formatDayShort(date),
      clockIn: record?.clock_in_time_label ?? "-",
      clockOut: record?.clock_out_time_label ?? "-",
      hours: record?.total_hours_label ?? "-",
    }
  })
}

const openPdfPreview = (blob: Blob): void => {
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank", "noopener,noreferrer")
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

const generateDtrPdf = async (
  detail: InternTimesheetDetail,
  startDate: string,
  endDate: string
): Promise<Blob> => {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const margin = 14
  let y = 18

  const writeHeader = () => {
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Daily Time Record (DTR)", A4_WIDTH_MM / 2, y, {
      align: "center",
    })
    y += 8
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Intern: ${detail.intern.name}`, margin, y)
    y += 5
    doc.text(`Student ID: ${detail.intern.student_id || "-"}`, margin, y)
    y += 5
    doc.text(`Period: ${startDate} to ${endDate}`, margin, y)
    y += 6
  }

  const writeTableHeader = () => {
    doc.setFont("helvetica", "bold")
    doc.text("Date", margin, y)
    doc.text("Day", margin + 28, y)
    doc.text("In", margin + 52, y)
    doc.text("Out", margin + 76, y)
    doc.text("Hours", margin + 104, y)
    y += 4
    doc.setLineWidth(0.3)
    doc.line(margin, y, A4_WIDTH_MM - margin, y)
    y += 4
    doc.setFont("helvetica", "normal")
  }

  writeHeader()
  writeTableHeader()

  const rows = buildDtrRows(detail, startDate, endDate)
  if (rows.length === 0) {
    doc.text("No attendance records found for this period.", margin, y)
  } else {
    rows.forEach((row) => {
      if (y > A4_HEIGHT_MM - 18) {
        doc.addPage()
        y = 18
        writeHeader()
        writeTableHeader()
      }
      doc.text(row.dateLabel, margin, y)
      doc.text(row.dayLabel, margin + 28, y)
      doc.text(row.clockIn, margin + 52, y)
      doc.text(row.clockOut, margin + 76, y)
      doc.text(row.hours, margin + 104, y)
      y += 5
    })
  }

  y += 4
  if (y > A4_HEIGHT_MM - 18) {
    doc.addPage()
    y = 18
  }
  doc.setFont("helvetica", "bold")
  doc.text(`Total Hours: ${detail.summary.total_hours_label}`, margin, y)
  y += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`Generated on ${getManilaDateString()}`, margin, y)

  return doc.output("blob")
}

export default function InternTimesheetsPage() {
  const [startOfWeek, setStartOfWeek] = useState<Date>(() =>
    getStartOfWeek(new Date())
  )
  const [timesheet, setTimesheet] = useState<InternTimesheetData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

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

  const handleExportDtr = async () => {
    if (isExporting) return
    setExportError(null)
    setIsExporting(true)
    try {
      const profile = await getInternProfile()
      if (!profile?.id) {
        throw new Error("Unable to load your intern profile.")
      }
      const startDate = profile.start_date
        ? profile.start_date.slice(0, 10)
        : undefined
      const endDate = getManilaDateString()
      const detail = await getInternTimesheetDetail(profile.id, {
        ...(startDate ? { start_date: startDate } : {}),
        end_date: endDate,
      })
      const earliestRecordDate =
        detail.records?.length
          ? detail.records[detail.records.length - 1].date
          : undefined
      const periodStart =
        startDate || earliestRecordDate || detail.date_range.start || endDate
      const periodEnd = endDate || detail.date_range.end || endDate
      const blob = await generateDtrPdf(detail, periodStart, periodEnd)
      openPdfPreview(blob)
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Failed to generate DTR PDF."
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="rounded-2xl border border-(--dash-border) bg-(--dash-card) p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
          Timesheets
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Weekly log</h1>
        <p className="mt-1 text-sm text-(--dash-muted)">
          Review your daily hours before submitting for approval.
        </p>
      </header>

      <div className="rounded-2xl border border-(--dash-border) bg-(--dash-card) p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
              {weekLabel}
            </p>
            <p className="mt-2 text-lg font-semibold">{totalLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full border-(--dash-border)"
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
              className="h-8 w-8 shrink-0 rounded-full border-(--dash-border)"
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
            <Button
              onClick={handleExportDtr}
              disabled={isExporting}
              className="bg-(--dash-accent) text-white hover:bg-(--dash-accent-strong)"
            >
              {isExporting ? "Preparing DTR..." : "View DTR PDF"}
            </Button>
          </div>
        </div>
        {exportError && (
          <div className="mt-3 rounded-xl border border-dashed border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {exportError}
          </div>
        )}

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
                className="flex items-center justify-between rounded-xl border border-(--dash-border) bg-white px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{entry.day}</p>
                  <p className="text-xs text-(--dash-muted)">
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
