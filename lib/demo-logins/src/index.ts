/**
 * Synthetic demo tenant addresses — not company staff (@livia-hq.com / cockpit Goldspire).
 * Password: LIVIA_DEMO_PASSWORD (default LiviaDemo2026!)
 */

export const DEMO_EMAIL_DOMAIN = "demo.livia-hq.com";
/** Legacy demo domain — still recognised until Clerk personas are reprovisioned. */
export const LEGACY_DEMO_EMAIL_DOMAIN = "livia.io";

export const DEMO_PASSWORD_HINT = "LiviaDemo2026!";

function atDemoDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  return d === DEMO_EMAIL_DOMAIN || d === LEGACY_DEMO_EMAIL_DOMAIN;
}

export function isDemoEmailDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf("@");
  if (at <= 0) return false;
  return atDemoDomain(lower.slice(at + 1));
}

/** slug → local part after `owner-` */
export const DEMO_OWNER_SHORT_BY_SLUG: Record<string, string> = {
  "aurora-studio": "aurora",
  "aurora-mews": "mews",
  "aurora-galway": "galway",
  "conors-cut-co": "conorcuts",
  "bloom-beauty-dublin": "bloom",
  "harbour-wellness-cork": "harbour",
  "ink-anchor-galway": "ink",
  "paws-parlour-dublin": "paws",
  "clarity-medspa-dublin": "clarity",
  "motion-physio-cork": "physio",
  "peak-fitness-dublin": "peak",
  "shine-studio-belfast": "shine",
  "luxe-salon-spa": "luxe",
  "stoneybatter-cuts": "stoney",
  "dublin-barber-collective": "barber",
  "dundrum-hair-studio": "dundrum",
  "dundrum-serenity-spa": "serenity",
  "london-rose-spa": "rose",
  "berlin-studio-neun": "berlin",
  "paris-belle-vue": "paris",
  "copenhagen-havn-wellness": "havn",
  "atelier-decor-dublin": "atelier",
};

const SHORT_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(DEMO_OWNER_SHORT_BY_SLUG).map(([slug, short]) => [short, slug]),
);

function demoEmail(localPart: string): string {
  return `${localPart}@${DEMO_EMAIL_DOMAIN}`;
}

/** Role + scenario accounts (not per-slug owners). */
export const DEMO_ROLE_EMAILS = {
  orgAdmin: demoEmail("org-admin"),
  ownerConor: demoEmail("owner-conorcuts"),
  manager: demoEmail("manager"),
  staffLara: demoEmail("staff-lara"),
  staffMo: demoEmail("staff-mo"),
  desk: demoEmail("desk"),
  customer: demoEmail("customer"),
  solo: demoEmail("solo"),
  chain: demoEmail("chain"),
  uk: demoEmail("uk"),
  de: demoEmail("de"),
  medspa: demoEmail("medspa"),
  pets: demoEmail("pets"),
  physio: demoEmail("physio"),
  studioBarber: demoEmail("studio-barber"),
  soloWellness: demoEmail("solo-wellness"),
  eventDecor: demoEmail("owner-atelier"),
} as const;

export function demoOwnerShortForSlug(slug: string): string {
  return DEMO_OWNER_SHORT_BY_SLUG[slug] ?? slug.replace(/-/g, "").slice(0, 24);
}

export function demoOwnerEmailForSlug(slug: string): string {
  return demoEmail(`owner-${demoOwnerShortForSlug(slug)}`);
}

export type DemoTenantRole = "owner" | "manager" | "desk" | "staff";

export function demoRoleEmailForSlug(slug: string, role: DemoTenantRole): string {
  const short = demoOwnerShortForSlug(slug);
  return demoEmail(`${role}-${short}`);
}

/**
 * Shared Clerk users for per-tenant roster emails (manager-bloom, staff-harbour, …).
 * UI/catalog still show per-shop addresses; sign-in provisions one global user per role
 * and wires membership on the target business — avoids Clerk dev 100-user quota.
 */
export function sharedClerkPoolEmailForTenantRole(
  slug: string,
  role: DemoTenantRole,
): string | null {
  if (role === "owner") return null;
  if (role === "manager") return DEMO_ROLE_EMAILS.manager;
  if (role === "desk") return DEMO_ROLE_EMAILS.desk;
  if (role === "staff") {
    let hash = 0;
    for (const ch of slug) hash = (hash + ch.charCodeAt(0)) | 0;
    return Math.abs(hash) % 2 === 0 ? DEMO_ROLE_EMAILS.staffLara : DEMO_ROLE_EMAILS.staffMo;
  }
  return null;
}

/**
 * Per-shop owner login (`owner-bloom@…`, legacy `demo-owner-{slug}@…`).
 * Used when pruning Clerk — keep these; delete other synthetic demo users.
 */
export function isDemoShopOwnerEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const lower = email.trim().toLowerCase();
  const fromOwner = slugFromOwnerDemoEmail(lower);
  if (fromOwner && DEMO_OWNER_SHORT_BY_SLUG[fromOwner]) return true;
  const parsed = parseDemoTenantEmail(lower);
  return Boolean(parsed?.role === "owner" && parsed.slug && DEMO_OWNER_SHORT_BY_SLUG[parsed.slug]);
}

/** Clerk API email for a roster def — pooled for non-owner tenant roles. */
export function clerkProvisionEmailForTenantDef(email: string): string {
  const parsed = parseDemoTenantEmail(email);
  if (!parsed || parsed.role === "owner") return email.trim().toLowerCase();
  return sharedClerkPoolEmailForTenantRole(parsed.slug, parsed.role) ?? email.trim().toLowerCase();
}

const TENANT_ROLE_RE =
  /^(owner|manager|desk|staff)-([a-z0-9]+)@(demo\.livia-hq\.com|livia\.io)$/;

/** Parse per-tenant demo email → business slug + role. */
export function parseDemoTenantEmail(
  email: string,
): { slug: string; role: DemoTenantRole } | null {
  const lower = email.trim().toLowerCase();
  const m = lower.match(TENANT_ROLE_RE);
  if (!m?.[1] || !m[2]) {
    const ownerSlug = slugFromOwnerDemoEmail(lower);
    return ownerSlug ? { slug: ownerSlug, role: "owner" } : null;
  }
  const role = m[1] as DemoTenantRole;
  const slug = SHORT_TO_SLUG[m[2]];
  if (!slug) return null;
  return { slug, role };
}

const OWNER_DEMO_RE = /^owner-([a-z0-9]+)@(demo\.livia-hq\.com|livia\.io)$/;
const LEGACY_OWNER_DEMO_RE = /^demo-owner-([a-z0-9-]+)@(demo\.livia-hq\.com|livia\.io)$/;

/** Resolve owner demo email → business slug. */
export function slugFromOwnerDemoEmail(email: string): string | null {
  const lower = email.trim().toLowerCase();
  const legacy = lower.match(LEGACY_OWNER_DEMO_RE);
  if (legacy?.[1]) return legacy[1];

  const modern = lower.match(OWNER_DEMO_RE);
  if (!modern?.[1]) return null;
  return SHORT_TO_SLUG[modern[1]] ?? null;
}

/** Demo persona inbox (synthetic tenants only — not workforce). */
export function isDemoLiviaEmail(email: string | null | undefined): boolean {
  if (!isDemoEmailDomain(email)) return false;
  const lower = (email ?? "").trim().toLowerCase();
  const local = lower.split("@")[0] ?? "";
  if (local.startsWith("demo-")) return true;
  if (local.startsWith("owner-")) return true;
  if (/^(manager|desk|staff)-/.test(local)) return true;
  if (Object.values(DEMO_ROLE_EMAILS).some((e) => e.toLowerCase() === lower)) return true;
  // Legacy @livia.io role emails from docs before domain migration
  if (lower.endsWith(`@${LEGACY_DEMO_EMAIL_DOMAIN}`)) {
    if (local.startsWith("demo-") || local.startsWith("owner-")) return true;
  }
  return false;
}

/** Expand a business slug typed on sign-in (e.g. `conors-cut-co`). */
export function demoOwnerEmailFromSlugInput(input: string): string | null {
  const slug = input.trim().toLowerCase();
  if (!slug || slug.includes("@")) return null;
  if (!/^[a-z0-9-]{3,}$/.test(slug)) return null;
  if (DEMO_OWNER_SHORT_BY_SLUG[slug]) return demoOwnerEmailForSlug(slug);
  return null;
}
