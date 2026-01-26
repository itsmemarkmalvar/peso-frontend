/**
 * Geofence Locations API Client
 * Handles geofence location-related API calls
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export interface GeofenceLocation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeofenceLocationsResponse {
  success: boolean;
  data: GeofenceLocation[];
  message?: string;
}

export interface GeofenceLocationResponse {
  success: boolean;
  data: GeofenceLocation;
  message?: string;
}

export interface CreateGeofenceLocationPayload {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active?: boolean;
}

export interface UpdateGeofenceLocationPayload {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  is_active?: boolean;
}

/**
 * Get all geofence locations
 * @param activeOnly - If true, only return active locations (for intern/GIP clock-in UI)
 */
export async function getGeofenceLocations(
  activeOnly: boolean = false
): Promise<GeofenceLocation[]> {
  const params = activeOnly ? "?active_only=1" : "";
  const response = await apiClient.get<GeofenceLocationsResponse>(
    `${API_ENDPOINTS.geofenceLocations.list}${params}`
  );
  return response.data;
}

/**
 * Get a single geofence location
 */
export async function getGeofenceLocation(
  id: number
): Promise<GeofenceLocation> {
  const response = await apiClient.get<GeofenceLocationResponse>(
    API_ENDPOINTS.geofenceLocations.show(id)
  );
  return response.data;
}

/**
 * Create a new geofence location
 * Admin/Supervisor only
 */
export async function createGeofenceLocation(
  payload: CreateGeofenceLocationPayload
): Promise<GeofenceLocation> {
  const response = await apiClient.post<GeofenceLocationResponse>(
    API_ENDPOINTS.geofenceLocations.create,
    payload
  );
  return response.data;
}

/**
 * Update a geofence location
 * Admin/Supervisor only
 */
export async function updateGeofenceLocation(
  id: number,
  payload: UpdateGeofenceLocationPayload
): Promise<GeofenceLocation> {
  const response = await apiClient.put<GeofenceLocationResponse>(
    API_ENDPOINTS.geofenceLocations.update(id),
    payload
  );
  return response.data;
}

/**
 * Delete a geofence location
 * Admin/Supervisor only
 * If location has attendance records, it will be deactivated instead of deleted
 */
export async function deleteGeofenceLocation(id: number): Promise<void> {
  await apiClient.delete<{ success: boolean; message: string }>(
    API_ENDPOINTS.geofenceLocations.delete(id)
  );
}
