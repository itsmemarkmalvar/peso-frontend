"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Play, Square } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Timesheet Details</h1>
            <p className="text-sm text-slate-600">
              {data.intern.name} · {data.intern.company}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
          <CardDescription>
            Period: {new Date(data.date_range.start).toLocaleDateString()} – {new Date(data.date_range.end).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600">Total Days</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{data.summary.total_days}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600">Total Hours</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{data.summary.total_hours_label}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600">Student ID</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{data.intern.student_id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Attendance Records</CardTitle>
          <CardDescription>
            Clock in, start break, end break, and clock out with captured photos and tracked hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.records.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-slate-500">No attendance records found for this period.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {data.records.map((record: AttendanceRecord) => (
                <div
                  key={record.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5"
                >
                  {/* Day header */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{record.date_label}</p>
                      <p className="text-xs text-slate-500">{record.day_name}</p>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>

                  {/* Four events: Clock In | Start Break | End Break | Clock Out */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Clock In */}
                    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-600">Clock In</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {record.clock_in_time_label || "—"}
                      </p>
                      {record.is_late && (
                        <Badge variant="outline" className="w-fit border-orange-300 bg-orange-50 text-orange-700 text-[10px]">
                          Late
                        </Badge>
                      )}
                      {record.clock_in_photo && (
                        <div className="relative mt-2 aspect-square w-full max-w-[120px] overflow-hidden rounded-lg border border-slate-200">
                          <Image
                            src={record.clock_in_photo}
                            alt="Clock in"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>

                    {/* Start Break */}
                    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                          <Play className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-600">Start Break</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {record.break_start_time_label || "—"}
                      </p>
                    </div>

                    {/* End Break */}
                    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100">
                          <Square className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-600">End Break</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {record.break_end_time_label || "—"}
                      </p>
                    </div>

                    {/* Clock Out */}
                    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                          <Clock className="h-4 w-4 text-red-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-600">Clock Out</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {record.clock_out_time_label || "—"}
                      </p>
                      {(record.is_undertime || record.is_overtime) && (
                        <div className="flex flex-wrap gap-1">
                          {record.is_undertime && (
                            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700 text-[10px]">
                              Undertime
                            </Badge>
                          )}
                          {record.is_overtime && (
                            <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 text-[10px]">
                              Overtime
                            </Badge>
                          )}
                        </div>
                      )}
                      {record.clock_out_photo && (
                        <div className="relative mt-2 aspect-square w-full max-w-[120px] overflow-hidden rounded-lg border border-slate-200">
                          <Image
                            src={record.clock_out_photo}
                            alt="Clock out"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location & total hours */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 border border-slate-200">
                    {record.location_address ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        <p className="text-xs text-slate-600 truncate">{record.location_address}</p>
                      </div>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-900">
                        Tracked: <span className="text-blue-600">{record.total_hours_label}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
