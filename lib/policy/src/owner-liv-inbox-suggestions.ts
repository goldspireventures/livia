/** Owner/manager Liv prompts when inbox queue is clear but commerce or setup needs attention. */
export function ownerLivInboxSuggestions(args: {
  hasCommerceActSignal?: boolean;
  capabilityBlockers?: number;
  pendingCount?: number;
  handedOffCount?: number;
}): string[] {
  const pending = Math.max(0, args.pendingCount ?? 0);
  const handed = Math.max(0, args.handedOffCount ?? 0);
  if (pending > 0 || handed > 0) return [];

  const out: string[] = [];
  if (args.hasCommerceActSignal) {
    out.push("Summarise money in vs bookings — what should I fix?");
    out.push("Walk me through getting deposits working, step by step.");
  }
  if ((args.capabilityBlockers ?? 0) > 0) {
    out.push("What's still blocking me from going live?");
  }
  out.push("Give me one priority besides inbox.");
  return out.slice(0, 3);
}
