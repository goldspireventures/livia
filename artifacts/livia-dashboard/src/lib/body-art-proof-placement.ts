import type { SkinPreviewBodyZone } from "@workspace/policy";

/** Guess body zone from proof note placement text. */
export function inferProofPlacementZone(note?: string | null): SkinPreviewBodyZone {
  const n = (note ?? "").toLowerCase();
  if (/\bback\b|full back/.test(n)) return "back";
  if (/\bchest\b/.test(n)) return "chest";
  if (/\bupper arm\b|\bbicep\b/.test(n)) return "upper_arm";
  if (/\bforearm\b|\bwrist\b/.test(n)) return "forearm";
  if (/\bsleeve\b/.test(n)) return "upper_arm";
  return "forearm";
}
