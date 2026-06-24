/** Post-session retail attach — calm upsell after treatment (WB-402), not full POS. */

import { wellnessContinuityForVariant } from "./wellness-continuity-ext";

export type WellnessRetailSku = {
  id: string;
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
  sku: string;
};

export const WELLNESS_RETAIL_PROGRAM = {
  title: "Post-session retail",
  subtitle:
    "Hydration, body oils, and gift sets — on your booking page and as a calm inbox thread after checkout.",
  defaultPublicTitle: "Take the ritual home",
  inboxActionLabel: "Draft post-session thread in Inbox",
  continuityVariant: "post_session" as const,
  note: "Guest bag + pay link on your booking page; reception can still hand off at the desk.",
  inboxFlowHint:
    "Opens Inbox with a draft loaded — pick the guest's thread from today's session, review, and send.",
} as const;

export function buildWellnessPostSessionInboxDraft(options?: {
  guestFirstName?: string;
  skuName?: string;
}): { body: string; steps: string[] } {
  const continuity = wellnessContinuityForVariant(WELLNESS_RETAIL_PROGRAM.continuityVariant);
  const greeting = options?.guestFirstName ? `Hi ${options.guestFirstName},\n\n` : "";
  const sku =
    options?.skuName != null
      ? `\n\nIf you'd like to take the ritual home, ${options.skuName} is at reception whenever you're ready — no pressure.`
      : "";
  const body = `${greeting}${continuity.smsBody}${sku}\n\n${continuity.publicNextSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}`;
  return {
    body,
    steps: [
      "Select the guest thread (completed session today).",
      "Review the draft below — edit tone or add a product mention.",
      "Send when ready; reception can also mention oils at checkout.",
    ],
  };
}

export function wellnessRetailSkuById(skuId: string) {
  return WELLNESS_DEMO_RETAIL_SKUS.find((sku) => sku.id === skuId);
}

/** Demo catalogue for Harbour / Havn — showcases the ritual, not ERP inventory. */
export const WELLNESS_DEMO_RETAIL_SKUS: WellnessRetailSku[] = [
  {
    id: "harbour-calm-oil",
    name: "Harbour Calm body oil",
    description: "60ml · lavender + cedar — take-home after massage",
    priceMinor: 2800,
    currency: "EUR",
    sku: "HC-OIL-60",
  },
  {
    id: "stillness-balm",
    name: "Stillness recovery balm",
    description: "100ml · muscle ease — pairs with deep tissue",
    priceMinor: 2200,
    currency: "EUR",
    sku: "ST-BALM-100",
  },
  {
    id: "garden-hydration",
    name: "Garden hydration mist",
    description: "50ml · post-float or sauna ritual",
    priceMinor: 1800,
    currency: "EUR",
    sku: "GD-MIST-50",
  },
  {
    id: "gift-trio",
    name: "Harbour gift trio",
    description: "Oil + balm + mist — voucher attach at reception",
    priceMinor: 6500,
    currency: "EUR",
    sku: "HC-GIFT-TRIO",
  },
];
