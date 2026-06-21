/**
 * Pre-visit intake — vertical scope and copy (shared medical_intake_records store).
 */
import type { BusinessVertical } from "./types";

export const INTAKE_VERTICALS: readonly BusinessVertical[] = [
  "beauty",
  "body-art",
  "medspa",
  "allied-health",
];

export function verticalRequiresIntake(vertical: string | null | undefined): boolean {
  return INTAKE_VERTICALS.includes((vertical ?? "") as BusinessVertical);
}

export function intakeFormTitleForVertical(vertical: string | null | undefined): string {
  switch (vertical) {
    case "beauty":
      return "Patch test & allergy intake";
    case "body-art":
      return "Health & consent intake";
    case "allied-health":
      return "Pre-visit assessment";
    case "medspa":
      return "Medical intake & consent";
    default:
      return "Pre-visit intake";
  }
}

export function intakePromptForVertical(vertical: string | null | undefined): string {
  switch (vertical) {
    case "beauty":
      return "Allergies, patch tests, and contraindications — Liv collects this before the chair, not at arrival.";
    case "body-art":
      return "Health gate and aftercare consent — required before session day.";
    case "allied-health":
      return "Reason for visit and clinical notes — beats paper forms at reception.";
    case "medspa":
      return "Medical history and procedure consent — clinical queue, not inbox chaos.";
    default:
      return "Complete once — Liv keeps it onClick for every visit.";
  }
}
