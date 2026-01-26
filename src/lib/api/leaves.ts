/**
 * Leaves API Client
 * Handles leave-related API calls
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export type LeaveType = "Leave" | "Holiday";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveRequest {
  id: number;
  intern_id: number;
  intern_name: string;
  intern_student_id: string;
  type: LeaveType;
  reason_title: string;
  status: LeaveStatus;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  rejection_reason: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeavesListResponse {
  data: LeaveRequest[];
  message?: string;
}

export interface LeaveActionResponse {
  data: LeaveRequest | null;
  message: string;
}

export interface CreateLeavePayload {
  type: LeaveType;
  reason_title: string;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
}

export interface LeaveCreateResponse {
  data: LeaveRequest | null;
  message?: string;
}

/**
 * Get all leave requests
 */
export function getLeaves(): Promise<LeavesListResponse> {
  return apiClient.get<LeavesListResponse>(API_ENDPOINTS.leaves.list);
}

/**
 * Get pending leave requests only
 */
export function getPendingLeaves(): Promise<LeavesListResponse> {
  return apiClient.get<LeavesListResponse>(API_ENDPOINTS.leaves.pending);
}

/**
 * Create a leave request
 */
export function createLeave(payload: CreateLeavePayload): Promise<LeaveCreateResponse> {
  return apiClient.post<LeaveCreateResponse>(API_ENDPOINTS.leaves.create, payload);
}

/**
 * Approve a leave request
 */
export function approveLeave(id: number, comments?: string): Promise<LeaveActionResponse> {
  return apiClient.post<LeaveActionResponse>(API_ENDPOINTS.leaves.approve(id), {
    comments,
  });
}

/**
 * Reject a leave request
 */
export function rejectLeave(
  id: number,
  reason: string,
  comments?: string
): Promise<LeaveActionResponse> {
  return apiClient.post<LeaveActionResponse>(API_ENDPOINTS.leaves.reject(id), {
    reason,
    comments,
  });
}
