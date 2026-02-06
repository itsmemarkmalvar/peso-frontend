import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type TimesheetDay = {
  date: string;
  hours: string;
  label: string;
  isRestDay: boolean;
};

export type TimesheetRow = {
  intern_id: number;
  intern: string;
  company: string;
  id: string;
  days: TimesheetDay[];
  total: string;
};

export type TimesheetData = {
  week_start: string;
  week_end: string;
  week_dates: string[];
  rows: TimesheetRow[];
};

export type AttendanceRecord = {
  id: number;
  date: string;
  date_label: string;
  day_name: string;
  clock_in_time: string | null;
  clock_in_time_label: string | null;
  clock_out_time: string | null;
  clock_out_time_label: string | null;
  break_start_time: string | null;
  break_start_time_label: string | null;
  break_end_time: string | null;
  break_end_time_label: string | null;
  clock_in_photo: string | null;
  clock_out_photo: string | null;
  total_hours: number | null;
  total_hours_label: string;
  status: "pending" | "approved" | "rejected";
  is_late: boolean;
  is_undertime: boolean;
  is_overtime: boolean;
  location_address: string | null;
};

export type InternTimesheetDetail = {
  intern: {
    id: number;
    name: string;
    company: string;
    student_id: string;
  };
  date_range: {
    start: string;
    end: string;
  };
  records: AttendanceRecord[];
  summary: {
    total_days: number;
    total_hours: number;
    total_hours_label: string;
  };
};

/**
 * Get weekly timesheet data for all interns (admin/supervisor)
 */
export function getTimesheets(params?: {
  week_start?: string;
}): Promise<TimesheetData> {
  const query = params?.week_start
    ? `?week_start=${encodeURIComponent(params.week_start)}`
    : "";

  return apiClient
    .get<{ success: boolean; message: string; data?: TimesheetData } & Partial<TimesheetData>>(
      API_ENDPOINTS.timesheets.list + query
    )
    .then((res) => {
      const payload = (res as { data?: TimesheetData }).data ?? (res as Partial<TimesheetData>);
      return (
        payload?.rows != null
          ? {
              week_start: payload.week_start ?? "",
              week_end: payload.week_end ?? "",
              week_dates: payload.week_dates ?? [],
              rows: payload.rows,
            }
          : { week_start: "", week_end: "", week_dates: [], rows: [] }
      );
    });
}

/**
 * Get detailed timesheet for a specific intern
 */
export function getInternTimesheetDetail(
  internId: number,
  params?: {
    start_date?: string;
    end_date?: string;
  }
): Promise<InternTimesheetDetail> {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append("start_date", params.start_date);
  if (params?.end_date) queryParams.append("end_date", params.end_date);
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return apiClient
    .get<{ success: boolean; message: string; data: InternTimesheetDetail }>(
      API_ENDPOINTS.timesheets.show(internId) + query
    )
    .then((res) => res.data ?? {
      intern: { id: internId, name: "", company: "", student_id: "" },
      date_range: { start: "", end: "" },
      records: [],
      summary: { total_days: 0, total_hours: 0, total_hours_label: "0h 0m" },
    });
}
