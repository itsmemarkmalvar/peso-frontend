import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

export type NotificationType = "schedule_availability_request" | string

export type NotificationRecord = {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

export function getNotifications(): Promise<NotificationRecord[]> {
  return apiClient
    .get<{ success: boolean; data: NotificationRecord[] }>(
      API_ENDPOINTS.notifications.list
    )
    .then((res) => res.data ?? [])
}

export function markNotificationRead(
  id: number
): Promise<NotificationRecord> {
  return apiClient
    .post<{ success: boolean; data: NotificationRecord }>(
      API_ENDPOINTS.notifications.read(id)
    )
    .then((res) => res.data)
}

export function respondToScheduleAvailability(
  id: number,
  status: "available" | "not_available"
): Promise<NotificationRecord> {
  return apiClient
    .post<{ success: boolean; data: NotificationRecord }>(
      API_ENDPOINTS.notifications.respond(id),
      { status }
    )
    .then((res) => res.data)
}
