import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

export type InternDashboardStat = {
  label: string
  value: string
  sub: string
}

export type InternActivityItem = {
  time: string
  title: string
  detail: string
}

export type InternDashboardData = {
  stats: InternDashboardStat[]
  recentActivity: InternActivityItem[]
}

export type InternTimeClockHeader = {
  currentTime: string
  meridiem: "AM" | "PM"
  dateLabel: string
  statusLabel: string
  statusTone: "active" | "inactive"
  shiftLabel: string
}

export type InternTimeClockSnapshot = {
  lastClock: string
  breakLabel: string
  locationLabel: string
}

export type InternTimeClockWeekItem = {
  day: string
  hours: string
}

export type InternTimeClockData = {
  header: InternTimeClockHeader
  snapshot: InternTimeClockSnapshot
  summary: InternDashboardStat[]
  week: InternTimeClockWeekItem[]
  recentActivity: InternActivityItem[]
}

export type InternTimesheetEntry = {
  day: string
  hours: string
  status: "Approved" | "Pending" | "Rejected"
}

export type InternTimesheetData = {
  weekLabel: string
  totalLabel: string
  entries: InternTimesheetEntry[]
}

export type InternApprovalItem = {
  date: string
  status: "Approved" | "Pending" | "Rejected"
  detail: string
}

export type InternApprovalsData = {
  items: InternApprovalItem[]
}

export type AdminIntern = {
  id: number
  user_id: number
  name: string
  email: string | null
  student_id: string
  course: string
  year_level: string | null
  company_name: string
  supervisor_name: string
  is_active: boolean
}

export function getInternDashboard(): Promise<InternDashboardData> {
  return apiClient.get<InternDashboardData>(API_ENDPOINTS.intern.dashboard)
}

export function getInternTimeClock(): Promise<InternTimeClockData> {
  return apiClient.get<InternTimeClockData>(API_ENDPOINTS.intern.timeClock)
}

export function getInternTimesheets(): Promise<InternTimesheetData> {
  return apiClient.get<InternTimesheetData>(API_ENDPOINTS.intern.timesheets)
}

export function getInternApprovals(): Promise<InternApprovalsData> {
  return apiClient.get<InternApprovalsData>(API_ENDPOINTS.intern.approvals)
}

export function getAdminInterns(search?: string): Promise<AdminIntern[]> {
  const endpoint =
    API_ENDPOINTS.interns.list +
    (search && search.trim().length > 0
      ? `?search=${encodeURIComponent(search.trim())}`
      : "")

  return apiClient.get<{ success: boolean; message: string; data: AdminIntern[] }>(
    endpoint
  ).then((res) => res.data ?? [])
}
