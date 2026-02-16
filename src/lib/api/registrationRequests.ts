/**
 * Registration Requests API
 * New system using RegistrationRequest model (full_name field)
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export interface RegistrationRequest {
  id: number;
  full_name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: number | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  approver?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface RegistrationRequestsResponse {
  success: boolean;
  data: RegistrationRequest[];
  message?: string;
}

export interface ApproveResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      username: string;
      role: string;
    };
    role: string;
    department_id: number | null;
    invitation_sent: boolean;
  };
  message?: string;
}

/** User created via registration approval (invitation sent) */
export interface ApprovedUser {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  status: string;
  invitation_sent_at: string | null;
  invitation_accepted_at: string | null;
}

/**
 * Get all registration requests
 */
export async function getRegistrationRequests(
  status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending'
): Promise<RegistrationRequest[]> {
  const query = new URLSearchParams({ status }).toString();
  const endpoint = `${API_ENDPOINTS.registrationRequests.list}?${query}`;
  const response = await apiClient.get<RegistrationRequestsResponse>(endpoint);
  return response.data;
}

/**
 * Get users created via registration approval (invitation sent).
 * @param status - 'pending' (not yet accepted), 'active' (accepted), or 'all'
 */
export async function getApprovedUsers(
  status: 'pending' | 'active' | 'all' = 'all'
): Promise<ApprovedUser[]> {
  const query = new URLSearchParams({ status }).toString();
  const endpoint = `${API_ENDPOINTS.registrationRequests.approvedUsers}?${query}`;
  const response = await apiClient.get<{ success: boolean; data: ApprovedUser[] }>(endpoint);
  return response.data;
}

/**
 * Get a single registration request
 */
export async function getRegistrationRequest(id: number): Promise<RegistrationRequest> {
  const response = await apiClient.get<{ success: boolean; data: RegistrationRequest }>(
    API_ENDPOINTS.registrationRequests.show(id)
  );
  return response.data;
}

const APPROVE_VALID_ROLES = ['admin', 'supervisor', 'gip', 'intern'] as const;

/**
 * Approve a registration request.
 * Backend requires "role"; undefined is omitted by JSON.stringify so we always send a valid role.
 */
export async function approveRegistrationRequest(
  id: number,
  role: string,
  departmentId: number | null
): Promise<ApproveResponse['data']> {
  const safeRole =
    role && typeof role === "string" && APPROVE_VALID_ROLES.includes(role as (typeof APPROVE_VALID_ROLES)[number])
      ? role
      : "intern";
  const payload = {
    role: safeRole,
    department_id: departmentId ?? null,
  };
  const response = await apiClient.post<ApproveResponse>(
    API_ENDPOINTS.registrationRequests.approve(id),
    payload
  );
  return response.data;
}

/**
 * Reject a registration request
 */
export async function rejectRegistrationRequest(
  id: number,
  reason?: string
): Promise<RegistrationRequest> {
  const response = await apiClient.post<{ success: boolean; data: RegistrationRequest }>(
    API_ENDPOINTS.registrationRequests.reject(id),
    { reason }
  );
  return response.data;
}
