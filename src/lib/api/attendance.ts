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
  break_start_photo?: string | null;
  break_end: string | null;
  break_end_photo?: string | null;
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
  total_hours_label?: string;
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

export type ApprovedHoursSummaryItem = {
  intern_id: number;
  hours_rendered: number;
};

export interface ApprovedHoursSummaryResponse {
  success: boolean;
  message: string;
  data: ApprovedHoursSummaryItem[];
}

export interface ClockInRequest {
  location_lat?: number;
  location_lng?: number;
  photo: string; // base64 encoded image
  geofence_location_id?: number;
}

export interface ClockInCorrectionRequest {
  photo: string; // required - selfie for audit
  reason: string;
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
 * Clock-in correction (GPS/device failure within grace period)
 */
export function clockInCorrection(data: ClockInCorrectionRequest): Promise<ClockInResponse> {
  return apiClient.post<ClockInResponse>(API_ENDPOINTS.attendance.clockInCorrection, data);
}

/**
 * Clock out
 */
export function clockOut(data: ClockOutRequest): Promise<ClockOutResponse> {
  return apiClient.post<ClockOutResponse>(API_ENDPOINTS.attendance.clockOut, data);
}

export interface BreakStartResponse {
  success: boolean;
  message: string;
  data: { attendance: Attendance; message: string };
}

export interface BreakEndResponse {
  success: boolean;
  message: string;
  data: { attendance: Attendance; message: string };
}

/**
 * Record break start (same payload as clock-in: photo, optional location/geofence)
 */
export function breakStart(data: ClockInRequest): Promise<BreakStartResponse> {
  return apiClient.post<BreakStartResponse>(API_ENDPOINTS.attendance.breakStart, data);
}

/**
 * Record break end (same payload as clock-out: photo, optional location/geofence)
 */
export function breakEnd(data: ClockOutRequest): Promise<BreakEndResponse> {
  return apiClient.post<BreakEndResponse>(API_ENDPOINTS.attendance.breakEnd, data);
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
  return apiClient
    .get<AttendanceListResponse | { success: boolean; message: string; data: { data?: Attendance[]; records?: Attendance[] } }>(
      `${API_ENDPOINTS.attendance.list}${query ? `?${query}` : ""}`
    )
    .then((res) => {
      const rawData: unknown = (res as AttendanceListResponse).data;
      if (Array.isArray(rawData)) {
        return { success: res.success, message: res.message, data: rawData };
      }
      if (rawData && typeof rawData === "object") {
        const objectData = rawData as { data?: unknown; records?: unknown };
        if (Array.isArray(objectData.data)) {
          return { success: res.success, message: res.message, data: objectData.data };
        }
        if (Array.isArray(objectData.records)) {
          return { success: res.success, message: res.message, data: objectData.records };
        }
      }
      return { success: res.success, message: res.message, data: [] };
    });
}

/**
 * Get approved hours totals grouped by intern (admin/supervisor).
 */
export function getApprovedHoursSummary(): Promise<ApprovedHoursSummaryResponse> {
  return apiClient.get<ApprovedHoursSummaryResponse>(
    `${API_ENDPOINTS.attendance.list}/approved-hours-summary`
  );
}

/**
 * Get today's attendance (single intern or current user)
 */
export function getTodayAttendance(intern_id?: number): Promise<{ success: boolean; message: string; data: Attendance | null }> {
  const queryParams = new URLSearchParams();
  if (intern_id) queryParams.append("intern_id", intern_id.toString());
  const query = queryParams.toString();
  return apiClient.get(`${API_ENDPOINTS.attendance.today}${query ? `?${query}` : ""}`);
}

/**
 * Get all today's attendance records (admin/supervisor only).
 * Reflects real clock-in, clock-out, break start, and break end from interns.
 */
export function getTodayAttendanceAll(): Promise<{ success: boolean; message: string; data: Attendance[] }> {
  return apiClient.get<{ success: boolean; message: string; data: Attendance[] }>(
    API_ENDPOINTS.attendance.todayAll
  );
}

export type LiveLocationItem = {
  intern_id: number;
  intern_name: string;
  student_id: string;
  company_name: string;
  status: "Clocked in" | "On break";
  last_seen_at: string | null;
  location: string;
  verification: string[];
};

/**
 * Get live locations: interns currently clocked in today (no clock-out yet).
 * Admin/supervisor only. Uses real attendance data (last activity, location, GPS/selfie).
 */
export function getLiveLocations(): Promise<{ success: boolean; message: string; data: LiveLocationItem[] }> {
  return apiClient.get<{ success: boolean; message: string; data: LiveLocationItem[] }>(
    API_ENDPOINTS.attendance.liveLocations
  );
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
