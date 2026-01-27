/**
 * Schedule API Client
 * Handles schedule-related API calls
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export interface Schedule {
  id: number;
  intern_id: number | null;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time: string;
  end_time: string;
  break_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleResponse {
  success: boolean;
  data: Schedule | Schedule[];
  message?: string;
}

export interface CreateSchedulePayload {
  intern_id?: number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_duration: number;
  is_active?: boolean;
}

export interface UpdateSchedulePayload {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  break_duration?: number;
  is_active?: boolean;
}

export interface DefaultSchedulePayload {
  name?: string;
  days: {
    day_of_week: number;
    start_time: string;
  end_time: string;
  }[];
  lunch_break_start: string;
  lunch_break_end: string;
}

export interface ExcusedIntern {
  id: number;
  name: string;
  student_id: string;
  course: string;
}

export interface ExcusedInternsResponse {
  success: boolean;
  data: ExcusedIntern[];
  message?: string;
}

/**
 * Get all schedules
 */
export async function getSchedules(): Promise<Schedule[]> {
  const response = await apiClient.get<ScheduleResponse>(
    API_ENDPOINTS.schedules.list
  );
  return Array.isArray(response.data) ? response.data : [response.data];
}

/**
 * Get a single schedule
 */
export async function getSchedule(id: number): Promise<Schedule> {
  const response = await apiClient.get<ScheduleResponse>(
    API_ENDPOINTS.schedules.show(id)
  );
  return Array.isArray(response.data) ? response.data[0] : response.data;
}

/**
 * Create a new schedule
 */
export async function createSchedule(
  payload: CreateSchedulePayload
): Promise<Schedule> {
  const response = await apiClient.post<ScheduleResponse>(
    API_ENDPOINTS.schedules.create,
    payload
  );
  return Array.isArray(response.data) ? response.data[0] : response.data;
}

/**
 * Update a schedule
 */
export async function updateSchedule(
  id: number,
  payload: UpdateSchedulePayload
): Promise<Schedule> {
  const response = await apiClient.put<ScheduleResponse>(
    API_ENDPOINTS.schedules.update(id),
    payload
  );
  return Array.isArray(response.data) ? response.data[0] : response.data;
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id: number): Promise<void> {
  await apiClient.delete<{ success: boolean; message: string }>(
    API_ENDPOINTS.schedules.delete(id)
  );
}

/**
 * Update default schedule (applies to all interns)
 */
export async function updateDefaultSchedule(
  payload: DefaultSchedulePayload
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    API_ENDPOINTS.schedules.assign,
    payload
  );
  return response;
}

/**
 * Get excused interns by day (those with school schedules)
 */
export async function getExcusedInterns(dayOfWeek: number): Promise<ExcusedIntern[]> {
  const response = await apiClient.get<ExcusedInternsResponse>(
    `${API_ENDPOINTS.schedules.excused}?day_of_week=${dayOfWeek}`
  );
  return response.data;
}
