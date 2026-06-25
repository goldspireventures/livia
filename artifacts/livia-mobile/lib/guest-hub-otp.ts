import { GUEST_HUB_COPY } from "@workspace/policy";
import { isProductionCustomerSurface } from "./production-surface";

export type GuestOtpRequestResult = {
  sessionToken: string;
  devOtp?: string;
  magicOtpCode?: string;
  phoneE164?: string;
};

function parseApiError(body: unknown, status: number): string {
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return `Could not send code (${status})`;
}

function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /network request failed|failed to fetch|network error/i.test(msg);
}

/** POST /api/public/guest-hub/otp/request — surfaces API + connectivity errors for mobile UI. */
export async function requestGuestHubOtpMobile(
  apiBase: string,
  phone: string,
  country = "IE",
): Promise<GuestOtpRequestResult> {
  const trimmed = phone.trim();
  if (!trimmed) {
    throw new Error("Enter your mobile number");
  }

  let res: Response;
  try {
    res = await fetch(`${apiBase}/api/public/guest-hub/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: trimmed, country }),
    });
  } catch (err) {
    if (isNetworkError(err)) {
      throw new Error(
        isProductionCustomerSurface()
          ? "We could not reach Livia right now. Check your connection and try again."
          : `Can't reach the API at ${apiBase}. Start the API on port 3000 and check Wi‑Fi / Windows Firewall.`,
      );
    }
    throw err;
  }

  let body: unknown = {};
  try {
    body = await res.json();
  } catch {
    /* non-json */
  }

  if (!res.ok) {
    throw new Error(parseApiError(body, res.status));
  }

  const j = body as GuestOtpRequestResult;
  if (!j.sessionToken) {
    throw new Error("Invalid response from server");
  }
  return j;
}

export const DEMO_GUEST_PHONE = GUEST_HUB_COPY.demoGuestPhone;
