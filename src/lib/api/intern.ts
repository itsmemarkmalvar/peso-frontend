import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import type { Attendance } from "@/lib/api/attendance"

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

export type ClockInCutoff = {
  time: string
  label: string
}

export type InternTimeClockData = {
  header: InternTimeClockHeader
  snapshot: InternTimeClockSnapshot
  summary: InternDashboardStat[]
  week: InternTimeClockWeekItem[]
  recentActivity: InternActivityItem[]
  todayAttendance?: Attendance | null
  clock_in_cutoff?: ClockInCutoff | null
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
  id?: number
  date: string
  status: "Approved" | "Pending" | "Rejected"
  detail: string
}

export type InternApprovalsData = {
  items: InternApprovalItem[]
}

type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
}

export type AdminIntern = {
  id: number
  user_id: number
  name: string
  email: string | null
  student_id: string
  course: string
  department_id: number | null
  department_name: string | null
  supervisor_name: string
  supervisor_email?: string | null
  is_active: boolean
  role: string
  required_hours: number | null
  profile_photo?: string | null
}

/** Full intern detail from onboarding (for People modal) */
export type AdminInternDetail = Omit<AdminIntern, "name"> & {
  full_name: string
  name?: string // alias for list compatibility
  school: string | null
  phone: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  weekly_availability: InternWeeklyAvailability | null
  supervisor_email: string | null
  start_date: string | null
  end_date: string | null
  onboarded_at: string | null
}

export type InternAvailabilityOption = "available" | "not_available"

export type InternWeeklyAvailability = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday",
  InternAvailabilityOption
>

export type InternProfile = {
  id: number
  user_id: number
  full_name: string
  school: string
  program: string
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  required_hours: number | null
  start_date: string | null
  end_date: string | null
  onboarded_at: string | null
  weekly_availability: InternWeeklyAvailability | null
  profile_photo?: string | null
}

export type InternOnboardingPayload = {
  full_name: string
  school: string
  program: string
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  required_hours: number
  weekly_availability: InternWeeklyAvailability
  profile_photo?: string | null
}

export function getInternDashboard(): Promise<InternDashboardData> {
  return apiClient
    .get<ApiResponse<InternDashboardData>>(API_ENDPOINTS.intern.dashboard)
    .then((res) => res.data ?? { stats: [], recentActivity: [] })
}

export function getInternTimeClock(): Promise<InternTimeClockData> {
  return apiClient
    .get<ApiResponse<InternTimeClockData>>(API_ENDPOINTS.intern.timeClock)
    .then((res) => res.data ?? ({} as InternTimeClockData))
}

export function getInternTimesheets(params?: {
  week_start?: string
}): Promise<InternTimesheetData> {
  const query = params?.week_start
    ? `?week_start=${encodeURIComponent(params.week_start)}`
    : ""
  return apiClient
    .get<ApiResponse<InternTimesheetData>>(API_ENDPOINTS.intern.timesheets + query)
    .then((res) => res.data ?? { weekLabel: "", totalLabel: "", entries: [] })
}

export function getInternApprovals(): Promise<InternApprovalsData> {
  return apiClient
    .get<ApiResponse<InternApprovalsData>>(API_ENDPOINTS.intern.approvals)
    .then((res) => res.data ?? { items: [] })
}

export type AdminFilterOptions = {
  roles: { value: string; label: string }[]
  groups: string[]
}

export function getAdminFilterOptions(): Promise<AdminFilterOptions> {
  return apiClient
    .get<{ success: boolean; message: string; data: AdminFilterOptions }>(
      API_ENDPOINTS.admin.filterOptions
    )
    .then((res) => res.data ?? { roles: [], groups: [] })
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

export function getAdminInternDetail(id: number): Promise<AdminInternDetail | null> {
  return apiClient
    .get<{ success: boolean; message: string; data: AdminInternDetail | null }>(
      API_ENDPOINTS.interns.show(id)
    )
    .then((res) => res.data ?? null)
}

export function getInternProfile(): Promise<InternProfile | null> {
  return apiClient
    .get<{ success: boolean; message: string; data: InternProfile | null }>(
      API_ENDPOINTS.interns.me
    )
    .then((res) => res.data ?? null)
}

export function saveInternOnboarding(
  payload: InternOnboardingPayload
): Promise<InternProfile> {
  return apiClient
    .post<{ success: boolean; message: string; data: InternProfile }>(
      API_ENDPOINTS.interns.me,
      payload
    )
    .then((res) => res.data)
}
