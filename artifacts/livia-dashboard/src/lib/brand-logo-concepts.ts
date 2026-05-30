/**
 * Livia Inc logo — current + concept explorations (dev gallery)
 * @see docs/design/BRAND-LOGO-CONCEPTS.md
 */

export type LogoConceptStatus = "shipped" | "concept";

export interface LogoConcept {
  id: string;
  name: string;
  tagline: string;
  status: LogoConceptStatus;
  /** Optional PNG in /brand-logos/ for static preview */
  imageFile?: string;
}

export const LOGO_CONCEPTS: LogoConcept[] = [
  {
    id: "current-aurum",
    name: "Current — Aurum Lv roundel",
    tagline: "Shipped today · Cormorant + champagne italic v in soft ring",
    status: "shipped",
    imageFile: "logo-current-aurum-roundel.png",
  },
  {
    id: "thread-l",
    name: "Concept 1 — Thread L",
    tagline: "Aurora cyan thread loops into L — M1 continuity metaphor",
    status: "concept",
    imageFile: "logo-concept-01-thread-l.png",
  },
  {
    id: "open-arc",
    name: "Concept 2 — Open arc",
    tagline: "Unclosed arc L→v — ongoing relationship, not sealed badge",
    status: "concept",
    imageFile: "logo-concept-02-open-arc.png",
  },
  {
    id: "signal-dot",
    name: "Concept 3 — Signal dot",
    tagline: "Aurora pulse dot + wordmark · crisp at 16px favicon",
    status: "concept",
    imageFile: "logo-concept-03-signal-dot.png",
  },
  {
    id: "lv-ligature",
    name: "Concept 4 — L–v ligature",
    tagline: "Typographic ligature · shared stem, champagne joint",
    status: "concept",
    imageFile: "logo-concept-04-lv-ligature.png",
  },
  {
    id: "steward",
    name: "Concept 5 — Steward mark",
    tagline: "Livia block + Liv whisper — company stewards agent",
    status: "concept",
    imageFile: "logo-concept-05-steward.png",
  },
];
