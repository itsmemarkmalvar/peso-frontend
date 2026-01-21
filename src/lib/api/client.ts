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
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      // Try to extract a useful message (Laravel validation / API error payloads)
      const contentType = response.headers.get('content-type') ?? '';
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
      }

      throw new Error(`API Error (${response.status}): ${response.statusText}`);
    }

    return response.json();
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
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
