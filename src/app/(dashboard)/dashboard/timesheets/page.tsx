"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { getTimesheets, type TimesheetRow, type TimesheetDay } from "@/lib/api/timesheets";

// Types are now imported from @/lib/api/timesheets

// Removed DEFAULT_ROWS - using real API data

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

export default function TimesheetsPage() {
  const router = useRouter();
  const [startOfWeek, setStartOfWeek] = useState<Date>(() =>
    getStartOfWeek(new Date())
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekRangeLabel = formatWeekRange(weekDates.length > 0 ? weekDates : getWeekDates(startOfWeek));

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

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    const weekStartStr = startOfWeek.toISOString().split('T')[0];

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

  const filteredRows = rows.filter((row) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      row.intern.toLowerCase().includes(query) ||
      row.company.toLowerCase().includes(query) ||
      row.id.toLowerCase().includes(query)
    );
  });

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
                  onClick={() => router.push(`/dashboard/timesheets/${row.intern_id}`)}
                  className="grid grid-cols-[minmax(0,3.2fr)_repeat(7,minmax(0,1fr))_minmax(0,1.4fr)] items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 sm:flex">
                      {row.intern
                        .split(",")[0]
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {row.intern}
                      </p>
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
                        <span className="text-slate-900">{day.label}</span>
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
