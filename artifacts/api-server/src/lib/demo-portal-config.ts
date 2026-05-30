/**
 * Demo portal — seven doors (docs/demo-gateway.md, docs/personas.md).
 * Stable slugs + emails so provision/sign-in are idempotent in local dev.
 */
import {
  DEMO_ROLE_EMAILS,
  demoOwnerEmailForSlug,
  isDemoLiviaEmail,
  slugFromOwnerDemoEmail,
} from "@workspace/demo-logins";

export {
  demoOwnerEmailForSlug,
  slugFromOwnerDemoEmail,
} from "@workspace/demo-logins";

export type DemoPersonaId =
  | "org_admin"
  | "owner"
  | "manager"
  | "staff-senior"
  | "staff-junior"
  | "receptionist"
  | "customer";

export const DEMO_WORLD_SLUGS = [
  "aurora-studio",
  "aurora-mews",
  "aurora-galway",
  "conors-cut-co",
  "bloom-beauty-dublin",
  "harbour-wellness-cork",
  "ink-anchor-galway",
  "paws-parlour-dublin",
  "clarity-medspa-dublin",
  "motion-physio-cork",
  "peak-fitness-dublin",
  "shine-studio-belfast",
  "luxe-salon-spa",
  "stoneybatter-cuts",
  "dublin-barber-collective",
  "dundrum-hair-studio",
  "dundrum-serenity-spa",
  "london-rose-spa",
  "berlin-studio-neun",
  "paris-belle-vue",
] as const;

export type DemoPersonaDef = {
  id: DemoPersonaId;
  email: string;
  displayName: string;
  roleLabel: string;
  firstName: string;
  lastName: string;
  /** Web route after sign-in (customer opens public booking externally). */
  landingPath: string;
  /** Clerk membership role when not the business owner. */
  membershipRole?: "ADMIN" | "STAFF";
  /** Business slug this persona primarily works in. */
  primaryBusinessSlug: string;
  /** All business slugs with a membership (founder = 3 shops). */
  businessSlugs: string[];
  /** Link staff row by display name on primary business. */
  staffDisplayName?: string;
  /** Front-desk preset for receptionist persona. */
  receptionPreset?: boolean;
  requiresClerk: boolean;
};

export const DEMO_PERSONAS: DemoPersonaDef[] = [
  {
    id: "org_admin",
    email: DEMO_ROLE_EMAILS.orgAdmin,
    displayName: "Aoife O'Connor",
    roleLabel: "Org admin · 3 locations",
    firstName: "Aoife",
    lastName: "O'Connor",
    landingPath: "/chain",
    primaryBusinessSlug: "aurora-studio",
    businessSlugs: ["aurora-studio", "aurora-mews", "aurora-galway"],
    requiresClerk: true,
  },
  {
    id: "owner",
    email: DEMO_ROLE_EMAILS.ownerConor,
    displayName: "Conor Walsh",
    roleLabel: "Single-shop owner",
    firstName: "Conor",
    lastName: "Walsh",
    landingPath: "/dashboard",
    primaryBusinessSlug: "conors-cut-co",
    businessSlugs: ["conors-cut-co"],
    requiresClerk: true,
  },
  {
    id: "manager",
    email: DEMO_ROLE_EMAILS.manager,
    displayName: "Niamh Doyle",
    roleLabel: "Manager · ADMIN",
    firstName: "Niamh",
    lastName: "Doyle",
    landingPath: "/inbox",
    membershipRole: "ADMIN",
    primaryBusinessSlug: "aurora-studio",
    businessSlugs: ["aurora-studio"],
    requiresClerk: true,
  },
  {
    id: "staff-senior",
    email: DEMO_ROLE_EMAILS.staffLara,
    displayName: "Lara Byrne",
    roleLabel: "Senior stylist · STAFF",
    firstName: "Lara",
    lastName: "Byrne",
    landingPath: "/my-day",
    membershipRole: "STAFF",
    primaryBusinessSlug: "aurora-studio",
    businessSlugs: ["aurora-studio"],
    staffDisplayName: "Lara Byrne",
    requiresClerk: true,
  },
  {
    id: "staff-junior",
    email: DEMO_ROLE_EMAILS.staffMo,
    displayName: "Mo Healy",
    roleLabel: "Junior stylist · STAFF",
    firstName: "Mo",
    lastName: "Healy",
    landingPath: "/my-day",
    membershipRole: "STAFF",
    primaryBusinessSlug: "conors-cut-co",
    businessSlugs: ["conors-cut-co"],
    staffDisplayName: "Mo Healy",
    requiresClerk: true,
  },
  {
    id: "receptionist",
    email: DEMO_ROLE_EMAILS.desk,
    displayName: "Síobhan Brady",
    roleLabel: "Front desk · ADMIN",
    firstName: "Síobhan",
    lastName: "Brady",
    landingPath: "/bookings",
    membershipRole: "ADMIN",
    primaryBusinessSlug: "aurora-studio",
    businessSlugs: ["aurora-studio"],
    receptionPreset: true,
    requiresClerk: true,
  },
  {
    id: "customer",
    email: "demo-customer@livia.io",
    displayName: "Mary McNamara",
    roleLabel: "End customer · public booking",
    firstName: "Mary",
    lastName: "McNamara",
    landingPath: "/b/aurora-studio",
    primaryBusinessSlug: "aurora-studio",
    businessSlugs: [],
    requiresClerk: false,
  },
];

export function getDemoPersona(id: string): DemoPersonaDef | undefined {
  return DEMO_PERSONAS.find((p) => p.id === id);
}

export function getDemoPersonaByEmail(email: string): DemoPersonaDef | undefined {
  const lower = email.trim().toLowerCase();
  return DEMO_PERSONAS.find((p) => p.email.toLowerCase() === lower);
}

export function buildBusinessOwnerDef(
  slug: string,
  name: string,
): DemoPersonaDef {
  return {
    id: "owner",
    email: demoOwnerEmailForSlug(slug),
    displayName: `${name} · Owner`,
    roleLabel: `Owner · ${name}`,
    firstName: "Demo",
    lastName: "Owner",
    landingPath: "/dashboard",
    primaryBusinessSlug: slug,
    businessSlugs: [slug],
    requiresClerk: true,
  };
}

export function isDemoEmail(email: string | null | undefined): boolean {
  return isDemoLiviaEmail(email);
}

/** Demo routes are never enabled in production unless explicitly overridden (staging drills only). */
export function isDemoPortalEnabled(): boolean {
  if (process.env.LIVIA_DEMO_ENABLED === "false") return false;
  if (process.env.NODE_ENV === "production") {
    // Staging Railway runs NODE_ENV=production — allow demo without prod-only flag.
    if (process.env.LIVIA_DEPLOY_ENV === "staging" && process.env.LIVIA_DEMO_ENABLED === "true") {
      return true;
    }
    return (
      process.env.LIVIA_DEMO_ENABLED === "true" &&
      process.env.LIVIA_DEMO_ALLOW_IN_PRODUCTION === "true"
    );
  }
  return true;
}

export function demoResponsesMayIncludeSecrets(): boolean {
  return process.env.NODE_ENV !== "production";
}
