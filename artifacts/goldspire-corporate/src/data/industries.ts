export type Industry = {
  id: string;
  name: string;
  headline: string;
  detail: string;
  examples: string[];
};

export const INDUSTRIES: Industry[] = [
  {
    id: "fintech",
    name: "Fintech",
    headline: "Financial infrastructure for the next billion users",
    detail:
      "We build rails for payments, subscriptions, savings, and credit — designed for markets where legacy banking left gaps.",
    examples: ["Mulah", "TrustBase verification for financial onboarding"],
  },
  {
    id: "ai",
    name: "AI",
    headline: "Intelligent systems with human-grade restraint",
    detail:
      "Ambient assistants, operational copilots, and agent infrastructure — always with clear boundaries and tenant control.",
    examples: ["S.I.M.I.", "Livia Liv intelligence layer"],
  },
  {
    id: "commerce",
    name: "Commerce",
    headline: "Platforms where transactions meet trust",
    detail:
      "Marketplaces, booking engines, and service commerce — built for repeat relationships, not one-off transactions.",
    examples: ["Livia guest booking", "TrustBase merchant signals"],
  },
  {
    id: "mobility",
    name: "Mobility",
    headline: "How people and goods move through the world",
    detail:
      "Routing, flow, and operator intelligence for cities and networks under increasing pressure.",
    examples: ["MOVE"],
  },
  {
    id: "identity",
    name: "Identity",
    headline: "Digital trust as composable infrastructure",
    detail:
      "Verification, reputation, and credential layers that work across borders and platforms.",
    examples: ["TrustBase", "Japa compliance pathways"],
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    headline: "Foundational systems others build on",
    detail:
      "Relocation stacks, data layers, and operational backbones — the unglamorous work that enables scale.",
    examples: ["Japa", "TrustBase APIs"],
  },
  {
    id: "saas",
    name: "SaaS",
    headline: "Vertical software that respects the work",
    detail:
      "Category-defining operating systems for industries that deserve better than generic tooling.",
    examples: ["Livia People Business OS"],
  },
];

export const VISION_2035_AREAS = [
  { title: "Digital Trust", desc: "Portable reputation across economies" },
  { title: "Financial Infrastructure", desc: "Inclusive rails for savings and commerce" },
  { title: "Commerce Platforms", desc: "Service-led economies at global scale" },
  { title: "Intelligent Agents", desc: "Ambient AI with enterprise-grade control" },
  { title: "Smart Mobility", desc: "Adaptive urban movement systems" },
  { title: "Emerging Technologies", desc: "Early bets on what comes next" },
] as const;
