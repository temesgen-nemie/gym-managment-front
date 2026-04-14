const DEFAULT_API_BASE_URL = "http://localhost:5000/api";

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");

export const apiBaseUrl = configuredApiBaseUrl || DEFAULT_API_BASE_URL;

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(errorPayload?.message ?? "Request failed");
  }

  return (await response.json()) as T;
}
