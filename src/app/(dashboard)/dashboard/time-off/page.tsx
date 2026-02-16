"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, User, CalendarDays, FileText, MessageSquare } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
        setError(err instanceof Error ? err.message : "Failed to load absent requests.");
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
        return "border-[color:var(--dash-border)] bg-[color:var(--dash-accent-soft)] text-[color:var(--dash-accent-strong)]";
      case "Holiday":
        return "border-[color:var(--dash-border)] bg-[color:var(--dash-accent-soft)]/70 text-[color:var(--dash-ink)]";
      default:
        return "border-[color:var(--dash-border)] bg-[color:var(--muted)] text-[color:var(--dash-ink)]";
    }
  };

  const getStatusBadgeClass = (status: LeaveStatus) => {
    switch (status) {
      case "Approved":
        return "bg-[color:var(--dash-accent-soft)] text-[color:var(--dash-accent-strong)] ring-1 ring-[color:var(--dash-border)]";
      case "Rejected":
        return "bg-[color:var(--dash-alert-soft)] text-[color:var(--dash-alert)] ring-1 ring-[color:var(--dash-alert)]/30";
      case "Pending":
        return "bg-[color:var(--dash-warn-soft)] text-[color:var(--dash-warn)] ring-1 ring-[color:var(--dash-warn)]/30";
      default:
        return "bg-[color:var(--muted)] text-[color:var(--dash-ink)] ring-1 ring-[color:var(--dash-border)]";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-[color:var(--dash-ink)]">Absent requests</h1>
        <p className="text-sm text-[color:var(--dash-muted)]">
          Review and approve absent and holiday requests from OJT interns.
        </p>
      </div>

      <Card className="border-[color:var(--dash-border)] bg-[color:var(--dash-card)]">
        <CardHeader>
          <CardTitle className="text-base text-[color:var(--dash-ink)]">Pending & completed absent requests</CardTitle>
          <CardDescription className="text-[color:var(--dash-muted)]">
            Click on any row to view details and approve or reject requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-[color:var(--dash-muted)] py-4">Loading absent requests…</p>
          )}
          {error && !isLoading && (
            <p className="text-sm text-[color:var(--dash-alert)] py-4">
              {error} Unable to load absent requests.
            </p>
          )}
          {!isLoading && !error && rows.length === 0 && (
            <p className="text-sm text-[color:var(--dash-muted)] py-4">
              No absent requests yet. Once interns submit absent requests, they will appear here.
            </p>
          )}
          {!isLoading && !error && rows.length > 0 && (
            <div className="mt-2 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {rows.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="flex items-center gap-3 rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] px-3 py-2 text-xs text-[color:var(--dash-ink)] cursor-pointer transition-colors hover:bg-[color:var(--dash-accent-soft)]/40"
                >
                  <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[color:var(--dash-accent-soft)] text-xs font-semibold text-[color:var(--dash-accent-strong)] sm:flex shrink-0">
                    {item.intern_name
                      .split(" ")[0]
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium text-[color:var(--dash-ink)]">
                      {item.intern_name}
                    </p>
                    <p className="text-[11px] text-[color:var(--dash-muted)]">
                      {item.intern_student_id}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0 text-sm text-[color:var(--dash-ink)] truncate">
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
        <DialogContent onClose={() => setIsDialogOpen(false)} className="flex max-h-[90vh] max-w-xl flex-col rounded-xl border-[color:var(--dash-border)] bg-[color:var(--dash-card)] shadow-xl">
          <DialogHeader className="shrink-0 space-y-1.5 pb-0">
            <DialogTitle className="text-lg font-semibold text-[color:var(--dash-ink)]">Absent Request Details</DialogTitle>
            <DialogDescription className="text-sm text-[color:var(--dash-muted)]">
              Review the request and approve or reject it.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-4">
              {/* Intern & status header */}
              <div className="flex items-center gap-4 rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-accent-soft)]/50 px-4 py-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-accent-soft)] text-[color:var(--dash-accent-strong)]">
                  <User className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[color:var(--dash-ink)]">{selectedRequest.intern_name}</p>
                  <p className="text-xs text-[color:var(--dash-muted)]">{selectedRequest.intern_student_id}</p>
                </div>
                <Badge className={`shrink-0 text-xs font-medium ${getStatusBadgeClass(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </Badge>
              </div>

              {/* Request info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[color:var(--dash-muted)]" />
                  <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--dash-muted)]">Request period</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-bg)] px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--dash-muted)]">Type</p>
                    <Badge variant="outline" className={`mt-0.5 text-xs font-medium ${getTypeBadgeClass(selectedRequest.type)}`}>
                      {selectedRequest.type}
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-bg)] px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--dash-muted)]">Start</p>
                    <p className="mt-0.5 text-sm font-medium text-[color:var(--dash-ink)]">
                      {new Date(selectedRequest.start_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {selectedRequest.end_date ? (
                    <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-bg)] px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--dash-muted)]">End</p>
                      <p className="mt-0.5 text-sm font-medium text-[color:var(--dash-ink)]">
                        {new Date(selectedRequest.end_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-bg)] px-3 py-2 sm:col-span-1">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--dash-muted)]">End</p>
                      <p className="mt-0.5 text-sm text-[color:var(--dash-muted)]">—</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason & notes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[color:var(--dash-muted)]" />
                  <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--dash-muted)]">Details</span>
                </div>
                <div className="rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-bg)] px-3 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[color:var(--dash-muted)]">Reason</p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--dash-ink)]">{selectedRequest.reason_title || "—"}</p>
                  {selectedRequest.notes && (
                    <>
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[color:var(--dash-muted)]">Notes from intern</p>
                      <p className="mt-1 text-sm text-[color:var(--dash-ink)] whitespace-pre-wrap">{selectedRequest.notes}</p>
                    </>
                  )}
                  {selectedRequest.rejection_reason && (
                    <>
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[color:var(--dash-alert)]">Rejection reason</p>
                      <p className="mt-1 text-sm text-[color:var(--dash-alert)]">{selectedRequest.rejection_reason}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Admin response (Pending only) */}
              {selectedRequest.status === "Pending" && (
                <div className="space-y-3 rounded-lg border border-[color:var(--dash-border)] bg-[color:var(--dash-accent-soft)]/40 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[color:var(--dash-accent-strong)]" />
                    <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--dash-accent-strong)]">Your response</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-notes" className="text-xs font-medium text-[color:var(--dash-ink)]">
                        Admin notes <span className="text-[color:var(--dash-muted)]">(optional)</span>
                      </Label>
                      <textarea
                        id="admin-notes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="e.g. Approved for records."
                        rows={2}
                        className="w-full min-h-0 resize-y rounded-lg border border-[color:var(--dash-border)] bg-white px-3 py-2 text-sm text-[color:var(--dash-ink)] placeholder:text-[color:var(--dash-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--dash-accent)] focus:ring-offset-1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reject-reason" className="text-xs font-medium text-[color:var(--dash-ink)]">
                        Rejection reason <span className="text-[color:var(--dash-alert)]">(required if rejecting)</span>
                      </Label>
                      <textarea
                        id="reject-reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain why the request is rejected..."
                        rows={2}
                        className="w-full min-h-0 resize-y rounded-lg border border-[color:var(--dash-border)] bg-white px-3 py-2 text-sm text-[color:var(--dash-ink)] placeholder:text-[color:var(--dash-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--dash-alert)]/40 focus:ring-offset-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-[color:var(--dash-border)] pt-4 sm:flex-row sm:justify-end">
            {selectedRequest?.status === "Pending" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isProcessing}
                  className="order-2 border-[color:var(--dash-border)] text-[color:var(--dash-ink)] hover:bg-[color:var(--dash-accent-soft)]/50 sm:order-1"
                >
                  Cancel
                </Button>
                <div className="flex w-full gap-2 sm:order-2 sm:w-auto">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isProcessing || !rejectReason.trim()}
                    className="flex-1 gap-2 sm:flex-initial"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-1 gap-2 bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)] sm:flex-initial"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[color:var(--dash-border)] text-[color:var(--dash-ink)] hover:bg-[color:var(--dash-accent-soft)]/50">
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
