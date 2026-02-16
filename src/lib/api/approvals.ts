/**
 * Approvals API Client
 * Handles approval-related API calls
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export type ApprovalType = "Overtime" | "Correction" | "Undertime";
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

export interface ApprovalRequest {
  id: number;
  attendance_id: number;
  intern_id: number;
  intern_name: string;
  intern_student_id: string;
  type: ApprovalType;
  reason_title: string;
  status: ApprovalStatus;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  notes: string | null;
  rejection_reason: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalsListResponse {
  data: ApprovalRequest[];
  message?: string;
}

export interface ApprovalActionResponse {
  data: ApprovalRequest | null;
  message: string;
}

/**
 * Get all approval requests
 */
export function getApprovals(): Promise<ApprovalsListResponse> {
  return apiClient.get<ApprovalsListResponse>(API_ENDPOINTS.approvals.list);
}

/**
 * Get pending approval requests only
 */
export function getPendingApprovals(): Promise<ApprovalsListResponse> {
  return apiClient.get<ApprovalsListResponse>(API_ENDPOINTS.approvals.pending);
}

/**
 * Approve an attendance request
 * Uses /api/approvals/approve proxy so POST body reaches backend
 */
export function approveRequest(id: number, comments?: string): Promise<ApprovalActionResponse> {
  return apiClient.post<ApprovalActionResponse>(API_ENDPOINTS.approvals.approve, {
    id,
    comments,
  });
}

/**
 * Reject an attendance request
 * Uses /api/approvals/reject proxy so POST body (reason) reaches backend
 */
export function rejectRequest(id: number, reason: string): Promise<ApprovalActionResponse> {
  return apiClient.post<ApprovalActionResponse>(API_ENDPOINTS.approvals.reject, {
    id,
    reason,
  });
}
