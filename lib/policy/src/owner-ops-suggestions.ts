/** Liv command / inbox prompts for owners and managers (ops mode). */
export function ownerOpsLivSuggestions(args: {
  hasCommerceActSignal?: boolean;
  capabilityBlockers?: number;
  pendingCount?: number;
}): string[] {
  const out: string[] = [];
  if ((args.pendingCount ?? 0) > 0) {
    out.push("What on today's calendar needs my eye first?");
  }
  if (args.hasCommerceActSignal) {
    out.push("Why aren't payments landing and what should I fix?");
    out.push("Summarise money in vs bookings this month — plain English.");
  }
  if ((args.capabilityBlockers ?? 0) > 0) {
    out.push("What's still blocking me from going live?");
  }
  out.push("Give me one priority for today.");
  return out.slice(0, 4);
}
