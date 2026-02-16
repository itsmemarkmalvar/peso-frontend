"use client";

import { useState, useEffect, useRef } from "react";
import { Edit2, Save, X, Info, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { updateDefaultSchedule, getDefaultSchedule, getExcusedInterns, type ExcusedIntern as ExcusedInternType } from "@/lib/api/schedule";

const DAYS_OF_WEEK = [
  { id: "monday", label: "Monday", short: "M" },
  { id: "tuesday", label: "Tuesday", short: "T" },
  { id: "wednesday", label: "Wednesday", short: "W" },
  { id: "thursday", label: "Thursday", short: "T" },
  { id: "friday", label: "Friday", short: "F" },
  { id: "saturday", label: "Saturday", short: "S" },
  { id: "sunday", label: "Sunday", short: "S" },
];

type DaySchedule = {
  startTime: string;
  endTime: string;
};

type ExcusedIntern = {
  name: string;
  student_id: string;
  course: string;
};

const WEEKDAYS = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

export default function WorkSchedulesPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [scheduleName, setScheduleName] = useState("On the Job Training 2026");
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]);
  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>({
    monday: { startTime: "08:00", endTime: "17:00" },
    tuesday: { startTime: "08:00", endTime: "17:00" },
    wednesday: { startTime: "08:00", endTime: "17:00" },
    thursday: { startTime: "08:00", endTime: "17:00" },
    friday: { startTime: "08:00", endTime: "17:00" },
  });
  const [lunchBreakStart, setLunchBreakStart] = useState("12:00");
  const [lunchBreakEnd, setLunchBreakEnd] = useState("13:00");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [excusedInterns, setExcusedInterns] = useState<Record<string, ExcusedIntern[]>>({});
  const [isLoadingExcused, setIsLoadingExcused] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(10);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const canViewExcused = user?.role === "admin" || user?.role === "supervisor";
  const workDaysSectionRef = useRef<HTMLDivElement>(null);

  // Calculate break duration automatically
  const calculateBreakDuration = (start: string, end: string): number => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return Math.max(0, endTotalMinutes - startTotalMinutes);
  };

  const lunchBreakDuration = calculateBreakDuration(lunchBreakStart, lunchBreakEnd);

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
      const newSchedules = { ...daySchedules };
      delete newSchedules[dayId];
      setDaySchedules(newSchedules);
    } else {
      setSelectedDays([...selectedDays, dayId]);
      setDaySchedules({
        ...daySchedules,
        [dayId]: { startTime: "08:00", endTime: "17:00" },
      });
    }
  };

  const updateDaySchedule = (dayId: string, field: "startTime" | "endTime", value: string) => {
    setDaySchedules({
      ...daySchedules,
      [dayId]: {
        ...daySchedules[dayId],
        [field]: value,
      },
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Map day name to day_of_week number (0=Sunday, 1=Monday, ..., 6=Saturday)
  const getDayOfWeek = (dayId: string): number => {
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return dayMap[dayId] ?? 1;
  };

  const dayOfWeekToId: Record<number, string> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };

  // Load saved default schedule (required clock-in times)
  useEffect(() => {
    let active = true;
    setIsLoadingSchedule(true);
    getDefaultSchedule()
      .then((data) => {
        if (!active || !data) return;
        if (data.name != null && data.name !== "") setScheduleName(data.name);
        if (data.admin_notes != null) setAdminNotes(data.admin_notes ?? "");
        const defaultWeekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
        if (data.days?.length) {
          const days = data.days;
          const selectedRaw = days.map((d) => dayOfWeekToId[d.day_of_week]).filter(Boolean);
          const selected = Array.from(new Set(selectedRaw));
          const schedules: Record<string, DaySchedule> = {};
          days.forEach((d) => {
            const id = dayOfWeekToId[d.day_of_week];
            if (id) {
              schedules[id] = {
                startTime: d.start_time.length === 5 ? d.start_time : d.start_time.slice(0, 5),
                endTime: d.end_time.length === 5 ? d.end_time : d.end_time.slice(0, 5),
              };
            }
          });
          setSelectedDays(selected.length ? selected : defaultWeekdays);
          setDaySchedules((prev) => ({ ...prev, ...schedules }));
        } else {
          // No days from API (e.g. no schedule set yet): keep at least weekdays so Save never sends empty
          setSelectedDays(defaultWeekdays);
        }
        if (data.lunch_break_start) setLunchBreakStart(data.lunch_break_start.length === 5 ? data.lunch_break_start : data.lunch_break_start.slice(0, 5));
        if (data.lunch_break_end) setLunchBreakEnd(data.lunch_break_end.length === 5 ? data.lunch_break_end : data.lunch_break_end.slice(0, 5));
        if (data.grace_period_minutes != null) setGracePeriodMinutes(data.grace_period_minutes);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingSchedule(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Load excused interns data from API
  useEffect(() => {
    let active = true;
    if (!canViewExcused) {
      setExcusedInterns({});
      setIsLoadingExcused(false);
      return () => {
        active = false;
      };
    }

    setIsLoadingExcused(true);

    const loadExcusedInterns = async () => {
      const excused: Record<string, ExcusedIntern[]> = {};
      
      // Fetch excused interns for each day
      const promises = WEEKDAYS.map(async (day) => {
        const dayOfWeek = getDayOfWeek(day.id);
        try {
          const interns = await getExcusedInterns(dayOfWeek);
          if (!active) return;
          
          // Only show excused interns on work days (not rest days)
          if (selectedDays.includes(day.id)) {
            excused[day.id] = interns.map((intern) => ({
              name: intern.name,
              student_id: intern.student_id,
              course: intern.course,
            }));
          } else {
            excused[day.id] = [];
          }
        } catch (error) {
          if (!active) return;
          console.error(`Failed to load excused interns for ${day.label}:`, error);
          excused[day.id] = [];
        }
      });

      await Promise.all(promises);
      
      if (!active) return;
      
      setExcusedInterns(excused);
      setIsLoadingExcused(false);
    };

    loadExcusedInterns();

    return () => {
      active = false;
    };
  }, [selectedDays, canViewExcused]);

  const handleDayClick = (dayId: string) => {
    setSelectedDay(dayId);
  };

  const getDayExcusedCount = (dayId: string): number => {
    return excusedInterns[dayId]?.length || 0;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Require at least one work day (backend expects non-empty days array)
      if (selectedDays.length === 0) {
        setSaveError("Select at least one work day.");
        setIsSaving(false);
        setTimeout(() => workDaysSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        return;
      }

      // Normalize time to HH:mm (backend expects date_format:H:i, no seconds)
      const toHHmm = (t: string) => (t && t.length >= 5 ? t.slice(0, 5) : t);

      // Convert day schedules to the format expected by the API (only include days that have a schedule)
      const days = selectedDays
        .filter((dayId) => daySchedules[dayId])
        .map((dayId) => {
          const schedule = daySchedules[dayId]!;
          return {
            day_of_week: getDayOfWeek(dayId),
            start_time: toHHmm(schedule.startTime),
            end_time: toHHmm(schedule.endTime),
          };
        });

      if (days.length === 0) {
        setSaveError("Select at least one work day and set its times.");
        setIsSaving(false);
        setTimeout(() => workDaysSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        return;
      }

      await updateDefaultSchedule({
        name: scheduleName,
        days,
        lunch_break_start: toHHmm(lunchBreakStart),
        lunch_break_end: toHHmm(lunchBreakEnd),
        admin_notes: adminNotes.trim() ? adminNotes.trim() : undefined,
      });

      setSaveSuccess(true);
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save schedule";
      setSaveError(message);
      if (message.toLowerCase().includes("work day") || message.toLowerCase().includes("day")) {
        workDaysSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Work schedules</h1>
        <p className="text-sm text-slate-600">
          Configure the OJT shift schedule for all interns.
        </p>
      </div>

      {!isEditing ? (
        // Display View
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{scheduleName}</CardTitle>
                <Badge variant="secondary" className="text-[11px]">
                  Default
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Standard OJT work schedule — required clock-in times for all interns</p>
              <p className="text-xs text-slate-500">Clock-in grace period: {gracePeriodMinutes} min — interns can clock in until start time + {gracePeriodMinutes} min without being marked late</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-900"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingSchedule ? (
              <p className="text-sm text-slate-500 py-4">Loading schedule…</p>
            ) : (
            <>
            {/* Daily Schedule */}
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day) => {
                const isWorkDay = selectedDays.includes(day.id);
                const schedule = daySchedules[day.id];
                return (
                  <div
                    key={day.id}
                    className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-b-0"
                  >
                    <span className={isWorkDay ? "font-medium text-slate-900" : "text-slate-400"}>
                      {day.label}
                    </span>
                    {isWorkDay && schedule ? (
                      <span className="font-semibold text-slate-900">
                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                      </span>
                    ) : (
                      <span className="text-slate-400">Rest day</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Split Timesheets */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                Split timesheets at <span className="font-semibold">12:00 am</span>
              </p>
            </div>

            {/* Breaks Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Breaks
                </h3>
                <Info className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">
                Schedule breaks by setting fixed times or durations here. If left empty, members can clock into breaks freely.
              </p>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">Lunch Break</span>
                  <span className="text-sm text-slate-600">
                    {lunchBreakDuration} minutes between {formatTime(lunchBreakStart)} - {formatTime(lunchBreakEnd)}
                  </span>
                </div>
              </div>
            </div>
            </>
            )}
          </CardContent>
        </Card>
      ) : (
        // Edit View
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-base">Edit Schedule</CardTitle>
              <CardDescription>
                Customize the OJT shift schedule settings
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-900"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Schedule name (saved to database) */}
            <div className="space-y-2">
              <Label htmlFor="schedule-name" className="text-xs font-semibold text-slate-700">
                Schedule name
              </Label>
              <Input
                id="schedule-name"
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="e.g. On the Job Training 2026"
                className="text-sm"
              />
            </div>

            {/* Days of the Week — at least one required */}
            <div className="space-y-2" id="work-days-section" ref={workDaysSectionRef}>
              <Label className="text-xs font-semibold text-slate-700">
                Work days <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-slate-500">Select at least one day. Blue = work day.</p>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-semibold transition ${
                      selectedDays.includes(day.id)
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
              {saveError && (saveError.includes("work day") || saveError.includes("day")) && (
                <p className="text-sm text-red-600">{saveError}</p>
              )}
            </div>

            {/* Daily Time Schedules */}
            <div className="space-y-3">
              {selectedDays.map((dayId, index) => {
                const day = DAYS_OF_WEEK.find((d) => d.id === dayId);
                const schedule = daySchedules[dayId];
                if (!day || !schedule) return null;

                return (
                  <div key={`work-${dayId}-${index}`} className="flex items-center gap-3">
                    <Label className="w-24 text-sm text-slate-700">{day.label}</Label>
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => updateDaySchedule(dayId, "startTime", e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <span className="text-sm text-slate-500">to</span>
                      <Input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => updateDaySchedule(dayId, "endTime", e.target.value)}
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                );
              })}
              {DAYS_OF_WEEK.filter((d) => !selectedDays.includes(d.id)).map((day) => (
                <div key={day.id} className="flex items-center gap-3">
                  <Label className="w-24 text-sm text-slate-400">{day.label}</Label>
                  <span className="text-sm text-slate-400">Rest day</span>
                </div>
              ))}
            </div>

            {/* Grace period (configured in Settings, enforced for clock-in cutoff) */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                Clock-in grace period: <span className="font-semibold text-slate-900">{gracePeriodMinutes} min</span>. Interns must clock in by start time + {gracePeriodMinutes} min. Change in <Link href="/dashboard/settings" className="text-blue-600 hover:underline">Settings</Link>.
              </p>
            </div>

            {/* Lunch Break */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-slate-700">Lunch Break</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="break-start" className="text-xs text-slate-600">
                    Start time
                  </Label>
                  <Input
                    id="break-start"
                    type="time"
                    value={lunchBreakStart}
                    onChange={(e) => setLunchBreakStart(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="break-end" className="text-xs text-slate-600">
                    End time
                  </Label>
                  <Input
                    id="break-end"
                    type="time"
                    value={lunchBreakEnd}
                    onChange={(e) => setLunchBreakEnd(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-600">
                  Duration: <span className="font-semibold text-slate-900">{lunchBreakDuration} minutes</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-notes" className="text-xs font-semibold text-slate-700">
                Admin notes (shown to interns)
              </Label>
              <textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add a note for interns about this schedule change."
                className="min-h-[90px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Save Button */}
            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4">
              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-800">{saveError}</p>
                </div>
              )}
              {saveSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm text-green-800">Schedule saved successfully!</p>
                </div>
              )}
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setSaveError(null);
                    setSaveSuccess(false);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="gap-2"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Schedule
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Excused due to school schedule */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Excused due to school schedule</CardTitle>
          <CardDescription>
            View OJT employees with scheduled school classes by day of the week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingExcused ? (
            <p className="text-sm text-slate-500 py-4">Loading excused schedules…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {WEEKDAYS.map((day) => {
                const count = getDayExcusedCount(day.id);
                const isRestDay = !selectedDays.includes(day.id);
                return (
                  <Button
                    key={day.id}
                    type="button"
                    variant="outline"
                    onClick={() => !isRestDay && handleDayClick(day.id)}
                    disabled={isRestDay}
                    className={`h-20 w-full flex-col gap-1 ${
                      isRestDay
                        ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <span className={`text-xs font-semibold ${isRestDay ? "text-slate-400" : "text-slate-700"}`}>
                      {day.label}
                    </span>
                    {isRestDay ? (
                      <span className="text-[10px] text-slate-400">Rest day</span>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-medium"
                      >
                        {count} {count === 1 ? "intern" : "interns"}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Excused Modal */}
      <Dialog open={canViewExcused && selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent onClose={() => setSelectedDay(null)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? `${WEEKDAYS.find((d) => d.id === selectedDay)?.label} - Excused Interns` : ""}
            </DialogTitle>
            <DialogDescription>
              OJT employees with scheduled school classes on this day.
            </DialogDescription>
          </DialogHeader>
          {selectedDay && excusedInterns[selectedDay] && (
            <div className="space-y-4 py-4">
              {excusedInterns[selectedDay].length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No interns excused for {WEEKDAYS.find((d) => d.id === selectedDay)?.label}.
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {excusedInterns[selectedDay].map((intern, index) => (
                    <div
                      key={`${intern.student_id}-${index}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2"
                    >
                      <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 sm:flex shrink-0">
                        {intern.name
                          .split(" ")[0]
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {intern.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{intern.student_id}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-xs font-medium text-slate-700">{intern.course}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDay(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

