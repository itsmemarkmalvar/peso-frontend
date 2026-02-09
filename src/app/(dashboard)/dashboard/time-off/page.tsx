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
  getLeaves,
  approveLeave,
  rejectLeave,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
} from "@/lib/api/leaves";

export default function LeavePage() {
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    let active = true;
    setError(null);

    getLeaves()
      .then((response) => {
        if (!active) return;
        // API may return { data: [...] } or { data: { data: [...] } }
        const raw = (response as { data?: { data?: LeaveRequest[] } | LeaveRequest[] }).data;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        setRows(list);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setRows([]);
        setError(err instanceof Error ? err.message : "Failed to load leave requests.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRowClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
    setRejectReason("");
    setAdminNotes("");
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      await approveLeave(selectedRequest.id, adminNotes.trim() || undefined);
      // Update the row in the list
      setRows((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: "Approved" as LeaveStatus }
            : r
        )
      );
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
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
      await rejectLeave(
        selectedRequest.id,
        rejectReason,
        adminNotes.trim() || undefined
      );
      // Update the row in the list
      setRows((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: "Rejected" as LeaveStatus, rejection_reason: rejectReason }
            : r
        )
      );
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason("");
      setAdminNotes("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeBadgeClass = (type: LeaveType) => {
    switch (type) {
      case "Leave":
        return "border-blue-200 bg-blue-50 text-blue-900";
      case "Holiday":
        return "border-purple-200 bg-purple-50 text-purple-900";
      default:
        return "border-slate-200 bg-slate-50 text-slate-900";
    }
  };

  const getStatusBadgeClass = (status: LeaveStatus) => {
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
        <h1 className="text-lg font-semibold text-slate-900">Leave requests</h1>
        <p className="text-sm text-slate-600">
          Review and approve leave and holiday requests from OJT interns.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Pending & completed leave requests</CardTitle>
          <CardDescription>
            Click on any row to view details and approve or reject requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-slate-500 py-4">Loading leave requests…</p>
          )}
          {error && !isLoading && (
            <p className="text-sm text-red-600 py-4">
              {error} Unable to load leave requests.
            </p>
          )}
          {!isLoading && !error && rows.length === 0 && (
            <p className="text-sm text-slate-500 py-4">
              No leave requests yet. Once interns submit leave requests, they will appear here.
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
            <DialogTitle>Leave Request Details</DialogTitle>
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
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Start Date</p>
                  <p className="text-sm text-slate-900">
                    {new Date(selectedRequest.start_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {selectedRequest.end_date && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">End Date</p>
                    <p className="text-sm text-slate-900">
                      {new Date(selectedRequest.end_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
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
                      Admin Notes (optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes for this request..."
                      className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
