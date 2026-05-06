// Thin wrapper around `fetch` for endpoints that don't yet have a
// generated react-query hook (my-day, /membership, /invitations).
//
// Auth is implicit: in the dashboard we ride on the Clerk session cookie
// that's set on the same origin by the Clerk proxy, so no Authorization
// header is needed.

const BASE = "/api";

export class ApiFetchError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };
  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new ApiFetchError(
      (data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed (${res.status})`),
      res.status,
      data && typeof data === "object" && "code" in data && typeof data.code === "string"
        ? data.code
        : undefined,
    );
  }
  return data as T;
}
