"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, FileDown, Filter, FileSpreadsheet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { getTimesheets, type TimesheetRow, type TimesheetDay } from "@/lib/api/timesheets";

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return d;
  });
}

function formatWeekRange(week: Date[]): string {
  if (!week.length) return "";
  const first = week[0];
  const last = week[week.length - 1];

  const startLabel = first.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endLabel = last.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

/** Format date as YYYY-MM-DD in local time for API */
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function TimesheetsPage() {
  const [startOfWeek, setStartOfWeek] = useState<Date>(() =>
    getStartOfWeek(new Date())
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pickRangeOpen, setPickRangeOpen] = useState(false);
  const [pickRangeDate, setPickRangeDate] = useState<string>(() => {
    const d = getStartOfWeek(new Date());
    return toLocalDateString(d);
  });
  const [filterCompanies, setFilterCompanies] = useState<string[]>([]);

  const datesForRange = weekDates.length > 0 ? weekDates : getWeekDates(startOfWeek);
  const weekRangeLabel = formatWeekRange(datesForRange);
  const weekStartStr = toLocalDateString(startOfWeek);
  const weekEndStr = datesForRange.length ? toLocalDateString(datesForRange[datesForRange.length - 1]) : weekStartStr;

  const companies = Array.from(new Set(rows.map((r) => r.company))).sort();

  const filteredRows = rows.filter((row) => {
    if (filterCompanies.length > 0 && !filterCompanies.includes(row.company)) return false;
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      row.intern.toLowerCase().includes(query) ||
      row.company.toLowerCase().includes(query) ||
      row.id.toLowerCase().includes(query)
    );
  });

  const goToPreviousWeek = () => {
    setStartOfWeek((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return getStartOfWeek(d);
    });
  };

  const goToNextWeek = () => {
    setStartOfWeek((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return getStartOfWeek(d);
    });
  };

  const applyPickRange = useCallback(() => {
    if (!pickRangeDate) return;
    const d = new Date(pickRangeDate + "T12:00:00");
    setStartOfWeek(getStartOfWeek(d));
    setPickRangeOpen(false);
  }, [pickRangeDate]);

  const handleExportExcel = useCallback(() => {
    const header = ["Intern", "Company", "ID", ...datesForRange.map((d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })), "Total hours"];
    const rowsCsv = filteredRows.map((row) => [
      row.intern,
      row.company,
      row.id,
      ...row.days.map((day) => (day.isRestDay ? "Rest day" : day.label)),
      row.total,
    ]);
    const lines = [header.map(escapeCsvCell).join(","), ...rowsCsv.map((r) => r.map(escapeCsvCell).join(","))];
    const csv = lines.join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets-${weekStartStr}-${weekEndStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredRows, datesForRange, weekStartStr, weekEndStr]);

  const handleExportPdf = useCallback(() => {
    const dayHeaders = datesForRange.map((d) => d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }));
    const tableRows = filteredRows.map((row) => [
      row.intern,
      row.company,
      ...row.days.map((day) => (day.isRestDay ? "Rest" : day.label)),
      row.total,
    ]);
    const thead = `<thead><tr><th>Intern</th><th>Company</th>${dayHeaders.map((h) => `<th>${h}</th>`).join("")}<th>Total</th></tr></thead>`;
    const tbody = `<tbody>${tableRows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Timesheets ${weekRangeLabel}</title><style>body{font-family:system-ui,sans-serif;padding:16px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:8px;text-align:left;} th{background:#f1f5f9;}</style></head><body><h1>Timesheets – ${weekRangeLabel}</h1><table>${thead}${tbody}</table></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }, [filteredRows, datesForRange, weekRangeLabel]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    getTimesheets({ week_start: weekStartStr })
      .then((data) => {
        if (!active) return;
        
        // Convert week_dates strings to Date objects
        const dates = data.week_dates.map((dateStr) => new Date(dateStr));
        setWeekDates(dates);
        setRows(data.rows);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load timesheets.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [startOfWeek]);

  return (
    <div className="flex flex-col gap-6">
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
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-full border-slate-200 text-xs"
            onClick={handleExportExcel}
            disabled={!filteredRows.length}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-full border-slate-200 text-xs"
            onClick={handleExportPdf}
            disabled={!filteredRows.length}
          >
            <FileDown className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-sm" onClose={() => setFiltersOpen(false)}>
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-xs text-slate-600">Filter by company</p>
            {companies.length === 0 ? (
              <p className="text-xs text-slate-500">No companies in current data.</p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {companies.map((company) => (
                  <label key={company} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={filterCompanies.includes(company)}
                      onCheckedChange={(checked) => {
                        setFilterCompanies((prev) =>
                          checked ? [...prev, company] : prev.filter((c) => c !== company)
                        );
                      }}
                    />
                    <span>{company}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setFilterCompanies([])}>
              Clear
            </Button>
            <Button size="sm" onClick={() => setFiltersOpen(false)}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pickRangeOpen} onOpenChange={setPickRangeOpen}>
        <DialogContent className="max-w-sm" onClose={() => setPickRangeOpen(false)}>
          <DialogHeader>
            <DialogTitle>Pick week</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600">Select a date to view that week.</p>
          <Input
            type="date"
            value={pickRangeDate}
            onChange={(e) => setPickRangeDate(e.target.value)}
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPickRangeOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={applyPickRange}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Daily Time Record</CardTitle>
            <CardDescription>
              Weekly-style view of intern hours per day, similar to payroll
              timesheets. Hook this to your Laravel API for real records.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Weekly timesheets</span>
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 rounded-full text-slate-600 hover:bg-slate-100"
                onClick={goToPreviousWeek}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 text-[11px] font-medium tabular-nums">
                {weekRangeLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 rounded-full text-slate-600 hover:bg-slate-100"
                onClick={goToNextWeek}
                aria-label="Next week"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 rounded-full border-slate-200 bg-white text-[11px]"
              onClick={() => {
                setPickRangeDate(weekStartStr);
                setPickRangeOpen(true);
              }}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Pick range
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search intern name, company, or ID"
              className="h-9 max-w-xs text-sm"
            />
            {searchTerm && (
              <p className="text-[11px] text-slate-500">
                Showing {filteredRows.length} of {rows.length} interns
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            {/* Header rows: label and day columns */}
            <div className="grid min-w-[960px] grid-cols-[minmax(0,3.2fr)_repeat(7,minmax(0,1fr))_minmax(0,1.4fr)] gap-3 rounded-t-lg bg-slate-50 px-3 pt-2 pb-1 text-[11px] font-medium text-slate-500">
              <span>Intern</span>
              <span className="col-span-7" />
              <span />
            </div>
            <div className="grid min-w-[960px] grid-cols-[minmax(0,3.2fr)_repeat(7,minmax(0,1fr))_minmax(0,1.4fr)] gap-3 border-b border-slate-100 bg-slate-50 px-3 pb-2 text-[11px] font-medium text-slate-500">
              <span />
              {weekDates.map((date) => {
                const weekday = date.toLocaleDateString("en-US", {
                  weekday: "short",
                });
                const day = date.getDate();
                return (
                  <span
                    key={date.toISOString()}
                    className="text-center tabular-nums"
                  >
                    {weekday.charAt(0)} {day}
                  </span>
                );
              })}
              <span className="text-right">Total hours</span>
            </div>
            <div className="mt-2 max-h-[420px] min-w-[960px] space-y-2 overflow-y-auto pr-1">
              {isLoading && (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-xs text-slate-500">
                  Loading timesheets…
                </div>
              )}
              {error && !isLoading && (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-red-200 bg-red-50 px-4 py-8 text-xs text-red-600">
                  {error}
                </div>
              )}
              {!isLoading &&
                !error &&
                filteredRows.map((row) => (
                <div
                  key={row.intern_id}
                  className="grid grid-cols-[minmax(0,3.2fr)_repeat(7,minmax(0,1fr))_minmax(0,1.4fr)] items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 sm:flex">
                      {row.intern
                        .split(",")[0]
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <Link
                        href={`/dashboard/timesheets/${row.intern_id}?start_date=${weekStartStr}&end_date=${weekEndStr}`}
                        className="truncate text-sm font-medium text-slate-900 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-300 rounded"
                      >
                        {row.intern}
                      </Link>
                      <p className="text-[11px] text-slate-500">
                        {row.company} · {row.id}
                      </p>
                    </div>
                  </div>

                  {row.days.map((day, index) => (
                    <div
                      key={`${row.intern_id}-day-${index}`}
                      className="flex justify-center text-[11px] tabular-nums"
                    >
                      {day.isRestDay ? (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          Rest day
                        </span>
                      ) : (
                        <Link
                          href={`/dashboard/timesheets/${row.intern_id}?start_date=${day.date}&end_date=${day.date}`}
                          className="text-slate-900 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-300 rounded"
                        >
                          {day.label}
                        </Link>
                      )}
                    </div>
                  ))}

                  <div className="text-right text-sm font-semibold text-slate-900">
                    {row.total}
                  </div>
                </div>
              ))}
              {!isLoading && !error && filteredRows.length === 0 && (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-xs text-slate-500">
                  No interns match your search.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
