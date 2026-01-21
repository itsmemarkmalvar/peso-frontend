"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminInterns, type AdminIntern } from "@/lib/api/intern";

type ApprovalRow = {
  id: string;
  intern: string;
  internId: string;
  type: "Overtime" | "Correction" | "Undertime";
  date: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
};

function buildApprovalRows(interns: AdminIntern[]): ApprovalRow[] {
  if (!interns.length) return [];

  const types: ApprovalRow["type"][] = ["Overtime", "Correction", "Undertime"];
  const statuses: ApprovalRow["status"][] = ["Pending", "Pending", "Approved", "Rejected"];

  return interns.slice(0, 30).map((intern, index) => {
    const type = types[index % types.length];
    const status = statuses[index % statuses.length];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - index);

    return {
      id: `APP-${2026}-${String(intern.id).padStart(4, "0")}`,
      intern: intern.name,
      internId: intern.student_id,
      type,
      date: baseDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      reason: "Sample approval request",
      status,
    };
  });
}

export default function ApprovalsPage() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAdminInterns()
      .then((interns) => {
        if (!active) return;
        setRows(buildApprovalRows(interns));
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load interns.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Approvals</h1>
        <p className="text-sm text-slate-600">
          Review and approve time corrections, overtime, and undertime requests from OJT interns.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Pending & completed approvals</CardTitle>
          <CardDescription>
            Live list of approval requests from OJT accounts. Wire action buttons to your approvals API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <p className="text-[11px] text-slate-500">Loading approvals…</p>
          )}
          {error && !isLoading && (
            <p className="text-[11px] text-red-600">
              {error} Unable to load approvals.
            </p>
          )}
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {!isLoading &&
              !error &&
              rows.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-500">
                        {item.id}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          item.type === "Overtime"
                            ? "border-blue-200 bg-blue-50 text-[11px] font-medium text-blue-900"
                            : item.type === "Correction"
                            ? "border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-900"
                            : "border-red-200 bg-red-50 text-[11px] font-medium text-red-900"
                        }
                      >
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{item.intern}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.internId} · {item.date}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Reason: {item.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "Pending" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 rounded-full border-green-200 bg-green-50 text-xs text-green-800 hover:bg-green-100"
                          disabled
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 rounded-full border-red-200 bg-red-50 text-xs text-red-800 hover:bg-red-100"
                          disabled
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Badge
                        className={
                          item.status === "Approved"
                            ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                            : "bg-red-50 text-red-800 ring-1 ring-red-200"
                        }
                      >
                        {item.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            {!isLoading && !error && rows.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No approval requests yet. Once interns submit corrections or overtime, they will appear here.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
