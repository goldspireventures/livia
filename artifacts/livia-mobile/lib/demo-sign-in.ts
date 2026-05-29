import {
  DEMO_ROLE_EMAILS,
  demoOwnerEmailFromSlugInput,
  isDemoLiviaEmail,
  slugFromOwnerDemoEmail,
} from "@workspace/demo-logins";
import { getApiBaseUrl } from "@/lib/api-base";

export type DemoTicketSignIn = {
  token: string;
  landingPath: string;
  email: string;
  displayName?: string;
  persona?: string;
  businessId?: string;
  primaryBusinessSlug?: string;
  businessSlugs?: string[];
};

export { isDemoLiviaEmail };

/** `owner-conorcuts@livia.io` → slug, for per-shop demo owners. */
export function demoOwnerSlugFromEmail(email: string): string | null {
  return slugFromOwnerDemoEmail(email);
}

async function fetchDemoSignInByBusinessSlug(slug: string): Promise<DemoTicketSignIn> {
  const res = await fetch(`${getApiBaseUrl()}/api/demo/sign-in-business`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });
  const body = (await res.json().catch(() => ({}))) as DemoTicketSignIn & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `Demo business sign-in failed (${res.status})`);
  }
  if (!body.token) {
    throw new Error("No sign-in ticket returned — run demo provision on the API.");
  }
  return {
    ...body,
    landingPath: body.landingPath ?? "/dashboard",
    primaryBusinessSlug: body.primaryBusinessSlug ?? slug,
    businessSlugs: body.businessSlugs?.length ? body.businessSlugs : [slug],
  };
}

export async function fetchDemoSignInTicket(
  email: string,
  password: string,
): Promise<DemoTicketSignIn> {
  const normalizedEmail = email.trim();
  const res = await fetch(`${getApiBaseUrl()}/api/demo/sign-in-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizedEmail, password }),
  });
  const body = (await res.json().catch(() => ({}))) as DemoTicketSignIn & { error?: string };
  if (!res.ok) {
    const slug = demoOwnerSlugFromEmail(normalizedEmail);
    if (res.status === 409 && slug) {
      return fetchDemoSignInByBusinessSlug(slug);
    }
    const hint =
      res.status === 409
        ? " Restart the API after pulling (pnpm --filter @workspace/api-server run build && restart port 3000)."
        : "";
    throw new Error((body.error ?? `Demo sign-in failed (${res.status})`) + hint);
  }
  if (!body.token) {
    throw new Error("No sign-in ticket returned — run demo provision on the API.");
  }
  return body;
}

/** Expand slug shortcuts on the sign-in screen (e.g. `conors-cut-co`). */
export function normalizeDemoSignInIdentifier(raw: string): string {
  const v = raw.trim();
  const lower = v.toLowerCase();
  if (lower === "org" || lower === "orgadmin" || lower === "org_admin" || lower === "hq") return DEMO_ROLE_EMAILS.orgAdmin;
  if (lower === "founder") return DEMO_ROLE_EMAILS.orgAdmin;
  if (lower === "owner" || lower === "conor") return DEMO_ROLE_EMAILS.ownerConor;
  if (lower === "solo") return DEMO_ROLE_EMAILS.solo;
  if (lower === "manager") return DEMO_ROLE_EMAILS.manager;
  if (lower === "staff") return DEMO_ROLE_EMAILS.staffLara;
  if (lower === "frontdesk" || lower === "reception") return DEMO_ROLE_EMAILS.desk;
  const fromSlug = demoOwnerEmailFromSlugInput(lower);
  if (fromSlug) return fromSlug;
  return v;
}
