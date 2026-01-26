/**
 * Attendance API Client
 * Handles attendance-related API calls
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export interface Attendance {
  id: number;
  intern_id: number;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  break_start: string | null;
  break_end: string | null;
  location_lat: number | null;
  location_lng: number | null;
  clock_in_photo: string | null;
  clock_out_photo: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by: number | null;
  approved_at: string | null;
  notes: string | null;
  total_hours: number | null;
  is_late: boolean;
  is_undertime: boolean;
  is_overtime: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceListResponse {
  success: boolean;
  message: string;
  data: Attendance[];
}

/**
 * Get all attendance records
 */
export function getAttendanceList(params?: {
  intern_id?: number;
  start_date?: string;
  end_date?: string;
  status?: "pending" | "approved" | "rejected";
}): Promise<AttendanceListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.intern_id) queryParams.append("intern_id", params.intern_id.toString());
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  if (params?.status) queryParams.append("status", params.status);
  
  const query = queryParams.toString();
  return apiClient.get<AttendanceListResponse>(
    `${API_ENDPOINTS.attendance.list}${query ? `?${query}` : ""}`
  );
}
