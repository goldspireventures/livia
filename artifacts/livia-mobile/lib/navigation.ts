import type { Href } from "expo-router";

/** Cast paths that exist in the file tree but are not yet in generated Expo Router types. */
export function asHref(path: string): Href {
  return path as Href;
}

export function routeRoot(segments: readonly string[]): string | undefined {
  return segments[0] as string | undefined;
}

export function isDemoRoute(segments: readonly string[]): boolean {
  return routeRoot(segments) === "demo";
}

/** Cold-open gateway at `/` (app/index.tsx). */
export function isGatewayRoute(segments: readonly string[]): boolean {
  return segments.length === 0;
}

export function isGuestPublicRoute(segments: readonly string[]): boolean {
  const root = routeRoot(segments);
  return root === "public-book" || root === "my-livia" || root === "my" || root === "guest-surface";
}

/** Clerk staff invitation deep link — pre-auth or mid-ticket. */
export function isStaffInviteRoute(segments: readonly string[]): boolean {
  return routeRoot(segments) === "staff-invite";
}
