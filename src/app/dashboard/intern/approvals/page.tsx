"use client"

import { useEffect, useState } from "react"

import {
  getInternApprovals,
  type InternApprovalItem,
} from "@/lib/api/intern"

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

export default function InternApprovalsPage() {
  const [approvals, setApprovals] =
    useState<InternApprovalItem[]>(fallbackApprovals)

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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
          Approvals
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Submission status</h1>
        <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
          Track which attendance logs are pending or approved.
        </p>
      </header>

      <div className="grid gap-4">
        {approvals.map((approval) => (
          <div
            key={approval.date}
            className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm"
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
                  approval.status === "Approved"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700",
                ].join(" ")}
              >
                {approval.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
