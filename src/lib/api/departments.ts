/**
 * Departments API
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export interface Department {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentsResponse {
  success: boolean;
  data: Department[];
  message?: string;
}

export interface DepartmentSupervisor {
  id: number;
  name: string;
  email: string;
}

/**
 * Get all active departments
 */
export async function getDepartments(): Promise<Department[]> {
  const response = await apiClient.get<DepartmentsResponse>(
    API_ENDPOINTS.departments.list
  );
  return response.data;
}

/**
 * Get supervisors assigned to a department.
 * Used by New Users approval flow to auto-fill supervisor for intern/GIP.
 */
export async function getDepartmentSupervisors(
  departmentId: number
): Promise<DepartmentSupervisor[]> {
  const response = await apiClient.get<{
    success: boolean;
    data: DepartmentSupervisor[];
  }>(API_ENDPOINTS.departments.supervisors(departmentId));
  return response.data;
}
