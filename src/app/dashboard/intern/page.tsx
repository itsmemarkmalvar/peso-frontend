"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

import {
  getInternDashboard,
  type InternActivityItem,
  type InternDashboardStat,
} from "@/lib/api/intern"
import { createLeave } from "@/lib/api/leaves"
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
  const reduceMotion = useReducedMotion()
  const [stats, setStats] = useState<InternDashboardStat[]>(fallbackStats)
  const [timeline, setTimeline] =
    useState<InternActivityItem[]>(sortActivityDescending(fallbackTimeline))
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [leaveReason, setLeaveReason] = useState("")
  const [leaveStartDate, setLeaveStartDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [leaveEndDate, setLeaveEndDate] = useState("")
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

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
            Welcome back, Intern
          </h1>
          <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
            Keep your time logs accurate for approvals and reports.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            className="w-full justify-center bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)] sm:w-auto"
          >
            <Link href="/dashboard/intern/time">Clock In</Link>
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
                Shift 8:00 AM - 5:00 PM
              </p>
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Not clocked in
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-[color:var(--dash-muted)]">
              <span>Progress</span>
              <span>2h 10m of 8h</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 w-[28%] rounded-full bg-[color:var(--dash-accent)]" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              size="sm"
              className="w-full justify-center bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)] sm:w-auto"
            >
              <Link href="/dashboard/intern/time">Clock In</Link>
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
