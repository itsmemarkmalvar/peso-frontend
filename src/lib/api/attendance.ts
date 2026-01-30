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
  location_address: string | null;
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
  geofence_location_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceListResponse {
  success: boolean;
  message: string;
  data: Attendance[];
}

export interface ClockInRequest {
  location_lat?: number;
  location_lng?: number;
  photo: string; // base64 encoded image
  geofence_location_id?: number;
}

export interface ClockOutRequest {
  location_lat?: number;
  location_lng?: number;
  photo: string; // base64 encoded image
  geofence_location_id?: number;
}

export interface ClockInResponse {
  success: boolean;
  message: string;
  data: {
    attendance: Attendance;
    message: string;
  };
}

export interface ClockOutResponse {
  success: boolean;
  message: string;
  data: {
    attendance: Attendance;
    total_hours: number;
    message: string;
  };
}

/**
 * Clock in
 */
export function clockIn(data: ClockInRequest): Promise<ClockInResponse> {
  return apiClient.post<ClockInResponse>(API_ENDPOINTS.attendance.clockIn, data);
}

/**
 * Clock out
 */
export function clockOut(data: ClockOutRequest): Promise<ClockOutResponse> {
  return apiClient.post<ClockOutResponse>(API_ENDPOINTS.attendance.clockOut, data);
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

/**
 * Get today's attendance
 */
export function getTodayAttendance(intern_id?: number): Promise<{ success: boolean; message: string; data: Attendance | null }> {
  const queryParams = new URLSearchParams();
  if (intern_id) queryParams.append("intern_id", intern_id.toString());
  const query = queryParams.toString();
  return apiClient.get(`${API_ENDPOINTS.attendance.today}${query ? `?${query}` : ""}`);
}

/**
 * Get attendance history
 */
export function getAttendanceHistory(params?: {
  intern_id?: number;
  start_date?: string;
  end_date?: string;
  status?: "pending" | "approved" | "rejected";
}): Promise<AttendanceListResponse> {
  return getAttendanceList(params);
}
