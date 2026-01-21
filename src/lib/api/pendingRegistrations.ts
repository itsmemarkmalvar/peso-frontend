/**
 * Pending Registrations API
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export interface PendingRegistration {
  id: number;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  approver?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface PendingRegistrationsResponse {
  success: boolean;
  data: PendingRegistration[];
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
    temp_password: string;
  };
  message?: string;
}

/**
 * Get all pending registrations
 */
export async function getPendingRegistrations(
  status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending'
): Promise<PendingRegistration[]> {
  const response = await apiClient.get<PendingRegistrationsResponse>(
    API_ENDPOINTS.pendingRegistrations.list,
    { params: { status } }
  );
  return response.data;
}

/**
 * Get a single pending registration
 */
export async function getPendingRegistration(id: number): Promise<PendingRegistration> {
  const response = await apiClient.get<{ success: boolean; data: PendingRegistration }>(
    API_ENDPOINTS.pendingRegistrations.show(id)
  );
  return response.data;
}

/**
 * Approve a pending registration
 */
export async function approvePendingRegistration(id: number): Promise<ApproveResponse['data']> {
  const response = await apiClient.post<ApproveResponse>(
    API_ENDPOINTS.pendingRegistrations.approve(id)
  );
  return response.data;
}

/**
 * Reject a pending registration
 */
export async function rejectPendingRegistration(
  id: number,
  reason?: string
): Promise<PendingRegistration> {
  const response = await apiClient.post<{ success: boolean; data: PendingRegistration }>(
    API_ENDPOINTS.pendingRegistrations.reject(id),
    { reason }
  );
  return response.data;
}
