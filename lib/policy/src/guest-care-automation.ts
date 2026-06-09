/**
 * Guest care automation — aftercare, retail usage, channel preference.
 * Cascade: policy → API workflows → inbox/thread + SMS.
 */
import { z } from "zod/v4";
import type { BusinessVertical } from "./types";
import { beautyAftercareSmsBody } from "./beauty-booking-rules";
import { parseOperationalPolicy, type OperationalPolicy } from "./operational-policy";

export const aftercareModeSchema = z.enum(["auto", "liv_draft", "manual_only"]);
export type AftercareMode = z.infer<typeof aftercareModeSchema>;

export const aftercareDelaySchema = z.enum(["2h", "same_evening", "next_morning"]);
export type AftercareDelay = z.infer<typeof aftercareDelaySchema>;

export const aftercareChannelPreferenceSchema = z.enum([
  "thread_first",
  "sms_fallback",
  "sms_only",
]);
export type AftercareChannelPreference = z.infer<typeof aftercareChannelPreferenceSchema>;

export const guestPreferredModalitySchema = z.enum([
  "VOICE",
  "WHATSAPP",
  "SMS",
  "EMAIL",
  "INSTAGRAM",
  "WEB",
  "ANY",
]);
export type GuestPreferredModality = z.infer<typeof guestPreferredModalitySchema>;

export const guestCareAutomationSchema = z.object({
  aftercareEnabled: z.boolean().default(true),
  aftercareMode: aftercareModeSchema.default("auto"),
  aftercareDelay: aftercareDelaySchema.default("2h"),
  aftercareChannel: aftercareChannelPreferenceSchema.default("thread_first"),
  retailAftercareEnabled: z.boolean().default(true),
  /** Body-art / medspa multi-touch sequences (day offsets from complete). */
  aftercareSequenceDays: z.array(z.number().int().min(0).max(90)).optional(),
});

export type GuestCareAutomation = z.infer<typeof guestCareAutomationSchema>;

export const DEFAULT_GUEST_CARE: GuestCareAutomation = guestCareAutomationSchema.parse({});

const VERTICAL_AFTERCARE_DEFAULTS: Partial<
  Record<BusinessVertical, Partial<GuestCareAutomation>>
> = {
  beauty: { aftercareMode: "auto", aftercareDelay: "2h" },
  hair: { aftercareMode: "auto", aftercareDelay: "same_evening" },
  wellness: { aftercareMode: "auto", aftercareDelay: "2h" },
  "body-art": {
    aftercareMode: "liv_draft",
    aftercareDelay: "2h",
    aftercareSequenceDays: [1, 3, 14],
  },
  medspa: { aftercareMode: "liv_draft", aftercareDelay: "2h" },
  "allied-health": { aftercareMode: "auto", aftercareDelay: "next_morning" },
  fitness: { aftercareMode: "auto", aftercareDelay: "2h" },
  "pet-grooming": { aftercareMode: "auto", aftercareDelay: "2h" },
  "automotive-detailing": { aftercareMode: "auto", aftercareDelay: "same_evening" },
};

const VERTICAL_AFTERCARE_BODY: Partial<Record<BusinessVertical, string>> = {
  "body-art":
    "Keep the area clean and dry. Avoid swimming for 2 weeks. Reply here if you have redness or swelling concerns.",
  medspa:
    "Avoid sun and active skincare for 48 hours. Contact us if you notice unusual swelling.",
  "allied-health":
    "Follow any exercises we discussed. Ice sore areas 15 min on/off today. Book your next session if you haven't already.",
  wellness:
    "Drink water and rest today. We'd love to see you again — reply to rebook your next session.",
  hair: "Avoid washing for 24–48h if you had colour. Use sulphate-free shampoo when you do — reply with any questions.",
  fitness: "Hydrate and stretch lightly today. Reply if you need to adjust your next session.",
  "pet-grooming":
    "Keep your pet calm and warm after grooming. Brush gently — reply if coat or skin looks irritated.",
  "automotive-detailing":
    "Avoid car washes for 7 days on ceramic coatings. Reply if you need maintenance booking.",
};

export function recommendedGuestCareForVertical(
  vertical: BusinessVertical,
): GuestCareAutomation {
  const base = { ...DEFAULT_GUEST_CARE };
  const patch = VERTICAL_AFTERCARE_DEFAULTS[vertical];
  return guestCareAutomationSchema.parse({ ...base, ...patch });
}

/** Stored on business.operational_policy.guestCare */
export function parseGuestCareAutomation(raw: unknown): GuestCareAutomation {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_GUEST_CARE };
  const parsed = guestCareAutomationSchema.safeParse(raw);
  return parsed.success ? parsed.data : { ...DEFAULT_GUEST_CARE };
}

export function resolveGuestCareAutomation(args: {
  vertical: BusinessVertical;
  operationalPolicy?: unknown;
}): GuestCareAutomation {
  const op = parseOperationalPolicy(args.operationalPolicy);
  const fromPolicy = parseGuestCareAutomation(
    (op as OperationalPolicy & { guestCare?: unknown }).guestCare,
  );
  const recommended = recommendedGuestCareForVertical(args.vertical);
  return guestCareAutomationSchema.parse({ ...recommended, ...fromPolicy });
}

export function aftercareDelayMs(delay: AftercareDelay): number {
  switch (delay) {
    case "2h":
      return 2 * 60 * 60 * 1000;
    case "same_evening":
      return 4 * 60 * 60 * 1000;
    case "next_morning":
      return 14 * 60 * 60 * 1000;
    default:
      return 2 * 60 * 60 * 1000;
  }
}

export type ResolveAftercareArgs = {
  vertical: BusinessVertical;
  businessName: string;
  serviceName: string;
  serviceCategory?: string | null;
  serviceInstructions?: string | null;
  visitUrl?: string | null;
  retailProductName?: string | null;
  retailUsageText?: string | null;
};

export function resolveAftercareMessageBody(args: ResolveAftercareArgs): string {
  if (args.serviceInstructions?.trim()) {
    let body = args.serviceInstructions.trim();
    if (args.retailProductName && args.retailUsageText) {
      body += `\n\nFor ${args.retailProductName}: ${args.retailUsageText}`;
    } else if (args.retailProductName) {
      body += `\n\nHome care: ${args.retailProductName} — ask reception if you'd like a link.`;
    }
    if (args.visitUrl) body += `\n\nManage visit: ${args.visitUrl}`;
    return body;
  }

  if (args.vertical === "beauty") {
    return beautyAftercareSmsBody({
      businessName: args.businessName,
      serviceName: args.serviceName,
      category: args.serviceCategory ?? null,
      visitUrl: args.visitUrl ?? null,
    });
  }

  const tip = VERTICAL_AFTERCARE_BODY[args.vertical] ?? "Follow the care your team shared — reply here with questions.";
  const visit = args.visitUrl ? ` ${args.visitUrl}` : "";
  let body = `Thanks for visiting ${args.businessName} for ${args.serviceName}. ${tip}${visit}`;
  if (args.retailProductName && args.retailUsageText) {
    body += `\n\n${args.retailProductName}: ${args.retailUsageText}`;
  }
  return body;
}

/** Map guest hub / customer preferred modality → outbound channel. */
export function resolveOutboundChannel(args: {
  preferredModality: GuestPreferredModality;
  aftercareChannel: AftercareChannelPreference;
  hasContinuityThread: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
}): "SMS" | "EMAIL" | "THREAD" {
  const pref = args.preferredModality;
  if (pref === "EMAIL" && args.hasEmail) return "EMAIL";
  if (pref === "WHATSAPP" || pref === "SMS" || pref === "VOICE") {
    if (args.hasPhone) return "SMS";
  }
  if (
    args.aftercareChannel !== "sms_only" &&
    args.hasContinuityThread &&
    (pref === "ANY" || pref === "WEB" || pref === "INSTAGRAM")
  ) {
    return "THREAD";
  }
  if (args.hasPhone) return "SMS";
  if (args.hasEmail) return "EMAIL";
  return "SMS";
}

export const GUEST_PREFERRED_MODALITY_LABELS: Record<GuestPreferredModality, string> = {
  SMS: "Text message",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  VOICE: "Phone call",
  INSTAGRAM: "Instagram DM",
  WEB: "In-app / My Livia",
  ANY: "Where I last messaged you",
};
