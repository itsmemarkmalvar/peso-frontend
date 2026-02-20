/**
 * API Client Configuration
 * Handles all HTTP requests to Laravel backend
 */

// In dev we proxy `/api/*` → Laravel (see `next.config.ts` rewrites) to avoid CORS.
// Override per-environment with NEXT_PUBLIC_API_URL, e.g. `http://127.0.0.1:8000/api`
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

type LaravelValidationError = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers = new Headers(options.headers);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (!isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type') ?? '';

    if (!response.ok) {
      // Try to extract a useful message (Laravel validation / API error payloads)
      if (contentType.includes('application/json')) {
        const body = (await response.json().catch(() => null)) as LaravelValidationError | null;
        if (body?.errors) {
          const firstField = Object.keys(body.errors)[0];
          const firstMessage = firstField ? body.errors[firstField]?.[0] : undefined;
          throw new Error(firstMessage ?? body.message ?? 'Request failed.');
        }
        if (body?.message) {
          throw new Error(body.message);
        }
      } else {
        const text = await response.text().catch(() => '');
        if (text) {
          throw new Error(`Unexpected response: ${text.slice(0, 120)}...`);
        }
      }

      throw new Error(`API Error (${response.status}): ${response.statusText}`);
    }

    if (contentType.includes('application/json')) {
      return response.json();
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text().catch(() => '');
    throw new Error(
      text
        ? `Unexpected response format. Expected JSON, received: ${text.slice(0, 120)}...`
        : 'Unexpected response format. Expected JSON.'
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    // Always send a JSON body: undefined is omitted by JSON.stringify, so use {} if no data
    const body = data !== undefined && data !== null ? JSON.stringify(data) : "{}";
    return this.request<T>(endpoint, {
      method: "POST",
      body,
    });
  }

  postForm<T>(endpoint: string, data: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data,
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    const body =
      data !== undefined && data !== null ? JSON.stringify(data) : "{}";
    return this.request<T>(endpoint, {
      method: "PUT",
      body,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
