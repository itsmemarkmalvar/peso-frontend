"use client";

import { useEffect, useState } from "react";
import { UserCheck, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  type RegistrationRequest,
} from "@/lib/api/registrationRequests";
import { ApprovalModal } from "@/components/admin/ApprovalModal";

export default function NewUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);

  const loadRegistrationRequests = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getRegistrationRequests('pending');
      setPendingUsers(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load registration requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrationRequests();
  }, []);

  const handleApproveClick = (user: RegistrationRequest) => {
    setActionError(null);
    setSelectedRequest(user);
    setApprovalModalOpen(true);
  };

  const handleApprove = async (role: string, departmentId: number | null) => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const result = await approveRegistrationRequest(
        selectedRequest.id,
        role,
        departmentId
      );
      setSuccessMessage(
        `Registration approved! User account created with role "${role}". Invitation email has been sent to ${selectedRequest.email}.`
      );
      // Reload the list
      await loadRegistrationRequests();
      setApprovalModalOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve registration request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this registration request?")) {
      return;
    }
    setProcessingId(id);
    setActionError(null);
    setSuccessMessage(null);
    try {
      await rejectRegistrationRequest(id);
      setSuccessMessage("Registration request rejected successfully.");
      // Reload the list
      await loadRegistrationRequests();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject registration request.");
    } finally {
      setProcessingId(null);
    }
  };

  const error = loadError ?? actionError;

  const pendingCount = pendingUsers.filter((u) => u.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">New User Registrations</h1>
        <p className="text-sm text-slate-600">
          Review and approve new account signups before users can complete their registration.
        </p>
      </div>

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Pending account approvals</CardTitle>
            <CardDescription>
              Users who have signed up are awaiting admin approval to complete their registration.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-50 text-amber-800 ring-1 ring-amber-200">
              <Clock className="mr-1 h-3 w-3" />
              {pendingCount} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
          {isLoading && (
            <p className="text-[11px] text-slate-500">Loading pending registrations…</p>
          )}

          {loadError && !isLoading && (
            <p className="text-[11px] text-red-600">
              {loadError} Unable to load pending users.
            </p>
          )}
          {actionError && !isLoading && (
            <p className="text-[11px] text-red-600">
              {actionError}
            </p>
          )}

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {!isLoading &&
              !loadError &&
              pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-slate-900">
                        {user.full_name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {user.email}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Registered: {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.status === "pending" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 rounded-full border-green-200 bg-green-50 text-xs text-green-800 hover:bg-green-100"
                          onClick={() => handleApproveClick(user)}
                          disabled={processingId === user.id}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {processingId === user.id ? "Processing..." : "Approve"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 rounded-full border-red-200 bg-red-50 text-xs text-red-800 hover:bg-red-100"
                          onClick={() => handleReject(user.id)}
                          disabled={processingId === user.id}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {processingId === user.id ? "Processing..." : "Reject"}
                        </Button>
                      </>
                    ) : (
                      <Badge
                        className={
                          user.status === "approved"
                            ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
                            : "bg-red-50 text-red-800 ring-1 ring-red-200"
                        }
                      >
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

            {!isLoading && !loadError && pendingUsers.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No pending registrations. New signups will appear here for your review.
              </p>
            )}
          </div>

          <p className="flex items-center gap-2 text-[11px] text-slate-500">
            <UserCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>
              Approve registrations to create user accounts. Rejected registrations will be marked accordingly.
            </span>
          </p>
        </CardContent>
      </Card>

      <ApprovalModal
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        registrationRequest={selectedRequest}
        onApprove={handleApprove}
      />
    </div>
  );
}
