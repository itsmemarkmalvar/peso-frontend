"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Bell } from "lucide-react"
import { useEffect, useState } from "react"

import { useAuth } from "@/hooks/useAuth"
import { getInternOrGipRoleLabel } from "@/lib/constants"
import {
  getInternDashboard,
  type InternActivityItem,
  type InternDashboardStat,
  getInternTimeClock,
  type InternTimeClockData,
} from "@/lib/api/intern"
import type { Attendance } from "@/lib/api/attendance"
import {
  getNotifications,
  markNotificationRead,
  respondToScheduleAvailability,
  type NotificationRecord,
} from "@/lib/api/notifications"
import { createLeave } from "@/lib/api/leaves"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const fallbackStats: InternDashboardStat[] = [
  { label: "Hours logged", value: "18h 40m", sub: "This week" },
  { label: "Last clock", value: "08:10 AM", sub: "Today" },
  { label: "Approvals", value: "1 pending", sub: "Awaiting review" },
] as const

const fallbackTimeline: InternActivityItem[] = [
  { time: "08:10 AM", title: "Clocked in", detail: "Main office" },
  { time: "12:05 PM", title: "Break start", detail: "Lunch" },
  { time: "12:45 PM", title: "Break end", detail: "Back to work" },
] as const

function parseTimeToMinutes(value: string): number {
  // Expect formats like "08:10 AM", fall back to 0 when unknown
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return 0
  let hours = Number(match[1])
  const minutes = Number(match[2])
  const period = match[3].toUpperCase()

  if (period === "PM" && hours !== 12) {
    hours += 12
  }
  if (period === "AM" && hours === 12) {
    hours = 0
  }

  return hours * 60 + minutes
}

function sortActivityDescending(items: InternActivityItem[]): InternActivityItem[] {
  return [...items].sort(
    (a, b) => parseTimeToMinutes(b.time) - parseTimeToMinutes(a.time)
  )
}

function formatDurationMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "0h 00m"
  }
  const hours = Math.floor(totalMinutes / 60)
  const minutes = Math.round(totalMinutes % 60)
  return `${hours}h ${String(minutes).padStart(2, "0")}m`
}

function parseMeridiemMinutes(value: string): number | null {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2])
  const period = match[3].toUpperCase()

  if (period === "PM" && hours !== 12) {
    hours += 12
  }
  if (period === "AM" && hours === 12) {
    hours = 0
  }

  return hours * 60 + minutes
}

function parseShiftMinutes(label: string): number | null {
  const match = label.match(
    /(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i
  )
  if (!match) return null
  const start = parseMeridiemMinutes(match[1])
  const end = parseMeridiemMinutes(match[2])
  if (start === null || end === null) return null
  let diff = end - start
  if (diff < 0) diff += 24 * 60
  return diff
}

function computeWorkedMinutes(
  attendance: Attendance | null,
  nowMs: number
): {
  workedMinutes: number
  isClockedIn: boolean
  isOnBreak: boolean
  hasClockedOut: boolean
} {
  if (!attendance?.clock_in_time) {
    return {
      workedMinutes: 0,
      isClockedIn: false,
      isOnBreak: false,
      hasClockedOut: false,
    }
  }

  const clockIn = new Date(attendance.clock_in_time)
  if (Number.isNaN(clockIn.getTime())) {
    return {
      workedMinutes: 0,
      isClockedIn: false,
      isOnBreak: false,
      hasClockedOut: false,
    }
  }

  const clockOut = attendance.clock_out_time
    ? new Date(attendance.clock_out_time)
    : null
  const end =
    clockOut && !Number.isNaN(clockOut.getTime()) ? clockOut : new Date(nowMs)

  let totalMinutes = Math.max(0, (end.getTime() - clockIn.getTime()) / 60000)
  let breakMinutes = 0

  if (attendance.break_start) {
    const breakStart = new Date(attendance.break_start)
    if (!Number.isNaN(breakStart.getTime())) {
      const breakEnd = attendance.break_end
        ? new Date(attendance.break_end)
        : end
      if (!Number.isNaN(breakEnd.getTime()) && breakEnd > breakStart) {
        breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / 60000
      }
    }
  }

  const workedMinutes = Math.max(0, totalMinutes - breakMinutes)
  const isClockedIn = Boolean(attendance.clock_in_time && !attendance.clock_out_time)
  const isOnBreak = Boolean(attendance.break_start && !attendance.break_end && isClockedIn)
  const hasClockedOut = Boolean(attendance.clock_out_time)

  return { workedMinutes, isClockedIn, isOnBreak, hasClockedOut }
}

const quickLinks = [
  {
    label: "Home",
    desc: "Overview and daily summary.",
    href: "/dashboard/intern",
  },
  {
    label: "Time & Clock",
    desc: "Schedule, clock in, and clock out.",
    href: "/dashboard/intern/time",
  },
  {
    label: "Timesheets",
    desc: "View and submit logs.",
    href: "/dashboard/intern/timesheets",
  },
  {
    label: "Approvals",
    desc: "Track approval status.",
    href: "/dashboard/intern/approvals",
  },
  {
    label: "Menu",
    desc: "Settings and resources.",
    href: "/dashboard/intern/menu",
  },
] as const

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function InternDashboardPage() {
  const { user } = useAuth()
  const reduceMotion = useReducedMotion()
  const [stats, setStats] = useState<InternDashboardStat[]>(fallbackStats)
  const [timeline, setTimeline] =
    useState<InternActivityItem[]>(sortActivityDescending(fallbackTimeline))
  const [timeClock, setTimeClock] = useState<InternTimeClockData | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [leaveReason, setLeaveReason] = useState("")
  const [leaveStartDate, setLeaveStartDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [leaveEndDate, setLeaveEndDate] = useState("")
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  )
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationRecord | null>(null)
  const [isResponding, setIsResponding] = useState(false)

  useEffect(() => {
    let active = true

    getInternDashboard()
      .then((data) => {
        if (!active) {
          return
        }
        if (data?.stats?.length) {
          setStats(data.stats)
        }
        if (data?.recentActivity?.length) {
          setTimeline(sortActivityDescending(data.recentActivity))
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    getInternTimeClock()
      .then((data) => {
        if (!active || !data) {
          return
        }
        setTimeClock(data)
        if (data.todayAttendance !== undefined) {
          setTodayAttendance(data.todayAttendance ?? null)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let active = true
    setIsLoadingNotifications(true)
    setNotificationsError(null)

    getNotifications()
      .then((data) => {
        if (!active) return
        setNotifications(data)
      })
      .catch((err) => {
        if (!active) return
        setNotificationsError(
          err instanceof Error
            ? err.message
            : "Unable to load notifications."
        )
      })
      .finally(() => {
        if (!active) return
        setIsLoadingNotifications(false)
      })

    return () => {
      active = false
    }
  }, [])

  const unreadCount = notifications.filter((item) => !item.is_read).length

  const selectedNotificationData =
    (selectedNotification?.data as Record<string, unknown> | null) ?? null
  const scheduleDayLabel =
    (selectedNotificationData?.day_label as string | undefined) ?? "Saturday"
  const scheduleStart = selectedNotificationData?.start_time as string | undefined
  const scheduleEnd = selectedNotificationData?.end_time as string | undefined
  const adminNotes = selectedNotificationData?.admin_notes as string | undefined
  const responseData = selectedNotificationData?.response as
    | { status?: string }
    | undefined
  const responseStatus = responseData?.status

  const { workedMinutes, isClockedIn, isOnBreak, hasClockedOut } =
    computeWorkedMinutes(todayAttendance, nowMs)
  const rawShiftLabel = timeClock?.header?.shiftLabel
  const shiftLabel = rawShiftLabel
    ? rawShiftLabel.toLowerCase().startsWith("shift") ||
      rawShiftLabel.toLowerCase().startsWith("no")
      ? rawShiftLabel
      : `Shift ${rawShiftLabel}`
    : "Shift 8:00 AM - 5:00 PM"
  const scheduledMinutes = rawShiftLabel
    ? parseShiftMinutes(rawShiftLabel)
    : parseShiftMinutes(shiftLabel)
  const progressLabel = scheduledMinutes
    ? `${formatDurationMinutes(workedMinutes)} of ${formatDurationMinutes(
        scheduledMinutes
      )}`
    : `${formatDurationMinutes(workedMinutes)} logged`
  const progressPct =
    scheduledMinutes && scheduledMinutes > 0
      ? Math.min(100, Math.round((workedMinutes / scheduledMinutes) * 100))
      : 0
  let statusLabel = "Not clocked in"
  if (hasClockedOut) {
    statusLabel = "Clocked out"
  } else if (isOnBreak) {
    statusLabel = "On break"
  } else if (isClockedIn) {
    statusLabel = "Clocked in"
  }
  const statusClassName = isOnBreak
    ? "bg-yellow-100 text-yellow-700"
    : isClockedIn
      ? "bg-emerald-100 text-emerald-700"
      : hasClockedOut
        ? "bg-slate-100 text-slate-700"
        : "bg-red-100 text-red-700"
  const primaryClockLabel =
    isClockedIn || hasClockedOut ? "Open Time Clock" : "Clock In"

  const handleOpenNotification = async (item: NotificationRecord) => {
    setSelectedNotification(item)
    if (item.is_read) {
      return
    }
    try {
      const updated = await markNotificationRead(item.id)
      setNotifications((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry))
      )
      setSelectedNotification((current) =>
        current && current.id === updated.id ? updated : current
      )
    } catch {
      // Non-blocking: keep UI responsive even if read status fails
    }
  }

  const handleRespond = async (status: "available" | "not_available") => {
    if (!selectedNotification) return
    setIsResponding(true)
    try {
      const updated = await respondToScheduleAvailability(
        selectedNotification.id,
        status
      )
      setNotifications((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      setSelectedNotification(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save response.")
    } finally {
      setIsResponding(false)
    }
  }

  const openLeaveDialog = () => {
    setLeaveReason("")
    setLeaveStartDate(new Date().toISOString().split("T")[0])
    setLeaveEndDate("")
    setLeaveError(null)
    setIsLeaveDialogOpen(true)
  }

  const handleSubmitLeave = async () => {
    setLeaveError(null)
    const trimmedReason = leaveReason.trim()
    if (!trimmedReason) {
      setLeaveError("Please provide a reason for your leave.")
      return
    }
    if (!leaveStartDate) {
      setLeaveError("Please select a start date.")
      return
    }
    if (leaveEndDate && leaveEndDate < leaveStartDate) {
      setLeaveError("End date cannot be earlier than start date.")
      return
    }

    setIsSubmittingLeave(true)
    try {
      await createLeave({
        type: "Leave",
        reason_title: trimmedReason,
        start_date: leaveStartDate,
        end_date: leaveEndDate ? leaveEndDate : null,
      })
      setIsLeaveDialogOpen(false)
      setLeaveReason("")
      setLeaveStartDate(new Date().toISOString().split("T")[0])
      setLeaveEndDate("")
      setLeaveError(null)
      alert("Leave request submitted for review.")
    } catch (err) {
      setLeaveError(
        err instanceof Error ? err.message : "Failed to submit leave request"
      )
    } finally {
      setIsSubmittingLeave(false)
    }
  }

  return (
    <motion.div
      variants={reduceMotion ? undefined : container}
      initial={reduceMotion ? undefined : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      className="mx-auto flex max-w-6xl flex-col gap-6"
    >
      <motion.header
        variants={reduceMotion ? undefined : item}
        className="flex flex-col gap-4 rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
            Tuesday, Jan 20
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Welcome back, {getInternOrGipRoleLabel(user?.role)}
          </h1>
          <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
            Keep your time logs accurate for approvals and reports.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsNotificationsOpen(true)
              setSelectedNotification(null)
            }}
            className="relative w-full justify-center border-[color:var(--dash-border)] text-[color:var(--dash-ink)] sm:w-auto"
          >
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button
            asChild
            className="w-full justify-center bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)] sm:w-auto"
          >
            <Link href="/dashboard/intern/time">{primaryClockLabel}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full justify-center border-[color:var(--dash-border)] text-[color:var(--dash-ink)] sm:w-auto"
          >
            <Link href="/dashboard/intern/timesheets">View Timesheets</Link>
          </Button>
          <Button
            variant="outline"
            onClick={openLeaveDialog}
            className="w-full justify-center border-[color:var(--dash-border)] text-[color:var(--dash-ink)] sm:w-auto"
          >
            File A Leave
          </Button>
        </div>
      </motion.header>

      <motion.div
        variants={reduceMotion ? undefined : item}
        className="grid gap-4 md:grid-cols-3"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-2 text-xs text-[color:var(--dash-muted)]">
              {stat.sub}
            </p>
          </div>
        ))}
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : item}
        className="grid gap-4 lg:grid-cols-2"
      >
        <div className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
                Workday Status
              </p>
              <p className="mt-2 text-lg font-semibold">
                {shiftLabel}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}>
              {statusLabel}
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-[color:var(--dash-muted)]">
              <span>Progress</span>
              <span>{progressLabel}</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-[color:var(--dash-accent)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              size="sm"
              className="w-full justify-center bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)] sm:w-auto"
            >
              <Link href="/dashboard/intern/time">{primaryClockLabel}</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full justify-center border-[color:var(--dash-border)] text-[color:var(--dash-ink)] sm:w-auto"
            >
              <Link href="/dashboard/intern/time">View Schedule</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
            Recent Activity
          </p>
          <div className="mt-4 space-y-4">
            {timeline.map((entry) => (
              <div
                key={`${entry.time}-${entry.title}`}
                className="flex items-start gap-3"
              >
                <div className="mt-1 h-2 w-2 rounded-full bg-[color:var(--dash-accent)]" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{entry.title}</span>
                    <span className="text-xs text-[color:var(--dash-muted)]">
                      {entry.time}
                    </span>
                  </div>
                  <p className="text-xs text-[color:var(--dash-muted)]">
                    {entry.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="mt-5 border-[color:var(--dash-border)] text-[color:var(--dash-ink)]"
          >
            <Link href="/dashboard/intern/time">Open Time Logs</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : item}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{link.label}</p>
              <span className="text-xs font-semibold text-[color:var(--dash-accent)]">
                Open
              </span>
            </div>
            <p className="mt-2 text-xs text-[color:var(--dash-muted)]">
              {link.desc}
            </p>
          </Link>
        ))}
      </motion.div>

      <Dialog
        open={isNotificationsOpen}
        onOpenChange={(open) => {
          setIsNotificationsOpen(open)
          if (!open) {
            setSelectedNotification(null)
          }
        }}
      >
        <DialogContent
          onClose={() => setIsNotificationsOpen(false)}
          className="max-w-xl"
        >
          <DialogHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <DialogTitle>Notifications</DialogTitle>
              <DialogDescription>
                Schedule changes and updates from your coordinator.
              </DialogDescription>
            </div>
            <Badge variant="secondary">{unreadCount} Unread</Badge>
          </DialogHeader>

          {selectedNotification ? (
            <div className="space-y-4 py-4 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">
                  {selectedNotification.title}
                </p>
                <p className="mt-1 text-slate-600">
                  {selectedNotification.message}
                </p>
              </div>
              {selectedNotification.type === "schedule_availability_request" && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">
                      Schedule change: {scheduleDayLabel}
                    </p>
                    {scheduleStart && scheduleEnd && (
                      <p className="mt-1">
                        {scheduleStart} - {scheduleEnd}
                      </p>
                    )}
                  </div>
                  {adminNotes && (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase text-slate-500">
                        Admin notes
                      </p>
                      <p className="mt-1 text-xs text-slate-700">
                        {adminNotes}
                      </p>
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">
                      Are you available?
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                        onClick={() => handleRespond("available")}
                        disabled={isResponding}
                      >
                        Available
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                        onClick={() => handleRespond("not_available")}
                        disabled={isResponding}
                      >
                        Not available
                      </Button>
                      {responseStatus && (
                        <span className="text-[11px] text-slate-500">
                          Current response: {responseStatus.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {isLoadingNotifications && (
                <p className="text-xs text-slate-500">
                  Loading notifications...
                </p>
              )}
              {notificationsError && !isLoadingNotifications && (
                <p className="text-xs text-red-600">{notificationsError}</p>
              )}
              {!isLoadingNotifications &&
                !notificationsError &&
                notifications.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No notifications yet. We&apos;ll let you know when something needs your attention.
                  </p>
                )}
              {!isLoadingNotifications &&
                !notificationsError &&
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenNotification(item)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                      item.is_read
                        ? "border-slate-100 bg-white hover:border-slate-200"
                        : "border-blue-200 bg-blue-50/60 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-600">
                          {item.message}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedNotification && (
              <Button
                variant="outline"
                onClick={() => setSelectedNotification(null)}
              >
                Back to list
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsNotificationsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent onClose={() => setIsLeaveDialogOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>File A Leave</DialogTitle>
            <DialogDescription>
              Submit a leave request for admin review.
            </DialogDescription>
          </DialogHeader>
          {leaveError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {leaveError}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leave-reason" className="text-xs font-semibold text-slate-700">
                Reason for leave
              </Label>
              <textarea
                id="leave-reason"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Share the reason for your leave..."
                className="w-full min-h-[96px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmittingLeave}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">
                Duration of leave
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="leave-start" className="text-xs text-slate-500">
                    Start date
                  </Label>
                  <Input
                    id="leave-start"
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    disabled={isSubmittingLeave}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave-end" className="text-xs text-slate-500">
                    End date
                  </Label>
                  <Input
                    id="leave-end"
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    disabled={isSubmittingLeave}
                    className="text-sm"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Leave end date blank if the leave is for one day only.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLeaveDialogOpen(false)}
              disabled={isSubmittingLeave}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitLeave}
              disabled={isSubmittingLeave}
              className="bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]"
            >
              {isSubmittingLeave ? "Submitting..." : "Submit Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
