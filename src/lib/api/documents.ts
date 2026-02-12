import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

export type DocumentRecord = {
  id: number
  title: string
  description: string | null
  file_name: string
  file_size: number
  mime_type: string
  is_active: boolean
  uploaded_by: { id: number; name: string | null } | null
  created_at: string
  updated_at: string
}

export function getDocuments(): Promise<DocumentRecord[]> {
  return apiClient
    .get<{ success: boolean; data: DocumentRecord[] }>(
      API_ENDPOINTS.documents.list
    )
    .then((res) => res.data ?? [])
}

export function uploadDocument(payload: FormData): Promise<DocumentRecord> {
  return apiClient
    .postForm<{ success: boolean; data: DocumentRecord }>(
      API_ENDPOINTS.documents.create,
      payload
    )
    .then((res) => res.data)
}

export function deleteDocument(id: number): Promise<void> {
  return apiClient
    .delete<{ success: boolean }>(API_ENDPOINTS.documents.delete(id))
    .then(() => undefined)
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

export async function fetchDocumentBlob(id: number): Promise<Blob> {
  const token = getAuthToken()
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.documents.download(id)}`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to download document (${response.status}).`)
  }

  return response.blob()
}
