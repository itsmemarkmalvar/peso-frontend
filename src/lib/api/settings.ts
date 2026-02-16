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
  const data = response?.data;
  if (data && typeof data === "object" && "grace_period_minutes" in data) {
    const grace = Number(data.grace_period_minutes);
    return {
      grace_period_minutes: Number.isFinite(grace) ? Math.min(120, Math.max(0, grace)) : 10,
      verification_gps: Boolean(data.verification_gps),
      verification_selfie: Boolean(data.verification_selfie),
    };
  }
  return {
    grace_period_minutes: 10,
    verification_gps: true,
    verification_selfie: true,
  };
}

/**
 * Update system settings.
 * Admin only (enforced by backend).
 */
export async function updateSettings(
  payload: Partial<SystemSettings>
): Promise<SystemSettings> {
  const response = await apiClient.put<SettingsResponse>(
    API_ENDPOINTS.settings.update,
    payload
  );
  const data = response?.data;
  if (data && typeof data === "object") {
    const grace = Number(data.grace_period_minutes);
    return {
      grace_period_minutes: Number.isFinite(grace) ? Math.min(120, Math.max(0, grace)) : 10,
      verification_gps: Boolean(data.verification_gps),
      verification_selfie: Boolean(data.verification_selfie),
    };
  }
  return {
    grace_period_minutes: 10,
    verification_gps: true,
    verification_selfie: true,
  };
}
