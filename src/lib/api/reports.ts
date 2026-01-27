/**
 * Reports API Client
 * Handles report-related API calls
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoints";

export interface DTRReportParams {
  intern_id?: number;
  start_date?: string;
  end_date?: string;
  format?: "json" | "pdf" | "excel";
}

export interface AttendanceReportParams {
  start_date?: string;
  end_date?: string;
  status?: "all" | "present" | "late" | "absent";
  format?: "json" | "pdf" | "excel";
}

export interface HoursReportParams {
  start_date?: string;
  end_date?: string;
  group_by?: "intern" | "company" | "supervisor";
  format?: "json" | "pdf" | "excel";
}

export interface ReportResponse {
  data: any;
  message?: string;
  download_url?: string;
}

/**
 * Get Daily Time Record (DTR) report
 */
export function getDTRReport(params?: DTRReportParams): Promise<ReportResponse> {
  const queryParams = new URLSearchParams();
  if (params?.intern_id) queryParams.append("intern_id", params.intern_id.toString());
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  if (params?.format) queryParams.append("format", params.format);
  
  const query = queryParams.toString();
  return apiClient.get<ReportResponse>(`${API_ENDPOINTS.reports.dtr}${query ? `?${query}` : ""}`);
}

/**
 * Get Attendance report
 */
export function getAttendanceReport(params?: AttendanceReportParams): Promise<ReportResponse> {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.format) queryParams.append("format", params.format);
  
  const query = queryParams.toString();
  return apiClient.get<ReportResponse>(`${API_ENDPOINTS.reports.attendance}${query ? `?${query}` : ""}`);
}

/**
 * Get Hours report
 */
export function getHoursReport(params?: HoursReportParams): Promise<ReportResponse> {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  if (params?.group_by) queryParams.append("group_by", params.group_by);
  if (params?.format) queryParams.append("format", params.format);
  
  const query = queryParams.toString();
  return apiClient.get<ReportResponse>(`${API_ENDPOINTS.reports.hours}${query ? `?${query}` : ""}`);
}

/**
 * Export report
 */
export function exportReport(type: "dtr" | "attendance" | "hours", format: "pdf" | "excel", params?: any): Promise<Blob> {
  const endpoint = type === "dtr" 
    ? API_ENDPOINTS.reports.dtr 
    : type === "attendance" 
    ? API_ENDPOINTS.reports.attendance 
    : API_ENDPOINTS.reports.hours;
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
  const queryParams = new URLSearchParams({ format });
  
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  if (params?.intern_id) queryParams.append("intern_id", params.intern_id.toString());
  if (params?.status) queryParams.append("status", params.status);
  if (params?.group_by) queryParams.append("group_by", params.group_by);
  
  const url = `${API_BASE_URL}${endpoint}?${queryParams.toString()}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  
  return fetch(url, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      Accept: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  }).then(async (res) => {
    // Check content type to detect if it's an error (JSON) or a file
    const contentType = res.headers.get("content-type") || "";
    
    // If response is JSON, it's likely an error
    if (contentType.includes("application/json")) {
      const errorData = await res.json();
      const errorMessage = errorData.message || errorData.error || "Export failed";
      throw new Error(errorMessage);
    }
    
    // If response is not OK, try to get error message
    if (!res.ok) {
      // Try to parse as JSON for error details
      try {
        const errorData = await res.clone().json();
        const errorMessage = errorData.message || errorData.error || `Export failed: ${res.statusText}`;
        throw new Error(errorMessage);
      } catch {
        // If not JSON, use status text
        throw new Error(`Export failed: ${res.statusText} (${res.status})`);
      }
    }
    
    // Verify it's actually a file blob
    const blob = await res.blob();
    
    // Check if blob is actually JSON (error response)
    if (blob.type.includes("json") || blob.size < 100) {
      // Small size or JSON type might indicate an error
      const text = await blob.text();
      try {
        const errorData = JSON.parse(text);
        const errorMessage = errorData.message || errorData.error || "Export endpoint returned an error";
        throw new Error(errorMessage);
      } catch {
        // If not parseable JSON, it might be a small valid file
        if (text.includes('"success"') || text.includes('"error"') || text.includes('"message"')) {
          throw new Error("Backend returned an error response instead of a file. The export endpoint may not be fully implemented yet.");
        }
      }
    }
    
    return blob;
  });
}
