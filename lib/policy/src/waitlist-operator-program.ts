/**
 * Slot waitlist — Liv-managed; operators get a subtle nudge at threshold, not a queue page.
 */

/** Active waitlist entries before Liv surfaces a Today nudge. */
export const LIV_WAITLIST_NUDGE_THRESHOLD = 3;

export function shouldShowLivWaitlistNudge(activeCount: number): boolean {
  return activeCount >= LIV_WAITLIST_NUDGE_THRESHOLD;
}

export function resolveLivWaitlistNudgeCopy(activeCount: number): {
  line: string;
  subline: string;
} {
  const n = Math.max(0, activeCount);
  return {
    line: `${n} guest${n === 1 ? "" : "s"} waiting for openings`,
    subline: "Liv will text them when a slot opens — nothing you need to do unless you want to call someone in early.",
  };
}
