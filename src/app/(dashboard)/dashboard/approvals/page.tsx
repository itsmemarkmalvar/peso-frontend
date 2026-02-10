"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getApprovals,
  approveRequest,
  rejectRequest,
  type ApprovalStatus,
  type ApprovalType,
  type ApprovalRequest,
} from "@/lib/api/approvals";

// Normalize API response: backend may return { data: [...], pagination } or { data: [...] }
function normalizeApprovalsList(response: { data?: ApprovalRequest[] | { data?: ApprovalRequest[] }; pagination?: unknown }): ApprovalRequest[] {
  const d = response.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object" && Array.isArray((d as { data?: ApprovalRequest[] }).data)) {
    return (d as { data: ApprovalRequest[] }).data;
  }
  return [];
}

export default function ApprovalsPage() {
  const [rows, setRows] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let active = true;
    setError(null);

    getApprovals()
      .then((response) => {
        if (!active) return;
        const list = normalizeApprovalsList(response as { data?: ApprovalRequest[] | { data?: ApprovalRequest[] }; pagination?: unknown });
        setRows(list);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load approvals.");
        setRows([]);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRowClick = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
    setRejectReason("");
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      await approveRequest(selectedRequest.id);
      // Update the row in the list
      setRows((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: "Approved" as ApprovalStatus }
            : r
        )
      );
      setIsDialogOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setIsProcessing(true);
    try {
      await rejectRequest(selectedRequest.id, rejectReason);
      // Update the row in the list
      setRows((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: "Rejected" as ApprovalStatus, rejection_reason: rejectReason }
            : r
        )
      );
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeBadgeClass = (type: ApprovalType) => {
    switch (type) {
      case "Overtime":
        return "border-blue-200 bg-blue-50 text-blue-900";
      case "Correction":
        return "border-amber-200 bg-amber-50 text-amber-900";
      case "Undertime":
        return "border-red-200 bg-red-50 text-red-900";
      default:
        return "border-slate-200 bg-slate-50 text-slate-900";
    }
  };

  const getStatusBadgeClass = (status: ApprovalStatus) => {
    switch (status) {
      case "Approved":
        return "bg-green-50 text-green-800 ring-1 ring-green-200";
      case "Rejected":
        return "bg-red-50 text-red-800 ring-1 ring-red-200";
      case "Pending":
        return "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200";
      default:
        return "bg-slate-50 text-slate-800 ring-1 ring-slate-200";
    }
  };

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
            Click on any row to view details and approve or reject requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-slate-500 py-4">Loading approvals…</p>
          )}
          {error && !isLoading && (
            <p className="text-sm text-red-600 py-4">
              {error} Unable to load approvals.
            </p>
          )}
          {!isLoading && !error && rows.length === 0 && (
            <p className="text-sm text-slate-500 py-4">
              No approval requests yet. Once interns submit corrections or overtime, they will appear here.
            </p>
          )}
          {!isLoading && !error && rows.length > 0 && (
            <div className="mt-2 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {rows.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700 cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 sm:flex shrink-0">
                    {item.intern_name
                      .split(" ")[0]
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.intern_name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.intern_student_id}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${getTypeBadgeClass(item.type)}`}
                    >
                      {item.type}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0 text-sm text-slate-700 truncate">
                    {item.reason_title || "No reason provided"}
                  </div>
                  <div className="shrink-0">
                    <Badge className={`text-xs ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approval Request Details</DialogTitle>
            <DialogDescription>
              Review the request details and approve or reject it.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Intern Name</p>
                  <p className="text-sm text-slate-900">{selectedRequest.intern_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Student ID</p>
                  <p className="text-sm text-slate-900">{selectedRequest.intern_student_id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Type</p>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${getTypeBadgeClass(selectedRequest.type)}`}
                  >
                    {selectedRequest.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</p>
                  <Badge className={`text-xs ${getStatusBadgeClass(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Date</p>
                  <p className="text-sm text-slate-900">
                    {new Date(selectedRequest.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {selectedRequest.clock_in_time && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Clock In</p>
                    <p className="text-sm text-slate-900">
                      {new Date(selectedRequest.clock_in_time).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: "Asia/Manila",
                      })}
                    </p>
                  </div>
                )}
                {selectedRequest.clock_out_time && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Clock Out</p>
                    <p className="text-sm text-slate-900">
                      {new Date(selectedRequest.clock_out_time).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                        timeZone: "Asia/Manila",
                      })}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Reason Title</p>
                <p className="text-sm text-slate-900">{selectedRequest.reason_title}</p>
              </div>
              {selectedRequest.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedRequest.notes}</p>
                </div>
              )}
              {selectedRequest.rejection_reason && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selectedRequest.rejection_reason}</p>
                </div>
              )}
              {selectedRequest.status === "Pending" && (
                <div className="space-y-2 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedRequest?.status === "Pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing || !rejectReason.trim()}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {selectedRequest?.status !== "Pending" && (
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
