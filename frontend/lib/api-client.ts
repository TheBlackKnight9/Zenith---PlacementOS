import { getStoredToken, clearAuthSession } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  statusCode: number;
  data: any;
  code: string;

  constructor(message: string, statusCode: number, data: any = null, code: string = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
    this.code = code;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  let json: any;
  try {
    json = await response.json();
  } catch {
    json = { success: false, message: response.statusText };
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      // Clear expired session if 401
      clearAuthSession();
    }
    throw new ApiError(
      json.message || "An unexpected error occurred",
      response.status,
      json.data,
      json.error?.code || "HTTP_ERROR"
    );
  }

  return json.data;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: "DELETE", ...options }),
};
