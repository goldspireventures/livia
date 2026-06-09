/**
 * Beauty service kinds + booking rules — policy hub.
 */
export const BEAUTY_SERVICE_KINDS = [
  "full_set",
  "fill",
  "maintenance",
  "consult",
  "patch_test",
  "other",
] as const;

export type BeautyServiceKind = (typeof BEAUTY_SERVICE_KINDS)[number];

export type BeautyServiceMeta = {
  serviceKind?: BeautyServiceKind | null;
  rebookIntervalDays?: number | null;
  requiresPatchTest?: boolean;
  category?: string | null;
};

export type BeautyClientProfile = {
  patchTestCompletedAt?: string | null;
  beautyPreferences?: {
    lashCurl?: string | null;
    lashLength?: string | null;
    lashStyle?: string | null;
    nailShape?: string | null;
    adhesiveSensitivity?: boolean;
    formulaNotes?: string | null;
    formulaSketchUrl?: string | null;
  } | null;
};

/** Patch test valid for 6 months unless tenant overrides later. */
export const BEAUTY_PATCH_TEST_VALID_DAYS = 183;

export function isPatchTestValid(completedAt?: string | Date | null, now = new Date()): boolean {
  if (!completedAt) return false;
  const d = completedAt instanceof Date ? completedAt : new Date(completedAt);
  if (Number.isNaN(d.getTime())) return false;
  const ms = now.getTime() - d.getTime();
  return ms >= 0 && ms <= BEAUTY_PATCH_TEST_VALID_DAYS * 86_400_000;
}

export function categoriesDefaultPatchTest(category?: string | null): boolean {
  if (!category) return false;
  const c = category.toLowerCase();
  return c === "lashes" || c === "brows" || c.includes("colour") || c.includes("color");
}

export function serviceRequiresPatchTest(meta: BeautyServiceMeta): boolean {
  if (meta.requiresPatchTest === true) return true;
  if (meta.serviceKind === "patch_test") return false;
  return categoriesDefaultPatchTest(meta.category);
}

export type BeautyPatchTestGateResult =
  | { ok: true }
  | {
      ok: false;
      code: "patch_test_required" | "patch_test_attestation_no";
      message: string;
      patchTestServiceHint?: boolean;
    };

export function validateBeautyPatchTestGate(args: {
  service: BeautyServiceMeta;
  customerPatchTestAt?: string | Date | null;
  guardAnswers?: Record<string, string>;
}): BeautyPatchTestGateResult {
  if (!serviceRequiresPatchTest(args.service)) return { ok: true };

  if (isPatchTestValid(args.customerPatchTestAt)) return { ok: true };

  const attestation = args.guardAnswers?.patch_test?.trim();
  if (attestation === "yes") return { ok: true };
  if (attestation === "na") return { ok: true };

  if (attestation === "no") {
    return {
      ok: false,
      code: "patch_test_attestation_no",
      message:
        "A patch test is required before this treatment. Book a patch test first or visit the studio.",
      patchTestServiceHint: true,
    };
  }

  return {
    ok: false,
    code: "patch_test_required",
    message:
      "This treatment requires a valid patch test. Book our patch test service or confirm you had one in the last 6 months.",
    patchTestServiceHint: true,
  };
}

export function inferFillRecommendation(args: {
  serviceKind?: BeautyServiceKind | null;
  rebookIntervalDays?: number | null;
  lastVisitAt?: string | Date | null;
  now?: Date;
}): { dueForFill: boolean; suggestFullSet: boolean; hint?: string } {
  const now = args.now ?? new Date();
  const kind = args.serviceKind ?? "other";
  const interval = args.rebookIntervalDays ?? (kind === "fill" ? 14 : kind === "maintenance" ? 21 : null);

  if (!args.lastVisitAt || !interval) {
    if (kind === "fill") {
      return {
        dueForFill: false,
        suggestFullSet: false,
        hint: "First visit or full set — allow time for consultation.",
      };
    }
    return { dueForFill: false, suggestFullSet: false };
  }

  const last = args.lastVisitAt instanceof Date ? args.lastVisitAt : new Date(args.lastVisitAt);
  const daysSince = Math.floor((now.getTime() - last.getTime()) / 86_400_000);

  if (kind === "fill" || kind === "maintenance") {
    if (daysSince > interval + 7) {
      return {
        dueForFill: true,
        suggestFullSet: daysSince > interval * 2,
        hint:
          daysSince > interval * 2
            ? "It has been a while — a full set may be better than a fill."
            : `You're due for a fill (last visit ${daysSince} days ago).`,
      };
    }
    if (daysSince >= interval) {
      return {
        dueForFill: true,
        suggestFullSet: false,
        hint: `Due for ${kind === "fill" ? "lash fill" : "maintenance"} — last visit ${daysSince} days ago.`,
      };
    }
  }

  return { dueForFill: false, suggestFullSet: false };
}

/** Minimum bookable slot length — brow lamination and long nail services (Innovation P0). */
export function minimumBeautySlotMinutes(meta: BeautyServiceMeta & { name?: string }): number {
  const name = (meta.name ?? "").toLowerCase();
  const kind = meta.serviceKind ?? "other";
  if (kind === "patch_test") return 30;
  if (name.includes("lamination") || name.includes("biab") || name.includes("builder gel")) {
    return 90;
  }
  if (name.includes("gel manicure") && name.includes("pedicure")) return 120;
  if (meta.category?.toLowerCase() === "brows" && kind === "maintenance") return 60;
  return 30;
}

export function publicServiceFillHint(
  service: BeautyServiceMeta & { name?: string },
  lastVisitAt?: string | null,
): string | null {
  const rec = inferFillRecommendation({
    serviceKind: service.serviceKind ?? null,
    rebookIntervalDays: service.rebookIntervalDays ?? null,
    lastVisitAt: lastVisitAt ?? null,
  });
  return rec.hint ?? null;
}

export function beautyRebookSmsBody(args: {
  businessName: string;
  serviceName: string;
  bookUrl: string;
  daysOverdue?: number;
}): string {
  const overdue =
    args.daysOverdue != null && args.daysOverdue > 0
      ? ` (${args.daysOverdue} days past your usual cycle)`
      : "";
  return `${args.businessName}: You're due for ${args.serviceName}${overdue}. Rebook in two taps: ${args.bookUrl}`;
}

export function beautyAftercareSmsBody(args: {
  businessName: string;
  serviceName: string;
  category?: string | null;
  visitUrl?: string | null;
}): string {
  const cat = (args.category ?? "").toLowerCase();
  let tip = "Follow the aftercare your tech shared — reply here with questions.";
  if (cat.includes("lash")) tip = "Avoid steam and oil for 24h — gentle cleanse only.";
  else if (cat.includes("wax")) tip = "Skip heat and tight clothes for 24h — exfoliate gently after 48h.";
  else if (cat.includes("nail")) tip = "Avoid picking gel — cuticle oil daily keeps the set fresh.";
  else if (cat.includes("brow")) tip = "No steam or tinting products for 24h.";
  const visit = args.visitUrl ? ` Prep: ${args.visitUrl}` : "";
  return `Thanks for visiting ${args.businessName} for ${args.serviceName}. ${tip}${visit}`;
}

export function templateDefaultsForKind(
  kind: BeautyServiceKind,
): Pick<BeautyServiceMeta, "rebookIntervalDays" | "requiresPatchTest"> {
  switch (kind) {
    case "fill":
      return { rebookIntervalDays: 14, requiresPatchTest: true };
    case "maintenance":
      return { rebookIntervalDays: 21, requiresPatchTest: false };
    case "full_set":
      return { rebookIntervalDays: 21, requiresPatchTest: true };
    case "patch_test":
      return { rebookIntervalDays: null, requiresPatchTest: false };
    case "consult":
      return { rebookIntervalDays: null, requiresPatchTest: false };
    default:
      return { rebookIntervalDays: null, requiresPatchTest: false };
  }
}
