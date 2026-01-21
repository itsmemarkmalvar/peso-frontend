"use client";

import { useState } from "react";
import { Clock, Edit2, Save, X, Info } from "lucide-react";

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

export default function WorkSchedulesPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [scheduleName] = useState("On the Job Training 2026");
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
              <p className="text-xs text-slate-500">Standard OJT work schedule</p>
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
            {/* Days of the Week */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Days of the week</Label>
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
            </div>

            {/* Daily Time Schedules */}
            <div className="space-y-3">
              {selectedDays.map((dayId) => {
                const day = DAYS_OF_WEEK.find((d) => d.id === dayId);
                const schedule = daySchedules[dayId];
                if (!day || !schedule) return null;

                return (
                  <div key={dayId} className="flex items-center gap-3">
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

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="gap-2"
                disabled
              >
                <Save className="h-4 w-4" />
                Save Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

