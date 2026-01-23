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

/**
 * Get all registration requests
 */
export async function getRegistrationRequests(
  status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending'
): Promise<RegistrationRequest[]> {
  const response = await apiClient.get<RegistrationRequestsResponse>(
    API_ENDPOINTS.registrationRequests.list,
    { params: { status } }
  );
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

/**
 * Approve a registration request
 */
export async function approveRegistrationRequest(
  id: number,
  role: string,
  departmentId: number | null
): Promise<ApproveResponse['data']> {
  const response = await apiClient.post<ApproveResponse>(
    API_ENDPOINTS.registrationRequests.approve(id),
    {
      role,
      department_id: departmentId,
    }
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
