// Thin wrapper around `customFetch` for endpoints that don't yet have a
// generated react-query hook (my-day, /membership, /invitations).
//
// Uses the same Clerk JWT + persona query injection as the generated client
// (see ClerkAuthBridge in App.tsx).

import { ApiError, customFetch, getRequestIdFromErrorData } from "@workspace/api-client-react";

const BASE = "/api";

export class ApiFetchError extends Error {
  status: number;
  code?: string;
  requestId?: string;
  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

function toApiFetchError(err: ApiError): ApiFetchError {
  const data = err.data;
  const message =
    data && typeof data === "object" && "error" in data && typeof data.error === "string"
      ? data.error
      : err.message;
  const code =
    data && typeof data === "object" && "code" in data && typeof data.code === "string"
      ? data.code
      : undefined;
  const requestId = getRequestIdFromErrorData(data);
  return new ApiFetchError(message, err.status, code, requestId);
}

function resolveApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Avoid /api/api/... when callers pass `/api/businesses/...` (BASE is `/api`).
  if (normalized.startsWith("/api/") || normalized === "/api") {
    return normalized;
  }
  return `${BASE}${normalized}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = resolveApiUrl(path);
  try {
    return await customFetch<T>(url, init);
  } catch (err) {
    if (err instanceof ApiError) {
      throw toApiFetchError(err);
    }
    throw err;
  }
}
