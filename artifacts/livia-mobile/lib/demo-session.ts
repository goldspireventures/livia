import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PersonaKind } from "@/hooks/usePersona";
import {
  demoOwnerSlugFromEmail,
  isDemoLiviaEmail,
  type DemoTicketSignIn,
} from "@/lib/demo-sign-in";

const DEMO_SESSION_KEY = "livia.demoSession";
const MOBILE_HOME_KEY = "livia.mobileHomeRoute";

export type DemoSession = {
  email: string;
  persona: string;
  landingPath: string;
  businessId?: string;
  primaryBusinessSlug: string;
  businessSlugs: string[];
};

export function demoPersonaToMobile(personaId: string): PersonaKind {
  switch (personaId) {
    case "org_admin":
      return "org_admin";
    case "owner":
      return "owner";
    case "manager":
      return "manager";
    case "receptionist":
      return "receptionist";
    case "staff-senior":
    case "staff-junior":
      return "staff";
    default:
      return "owner";
  }
}

/** Map web demo landing paths to Expo Router tab/stack routes. */
export function mobileRouteFromDemoLanding(landingPath: string): string {
  const path = landingPath.split("?")[0] ?? "/";
  if (path === "/chain" || path.startsWith("/chain")) return "/(tabs)/shops";
  if (path === "/inbox" || path.startsWith("/inbox")) return "/(tabs)/inbox";
  if (path === "/my-day" || path.startsWith("/my-day")) return "/(tabs)/my-day";
  if (path === "/bookings" || path.startsWith("/bookings")) return "/(tabs)/bookings";
  if (path.startsWith("/b/")) return "/(tabs)";
  return "/(tabs)";
}

export async function persistDemoSession(ticket: DemoTicketSignIn): Promise<void> {
  const slugFromEmail = demoOwnerSlugFromEmail(ticket.email);
  const primarySlug =
    ticket.primaryBusinessSlug ?? ticket.businessSlugs?.[0] ?? slugFromEmail ?? "";
  const slugs =
    ticket.businessSlugs?.length
      ? ticket.businessSlugs
      : primarySlug
        ? [primarySlug]
        : [];
  const session: DemoSession = {
    email: ticket.email,
    persona: ticket.persona ?? "owner",
    landingPath: ticket.landingPath,
    businessId: ticket.businessId,
    primaryBusinessSlug: primarySlug,
    businessSlugs: slugs,
  };
  const home = mobileRouteFromDemoLanding(ticket.landingPath);
  await AsyncStorage.multiSet([
    [DEMO_SESSION_KEY, JSON.stringify(session)],
    [MOBILE_HOME_KEY, home],
  ]);
}

export async function clearDemoSession(): Promise<void> {
  await AsyncStorage.multiRemove([DEMO_SESSION_KEY, MOBILE_HOME_KEY]);
}

/** Stale demo session must not hijack a real founder sign-in on the same device. */
export function isActiveDemoSession(
  session: DemoSession | null,
  clerkEmail: string | null | undefined,
): boolean {
  if (!session) return false;
  if (!clerkEmail) return false;
  const clerk = clerkEmail.trim().toLowerCase();
  const sessionEmail = session.email.trim().toLowerCase();
  if (!isDemoLiviaEmail(clerk) && clerk !== sessionEmail) return false;
  return true;
}

export async function getDemoSession(): Promise<DemoSession | null> {
  const raw = await AsyncStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export async function getMobileHomeRoute(): Promise<string | null> {
  return AsyncStorage.getItem(MOBILE_HOME_KEY);
}

export async function consumeMobileHomeRoute(): Promise<string | null> {
  const route = await getMobileHomeRoute();
  if (route) await AsyncStorage.removeItem(MOBILE_HOME_KEY);
  return route;
}

export function businessAllowedForDemo(
  slug: string | null | undefined,
  session: DemoSession | null,
): boolean {
  if (!session?.businessSlugs?.length) return true;
  if (!slug) return false;
  return session.businessSlugs.includes(slug);
}
