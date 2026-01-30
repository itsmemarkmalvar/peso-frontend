/**
 * Settings API Client
 * Fetches and updates system settings (admin only for update).
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { SystemSettings } from "@/types";

export interface SettingsResponse {
  success: boolean;
  data: SystemSettings;
  message?: string;
}

/**
 * Get system settings.
 * Any authenticated user can read (interns receive rules that apply to them).
 */
export async function getSettings(): Promise<SystemSettings> {
  const response = await apiClient.get<SettingsResponse>(
    API_ENDPOINTS.settings.get
  );
  return response.data;
}

/**
 * Update system settings.
 * Admin only.
 */
export async function updateSettings(
  payload: Partial<SystemSettings>
): Promise<SystemSettings> {
  const response = await apiClient.put<SettingsResponse>(
    API_ENDPOINTS.settings.update,
    payload
  );
  return response.data;
}
