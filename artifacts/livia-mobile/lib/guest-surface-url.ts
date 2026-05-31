/** Dashboard / app host for thick guest surfaces (visit, intake, pay, /my). */
export function getDashboardOrigin(): string {
  const fromEnv = process.env.EXPO_PUBLIC_DASHBOARD_URL?.replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (__DEV__) return "http://localhost:5173";
  return "https://app.livia-hq.com";
}

export type GuestSurfaceKind = "visit" | "intake" | "waitlist" | "pay" | "proof";

export function getGuestSurfaceUrl(
  kind: GuestSurfaceKind,
  slug: string,
  token: string,
): string {
  const base = getDashboardOrigin();
  switch (kind) {
    case "visit":
      return `${base}/b/${slug}/visit/${token}`;
    case "intake":
      return `${base}/b/${slug}/intake/${token}`;
    case "waitlist":
      return `${base}/b/${slug}/waitlist/${token}`;
    case "pay":
      return `${base}/b/${slug}/pay/${token}`;
    case "proof":
      return `${base}/b/${slug}/proof/${token}`;
  }
}

export function getMyLiviaUrl(): string {
  return `${getDashboardOrigin()}/my`;
}
