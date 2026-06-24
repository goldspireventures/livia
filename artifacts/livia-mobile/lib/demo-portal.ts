import { getApiBaseUrl } from "@/lib/api-base";

export type DemoPersonaId =
  | "org_admin"
  | "owner"
  | "manager"
  | "staff-senior"
  | "staff-junior"
  | "receptionist"
  | "customer";

export type DemoRosterEntry = {
  role: string;
  label: string;
  email: string;
  landingPath: string;
  personaId: string;
};

export type DemoBusinessTenant = {
  slug: string;
  id: string;
  name: string;
  vertical?: string | null;
  country?: string | null;
  ownerEmail: string;
  ownerPersonaId?: DemoPersonaId | null;
  publicBookingUrl: string;
  roster?: DemoRosterEntry[];
};

export type DemoSignInResult = {
  token?: string;
  landingPath: string;
  businessId?: string;
  email: string;
  displayName: string;
  persona: DemoPersonaId;
  signInStrategy: "ticket" | "public";
  primaryBusinessSlug?: string;
  businessSlugs?: string[];
};

const STATUS_TIMEOUT_MS = 20_000;
const SYNC_TIMEOUT_MS = 180_000;

function isTimeoutError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const m = e.message.toLowerCase();
  return (
    e.name === "AbortError" ||
    m.includes("timed out") ||
    m.includes("timeout") ||
    m.includes("aborted")
  );
}

async function demoFetch<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? STATUS_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${getApiBaseUrl()}/api${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      throw new Error(body.error ?? `Demo API failed (${res.status})`);
    }
    return body;
  } catch (e: unknown) {
    if (isTimeoutError(e)) {
      throw new Error(
        path.includes("/sync") || path.includes("/provision") || path.includes("/repair")
          ? "Demo setup timed out — keep the app open and retry. First seed can take 1–3 minutes."
          : "Demo status timed out — check your connection and try again.",
      );
    }
    if (e instanceof TypeError && /network request failed/i.test(e.message)) {
      throw new Error(
        "Cannot reach Livia — check your connection and try again.",
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDemoStatus() {
  return demoFetch<{
    provisioned: boolean;
    businesses: DemoBusinessTenant[];
    passwordHint: string;
    demoPasswordConfigured: boolean;
  }>("/demo/status", { timeoutMs: STATUS_TIMEOUT_MS });
}

export async function fetchDemoCatalog() {
  return demoFetch<{
    personas: Array<{ id: string; email: string }>;
    scenarios?: Array<{ id: string; title: string; slug: string }>;
    sharedPassword?: string;
    devPassword?: string;
  }>("/demo/catalog");
}

export async function syncDemoWorld() {
  return demoFetch<{
    mode: "sync" | "full";
    provisioned: boolean;
    businesses: Array<{ slug: string; id: string; name: string }>;
    passwordHint: string;
  }>("/demo/sync", { method: "POST", timeoutMs: SYNC_TIMEOUT_MS });
}

/** Clerk dev quota fallback — same as web “Repair demo”. */
export async function repairDemoDatabase() {
  return demoFetch<{
    mode?: "repair";
    provisioned: boolean;
    businesses: Array<{ slug: string; id: string; name: string }>;
    passwordHint: string;
  }>("/demo/repair-db", { method: "POST", timeoutMs: SYNC_TIMEOUT_MS });
}

export function isDemoClerkQuotaError(message: string): boolean {
  return /user limit|repair-db|clerk_user_quota|clerk.*quota/i.test(message);
}

export async function requestDemoQuickSignIn(email: string) {
  return demoFetch<DemoSignInResult>("/demo/quick-sign-in", {
    method: "POST",
    body: JSON.stringify({ email }),
    timeoutMs: 45_000,
  });
}

export async function requestDemoSignInAsBusiness(slug: string) {
  return demoFetch<DemoSignInResult>("/demo/sign-in-business", {
    method: "POST",
    body: JSON.stringify({ slug }),
    timeoutMs: 45_000,
  });
}
