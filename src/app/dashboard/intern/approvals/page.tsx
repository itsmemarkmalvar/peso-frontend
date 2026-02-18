"use client"

import { useEffect, useState } from "react"

import {
  getInternApprovals,
  type InternApprovalItem,
} from "@/lib/api/intern"
import { getLeaves, type LeaveRequest } from "@/lib/api/leaves"

const fallbackApprovals: InternApprovalItem[] = []

function formatDateRange(start: string, end: string | null): string {
  if (!end || end === start) {
    return new Date(start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  return `${new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
}

export default function InternApprovalsPage() {
  const [approvals, setApprovals] =
    useState<InternApprovalItem[]>(fallbackApprovals)
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(true)
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(true)

  useEffect(() => {
    let active = true

    getInternApprovals()
      .then((data) => {
        if (!active) return
        setApprovals(data?.items ?? [])
      })
      .catch(() => {
        if (!active) return
        setApprovals([])
      })
      .finally(() => {
        if (active) setIsLoadingApprovals(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    getLeaves()
      .then((res) => {
        if (!active) return
        const items = Array.isArray((res as { data?: LeaveRequest[] }).data)
          ? (res as { data: LeaveRequest[] }).data
          : []
        setLeaves(items)
      })
      .catch(() => {
        if (!active) return
        setLeaves([])
      })
      .finally(() => {
        if (active) setIsLoadingLeaves(false)
      })

    return () => {
      active = false
    }
  }, [])

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-blue-100 text-blue-700"
      case "Rejected":
        return "bg-red-100 text-red-700"
      default:
        return "bg-yellow-100 text-yellow-700"
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="rounded-2xl border border-(--dash-border) bg-(--dash-card) p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
          Approvals
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Submission status</h1>
        <p className="mt-1 text-sm text-(--dash-muted)">
          Track attendance logs and leave requests—pending or approved.
        </p>
      </header>

      {/* Attendance approvals */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--dash-muted)">
          Attendance
        </h2>
        <div className="grid gap-4">
          {isLoadingApprovals ? (
            <div className="rounded-2xl border border-dashed border-(--dash-border) bg-(--dash-card) px-6 py-8 text-center text-sm text-(--dash-muted)">
              Loading attendance…
            </div>
          ) : approvals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-(--dash-border) bg-(--dash-card) px-6 py-8 text-center text-sm text-(--dash-muted)">
              No attendance records yet.
            </div>
          ) : (
            approvals.map((approval, index) => (
              <div
                key={"id" in approval ? approval.id : `${approval.date}-${index}`}
                className="rounded-2xl border border-(--dash-border) bg-(--dash-card) p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{approval.date}</p>
                      {approval.approval_type && (
                        <span className="rounded-md bg-(--dash-muted)/20 px-2 py-0.5 text-[10px] font-medium text-(--dash-muted)">
                          {approval.approval_type}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-(--dash-muted)">
                      {approval.detail}
                    </p>
                  </div>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      getStatusClass(approval.status),
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

      {/* Leave requests */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--dash-muted)">
          Leave requests
        </h2>
        <div className="grid gap-4">
          {isLoadingLeaves ? (
            <div className="rounded-2xl border border-dashed border-(--dash-border) bg-(--dash-card) px-6 py-8 text-center text-sm text-(--dash-muted)">
              Loading leave requests…
            </div>
          ) : leaves.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-(--dash-border) bg-(--dash-card) px-6 py-8 text-center text-sm text-(--dash-muted)">
              No leave requests yet. Submit a leave from the dashboard.
            </div>
          ) : (
            leaves.map((leave) => (
              <div
                key={leave.id}
                className="rounded-2xl border border-(--dash-border) bg-(--dash-card) p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {formatDateRange(leave.start_date, leave.end_date)}
                    </p>
                    <p className="mt-1 text-xs text-(--dash-muted)">
                      {leave.reason_title}
                      {leave.rejection_reason
                        ? ` — Rejected: ${leave.rejection_reason}`
                        : leave.status === "Approved" && leave.approved_at
                          ? " — Approved"
                          : leave.status === "Pending"
                            ? " — Awaiting supervisor review"
                            : ""}
                    </p>
                  </div>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      getStatusClass(leave.status),
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
  )
}
