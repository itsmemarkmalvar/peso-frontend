"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Coffee, Timer, LogIn, LogOut } from "lucide-react";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getInternTimesheetDetail, type InternTimesheetDetail, type AttendanceRecord } from "@/lib/api/timesheets";

export default function TimesheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const internId = parseInt(params.internId as string, 10);
  const startDate = searchParams.get("start_date") ?? undefined;
  const endDate = searchParams.get("end_date") ?? undefined;

  const [data, setData] = useState<InternTimesheetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(internId)) {
      setError("Invalid intern ID");
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    const dateParams = [startDate, endDate].every(Boolean) ? { start_date: startDate!, end_date: endDate! } : undefined;

    getInternTimesheetDetail(internId, dateParams)
      .then((timesheetData) => {
        if (!active) return;
        setData(timesheetData);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load timesheet details.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [internId, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-slate-500">Loading timesheet details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-red-600">{error || "Timesheet not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

  const periodLabel = `${new Date(data.date_range.start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${new Date(data.date_range.end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="flex flex-col gap-8">
      {/* Header with breadcrumb feel */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9 shrink-0 rounded-lg"
            aria-label="Back to timesheets"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
              {data.intern.name}
            </h1>
            <p className="text-sm text-slate-500">
              {data.intern.company}
              {data.intern.student_id && ` · ${data.intern.student_id}`}
            </p>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200/80 bg-gradient-to-br from-slate-50 to-white">
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Period
            </p>
            <p className="mt-1.5 text-sm font-medium text-slate-900">{periodLabel}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-gradient-to-br from-blue-50/80 to-white">
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total days
            </p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">
              {data.summary.total_days}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-gradient-to-br from-emerald-50/80 to-white">
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total hours
            </p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-emerald-700">
              {data.summary.total_hours_label}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Attendance Records */}
      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
          <CardTitle className="text-lg">Daily attendance</CardTitle>
          <CardDescription className="max-w-xl">
            Clock in, break start/end, and clock out with timestamps and verification photos per day.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.records.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Calendar className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-center text-sm font-medium text-slate-600">
                No attendance for this period
              </p>
              <p className="text-center text-xs text-slate-500">
                Records will appear when the intern clocks in for dates in the selected range.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.records.map((record: AttendanceRecord) => (
                <li key={record.id} className="px-6 py-5 sm:px-6 sm:py-6">
                  {/* Day row */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-semibold text-slate-900">
                        {record.date_label}
                      </span>
                      <span className="ml-2 text-sm text-slate-500">{record.day_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(record.status)}
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">
                        {record.total_hours_label}
                      </span>
                    </div>
                  </div>

                  {/* Timeline: 4 steps */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <TimeBlock
                      icon={LogIn}
                      label="Clock in"
                      time={record.clock_in_time_label}
                      photo={record.clock_in_photo}
                      photoAlt="Clock in"
                      badge={record.is_late ? "Late" : null}
                      badgeClass="border-amber-300 bg-amber-50 text-amber-800"
                    />
                    <TimeBlock
                      icon={Coffee}
                      label="Break start"
                      time={record.break_start_time_label}
                      iconBg="bg-amber-100"
                      iconColor="text-amber-600"
                    />
                    <TimeBlock
                      icon={Timer}
                      label="Break end"
                      time={record.break_end_time_label}
                      iconBg="bg-orange-100"
                      iconColor="text-orange-600"
                    />
                    <TimeBlock
                      icon={LogOut}
                      label="Clock out"
                      time={record.clock_out_time_label}
                      photo={record.clock_out_photo}
                      photoAlt="Clock out"
                      badge={
                        record.is_undertime
                          ? "Undertime"
                          : record.is_overtime
                            ? "Overtime"
                            : null
                      }
                      badgeClass={
                        record.is_undertime
                          ? "border-amber-300 bg-amber-50 text-amber-800"
                          : "border-emerald-300 bg-emerald-50 text-emerald-800"
                      }
                    />
                  </div>

                  {/* Location footer */}
                  {record.location_address && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <p className="text-xs text-slate-600 truncate">{record.location_address}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TimeBlock({
  icon: Icon,
  label,
  time,
  photo,
  photoAlt,
  badge,
  badgeClass,
  iconBg = "bg-blue-100",
  iconColor = "text-blue-600",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  time: string | null | undefined;
  photo?: string | null;
  photoAlt?: string;
  badge?: string | null;
  badgeClass?: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-shadow hover:shadow">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-sm font-semibold tabular-nums text-slate-900">
        {time || "—"}
      </p>
      {badge && (
        <Badge
          variant="outline"
          className={`w-fit text-[10px] ${badgeClass ?? "border-slate-200 bg-slate-50 text-slate-700"}`}
        >
          {badge}
        </Badge>
      )}
      {photo && (
        <div className="relative mt-2 aspect-square w-full max-w-[100px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <Image
            src={photo}
            alt={photoAlt ?? label}
            fill
            className="object-cover"
            unoptimized
            sizes="100px"
          />
        </div>
      )}
    </div>
  );
}
