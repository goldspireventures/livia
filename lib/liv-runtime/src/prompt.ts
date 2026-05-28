import type { ResolvedBusinessPolicies } from "@workspace/policy";
import { loadVerticalPack } from "./packs/loader";
import { buildLivPromptFromTemplate } from "./templates";

export type LivBusinessContext = {
  id: string;
  name: string;
  city?: string | null;
  timezone: string;
  aiTone?: string | null;
  aiGreeting?: string | null;
  aiKnowledge?: string | null;
  aiCanBookDirectly?: string | null;
};

export type LivServiceRow = {
  id: string;
  name: string;
  durationMinutes: number;
  priceMinor: number;
  currency: string;
  description: string | null;
};

export type LivStaffRow = { id: string; displayName: string };

export function todayInTimezone(timezone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

export function buildLivSystemPrompt(args: {
  business: LivBusinessContext;
  policies: ResolvedBusinessPolicies;
  services: LivServiceRow[];
  staff: LivStaffRow[];
  verticalId?: string | null;
  packConfig?: Record<string, unknown> | null;
  promptOverrides?: Record<string, string>;
  knownCustomer?: { name?: string | null; email?: string | null; phone?: string | null };
}): string {
  const pack = loadVerticalPack(args.verticalId, args.packConfig);
  const today = todayInTimezone(args.business.timezone);
  const base = buildLivPromptFromTemplate({
    business: args.business,
    policies: args.policies,
    services: args.services,
    staff: args.staff,
    pack,
    knownCustomer: args.knownCustomer,
    today,
  });
  const overrides = args.promptOverrides ?? {};
  const verticalOverride = overrides["vertical.module"]?.trim();
  const coreOverride = overrides["system.core"]?.trim();
  let merged = base;
  if (verticalOverride) {
    merged = merged.replace(pack.promptModule, verticalOverride);
  }
  if (coreOverride) {
    merged = `${coreOverride}\n\n${merged}`;
  }
  const policyBlock = `\n\nBooking terms (legal):\n${args.policies.bookingTermsBlock}\n\nVocabulary: ${args.policies.vertical.livVocabularyHint}\n`;
  return `${merged}${policyBlock}`;
}

/** When false, Liv must not invoke tools (human handoff or closed thread). */
export function shouldLivUseTools(args: { status: string; aiHandled: boolean }): boolean {
  return args.status === "OPEN" && args.aiHandled;
}
