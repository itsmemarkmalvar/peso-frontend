"use client"

import { useEffect, useState } from "react"

import { getInternApprovals, type InternApprovalItem } from "@/lib/api/intern"
import { getLeaves, type LeaveRequest } from "@/lib/api/leaves"

const fallbackApprovals: InternApprovalItem[] = [
  {
    date: "Jan 19, 2026",
    status: "Pending",
    detail: "Waiting for supervisor review.",
  },
  {
    date: "Jan 18, 2026",
    status: "Approved",
    detail: "Approved by Supervisor Santos.",
  },
  {
    date: "Jan 17, 2026",
    status: "Approved",
    detail: "Approved by Supervisor Santos.",
  },
] as const

const fallbackLeaves: LeaveRequest[] = [
  {
    id: 1,
    intern_id: 1,
    intern_name: "Sample Intern",
    intern_student_id: "INT-0001",
    type: "Leave",
    reason_title: "School event",
    status: "Pending",
    start_date: "2026-01-20",
    end_date: null,
    notes: null,
    rejection_reason: null,
    approved_by: null,
    approved_at: null,
    created_at: "2026-01-18T08:00:00Z",
    updated_at: "2026-01-18T08:00:00Z",
  },
  {
    id: 2,
    intern_id: 1,
    intern_name: "Sample Intern",
    intern_student_id: "INT-0001",
    type: "Holiday",
    reason_title: "Local holiday",
    status: "Approved",
    start_date: "2026-01-22",
    end_date: null,
    notes: "Approved by HR",
    rejection_reason: null,
    approved_by: 4,
    approved_at: "2026-01-21T14:00:00Z",
    created_at: "2026-01-20T08:00:00Z",
    updated_at: "2026-01-21T14:00:00Z",
  },
] as const

function getStatusBadgeClass(status: "Approved" | "Pending" | "Rejected") {
  if (status === "Approved") {
    return "bg-blue-100 text-blue-700"
  }
  if (status === "Rejected") {
    return "bg-red-100 text-red-700"
  }
  return "bg-yellow-100 text-yellow-700"
}

function formatLeaveDates(leave: LeaveRequest) {
  const start = new Date(leave.start_date)
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  if (!leave.end_date) {
    return startLabel
  }

  const end = new Date(leave.end_date)
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return `${startLabel} - ${endLabel}`
}

export default function InternApprovalsPage() {
  const [approvals, setApprovals] =
    useState<InternApprovalItem[]>(fallbackApprovals)
  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>(fallbackLeaves)

  useEffect(() => {
    let active = true

    getInternApprovals()
      .then((data) => {
        if (!active) {
          return
        }
        if (data?.items?.length) {
          setApprovals(data.items)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    getLeaves()
      .then((response) => {
        if (!active) {
          return
        }
        if (response?.data?.length) {
          setLeaveRequests(response.data)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
          Approvals
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Submission status</h1>
        <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
          Track attendance updates and leave requests.
        </p>
      </header>

      <div className="grid gap-4">
        <section className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Attendance approvals</p>
            <p className="text-xs text-[color:var(--dash-muted)]">
              Time corrections, overtime, and undertime updates.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {approvals.length === 0 ? (
              <p className="text-xs text-[color:var(--dash-muted)]">
                No attendance approvals yet.
              </p>
            ) : (
              approvals.map((approval, index) => (
                <div
                  key={`${approval.date}-${index}`}
                  className="rounded-xl border border-slate-100 bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{approval.date}</p>
                      <p className="mt-1 text-xs text-[color:var(--dash-muted)]">
                        {approval.detail}
                      </p>
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusBadgeClass(approval.status),
                      ].join(" ")}
                    >
                      {approval.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Leave requests</p>
            <p className="text-xs text-[color:var(--dash-muted)]">
              Leave and holiday submissions sent to your supervisor.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {leaveRequests.length === 0 ? (
              <p className="text-xs text-[color:var(--dash-muted)]">
                No leave requests yet.
              </p>
            ) : (
              leaveRequests.map((leave) => (
                <div
                  key={leave.id}
                  className="rounded-xl border border-slate-100 bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{leave.reason_title}</p>
                      <p className="mt-1 text-xs text-[color:var(--dash-muted)]">
                        {leave.type} · {formatLeaveDates(leave)}
                      </p>
                      {leave.rejection_reason && (
                        <p className="mt-1 text-xs text-red-600">
                          {leave.rejection_reason}
                        </p>
                      )}
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusBadgeClass(leave.status),
                      ].join(" ")}
                    >
                      {leave.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
