/**
 * Short @livia.io demo addresses — shared by API, mobile, and docs.
 * Password: LIVIA_DEMO_PASSWORD (default LiviaDemo2026!)
 */

export const DEMO_PASSWORD_HINT = "LiviaDemo2026!";

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
};

const SHORT_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(DEMO_OWNER_SHORT_BY_SLUG).map(([slug, short]) => [short, slug]),
);

/** Role + scenario accounts (not per-slug owners). */
export const DEMO_ROLE_EMAILS = {
  orgAdmin: "org-admin@livia.io",
  ownerConor: "owner-conorcuts@livia.io",
  manager: "manager@livia.io",
  staffLara: "staff-lara@livia.io",
  staffMo: "staff-mo@livia.io",
  desk: "desk@livia.io",
  customer: "customer@livia.io",
  solo: "solo@livia.io",
  chain: "chain@livia.io",
  uk: "uk@livia.io",
  de: "de@livia.io",
  medspa: "medspa@livia.io",
  pets: "pets@livia.io",
  physio: "physio@livia.io",
} as const;

export function demoOwnerShortForSlug(slug: string): string {
  return DEMO_OWNER_SHORT_BY_SLUG[slug] ?? slug.replace(/-/g, "").slice(0, 24);
}

export function demoOwnerEmailForSlug(slug: string): string {
  return `owner-${demoOwnerShortForSlug(slug)}@livia.io`;
}

/** Resolve `owner-conorcuts@livia.io` or legacy `demo-owner-conors-cut-co@livia.io` → slug. */
export function slugFromOwnerDemoEmail(email: string): string | null {
  const lower = email.trim().toLowerCase();
  const legacy = lower.match(/^demo-owner-([a-z0-9-]+)@livia\.io$/);
  if (legacy?.[1]) return legacy[1];

  const modern = lower.match(/^owner-([a-z0-9]+)@livia\.io$/);
  if (!modern?.[1]) return null;
  return SHORT_TO_SLUG[modern[1]] ?? null;
}

export function isDemoLiviaEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  if (!lower.endsWith("@livia.io")) return false;
  const local = lower.split("@")[0] ?? "";
  if (local.startsWith("demo-")) return true;
  if (local.startsWith("owner-")) return true;
  if (Object.values(DEMO_ROLE_EMAILS).some((e) => e.toLowerCase() === lower)) return true;
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
