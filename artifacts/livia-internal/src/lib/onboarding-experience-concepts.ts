export type ConceptId =
  | "cold-open"
  | "chapter-spine"
  | "liv-rehearsal"
  | "split-screen"
  | "go-live-beat"
  | "stuck-video"
  | "liv-continuity"
  | "act-loops"
  | "timeline-fill";

export interface OnboardingConcept {
  id: ConceptId;
  name: string;
  tagline: string;
  acts: string[];
  impact: number;
  effort: number;
  lift: "Sprint" | "Phase" | "Ongoing";
  surfaces: string[];
  payoff: string;
}

export const ONBOARDING_CONCEPTS: OnboardingConcept[] = [
  {
    id: "cold-open",
    name: "Cold open film",
    tagline: "Emotion before forms",
    acts: ["Pre-wizard"],
    impact: 9,
    effort: 6,
    lift: "Sprint",
    surfaces: ["Web onboarding", "Marketing"],
    payoff: "Owner feels the product before typing shop name.",
  },
  {
    id: "chapter-spine",
    name: "Chapter filmstrip",
    tagline: "Journey, not checklist",
    acts: ["A1–A12 shell"],
    impact: 8,
    effort: 5,
    lift: "Sprint",
    surfaces: ["Web wizard"],
    payoff: "Progress reads like chapters; current act glows, done acts shrink.",
  },
  {
    id: "liv-rehearsal",
    name: "A6 Liv rehearsal",
    tagline: "Liv breathes before connect",
    acts: ["A6 Meet Liv"],
    impact: 9,
    effort: 4,
    lift: "Sprint",
    surfaces: ["Web A6", "Mobile pulse"],
    payoff: "Type real greeting → see Liv reply in phone mock with typing pulse.",
  },
  {
    id: "split-screen",
    name: "A8 split-screen",
    tagline: "It's real — live",
    acts: ["A8 Public link"],
    impact: 10,
    effort: 5,
    lift: "Sprint",
    surfaces: ["Web A8 + /b preview"],
    payoff: "Edit slug left; incognito booking page crossfades right.",
  },
  {
    id: "go-live-beat",
    name: "A12 success beat",
    tagline: "One celebration, then reveal",
    acts: ["A12 Go-live"],
    impact: 8,
    effort: 3,
    lift: "Sprint",
    surfaces: ["Web", "celebrate.ts"],
    payoff: "Champagne shimmer + chime → cockpit cards stagger in (no hard redirect).",
  },
  {
    id: "stuck-video",
    name: "Stuck-user clip",
    tagline: "Personal nudge, not generic email",
    acts: ["48h cron"],
    impact: 7,
    effort: 4,
    lift: "Phase",
    surfaces: ["Email + optional in-app"],
    payoff: "9:16 video names their shop + next unfinished act.",
  },
  {
    id: "liv-continuity",
    name: "Liv continuity",
    tagline: "Same colleague everywhere",
    acts: ["All surfaces"],
    impact: 8,
    effort: 6,
    lift: "Ongoing",
    surfaces: ["Marketing → sign-in → A6 → inbox"],
    payoff: "One avatar/pulse language; never a different AI widget.",
  },
  {
    id: "act-loops",
    name: "Micro-films per act",
    tagline: "3–8s loops, replayable",
    acts: ["A3, A5, A7, A9…"],
    impact: 7,
    effort: 7,
    lift: "Phase",
    surfaces: ["Wizard + Settings"],
    payoff: "Each painful step has a tiny film; reduced-motion gets poster frame.",
  },
  {
    id: "timeline-fill",
    name: "Cockpit fills up",
    tagline: "Empty spine animates as you complete acts",
    acts: ["Post-act → Dashboard"],
    impact: 8,
    effort: 5,
    lift: "Phase",
    surfaces: ["Cockpit timeline"],
    payoff: "Dashboard feels like it's waking up with you, not waiting empty.",
  },
];

export const JOURNEY_ACTS = [
  "A1",
  "A2",
  "A3",
  "A4",
  "A5",
  "A6",
  "A7",
  "A8",
  "A9",
  "A10",
  "A11",
  "A12",
] as const;

export function actHitsConcept(actLabel: string, concept: OnboardingConcept): boolean {
  if (concept.acts.some((a) => a.includes("A1–A12") || a.includes("All"))) {
    if (actLabel === "A1" && concept.id === "chapter-spine") return true;
    if (concept.acts.some((a) => a.startsWith("A1–"))) return true;
  }
  return concept.acts.some(
    (a) => a === actLabel || a.startsWith(`${actLabel} `) || a.includes(actLabel),
  );
}
