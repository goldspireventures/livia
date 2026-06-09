/**
 * Persona rituals — the hotel principle in product form.
 *
 * Same Livia building (one design system, one data model). Different keys:
 * each persona gets their own nav labels, home route, Liv voice, and job order.
 *
 * @see docs/personas.md
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Users,
  UsersRound,
  Settings,
  Inbox,
  Sun,
  Building2,
  BookOpen,
  Armchair,
  Layers,
  Clock,
  Dumbbell,
  Network,
  ImageIcon,
  LayoutGrid,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import { businessVocabulary, resolveWellnessPersonaHome } from "@workspace/policy";
import type { PersonaKind } from "./persona";
import type { Role } from "./membership-context";

export type RitualNavItem = {
  /** User-facing label — not generic product jargon */
  ritualName: string;
  href: string;
  icon: LucideIcon;
  min: Role;
  /** When set, only these personas see the item (still gated by min role). */
  personas?: PersonaKind[];
  /** Hide unless user owns 2+ businesses */
  requiresMultiShop?: boolean;
  /** Show when business tier matches */
  tiers?: string[];
  /** Show when business vertical matches */
  verticals?: string[];
  /** Dev/demo only */
  demoOnly?: boolean;
};

export type PersonaRitual = {
  kind: PersonaKind;
  /** Home surface after sign-in */
  homePath: string;
  /** Page title on their home ritual (not "Dashboard") */
  homeTitle: string;
  homeSubtitle: string;
  /** Time-aware greeting prefix */
  greetingName: string;
  /** Liv briefing fallback when live data still loading */
  livFallback: string;
  /** Optional alert chip on home */
  alertLabel?: string;
  /** Primary quick action on home */
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
};

const RANK: Record<Role, number> = { STAFF: 1, ADMIN: 2, OWNER: 3 };

export const PERSONA_RITUALS: Record<PersonaKind, PersonaRitual> = {
  org_admin: {
    kind: "org_admin",
    homePath: "/chain",
    homeTitle: "Your shops at a glance",
    homeSubtitle: "Week-ahead signal across every location — drill into one shop when you need to.",
    greetingName: "there",
    livFallback:
      "Three numbers per shop, one screen. Liv flags what needs you before Sunday becomes a spreadsheet.",
    primaryAction: { label: "Open shop today", href: "/dashboard" },
    secondaryAction: { label: "Review inbox", href: "/inbox" },
    alertLabel: "Cross-shop",
  },
  owner: {
    kind: "owner",
    homePath: "/dashboard",
    homeTitle: "Today",
    homeSubtitle: "Today's bookings, inbox, and anything that needs a yes or no.",
    greetingName: "there",
    livFallback:
      "Pending confirmations, overnight messages, and gaps on the calendar — Liv flags what needs you.",
    primaryAction: { label: "Open inbox", href: "/inbox" },
    secondaryAction: { label: "Book appointment", href: "/bookings?create=1" },
  },
  manager: {
    kind: "manager",
    homePath: "/inbox",
    homeTitle: "Queue",
    homeSubtitle: "What Liv handled, what needs your sign-off, and what can wait.",
    greetingName: "there",
    livFallback:
      "Approvals first. Peek a stylist's day in one tap — every preview is audited.",
    primaryAction: { label: "Today's floor", href: "/bookings" },
    secondaryAction: { label: "View as staff", href: "/my-day" },
    alertLabel: "Needs you",
  },
  staff: {
    kind: "staff",
    homePath: "/my-day",
    homeTitle: "My chair",
    homeSubtitle: "Your appointments, your regulars, nothing else cluttering the view.",
    greetingName: "there",
    livFallback:
      "Next client, time until they're in the chair, and the customers who always ask for you.",
    primaryAction: { label: "Today's list", href: "/bookings" },
  },
  receptionist: {
    kind: "receptionist",
    homePath: "/bookings",
    homeTitle: "The floor",
    homeSubtitle: "Who's in, who's due, where to put the walk-in — calendar first.",
    greetingName: "there",
    livFallback:
      "Multi-staff calendar, incoming messages, and routing walk-ins without waking the owner.",
    primaryAction: { label: "Messages", href: "/inbox" },
    secondaryAction: { label: "Add booking", href: "/bookings?create=1" },
    alertLabel: "Front desk",
  },
};

/** Canonical nav pool — filtered + relabelled per persona */
const NAV_POOL: RitualNavItem[] = [
  { ritualName: "My chair", href: "/my-day", icon: Sun, min: "STAFF", personas: ["staff"] },
  {
    ritualName: "Liv command",
    href: "/toolkit",
    icon: LayoutGrid,
    min: "OWNER",
    personas: ["org_admin", "owner"],
  },
  { ritualName: "Glance", href: "/chain", icon: Building2, min: "OWNER", personas: ["org_admin"], requiresMultiShop: true },
  { ritualName: "Today", href: "/dashboard", icon: LayoutDashboard, min: "ADMIN", personas: ["org_admin", "owner", "manager"] },
  { ritualName: "Queue", href: "/inbox", icon: Inbox, min: "ADMIN", personas: ["org_admin", "owner", "manager", "receptionist"] },
  { ritualName: "The floor", href: "/bookings", icon: CalendarDays, min: "STAFF" },
  {
    ritualName: "Menu",
    href: "/services",
    icon: Sparkles,
    min: "ADMIN",
    personas: ["org_admin", "owner", "manager"],
  },
  { ritualName: "Customers", href: "/customers", icon: Users, min: "STAFF" },
  { ritualName: "Team", href: "/staff", icon: UsersRound, min: "ADMIN", personas: ["org_admin", "owner", "manager"] },
  { ritualName: "Lifecycle", href: "/lifecycle", icon: BookOpen, min: "OWNER", personas: ["org_admin", "owner"] },
  { ritualName: "Settings", href: "/settings", icon: Settings, min: "STAFF" },
  { ritualName: "Host floor", href: "/host", icon: Armchair, min: "OWNER", tiers: ["chair-host"] },
  {
    ritualName: "Brands",
    href: "/brands",
    icon: Layers,
    min: "OWNER",
    personas: ["org_admin", "owner"],
    requiresMultiShop: true,
  },
  {
    ritualName: "Care programmes",
    href: "/day-packages",
    icon: ClipboardList,
    min: "ADMIN",
    verticals: ["allied-health", "wellness"],
    personas: ["org_admin", "owner", "manager"],
  },
  { ritualName: "Rota", href: "/rota", icon: Clock, min: "ADMIN", personas: ["org_admin", "owner", "manager"] },
  { ritualName: "Classes", href: "/classes", icon: Dumbbell, min: "ADMIN", verticals: ["fitness"] },
  {
    ritualName: "Design proofs",
    href: "/design-proofs",
    icon: ImageIcon,
    min: "OWNER",
    verticals: ["body-art"],
  },
  {
    ritualName: "Clinical hub",
    href: "/medspa",
    icon: Stethoscope,
    min: "ADMIN",
    verticals: ["medspa"],
    personas: ["org_admin", "owner", "manager"],
  },
  {
    ritualName: "Mini store",
    href: "/beauty-store",
    icon: Sparkles,
    min: "ADMIN",
    verticals: ["beauty"],
    personas: ["org_admin", "owner", "manager"],
  },
  {
    ritualName: "Franchise",
    href: "/franchise",
    icon: Network,
    min: "OWNER",
    tiers: ["franchise", "mid-chain"],
    personas: ["org_admin", "owner"],
  },
];

const PERSONA_NAV_ORDER: Record<PersonaKind, string[]> = {
  org_admin: ["/chain", "/brands", "/host", "/dashboard", "/inbox", "/bookings", "/services", "/customers", "/staff", "/rota", "/lifecycle", "/toolkit", "/settings"],
  owner: ["/host", "/brands", "/dashboard", "/inbox", "/bookings", "/services", "/customers", "/day-packages", "/staff", "/rota", "/lifecycle", "/toolkit", "/settings"],
  manager: ["/inbox", "/dashboard", "/bookings", "/services", "/customers", "/staff", "/rota", "/settings"],
  staff: ["/my-day", "/bookings", "/customers", "/settings"],
  receptionist: ["/bookings", "/inbox", "/customers", "/settings"],
};

/** Merge wellness ritual homes when vertical=wellness */
export function resolvePersonaRitual(
  persona: PersonaKind,
  businessVertical?: string | null,
): PersonaRitual {
  const base = PERSONA_RITUALS[persona];
  const wellness = resolveWellnessPersonaHome(persona, businessVertical ?? null);
  if (!wellness) return base;
  return {
    ...base,
    homePath: wellness.homePath,
    homeTitle: wellness.homeTitle,
    homeSubtitle: wellness.homeSubtitle,
    primaryAction: wellness.primaryAction ?? base.primaryAction,
    secondaryAction: wellness.secondaryAction ?? base.secondaryAction,
  };
}

export function personaNavOrder(
  persona: PersonaKind,
  businessVertical?: string | null,
): string[] {
  if (businessVertical === "wellness" && persona === "receptionist") {
    return ["/wellness-reception", "/bookings", "/inbox", "/customers", "/settings"];
  }
  if (businessVertical === "wellness" && persona === "manager") {
    return ["/wellness-reception", "/inbox", "/dashboard", "/bookings", "/wellness-reports", "/settings"];
  }
  if (businessVertical === "beauty" && persona === "receptionist") {
    return ["/beauty-reception", "/bookings", "/inbox", "/customers", "/settings"];
  }
  if (businessVertical === "beauty" && (persona === "manager" || persona === "owner")) {
    return [
      "/dashboard",
      "/beauty-reception",
      "/inbox",
      "/bookings",
      "/beauty-store",
      "/services",
      "/studio-setup",
      "/settings",
    ];
  }
  return PERSONA_NAV_ORDER[persona];
}

export function timeGreeting(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function greetingLine(
  firstName: string | null | undefined,
  persona: PersonaKind,
  opts?: { locationNoun?: string },
): string {
  const name = firstName?.trim() || PERSONA_RITUALS[persona].greetingName;
  const t = timeGreeting();
  const place = opts?.locationNoun?.toLowerCase() ?? "business";
  const tails: Record<PersonaKind, string> = {
    org_admin: "— here's how your locations are doing.",
    owner: `— here's what needs you at your ${place}.`,
    manager: "— here's your queue.",
    staff: "— here's your chair today.",
    receptionist: "— here's the floor.",
  };
  return `Good ${t}, ${name} ${tails[persona]}`;
}

/** Owner Today subtitle when business vertical is known. */
export function ownerHomeSubtitle(vertical?: string | null, category?: string | null): string {
  return businessVocabulary(vertical, category).ownerTodayLine;
}

const VERTICAL_NAV_LABELS: Record<string, Partial<Record<string, string>>> = {
  beauty: {
    "/services": "Treatments",
    "/customers": "Clients",
    "/bookings": "Schedule",
    "/inbox": "Inbox",
    "/beauty-store": "Mini store",
  },
  hair: {
    "/services": "Services",
    "/customers": "Clients",
  },
  "allied-health": {
    "/customers": "Patients",
    "/staff": "Clinicians",
    "/bookings": "Appointments",
  },
  medspa: {
    "/customers": "Patients",
    "/staff": "Practitioners",
    "/bookings": "Appointments",
  },
  "pet-grooming": {
    "/customers": "Pet parents",
    "/bookings": "Grooms",
  },
  fitness: {
    "/customers": "Members",
    "/bookings": "Sessions",
    "/staff": "Coaches",
  },
  wellness: {
    "/bookings": "Rooms",
    "/customers": "Guests",
    "/staff": "Practitioners",
    "/services": "Sessions",
    "/inbox": "Inbox",
    "/dashboard": "Today",
  },
};

export function getRitualNav(
  persona: PersonaKind,
  effectiveRole: Role | null,
  ownedShopCount: number,
  includeDemoLinks: boolean,
  businessTier?: string | null,
  businessVertical?: string | null,
  _businessCategory?: string | null,
  opts?: { showLifecycle?: boolean },
): RitualNavItem[] {
  if (!effectiveRole) return [];

  const order = personaNavOrder(persona, businessVertical ?? null);
  const tier = businessTier ?? "solo";
  const items = NAV_POOL.filter((item) => {
    if (item.demoOnly && !includeDemoLinks) return false;
    if (item.requiresMultiShop && ownedShopCount < 2) return false;
    if (item.tiers && !item.tiers.includes(tier)) return false;
    if (item.verticals && businessVertical && !item.verticals.includes(businessVertical)) return false;
    if (item.verticals && !businessVertical) return false;
    if (item.href === "/lifecycle" && opts?.showLifecycle === false) return false;
    if (RANK[effectiveRole] < RANK[item.min]) return false;
    if (item.personas && !item.personas.includes(persona)) return false;
    return true;
  });

  // Receptionist: relabel inbox/bookings for their ritual names on shared hrefs
  const relabel: Partial<Record<string, Partial<Record<PersonaKind, string>>>> = {
    "/inbox": { receptionist: "Messages", org_admin: "Inbox", owner: "Inbox", manager: "Queue" },
    "/bookings": { receptionist: "The floor", staff: "Appointments", org_admin: "Bookings", owner: "Bookings", manager: "Bookings" },
    "/dashboard": { org_admin: "Today", owner: "Today", manager: "Overview" },
    "/chain": { org_admin: "Glance" },
    "/my-day": { staff: "My chair" },
  };

  const sorted = [...items].sort((a, b) => {
    const ia = order.indexOf(a.href);
    const ib = order.indexOf(b.href);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const verticalLabels = businessVertical ? VERTICAL_NAV_LABELS[businessVertical] : undefined;

  return sorted.map((item) => ({
    ...item,
    ritualName:
      verticalLabels?.[item.href] ??
      relabel[item.href]?.[persona] ??
      item.ritualName,
  }));
}

export function pageRitualTitle(pathname: string, persona: PersonaKind): string | null {
  if (pathname === "/chain") return PERSONA_RITUALS.org_admin.homeTitle;
  if (pathname === "/dashboard") {
    if (persona === "org_admin" || persona === "owner") return PERSONA_RITUALS[persona].homeTitle;
    if (persona === "manager") return "Overview";
  }
  if (pathname === "/inbox") return PERSONA_RITUALS[persona === "manager" ? "manager" : "owner"].homeTitle === "Queue" ? "Queue" : "Inbox";
  if (pathname === "/my-day") return PERSONA_RITUALS.staff.homeTitle;
  if (pathname === "/bookings") return persona === "receptionist" ? PERSONA_RITUALS.receptionist.homeTitle : "Bookings";
  if (pathname === "/host") return "Host floor";
  if (pathname === "/brands") return "Brand portfolio";
  if (pathname === "/toolkit") return "Liv command";
  if (pathname === "/rota") return "Team rota";
  return null;
}
