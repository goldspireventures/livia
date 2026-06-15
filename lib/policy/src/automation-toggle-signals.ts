/**
 * Owner automation toggle adoption — track gates left off for product tailoring.
 * Stored on business.operational_policy.automationToggleSignals (jsonb).
 */
import { z } from "zod/v4";

export const AUTOMATION_TOGGLE_KEYS = [
  "guestCare.aftercareEnabled",
  "guestCare.retailAftercareEnabled",
  "guestCare.aftercareMode",
  "retail.enabled",
  "retail.postSessionSuggest",
] as const;

export type AutomationToggleKey = (typeof AUTOMATION_TOGGLE_KEYS)[number];

export const automationToggleSignalSchema = z.object({
  value: z.union([z.boolean(), z.string()]),
  updatedAt: z.string(),
  /** True once the owner turned a boolean on or picked a non-default send mode. */
  everActivated: z.boolean().default(false),
  /** Boolean false (or manual-only mode) and never activated — product signal. */
  persistentlyOff: z.boolean().default(false),
});

export type AutomationToggleSignal = z.infer<typeof automationToggleSignalSchema>;
export type AutomationToggleSignals = Partial<Record<AutomationToggleKey, AutomationToggleSignal>>;

const BOOLEAN_ACTIVATION_ON: Partial<Record<AutomationToggleKey, boolean>> = {
  "guestCare.aftercareEnabled": true,
  "guestCare.retailAftercareEnabled": true,
  "retail.enabled": true,
  "retail.postSessionSuggest": true,
};

const MODE_ACTIVATED_VALUES = new Set(["auto", "liv_draft"]);

function isActivatedValue(key: AutomationToggleKey, value: boolean | string): boolean {
  if (key === "guestCare.aftercareMode") {
    return typeof value === "string" && MODE_ACTIVATED_VALUES.has(value);
  }
  const expect = BOOLEAN_ACTIVATION_ON[key];
  return expect !== undefined && value === expect;
}

function isPersistentlyOffValue(key: AutomationToggleKey, value: boolean | string): boolean {
  if (key === "guestCare.aftercareMode") {
    return value === "manual_only";
  }
  return value === false;
}

export function recordAutomationToggleSignals(
  current: AutomationToggleSignals | undefined,
  updates: Partial<Record<AutomationToggleKey, boolean | string>>,
  now = new Date().toISOString(),
): AutomationToggleSignals {
  const next: AutomationToggleSignals = { ...(current ?? {}) };
  for (const key of AUTOMATION_TOGGLE_KEYS) {
    const value = updates[key];
    if (value === undefined) continue;
    const prev = next[key];
    const everActivated = prev?.everActivated === true || isActivatedValue(key, value);
    const persistentlyOff = !everActivated && isPersistentlyOffValue(key, value);
    next[key] = automationToggleSignalSchema.parse({
      value,
      updatedAt: now,
      everActivated,
      persistentlyOff,
    });
  }
  return next;
}

/** Keys owners left off — internal ops / future onboarding tailoring. */
export function persistentlyDisabledAutomationToggles(
  signals: AutomationToggleSignals | undefined,
): AutomationToggleKey[] {
  if (!signals) return [];
  return AUTOMATION_TOGGLE_KEYS.filter((k) => signals[k]?.persistentlyOff === true);
}

export function automationToggleUpdatesFromGuestCare(care: {
  aftercareEnabled: boolean;
  retailAftercareEnabled: boolean;
  aftercareMode: string;
}): Partial<Record<AutomationToggleKey, boolean | string>> {
  return {
    "guestCare.aftercareEnabled": care.aftercareEnabled,
    "guestCare.retailAftercareEnabled": care.retailAftercareEnabled,
    "guestCare.aftercareMode": care.aftercareMode,
  };
}

export function automationToggleUpdatesFromRetail(settings: {
  enabled: boolean;
  postSessionSuggest: boolean;
}): Partial<Record<AutomationToggleKey, boolean | string>> {
  return {
    "retail.enabled": settings.enabled,
    "retail.postSessionSuggest": settings.postSessionSuggest,
  };
}
