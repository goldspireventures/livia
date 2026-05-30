/**
 * Livia platform evolution — northstar / now / v3 actual screens
 * Gallery: /experience/livia-evolution (dev only)
 * @see docs/design/LIVIA-EVOLUTION-SCREENS.md
 */

export type EvolutionTier = "northstar" | "now" | "v3";
export type EvolutionPlatform = "web" | "mobile";

export interface EvolutionScreen {
  id: string;
  name: string;
  tagline: string;
  docRef: string;
  platform: EvolutionPlatform;
  /** Filename under /livia-evolution/{tier}/ */
  imageFile: string;
  lockedRef?: string;
}

export const EVOLUTION_TIERS: {
  id: EvolutionTier;
  label: string;
  horizon: string;
  description: string;
}[] = [
  {
    id: "northstar",
    label: "North star",
    horizon: "Ultimate coherent Livia",
    description:
      "Best ultimate product — aurora editorial, Liv everywhere, guest surfaces rich, mobile flagship. Aspirational but buildable on policy/API foundations.",
  },
  {
    id: "now",
    label: "Now → north star",
    horizon: "R1 · ~8–12 weeks",
    description:
      "What we ship next on locked tracks F+G+D — honest density, Platform Default chrome, guest proof v1, wedge story live.",
  },
  {
    id: "v3",
    label: "Livia v3",
    horizon: "R3 · ~12–18 months",
    description:
      "Platform coherence release — presets polished, mobile ~95% parity, internal ops + support unified, programmatic lifecycle verified E2E.",
  },
];

export const EVOLUTION_SCREENS: EvolutionScreen[] = [
  // Marketing
  {
    id: "m1-home",
    name: "Marketing home",
    tagline: "One thread story — company & category",
    docRef: "M1-R2",
    platform: "web",
    imageFile: "m1-home-web.png",
    lockedRef: "M1-R2 locked",
  },
  {
    id: "g1-wedge",
    name: "Demo wedge grid",
    tagline: "Pick trade → story interstitial",
    docRef: "G1-A",
    platform: "web",
    imageFile: "g1-wedge-web.png",
    lockedRef: "G1 locked",
  },
  {
    id: "g1-wedge-mobile",
    name: "Demo wedge (mobile)",
    tagline: "Full-bleed trade picker",
    docRef: "G1-A",
    platform: "mobile",
    imageFile: "g1-wedge-mobile.png",
    lockedRef: "G1 locked",
  },
  // Tenant
  {
    id: "tenant-inbox",
    name: "Dashboard inbox",
    tagline: "Liv triage · thick Livia work",
    docRef: "W4",
    platform: "web",
    imageFile: "tenant-inbox-web.png",
  },
  {
    id: "tenant-inbox-mobile",
    name: "Inbox (mobile)",
    tagline: "Staff approvals + Liv chips",
    docRef: "W4",
    platform: "mobile",
    imageFile: "tenant-inbox-mobile.png",
  },
  {
    id: "tenant-today",
    name: "Staff Today",
    tagline: "Ritual home · next up · week glance",
    docRef: "W4 mobile",
    platform: "mobile",
    imageFile: "tenant-today-mobile.png",
  },
  {
    id: "tenant-proofs",
    name: "Design proofs desk",
    tagline: "Body-art collab → guest link",
    docRef: "W4 + G1",
    platform: "web",
    imageFile: "tenant-proofs-web.png",
  },
  // Guest P7
  {
    id: "guest-proof",
    name: "Guest design proof",
    tagline: "Token page · approve · comment",
    docRef: "Track G",
    platform: "mobile",
    imageFile: "guest-proof-mobile.png",
  },
  {
    id: "public-book",
    name: "Public book `/b`",
    tagline: "Vertical skin · Liv chat entry",
    docRef: "W5",
    platform: "mobile",
    imageFile: "public-book-mobile.png",
  },
  // Internal
  {
    id: "i4-thread",
    name: "Support — The Thread",
    tagline: "Queue · conversation · tenant context",
    docRef: "I4-A locked",
    platform: "web",
    imageFile: "i4-thread-web.png",
    lockedRef: "I4-A locked",
  },
  {
    id: "i2-shiplane",
    name: "Exec — Ship Lane",
    tagline: "Collapsed summary → expanded detail",
    docRef: "I2 locked",
    platform: "web",
    imageFile: "i2-shiplane-web.png",
    lockedRef: "I2 locked",
  },
];

export function evolutionImagePath(tier: EvolutionTier, file: string): string {
  return `/livia-evolution/${tier}/${file}`;
}

export function screensForTier(tier: EvolutionTier): EvolutionScreen[] {
  return EVOLUTION_SCREENS;
}

export function screensForPlatform(platform: EvolutionPlatform): EvolutionScreen[] {
  return EVOLUTION_SCREENS.filter((s) => s.platform === platform);
}
