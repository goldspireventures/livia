/**
 * Vertical copy program — CI-enforced exhaustiveness for operator + guest language.
 *
 * When you add a vertical: register the pack (`defineVerticalPack`) and this module
 * validates every copy surface resolves with no cross-vertical bleed.
 *
 * @see docs/engineering/VERTICAL-ADD-PLAYBOOK.md §2.1
 * @see docs/engineering/VERTICAL-COMES-TOGETHER.md §2
 */
import type { BusinessVertical } from "./types";
import { businessVerticalSchema } from "./types";
import {
  PENDING_REASON_CODES,
  bookingExperienceCopy,
  livPendingAutoConfirmBlocker,
  pendingApprovalGuidance,
  pendingReasonLabel,
  publicAwaitingContinuityHoldLines,
  stuckContinuityCardCopy,
} from "./booking-experience-copy";
import { getContinuityTemplate } from "./continuity-templates";
import { guestPublicExperience } from "./guest-public-experience";
import { businessVocabulary } from "./vocabulary";

/** Surfaces that must resolve per vertical — expand when new copy hubs ship. */
export const VERTICAL_COPY_SURFACES = [
  "vocabulary.core",
  "booking.pending",
  "booking.operatorExperience",
  "booking.publicHold",
  "booking.stuckContinuity",
  "continuity.template",
  "guest.publicExperience",
] as const;

export type VerticalCopySurface = (typeof VERTICAL_COPY_SURFACES)[number];

/** Internal jargon / salon defaults — never on owner surfaces. */
export const OWNER_COPY_FORBIDDEN_GLOBAL = [
  "continuity thread",
  "photos or confirmation",
  "hasn't confirmed photos",
  "booking continuity",
] as const;

/**
 * Wrong-vertical phrases in owner-facing copy for a given pack.
 * Guest SMS may mention photos where appropriate (e.g. hair colour) — owner Today must not.
 */
export const VERTICAL_COPY_BLEED_FORBID: Record<BusinessVertical, readonly string[]> = {
  hair: ["patch test", "design reference", "placement notes", "lash map", "therapist", "health notes", "pet parent", "vehicle make"],
  beauty: ["design reference", "placement notes", "therapist", "pet parent", "vehicle make"],
  "body-art": ["patch test", "lash map", "therapist", "pet parent", "vehicle make"],
  wellness: ["patch test", "lash map", "design reference", "chair notes", "pet parent", "vehicle make"],
  fitness: ["patch test", "lash map", "design reference", "therapist", "pet parent", "vehicle make"],
  medspa: ["patch test", "lash map", "design reference", "chair notes", "pet parent"],
  "allied-health": ["patch test", "lash map", "design reference", "chair notes", "pet parent"],
  "pet-grooming": ["patch test", "lash map", "design reference", "therapist", "vehicle make"],
  "automotive-detailing": ["patch test", "lash map", "design reference", "therapist", "pet parent"],
  "event-vendors": ["patch test", "lash map", "design reference", "therapist", "pet parent", "vehicle make"],
};

export type VerticalCopyValidation = {
  vertical: BusinessVertical;
  ok: boolean;
  errors: string[];
};

const CONTINUITY_FIXTURE = {
  businessName: "Demo Studio",
  serviceName: "Sample service",
  staffDisplayName: "Alex",
  startAtLocal: "Mon 10:00",
  bookingRef: "REF1",
  visitUrl: null as string | null,
};

function scanOwnerCopy(
  vertical: BusinessVertical,
  text: string,
  context: string,
  errors: string[],
): void {
  const lower = text.toLowerCase();
  for (const bad of OWNER_COPY_FORBIDDEN_GLOBAL) {
    if (lower.includes(bad)) {
      errors.push(`${vertical} ${context}: forbidden phrase "${bad}"`);
    }
  }
  for (const bad of VERTICAL_COPY_BLEED_FORBID[vertical]) {
    if (lower.includes(bad.toLowerCase())) {
      errors.push(`${vertical} ${context}: cross-vertical bleed "${bad}"`);
    }
  }
}

/** Validate one vertical's copy program — used by defineVerticalPack + CI. */
export function validateVerticalCopyProgram(vertical: BusinessVertical): VerticalCopyValidation {
  const errors: string[] = [];

  const vocab = businessVocabulary(vertical, null);
  if (!vocab.ownerTodayScheduleTitle?.trim()) {
    errors.push(`${vertical} vocabulary: ownerTodayScheduleTitle missing`);
  }
  if (!vocab.clientNoun?.trim() || !vocab.serviceNoun?.trim()) {
    errors.push(`${vertical} vocabulary: client/service nouns missing`);
  }

  for (const reason of Object.values(PENDING_REASON_CODES)) {
    const label = pendingReasonLabel(reason, vertical);
    const guidance = pendingApprovalGuidance(reason, vertical);
    if (!label?.trim()) errors.push(`${vertical} pending: missing label for ${reason}`);
    if (!guidance?.trim()) errors.push(`${vertical} pending: missing guidance for ${reason}`);
    scanOwnerCopy(vertical, label, `pending label (${reason})`, errors);
    scanOwnerCopy(vertical, guidance, `pending guidance (${reason})`, errors);
    const blocker = livPendingAutoConfirmBlocker(reason, vertical);
    if (blocker) scanOwnerCopy(vertical, blocker, `liv blocker (${reason})`, errors);
  }

  const exp = bookingExperienceCopy(vertical, null);
  for (const field of [
    exp.detailPageTitle,
    exp.detailPageSubtitle,
    exp.partyCardTitle,
    exp.continuityPanelTitle,
    exp.mediaCardTitle,
    exp.notesDisclosureDescription,
    exp.listGuidedBookingDescription,
  ]) {
    scanOwnerCopy(vertical, field, "booking experience", errors);
  }
  if (exp.continuityPanelTitle.toLowerCase().includes("continuity")) {
    errors.push(`${vertical} booking experience: continuityPanelTitle uses internal jargon`);
  }

  const holdLines = publicAwaitingContinuityHoldLines(vertical, null);
  if (holdLines.length < 3) {
    errors.push(`${vertical} public hold: expected at least 3 lines`);
  }

  const stuck = stuckContinuityCardCopy(vertical, null);
  scanOwnerCopy(vertical, stuck.description, "stuck continuity card", errors);

  const continuity = getContinuityTemplate(vertical);
  const sms = continuity.smsBody(CONTINUITY_FIXTURE);
  const emailSubject = continuity.emailSubject(CONTINUITY_FIXTURE);
  if (!sms?.trim()) errors.push(`${vertical} continuity: empty smsBody`);
  if (!emailSubject?.trim()) errors.push(`${vertical} continuity: empty emailSubject`);
  if (!continuity.publicNextSteps(CONTINUITY_FIXTURE).length) {
    errors.push(`${vertical} continuity: empty publicNextSteps`);
  }

  const guest = guestPublicExperience(vertical, null);
  if (!guest.heroTitle?.trim()) errors.push(`${vertical} guest public: heroTitle missing`);
  if (!guest.catalogTitle?.trim()) errors.push(`${vertical} guest public: catalogTitle missing`);
  if (!guest.guardSectionTitle?.trim()) {
    errors.push(`${vertical} guest public: guardSectionTitle missing`);
  }

  return { vertical, ok: errors.length === 0, errors };
}

/** Validate all registered verticals — `pnpm vertical:check` gate. */
export function validateAllVerticalCopyPrograms(): VerticalCopyValidation[] {
  return businessVerticalSchema.options.map((vertical) => validateVerticalCopyProgram(vertical));
}
