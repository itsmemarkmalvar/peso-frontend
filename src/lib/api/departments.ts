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

/**
 * Get all active departments
 */
export async function getDepartments(): Promise<Department[]> {
  const response = await apiClient.get<DepartmentsResponse>(
    API_ENDPOINTS.departments.list
  );
  return response.data;
}
