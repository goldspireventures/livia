/**
 * Vertical announcement — how a pack declares itself to the platform.
 *
 * The platform owns **default vertical attributes** (shared keys every pack must satisfy).
 * Each vertical ships an **announcement package**: defaults + optional extensions.
 * `welcomeVerticalAnnouncement()` merges and returns what surfaces consume (flows down).
 *
 * Over time, new keys graduate from per-vertical extensions into platform defaults
 * (Liv / ops telemetry can propose expansions — human review before hub promotion).
 *
 * @see docs/engineering/VERTICAL-ANNOUNCEMENT.md
 */
import type { BusinessVertical } from "./types";
import { businessVerticalSchema } from "./types";
import { businessVocabulary, verticalOperationalCopy } from "./vocabulary";
import { getVerticalPlaybook } from "./vertical-playbooks";
import { getVerticalOnboardingExtras } from "./vertical-onboarding";
import { getBookingGuardsForVertical } from "./booking-guards";
import { CONTINUITY_TEMPLATES } from "./continuity-templates";
import { guestSurfacesForVertical } from "./guest-surfaces";
import { guestPublicExperience } from "./guest-public-experience";
import {
  validateVerticalPresentationPack,
  type VerticalPresentationHandshake,
} from "./presentation-surface";
import { beautyShellNavItems } from "./beauty-operator-shell";
import { wellnessShellNavItems } from "./wellness-operator-shell";
import { VERTICAL_COVERAGE_REGISTRY } from "./vertical-coverage";
import { showBookingResourcesSettings, isDashboardRouteAllowedForTenant } from "./wedge-gate";

/** Maturity — platform knows how to treat each capability without parsing vertical-specific UI. */
export type VerticalCapabilityMaturity = "platform-default" | "R1" | "R1.1" | "R2" | "R3";

export type VerticalCapability = {
  id: string;
  label: string;
  maturity: VerticalCapabilityMaturity;
  /** Routes or surface ids this capability affects. */
  surfaces?: string[];
};

/** Keys the platform expects every vertical announcement to satisfy (expandable over years). */
export const PLATFORM_DEFAULT_VERTICAL_ATTRIBUTES = [
  "pack.registered",
  "vocabulary.core",
  "playbook.linked",
  "onboarding.extras",
  "presentation.handshake",
  "continuity.template",
  "guestSurfaces.catalog",
  "bookingExperience.copy",
  "coverage.registry",
  "guest.publicExperience",
] as const;

export type PlatformDefaultVerticalAttribute =
  (typeof PLATFORM_DEFAULT_VERTICAL_ATTRIBUTES)[number];

export type RoomBoardMode = "none" | "schedule-derived" | "resource-api";

export type VerticalAnnouncementPackage = {
  vertical: BusinessVertical;
  /** Bump when announcement shape changes — surfaces may cache on version. */
  version: number;
  programDoc: string;
  handshake: VerticalPresentationHandshake;
  satisfiedDefaults: PlatformDefaultVerticalAttribute[];
  capabilities: VerticalCapability[];
  extensions: Record<string, unknown>;
};

export type WelcomedVerticalAnnouncement = {
  vertical: BusinessVertical;
  version: number;
  welcomed: boolean;
  handshakeOk: boolean;
  satisfiedDefaults: PlatformDefaultVerticalAttribute[];
  missingDefaults: PlatformDefaultVerticalAttribute[];
  capabilities: VerticalCapability[];
  readyCapabilities: VerticalCapability[];
  deferredCapabilities: VerticalCapability[];
  extensions: Record<string, unknown>;
  operatorShell: "standard" | "wellness-full-nav" | "beauty-inbox-nav";
  roomBoard: {
    mode: RoomBoardMode;
    footnote: string;
  };
  routes: {
    dayPackages: boolean;
    bookingResources: boolean;
  };
};

const PROGRAM_DOCS: Record<BusinessVertical, string> = {
  hair: "docs/product/HAIR-VERTICAL-PROGRAM.md",
  beauty: "docs/product/BEAUTY-VERTICAL-PROGRAM.md",
  "body-art": "docs/product/BODY-ART-VERTICAL-PROGRAM.md",
  wellness: "docs/product/WELLNESS-VERTICAL-PROGRAM.md",
  fitness: "docs/product/FITNESS-VERTICAL-PROGRAM.md",
  medspa: "docs/product/MEDSPA-VERTICAL-PROGRAM.md",
  "allied-health": "docs/product/ALLIED-HEALTH-VERTICAL-PROGRAM.md",
  "pet-grooming": "docs/product/PET-GROOMING-VERTICAL-PROGRAM.md",
  "automotive-detailing": "docs/product/AUTOMOTIVE-DETAILING-VERTICAL-PROGRAM.md",
  "event-vendors": "docs/product/EVENT-VENDORS-VERTICAL-PROGRAM.md",
};

const BASE_CAPABILITIES: VerticalCapability[] = [
  {
    id: "owner-today",
    label: "Owner today / briefing",
    maturity: "platform-default",
    surfaces: ["/dashboard"],
  },
  {
    id: "inbox-continuity",
    label: "Inbox + booking continuity",
    maturity: "platform-default",
    surfaces: ["/inbox", "/bookings/:id"],
  },
  {
    id: "public-storefront",
    label: "Guest storefront /b",
    maturity: "platform-default",
    surfaces: ["/b/{slug}"],
  },
  {
    id: "visit-token",
    label: "Visit token day-of",
    maturity: "platform-default",
    surfaces: ["/b/{slug}/visit/:token"],
  },
];

const BEAUTY_EXTENSIONS: VerticalCapability[] = [
  {
    id: "beauty-operator-shell",
    label: "Inbox-first shell — Treatments in studio nav",
    maturity: "R1",
    surfaces: ["w4.shell", "/services"],
  },
  {
    id: "treatment-menu-setup",
    label: "Blocking treatment menu onboarding + quick-add templates",
    maturity: "R1",
    surfaces: ["/services", "/onboarding"],
  },
  {
    id: "patch-test-guard",
    label: "Patch-test intake on /b",
    maturity: "R1",
    surfaces: ["/b/{slug}"],
  },
  {
    id: "fill-cycle-rebook",
    label: "Fill-cycle rebook SMS + per-service patch flag",
    maturity: "R1",
    surfaces: ["/customers", "/toolkit"],
  },
  {
    id: "lash-preference-profile",
    label: "Client lash/nail preference fields",
    maturity: "R2",
  },
];

const WELLNESS_EXTENSIONS: VerticalCapability[] = [
  {
    id: "wellness-operator-shell",
    label: "Rooms-first operator shell (Today · Inbox · Rooms · …)",
    maturity: "R1",
    surfaces: ["w4.shell"],
  },
  {
    id: "presentation-morph-today",
    label: "Preset morph replaces Today (atrium / rail / ledger)",
    maturity: "R1",
    surfaces: ["/dashboard"],
  },
  {
    id: "room-board-schedule",
    label: "Live room board — resources, drag assign, turnover buffer",
    maturity: "R3",
    surfaces: ["/dashboard"],
  },
  {
    id: "day-packages",
    label: "Day packages owner route",
    maturity: "R1",
    surfaces: ["/day-packages"],
  },
  {
    id: "booking-guards-intake",
    label: "Public book intake (health, therapist preference, couples/gift)",
    maturity: "R1.1",
    surfaces: ["/b/{slug}"],
  },
  {
    id: "voucher-ledger-today",
    label: "Package & session credits on evening-ledger Today",
    maturity: "R3",
    surfaces: ["/dashboard"],
  },
  {
    id: "gift-public-book",
    label: "Gift voucher purchase on /b",
    maturity: "R3",
    surfaces: ["/b/{slug}"],
  },
  {
    id: "wellness-reports",
    label: "Owner reports — heatmap, waterfall, stress score",
    maturity: "R3",
    surfaces: ["/wellness-reports"],
  },
  {
    id: "wellness-reception",
    label: "Reception desk — voucher scan",
    maturity: "R3",
    surfaces: ["/wellness-reception"],
  },
  {
    id: "guest-wallet-credits",
    label: "Session packs on My Livia",
    maturity: "R3",
    surfaces: ["/my"],
  },
  {
    id: "membership-minutes",
    label: "Membership minutes bank",
    maturity: "R2",
  },
  {
    id: "locale-quiet-hours-dk",
    label: "DK quiet-hours + locale copy pack",
    maturity: "R2",
    surfaces: ["copenhagen-havn-wellness"],
  },
];

function registryRowFor(vertical: BusinessVertical) {
  return VERTICAL_COVERAGE_REGISTRY.find((r) => r.codeVertical === vertical);
}

function collectSatisfiedDefaults(vertical: BusinessVertical): PlatformDefaultVerticalAttribute[] {
  const satisfied: PlatformDefaultVerticalAttribute[] = [];
  const vocab = businessVocabulary(vertical, null);
  if (vocab.clientNoun && vocab.serviceNoun) satisfied.push("vocabulary.core");
  if (getVerticalPlaybook(vertical)) satisfied.push("playbook.linked");
  if (getVerticalOnboardingExtras(vertical)) satisfied.push("onboarding.extras");
  if (CONTINUITY_TEMPLATES[vertical]) satisfied.push("continuity.template");
  if (guestSurfacesForVertical(vertical).length > 0) satisfied.push("guestSurfaces.catalog");
  if (verticalOperationalCopy(vertical, null)) satisfied.push("bookingExperience.copy");
  if (registryRowFor(vertical)) satisfied.push("coverage.registry");
  if (guestPublicExperience(vertical, null).heroTitle) satisfied.push("guest.publicExperience");
  satisfied.push("pack.registered");
  const handshake = validateVerticalPresentationPack(vertical);
  if (handshake.ok) satisfied.push("presentation.handshake");
  return satisfied;
}

/** Build the announcement package a vertical publishes to the platform hub. */
export function buildVerticalAnnouncementPackage(
  vertical: BusinessVertical,
): VerticalAnnouncementPackage {
  const handshake = validateVerticalPresentationPack(vertical);
  const satisfiedDefaults = collectSatisfiedDefaults(vertical);
  const capabilities = [...BASE_CAPABILITIES];
  const extensions: Record<string, unknown> = {};

  if (vertical === "beauty") {
    capabilities.push(...BEAUTY_EXTENSIONS);
    const v = businessVocabulary("beauty", null);
    const op = verticalOperationalCopy("beauty", null);
    extensions.beauty = {
      operatorNav: beautyShellNavItems(
        v.publicBookCatalogTitle === "Services" ? "Treatments" : v.serviceNoun + "s",
        op.teamPageTitle,
      ),
      inspirationDoc: "docs/product/BEAUTY-VERTICAL-INSPIRATION.md",
      excellenceDoc: "docs/product/vertical-excellence/beauty.md",
      menuSetupRequired: true,
    };
  }

  if (vertical === "wellness") {
    capabilities.push(...WELLNESS_EXTENSIONS);
    const op = verticalOperationalCopy("wellness", null);
    extensions.wellness = {
      operatorNav: wellnessShellNavItems("atrium", op.teamPageTitle, op.providerNoun),
      roomBoardMode: "resource-linked" as RoomBoardMode,
      roomBoardFootnote:
        "Drag sessions between rooms. A short turnover buffer applies after each session ends.",
      inspirationDoc: "docs/product/WELLNESS-VERTICAL-INSPIRATION.md",
    };
  }

  return {
    vertical,
    version: 1,
    programDoc: PROGRAM_DOCS[vertical],
    handshake,
    satisfiedDefaults,
    capabilities,
    extensions,
  };
}

let _packagesCache: Record<BusinessVertical, VerticalAnnouncementPackage> | null = null;

function packagesCache(): Record<BusinessVertical, VerticalAnnouncementPackage> {
  if (!_packagesCache) {
    _packagesCache = Object.fromEntries(
      businessVerticalSchema.options.map((v) => [v, buildVerticalAnnouncementPackage(v)]),
    ) as Record<BusinessVertical, VerticalAnnouncementPackage>;
  }
  return _packagesCache;
}

export function getVerticalAnnouncementPackage(
  vertical: BusinessVertical,
): VerticalAnnouncementPackage {
  return packagesCache()[vertical];
}

export type VerticalAnnouncementValidation = {
  vertical: BusinessVertical;
  ok: boolean;
  missingDefaults: PlatformDefaultVerticalAttribute[];
  handshakeErrors: string[];
};

/** Platform welcomes a vertical only when all default attributes are present. */
export function validateVerticalAnnouncement(
  vertical: BusinessVertical,
): VerticalAnnouncementValidation {
  const pack = getVerticalAnnouncementPackage(vertical);
  const missingDefaults = PLATFORM_DEFAULT_VERTICAL_ATTRIBUTES.filter(
    (k) => !pack.satisfiedDefaults.includes(k),
  );
  return {
    vertical,
    ok: missingDefaults.length === 0 && pack.handshake.ok,
    missingDefaults,
    handshakeErrors: pack.handshake.errors,
  };
}

function resolveRoomBoard(vertical: BusinessVertical, extensions: Record<string, unknown>) {
  if (vertical === "wellness") {
    const w = extensions.wellness as { roomBoardMode?: RoomBoardMode; roomBoardFootnote?: string };
    return {
      mode: (w?.roomBoardMode ?? "schedule-derived") as RoomBoardMode,
      footnote:
        w?.roomBoardFootnote ??
        "Rooms are grouped from today's sessions until room resources are linked in Settings.",
    };
  }
  return {
    mode: "none" as RoomBoardMode,
    footnote: "",
  };
}

/** Merged announcement for tenant-experience and thin surfaces — flows downward. */
export function welcomeVerticalAnnouncement(
  vertical: BusinessVertical,
): WelcomedVerticalAnnouncement {
  const pack = getVerticalAnnouncementPackage(vertical);
  const validation = validateVerticalAnnouncement(vertical);
  const ready = pack.capabilities.filter((c) => c.maturity !== "R2");
  const deferred = pack.capabilities.filter((c) => c.maturity === "R2");

  return {
    vertical,
    version: pack.version,
    welcomed: validation.ok,
    handshakeOk: pack.handshake.ok,
    satisfiedDefaults: pack.satisfiedDefaults,
    missingDefaults: validation.missingDefaults,
    capabilities: pack.capabilities,
    readyCapabilities: ready,
    deferredCapabilities: deferred,
    extensions: pack.extensions,
    operatorShell:
      vertical === "wellness"
        ? "wellness-full-nav"
        : vertical === "beauty"
          ? "beauty-inbox-nav"
          : "standard",
    roomBoard: resolveRoomBoard(vertical, pack.extensions),
    routes: {
      dayPackages: isDashboardRouteAllowedForTenant("/day-packages", vertical),
      bookingResources: showBookingResourcesSettings(vertical),
    },
  };
}
