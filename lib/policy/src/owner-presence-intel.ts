/** Owner Liv presence lines when operational queue is clear — commerce + Twin. */

export type OwnerPresenceIntelSlice = {
  twinHeadline?: string | null;
  twinSubline?: string | null;
  commerceTopSignal?: {
    title: string;
    href: string;
    severity: "act" | "watch" | "info";
  } | null;
  remediationActCount?: number;
};

export function resolveOwnerPresenceIntelLine(args: {
  pending: number;
  open: number;
  intel?: OwnerPresenceIntelSlice | null;
}): string | null {
  if (args.pending > 0 || args.open > 0) return null;
  const top = args.intel?.commerceTopSignal;
  if (top && (top.severity === "act" || top.severity === "watch")) {
    return top.title;
  }
  if (args.intel?.twinHeadline?.trim()) {
    return args.intel.twinSubline?.trim()
      ? `${args.intel.twinHeadline.trim()} — ${args.intel.twinSubline.trim()}`
      : args.intel.twinHeadline.trim();
  }
  return null;
}

export function ownerLivOpsDynamicSuggestions(intel?: {
  remediationTasks?: Array<{ ownerPrompt?: string; title: string }>;
  livPrompts?: string[];
} | null): string[] {
  const fromTasks = (intel?.remediationTasks ?? [])
    .map((t) => t.ownerPrompt?.trim() || t.title.trim())
    .filter(Boolean)
    .slice(0, 2);
  const fromPrompts = (intel?.livPrompts ?? []).slice(0, 2);
  const merged = [...fromTasks, ...fromPrompts];
  if (merged.length > 0) return merged.slice(0, 4);
  return [
    "What should I tackle first today?",
    "What's still between me and my first booking?",
    "Summarise how the shop looks right now.",
  ];
}
