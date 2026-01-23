import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

export type SupervisorProfile = {
  id: number
  user_id: number
  full_name: string
  email: string
  phone: string
  department: string
  job_title: string
  approval_scope: string
  work_location: string
  onboarded_at: string | null
}

export type SupervisorOnboardingPayload = {
  full_name: string
  email: string
  phone: string
  department: string
  job_title: string
  approval_scope: string
  work_location: string
}

export function getSupervisorProfile(): Promise<SupervisorProfile | null> {
  return apiClient
    .get<{ success: boolean; message: string; data: SupervisorProfile | null }>(
      API_ENDPOINTS.supervisors.me
    )
    .then((res) => res.data ?? null)
}

export function saveSupervisorOnboarding(
  payload: SupervisorOnboardingPayload
): Promise<SupervisorProfile> {
  return apiClient
    .post<{ success: boolean; message: string; data: SupervisorProfile }>(
      API_ENDPOINTS.supervisors.me,
      payload
    )
    .then((res) => res.data)
}
