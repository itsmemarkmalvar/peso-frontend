import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

export type LanguageSkillMatrix = {
  read: boolean
  write: boolean
  speak: boolean
  understand: boolean
}

export type NsrpFormPayload = {
  personal_information: {
    surname: string
    first_name: string
    middle_name: string
    suffix: string
    date_of_birth: string | null
    sex: "male" | "female"
    civil_status: string
    religion: string
    tin: string
    height: string
    disability: string
    contact_number: string
    email: string
    address: {
      house_no: string
      barangay: string
      city: string
      province: string
    }
    employment_status: {
      status: "employed" | "unemployed"
      employed_details: {
        wage_employed: boolean
        self_employed: boolean
        self_employed_categories: string[]
        self_employed_other: string
      }
      unemployed_details: {
        months_looking: string
        reasons: string[]
        others_specify: string
      }
    }
    ofw: {
      is_ofw: boolean
      country: string
      country_of_destination: string
      former_ofw: boolean
      latest_country_of_deployment: string
      return_month_year: string
    }
    four_ps: {
      is_beneficiary: boolean
      household_id: string
    }
  }
  job_preferences: {
    preferred_occupations: [string, string, string]
    preferred_locations: [string, string, string]
    work_type: string[]
  }
  language_proficiency: {
    others_label: string
    languages: {
      english: LanguageSkillMatrix
      filipino: LanguageSkillMatrix
      mandarin: LanguageSkillMatrix
      others: LanguageSkillMatrix
    }
  }
  educational_background: {
    currently_in_school: boolean
    elementary: {
      school_attended: string
      year_graduated: string
    }
    secondary: {
      school_attended: string
      year_graduated: string
    }
    secondary_k12: {
      school_attended: string
      year_graduated: string
    }
    senior_high: {
      strand: string
      school_attended: string
      year_graduated: string
    }
    tertiary: {
      course: string
      school_attended: string
      year_graduated: string
      level_reached: string
      year_last_attended: string
    }
    graduate: {
      course: string
      school_attended: string
      year_graduated: string
      level_reached: string
      year_last_attended: string
    }
  }
  technical_vocational_training: Array<{
    course: string
    hours: number
    institution: string
    skills_acquired: string
    certificates_received: string
  }>
  eligibility_license: Array<{
    civil_service_eligibility: string
    civil_service_date_taken: string
    prc_license: string
    prc_validity: string
  }>
  work_experience: Array<{
    company_name: string
    address: string
    position: string
    months_worked: number
    employment_status: string
  }>
  other_skills: {
    selected_skills: string[]
    others: string
  }
  certification: {
    certify_true: boolean
    typed_name: string
    date: string
  }
}

export type NsrpFormData = NsrpFormPayload & {
  id: number | null
  user_id: number
  is_completed: boolean
  submitted_at: string | null
  updated_at: string | null
}

type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
}

export function getMyNsrpForm(): Promise<NsrpFormData> {
  return apiClient
    .get<ApiResponse<NsrpFormData>>(API_ENDPOINTS.nsrp.me)
    .then((res) => {
      if (!res.data) {
        throw new Error("NSRP form payload is missing.")
      }
      return res.data
    })
}

export function getMyNsrpStatus(): Promise<{
  is_completed: boolean
  submitted_at: string | null
}> {
  return apiClient
    .get<ApiResponse<{ is_completed: boolean; submitted_at: string | null }>>(
      API_ENDPOINTS.nsrp.status
    )
    .then((res) => res.data ?? { is_completed: false, submitted_at: null })
}

export function saveNsrpDraft(payload: NsrpFormPayload): Promise<NsrpFormData> {
  return apiClient
    .put<ApiResponse<NsrpFormData>>(API_ENDPOINTS.nsrp.saveDraft, payload)
    .then((res) => {
      if (!res.data) {
        throw new Error("Failed to save NSRP draft.")
      }
      return res.data
    })
}

export function submitNsrpForm(payload: NsrpFormPayload): Promise<NsrpFormData> {
  return apiClient
    .post<ApiResponse<NsrpFormData>>(API_ENDPOINTS.nsrp.submit, payload)
    .then((res) => {
      if (!res.data) {
        throw new Error("Failed to submit NSRP form.")
      }
      return res.data
    })
}

export function getNsrpFormByUser(userId: number): Promise<NsrpFormData | null> {
  return apiClient
    .get<ApiResponse<NsrpFormData | null>>(API_ENDPOINTS.nsrp.show(userId))
    .then((res) => res.data ?? null)
}

export async function openNsrpPdfByUser(userId: number): Promise<void> {
  const blob = await apiClient.getBlob(API_ENDPOINTS.nsrp.pdf(userId))
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, "_blank", "noopener,noreferrer")
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}
