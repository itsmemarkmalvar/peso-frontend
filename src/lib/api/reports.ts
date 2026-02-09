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
 * Detect likely cause from export error message for console diagnostics
 */
function detectExportErrorCause(message: string, status?: number): string {
  const m = message.toLowerCase();
  if (status === 503 || m.includes("composer install") || m.includes("required package not installed")) {
    return "BACKEND_DEPS_MISSING: Run 'composer install' in peso-backend (Dompdf/PhpSpreadsheet not installed).";
  }
  if (status === 500 || m.includes("internal server error")) {
    return "BACKEND_ERROR: Server threw 500. Check peso-backend storage/logs/laravel.log for the exception.";
  }
  if (status === 401 || m.includes("unauthorized") || m.includes("unauthenticated")) {
    return "AUTH: Token missing or expired. Log in again.";
  }
  if (status === 403 || m.includes("forbidden")) {
    return "FORBIDDEN: Your role cannot export reports.";
  }
  if (status === 404 || m.includes("not found")) {
    return "ENDPOINT_NOT_FOUND: Backend route missing or wrong NEXT_PUBLIC_API_URL.";
  }
  if (status === 0 || m.includes("failed to fetch") || m.includes("network")) {
    return "NETWORK: Backend unreachable. Is the server running? Is NEXT_PUBLIC_API_URL correct?";
  }
  if (m.includes("not be fully implemented") || m.includes("error response instead of a file")) {
    return "BACKEND_RESPONSE: Backend returned JSON instead of a file (endpoint or format issue).";
  }
  return "UNKNOWN: See message above.";
}

/**
 * Log export failure to console for debugging (warn so Next.js doesn't show error overlay)
 */
function logExportError(context: {
  reportType: string;
  format: string;
  url: string;
  status?: number;
  message: string;
  cause: string;
}) {
  if (typeof console === "undefined") return;
  const log = console.warn ?? console.error;
  const summary = `[PESO Reports Export] FAILED | ${context.reportType} ${context.format} | status=${context.status ?? "n/a"} | ${context.cause}`;
  log(summary);
  log("  URL:", context.url, "| message:", context.message);
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
    const contentType = res.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      const errorData = await res.json();
      const errorMessage = errorData.message || errorData.error || "Export failed";
      const cause = detectExportErrorCause(errorMessage, res.status);
      logExportError({ reportType: type, format, url, status: res.status, message: errorMessage, cause });
      throw new Error(errorMessage);
    }
    
    if (!res.ok) {
      try {
        const errorData = await res.clone().json();
        const errorMessage = errorData.message || errorData.error || `Export failed: ${res.statusText}`;
        const cause = detectExportErrorCause(errorMessage, res.status);
        logExportError({ reportType: type, format, url, status: res.status, message: errorMessage, cause });
        throw new Error(errorMessage);
      } catch (e) {
        if (e instanceof Error && e.message !== "Export failed") throw e;
        const errorMessage = `Export failed: ${res.statusText} (${res.status})`;
        const cause = detectExportErrorCause(errorMessage, res.status);
        logExportError({ reportType: type, format, url, status: res.status, message: errorMessage, cause });
        throw new Error(errorMessage);
      }
    }
    
    const blob = await res.blob();
    
    if (blob.type.includes("json") || blob.size < 100) {
      const text = await blob.text();
      try {
        const errorData = JSON.parse(text);
        const errorMessage = errorData.message || errorData.error || "Export endpoint returned an error";
        const cause = detectExportErrorCause(errorMessage, res.status);
        logExportError({ reportType: type, format, url, status: res.status, message: errorMessage, cause });
        throw new Error(errorMessage);
      } catch (e) {
        if (e instanceof Error && e.message !== "Export endpoint returned an error") throw e;
        if (text.includes('"success"') || text.includes('"error"') || text.includes('"message"')) {
          const errorMessage = "Backend returned an error response instead of a file. The export endpoint may not be fully implemented yet.";
          logExportError({ reportType: type, format, url, status: res.status, message: errorMessage, cause: detectExportErrorCause(errorMessage, res.status) });
          throw new Error(errorMessage);
        }
      }
    }
    
    return blob;
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    // Only log here for network/request failures; 4xx/5xx are already logged in .then()
    const isNetworkError =
      /failed to fetch|network error|load failed|networkrequestfailed/i.test(message) ||
      (err instanceof TypeError && message.includes("fetch"));
    if (isNetworkError) {
      logExportError({
        reportType: type,
        format,
        url,
        status: undefined,
        message,
        cause: "NETWORK: Request failed (CORS or backend not running).",
      });
    }
    throw err;
  });
}
