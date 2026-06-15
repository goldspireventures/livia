/** My Livia guest vault — OTP session stored after /my sign-in. */
export const GUEST_HUB_TOKEN_KEY = "livia_guest_hub_token";

export function readGuestHubToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_HUB_TOKEN_KEY);
}

export function isMyLiviaRebookFlow(): boolean {
  if (typeof window === "undefined") return false;
  return (
    new URLSearchParams(window.location.search).get("hub") === "1" ||
    Boolean(readGuestHubToken())
  );
}

export type GuestHubBookProfile = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  hubAuthenticated: boolean;
};

/** Load signed-in guest contact fields for /book autofill when rebooking from /my. */
export async function fetchGuestHubBookProfile(slug: string): Promise<GuestHubBookProfile | null> {
  const token = readGuestHubToken();
  if (!token || !slug) return null;
  const res = await fetch(`/api/public/guest-hub/shops/${encodeURIComponent(slug)}`, {
    headers: { "X-Guest-Hub-Token": token },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    customer?: GuestHubBookProfile | null;
  };
  return data.customer?.hubAuthenticated ? data.customer : null;
}
