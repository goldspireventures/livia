/**
 * Body-art design proof — ownership, publish rights, skin preview (phase 2/3).
 * Hub authority: proof desk, guest /proof, public /b gallery gate.
 */

/** Studio-authored work category — not client reference uploads. */
export type DesignProofKind = "flash" | "custom_commission" | "client_supplied";

/** Who may see the artwork beyond the approving client. */
export type DesignProofPublishRight = "private" | "portfolio_ok" | "flash_resell_ok";

export const DESIGN_PROOF_KINDS = [
  "flash",
  "custom_commission",
  "client_supplied",
] as const satisfies readonly DesignProofKind[];

export const DESIGN_PROOF_PUBLISH_RIGHTS = [
  "private",
  "portfolio_ok",
  "flash_resell_ok",
] as const satisfies readonly DesignProofPublishRight[];

export type SkinPreviewBodyZone = "forearm" | "upper_arm" | "back" | "chest";

export const SKIN_PREVIEW_BODY_ZONES = [
  "forearm",
  "upper_arm",
  "back",
  "chest",
] as const satisfies readonly SkinPreviewBodyZone[];

export type SkinPreviewTone = "light" | "medium" | "deep" | "rich";

export const SKIN_PREVIEW_TONES = [
  "light",
  "medium",
  "deep",
  "rich",
] as const satisfies readonly SkinPreviewTone[];

export const DESIGN_PROOF_KIND_LABEL: Record<DesignProofKind, string> = {
  flash: "Flash sheet",
  custom_commission: "Custom for client",
  client_supplied: "Client-supplied design",
};

export const DESIGN_PROOF_PUBLISH_LABEL: Record<DesignProofPublishRight, string> = {
  private: "Private — client & studio only",
  portfolio_ok: "Portfolio — OK on /b with client consent",
  flash_resell_ok: "Flash — repeatable on /b & walk-ins",
};

export const SKIN_PREVIEW_ZONE_LABEL: Record<SkinPreviewBodyZone, string> = {
  forearm: "Full forearm",
  upper_arm: "Full upper arm",
  back: "Full back",
  chest: "Full chest",
};

export const SKIN_PREVIEW_TONE_LABEL: Record<SkinPreviewTone, string> = {
  light: "Light",
  medium: "Medium",
  deep: "Deep",
  rich: "Rich",
};

/** Hex fills for Phase 1 template placement (illustrative silhouettes). */
export const SKIN_PREVIEW_TONE_HEX: Record<SkinPreviewTone, string> = {
  light: "#f0d4c4",
  medium: "#c9956c",
  deep: "#8d5524",
  rich: "#5c3317",
};

export const SKIN_PREVIEW_DISCLAIMER =
  "Illustrative placement only — not a guaranteed healed result. Final work is by your artist.";

export function defaultPublishRightForKind(kind: DesignProofKind): DesignProofPublishRight {
  if (kind === "flash") return "flash_resell_ok";
  if (kind === "client_supplied") return "private";
  return "private";
}

/** Publish rights the studio may select for a given proof kind. */
export function allowedPublishRightsForKind(kind: DesignProofKind): DesignProofPublishRight[] {
  switch (kind) {
    case "flash":
      return ["private", "flash_resell_ok"];
    case "client_supplied":
      return ["private"];
    case "custom_commission":
      return ["private", "portfolio_ok"];
    default:
      return ["private"];
  }
}

export function isValidPublishRightForKind(
  kind: DesignProofKind,
  right: DesignProofPublishRight,
): boolean {
  return allowedPublishRightsForKind(kind).includes(right);
}

/** Gate public /b design showcase — approved is necessary but not sufficient. */
export function canShowOnPublicGallery(publishRight: DesignProofPublishRight): boolean {
  return publishRight === "portfolio_ok" || publishRight === "flash_resell_ok";
}

export function normalizeDesignProofKind(value: unknown): DesignProofKind {
  if (
    typeof value === "string" &&
    (DESIGN_PROOF_KINDS as readonly string[]).includes(value)
  ) {
    return value as DesignProofKind;
  }
  return "custom_commission";
}

export function normalizeDesignProofPublishRight(value: unknown): DesignProofPublishRight {
  if (
    typeof value === "string" &&
    (DESIGN_PROOF_PUBLISH_RIGHTS as readonly string[]).includes(value)
  ) {
    return value as DesignProofPublishRight;
  }
  return "private";
}

export function normalizeSkinPreviewZone(value: unknown): SkinPreviewBodyZone {
  if (
    typeof value === "string" &&
    (SKIN_PREVIEW_BODY_ZONES as readonly string[]).includes(value)
  ) {
    return value as SkinPreviewBodyZone;
  }
  return "forearm";
}

export function normalizeSkinPreviewTone(value: unknown): SkinPreviewTone {
  if (
    typeof value === "string" &&
    (SKIN_PREVIEW_TONES as readonly string[]).includes(value)
  ) {
    return value as SkinPreviewTone;
  }
  return "medium";
}

/** Infer flash from note heuristics when migrating legacy rows. */
export function inferProofKindFromNote(note?: string | null): DesignProofKind {
  const n = (note ?? "").toLowerCase();
  if (/\bflash\b/.test(n)) return "flash";
  if (/\bclient.?supplied\b|\bbrought\b|\bpinterest\b/.test(n)) return "client_supplied";
  return "custom_commission";
}

export function proofDeskSubtitle(): string {
  return "Click a proof card — client remarks and studio actions appear on the right.";
}

/** Sidebar pipeline card — removed from proof desk; kept for policy tests only. */
export function proofDeskPipelineCaption(): string {
  return "Booking stages live on the calendar — proof desk focuses on artwork review.";
}

export type DesignProofRevisionView = {
  version: number;
  imageUrl: string | null;
  createdAt?: string;
};

/** Group key for one design thread (title before placement suffix). */
export function designProofThreadKey(note?: string | null): string {
  const base = stripDesignProofGuestFeedback(note)?.trim() ?? "";
  const idx = base.indexOf(" — ");
  const title = idx > 0 ? base.slice(0, idx) : base;
  return title.toLowerCase() || "studio-design";
}

export function sortDesignProofRevisionsAsc<T extends { version: number }>(revs: T[]): T[] {
  return [...revs].sort((a, b) => a.version - b.version);
}

/** Guest may approve/reject only the latest version while awaiting review. */
export function canGuestReviewDesignProof(status: string, viewingLatestVersion: boolean): boolean {
  return viewingLatestVersion && status === "pending_review";
}

/** Ship gate for on-skin preview — off in stg/prod; phase 2/3 local only via env override. */
export type SkinPreviewShipPhase = "off" | "phase2" | "phase3";

export type SkinPreviewDeploySurface = "local" | "staging" | "production" | "development";

const SKIN_PREVIEW_OVERRIDE_KEYS = [
  "LIVIA_BODY_ART_SKIN_PREVIEW",
  "VITE_LIVIA_BODY_ART_SKIN_PREVIEW",
] as const;

function readSkinPreviewOverride(env?: Record<string, string | undefined>): string | null {
  if (!env) return null;
  for (const key of SKIN_PREVIEW_OVERRIDE_KEYS) {
    const raw = env[key]?.trim().toLowerCase();
    if (raw) return raw;
  }
  return null;
}

function parseSkinPreviewOverride(raw: string): SkinPreviewShipPhase | null {
  if (raw === "off" || raw === "false" || raw === "0" || raw === "phase1" || raw === "1") return "off";
  if (raw === "phase2" || raw === "2" || raw === "true") return "phase2";
  if (raw === "phase3" || raw === "3") return "phase3";
  return null;
}

/** Resolve which skin-preview phase may render (phase 1 retired; stg/prod always off). */
export function resolveBodyArtSkinPreviewPhase(
  deploySurface: SkinPreviewDeploySurface,
  env?: Record<string, string | undefined>,
): SkinPreviewShipPhase {
  if (deploySurface === "staging" || deploySurface === "production") return "off";
  const override = readSkinPreviewOverride(env);
  if (override) {
    const parsed = parseSkinPreviewOverride(override);
    if (parsed) return parsed;
  }
  return "off";
}

export function isBodyArtSkinPreviewEnabled(
  deploySurface: SkinPreviewDeploySurface,
  env?: Record<string, string | undefined>,
): boolean {
  const phase = resolveBodyArtSkinPreviewPhase(deploySurface, env);
  return phase === "phase2" || phase === "phase3";
}

/** Phase 3 AI compositing requires studio API configuration. */
export function isBodyArtSkinPreviewAiConfigured(
  env?: Record<string, string | undefined>,
): boolean {
  const key = env?.LIVIA_BODY_ART_SKIN_AI_KEY?.trim() || env?.VITE_LIVIA_BODY_ART_SKIN_AI_KEY?.trim();
  return Boolean(key);
}

export const SKIN_PREVIEW_PHOTO_DISCLAIMER =
  "Placement preview on your photo — illustrative only, not a healed result. Final work is by your artist.";

export const SKIN_PREVIEW_AI_DISCLAIMER =
  "AI-enhanced previews are approximate. Your artist approves all final linework before the session.";

/** Default follow-up SLA — studios can override via settings (future). */
export type DesignProofFollowUpPolicy = {
  /** Days awaiting client review before nudge. */
  clientNudgeDays: number;
  /** Days awaiting client review before auto-close to draft. */
  clientCloseDays: number;
  /** Days after client requested changes before studio reminder. */
  studioRevisionNudgeDays: number;
};

export const DEFAULT_DESIGN_PROOF_FOLLOW_UP: DesignProofFollowUpPolicy = {
  clientNudgeDays: 2,
  clientCloseDays: 3,
  studioRevisionNudgeDays: 2,
};

/** Suffix appended to proof `note` when guest submits feedback on `/proof`. */
export const DESIGN_PROOF_GUEST_FEEDBACK_MARKER = "— Guest:";

export function parseDesignProofGuestFeedback(note?: string | null): string | null {
  if (!note) return null;
  const idx = note.indexOf(DESIGN_PROOF_GUEST_FEEDBACK_MARKER);
  if (idx < 0) return null;
  const feedback = note.slice(idx + DESIGN_PROOF_GUEST_FEEDBACK_MARKER.length).trim();
  return feedback || null;
}

/** Studio-facing title/placement — strips guest feedback suffix from `note`. */
export function stripDesignProofGuestFeedback(note?: string | null): string | null {
  if (!note) return null;
  const idx = note.indexOf(DESIGN_PROOF_GUEST_FEEDBACK_MARKER);
  const base = idx < 0 ? note : note.slice(0, idx);
  const trimmed = base.trim();
  return trimmed || null;
}
