/**
 * Operator shape → tailored home, onboarding, and Liv emphasis.
 * Solo operators wear every hat — surfaces should feel like Liv is on the team.
 */
import type { BusinessVertical } from "./types";
import {
  getSubverticalProfile,
  defaultSubverticalProfile,
  type SubverticalProfile,
} from "./subvertical-profiles";
import {
  operatorNeedsWorkforceNav,
  type OperatorNavSignals,
} from "./operator-nav-policy";
import { resolveVerticalKey } from "./vocabulary";
import { businessVocabulary } from "./vocabulary";

export type OperatorQuickAction = {
  id: string;
  label: string;
  href: string;
  mobileRoute?: string;
};

export type OperatorFirstRunStep = {
  step: number;
  label: string;
  body: string;
  href: string;
  mobileRoute?: string;
};

export type OperatorExperiencePack = {
  soloMode: boolean;
  /** Pitch + quick-action strip on Today — off for consult-first verticals where briefing is enough. */
  showSoloCopilotCard: boolean;
  segmentLabel: string | null;
  livPitch: string;
  livSubline: string;
  homeWelcomeLine: string;
  quickActions: OperatorQuickAction[];
  firstRunSteps: OperatorFirstRunStep[];
  livOpsStarters: string[];
};

export function isSoloOperator(signals: OperatorNavSignals): boolean {
  return !operatorNeedsWorkforceNav(signals);
}

const SUBVERTICAL_SOLO_PITCH: Partial<Record<string, { pitch: string; subline: string }>> = {
  "beauty.lash": {
    pitch: "Liv tracks fill cycles, deposits, and inbox while you're mid-lash.",
    subline: "You hold the lamp — Liv holds the diary and the yes/no queue.",
  },
  "beauty.nail": {
    pitch: "Liv minds walk-ins, BIAB gaps, and rebooks while your hands are busy.",
    subline: "One chair, full salon brain — deposits and reminders included.",
  },
  "beauty.brow": {
    pitch: "Liv handles DMs, patch tests, and the waitlist between brow clients.",
    subline: "Solo brow bar — Liv is your reception and your follow-up.",
  },
  "beauty.mobile": {
    pitch: "On the road — Liv holds inbox, travel buffers, and deposits between stops.",
    subline: "Your van is the studio; Liv is the desk you don't carry.",
  },
  "hair.mobile": {
    pitch: "Between homes — Liv confirms slots, collects deposits, and chases rebooks.",
    subline: "Mobile stylist mode: one calendar, zero admin between clients.",
  },
  "hair.barber": {
    pitch: "Liv runs the queue, walk-ins, and rebook nudges while you cut.",
    subline: "Even solo — Liv keeps the chair full without a second person on the floor.",
  },
  "wellness.massage": {
    pitch: "Liv minds room turnover, session packs, and guest prep notes.",
    subline: "You hold the room — Liv holds intake, deposits, and the diary.",
  },
  "wellness.float": {
    pitch: "Tank sessions need quiet — Liv handles booking rules and guest comms.",
    subline: "Solo float centre: Liv is front desk without breaking the calm.",
  },
  "wellness.holistic": {
    pitch: "Liv remembers preferences, consent, and follow-ups between sessions.",
    subline: "Holistic practice — Liv wears admin so you stay present.",
  },
  "body_art.flash": {
    pitch: "Flash days move fast — Liv queues walk-ins and collects deposits.",
    subline: "Solo flash: numbered flow without a second pair of hands.",
  },
  "fitness.pt": {
    pitch: "Liv runs pack credits, waitlists, and rebook nudges between sessions.",
    subline: "1:1 studio — Liv is your ops while you coach.",
  },
  "pet.mobile": {
    pitch: "Van route days — Liv buffers drive time and confirms every stop.",
    subline: "Mobile groomer: Liv is dispatch and inbox in one.",
  },
  "auto.mobile": {
    pitch: "Pickup windows and bay gaps — Liv keeps the route honest.",
    subline: "Mobile detail: Liv handles comms while you're on the job.",
  },
};

const VERTICAL_SOLO_PITCH: Partial<Record<BusinessVertical, { pitch: string; subline: string }>> = {
  hair: {
    pitch: "Liv confirms colour blocks, chases deposits, and answers inbox while you work.",
    subline: "Solo chair — Liv is reception, reminders, and rebooks in one.",
  },
  beauty: {
    pitch: "Liv handles DMs, deposits, and the yes/no queue while you're mid-treatment.",
    subline: "One room — Liv wears front desk and follow-up.",
  },
  wellness: {
    pitch: "Liv minds the diary, session packs, and guest prep — you hold the room.",
    subline: "Solo wellness — calm floor, active ops behind the scenes.",
  },
  "body-art": {
    pitch: "Liv runs consult → proof → session handoffs and deposit rules.",
    subline: "Solo studio — Liv keeps the pipeline moving without a coordinator.",
  },
  medspa: {
    pitch: "Liv tracks consults, consent, and course treatments between visits.",
    subline: "Clinical solo — Liv handles intake noise so you focus on outcomes.",
  },
  "allied-health": {
    pitch: "Liv nudges plan follow-ups and fills gaps between appointments.",
    subline: "Solo practice — Liv is your admin and recall system.",
  },
  fitness: {
    pitch: "Liv manages pack credits, waitlists, and session reminders.",
    subline: "Boutique solo — Liv keeps the floor full.",
  },
  "pet-grooming": {
    pitch: "Liv confirms sizes, deposits, and route order for every pet.",
    subline: "Solo groom — Liv is booking desk and follow-up.",
  },
  "automotive-detailing": {
    pitch: "Liv buffers bay time, pickup windows, and customer updates.",
    subline: "Solo detail — Liv runs comms while you work the paint.",
  },
  "event-vendors": {
    pitch: "Liv drafts quotes from your catalogue and nudges stale enquiries.",
    subline: "Solo decor — one link from IG, organised pipeline to booked.",
  },
};

function resolveSoloCopy(
  vertical: BusinessVertical,
  profile: SubverticalProfile,
): { pitch: string; subline: string } {
  const sub = SUBVERTICAL_SOLO_PITCH[profile.id];
  if (sub) return sub;
  const vert = VERTICAL_SOLO_PITCH[vertical];
  if (vert) return vert;
  const vocab = businessVocabulary(vertical);
  return {
    pitch: `Liv runs inbox, deposits, and your ${vocab.serviceNoun.toLowerCase()} diary — you run the floor.`,
    subline: `Solo ${vocab.locationNoun.toLowerCase()} — Liv wears the hats you don't have staff for yet.`,
  };
}

function soloQuickActions(vertical: BusinessVertical): OperatorQuickAction[] {
  const base: OperatorQuickAction[] = [
    { id: "new-booking", label: "New booking", href: "/bookings?create=1", mobileRoute: "/bookings" },
    { id: "inbox", label: "Review inbox", href: "/inbox", mobileRoute: "/inbox" },
    { id: "share-book", label: "Share book page", href: "/settings?tab=public", mobileRoute: "/settings" },
    { id: "ask-liv", label: "Ask Liv", href: "/my-livia", mobileRoute: "/my-livia" },
  ];
  if (vertical === "wellness") {
    return [
      { id: "rooms", label: "Room board", href: "/wellness/reception", mobileRoute: "/bookings" },
      ...base,
    ];
  }
  if (vertical === "fitness") {
    return [
      { id: "packages", label: "Session packs", href: "/day-packages", mobileRoute: "/bookings" },
      ...base,
    ];
  }
  if (vertical === "event-vendors") {
    return [
      { id: "enquiries", label: "Open inbox", href: "/inbox", mobileRoute: "/inbox" },
      { id: "quotes", label: "Draft quote", href: "/quotes", mobileRoute: "/quotes" },
      { id: "share-website", label: "Share website", href: "/event-site", mobileRoute: "/event-site" },
      { id: "ask-liv", label: "Ask Liv", href: "/my-livia", mobileRoute: "/my-livia" },
    ];
  }
  return base;
}

function soloFirstRunSteps(vertical: BusinessVertical): OperatorFirstRunStep[] {
  if (vertical === "event-vendors") {
    return [
      {
        step: 1,
        label: "Build your catalogue",
        body: "Add decor items with starting prices — quotes pull line items from here.",
        href: "/services",
        mobileRoute: "/services",
      },
      {
        step: 2,
        label: "Polish your website",
        body: "Gallery, hero copy, and deposit rules — what clients see before they enquire.",
        href: "/event-site",
        mobileRoute: "/event-site",
      },
      {
        step: 3,
        label: "Share your enquire link",
        body: "Drop the link in your Instagram bio — enquiries land in one inbox.",
        href: "/settings?tab=shop",
        mobileRoute: "/settings",
      },
      {
        step: 4,
        label: "Send your first quote",
        body: "Generate from an enquiry, tweak the invoice, send by email or WhatsApp.",
        href: "/inbox",
        mobileRoute: "/inbox",
      },
    ];
  }
  const vocab = businessVocabulary(vertical);
  return [
    {
      step: 1,
      label: `Build your ${vocab.serviceNoun.toLowerCase()} menu`,
      body: `Add what you offer and how long it takes — Liv uses this for every booking rule.`,
      href: "/services",
      mobileRoute: "/services",
    },
    {
      step: 2,
      label: "Set when you're open",
      body: "Your hours power online booking, Liv's answers, and what shows as available.",
      href: "/onboarding",
      mobileRoute: "/settings",
    },
    {
      step: 3,
      label: "Connect Liv & your book page",
      body: "Turn on Liv for inbox and share your branded book link — customers book you, not a marketplace.",
      href: "/settings?tab=liv",
      mobileRoute: "/settings",
    },
    {
      step: 4,
      label: "Take your first booking",
      body: "Test with a manual booking or share your link — Liv handles inbox from there.",
      href: "/bookings?create=1",
      mobileRoute: "/bookings",
    },
  ];
}

function teamFirstRunSteps(): OperatorFirstRunStep[] {
  return [
    {
      step: 1,
      label: "Add your team & services",
      body: "Livia needs to know who works there and what they do.",
      href: "/staff",
      mobileRoute: "/staff",
    },
    {
      step: 2,
      label: "Set your booking page",
      body: "Share your book page on socials — customers book on your brand, not a marketplace.",
      href: "/settings?tab=public",
      mobileRoute: "/settings",
    },
    {
      step: 3,
      label: "Take your first booking",
      body: "Manually or share your public link with customers.",
      href: "/bookings?create=1",
      mobileRoute: "/bookings",
    },
  ];
}

function livOpsStartersForProfile(profile: SubverticalProfile, vertical: BusinessVertical): string[] {
  const byId: Partial<Record<string, string[]>> = {
    "beauty.lash": [
      "Which clients are due for a fill this week?",
      "Draft a deposit reminder for pending lash bookings",
    ],
    "beauty.nail": [
      "Any BIAB gaps I should fill today?",
      "Summarise pending nail bookings",
    ],
    "wellness.massage": [
      "Room turnover gaps for today?",
      "Guests with session packs running low",
    ],
    "fitness.pt": [
      "Who has pack credits expiring soon?",
      "Best slot to offer a waitlisted client",
    ],
    "hair.barber": [
      "Walk-in queue vs booked chair time today?",
      "Clients overdue for a rebook",
    ],
    "body_art.custom": [
      "Consults waiting on deposit?",
      "Sessions needing proof approval",
    ],
    "event-vendors.default": [
      "Which enquiries need a quote today?",
      "Draft a follow-up for quotes sent 5+ days ago",
    ],
  };
  const specific = byId[profile.id];
  if (specific) return specific;
  const vocab = businessVocabulary(vertical);
  return [
    `What should I focus on before my first ${vocab.clientNoun.toLowerCase()}?`,
    "Is my book page ready to share?",
    "Summarise what's waiting on me today",
  ];
}

export function resolveOperatorExperience(args: {
  signals: OperatorNavSignals;
  vertical?: string | null;
  category?: string | null;
  subverticalProfileId?: string | null;
  businessName?: string | null;
}): OperatorExperiencePack {
  const key = resolveVerticalKey(args.vertical, args.category);
  const soloMode = isSoloOperator(args.signals);
  const profile =
    (args.subverticalProfileId
      ? getSubverticalProfile(args.subverticalProfileId)
      : null) ?? defaultSubverticalProfile(key);

  const segmentLabel = profile.id.endsWith(".default") ? null : profile.label;

  if (!soloMode) {
    return {
      soloMode: false,
      showSoloCopilotCard: false,
      segmentLabel,
      livPitch: "",
      livSubline: "",
      homeWelcomeLine: args.businessName?.trim()
        ? `Today at ${args.businessName.trim()}`
        : "Your team command center",
      quickActions: [],
      firstRunSteps: teamFirstRunSteps(),
      livOpsStarters: [],
    };
  }

  const { pitch, subline } = resolveSoloCopy(key, profile);
  const name = args.businessName?.trim();
  return {
    soloMode: true,
    showSoloCopilotCard: key !== "event-vendors",
    segmentLabel,
    livPitch: pitch,
    livSubline: subline,
    homeWelcomeLine: name
      ? `${segmentLabel ?? "Solo"} · ${name}`
      : `Solo ${segmentLabel ?? "studio"}`,
    quickActions: soloQuickActions(key),
    firstRunSteps: soloFirstRunSteps(key),
    livOpsStarters: livOpsStartersForProfile(profile, key),
  };
}

/** Quiet-day CTA when solo — nudge Liv setup before calendar noise. */
export function resolveSoloOwnerHomeFallback(
  operator: OperatorNavSignals,
  signals: {
    pendingCount: number;
    handedOffCount: number;
    todayBookings: number;
    weekBookings: number;
  },
): { href: string; label: string } | null {
  if (!isSoloOperator(operator)) return null;
  const busy =
    signals.pendingCount > 0 ||
    signals.handedOffCount > 0 ||
    signals.todayBookings > 0 ||
    signals.weekBookings > 0;
  if (busy) return null;
  return { href: "/my-livia", label: "Tune Liv for your studio" };
}
