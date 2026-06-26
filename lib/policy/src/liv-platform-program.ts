/**
 * Liv platform copy hub — runtime fallbacks, outbound templates, defaults by vertical.
 * Surfaces and services resolve copy here; tenants override via `livOutboundOverrides` on businesses.
 */
import type { BusinessVertical } from "./types";
import { isConsultFirstVertical } from "./client-profile-policy";

/** Default decline — tenants override via `livOutboundOverrides.decline_reply`. */
export const DEFAULT_ENQUIRY_DECLINE_REPLY = `Hi {{firstName}},

Thank you for reaching out to {{businessName}}. {{reasonSentence}}

We hope your celebration is wonderful, and we'd love to hear from you again for a future event.

Warmly,
{{businessName}}`;

/** System messages when LLM is off or conversation state blocks tools. */
export type LivRuntimeCopyKey =
  | "conversation_closed"
  | "conversation_handed_off"
  | "assistant_unavailable"
  | "default_greeting_booking"
  | "default_greeting_consult"
  | "booking_rules_can_book"
  | "booking_rules_no_direct_book"
  | "conversational_unclear_rephrase"
  | "conversational_tool_hop_exhausted";

/** Operator-assisted or automated outbound messages. */
export type LivOutboundCopyKey =
  | "decline_reply"
  | "enquiry_thanks"
  | "quote_whatsapp"
  | "stale_quote_nudge"
  | "pending_booking_assist"
  | "booking_confirm_email_subject"
  | "booking_confirm_email_body"
  | "booking_confirm_sms";

const LIV_RUNTIME_DEFAULTS: Record<LivRuntimeCopyKey, string> = {
  conversation_closed:
    "This conversation is closed. Please start a new chat or contact the shop directly.",
  conversation_handed_off: "Thanks — a team member will get back to you shortly.",
  assistant_unavailable:
    "Our booking assistant is not available right now. Please use the booking steps on this page or contact the studio directly.",
  default_greeting_booking:
    "What are you looking to book today?",
  default_greeting_consult:
    "Tell me about your event — I'll help you enquire or answer questions.",
  booking_rules_can_book:
    "You may use create_booking once the customer confirms service, date/time, and contact details.",
  booking_rules_no_direct_book:
    "You must NOT use create_booking. Collect preferences and tell them a team member will confirm shortly.",
  conversational_unclear_rephrase: "Sorry, I didn't catch that. Could you rephrase?",
  conversational_tool_hop_exhausted:
    "Hmm, that took a few tries. Could you tell me again what you'd like to book?",
};

const LIV_OUTBOUND_DEFAULTS: Record<LivOutboundCopyKey, string> = {
  decline_reply: DEFAULT_ENQUIRY_DECLINE_REPLY,
  enquiry_thanks: `Hi {{firstName}}! Thanks for reaching out to {{businessName}} — we've received your enquiry and will send a personalised quote shortly.

Enquire again anytime:
{{enquireUrl}}`,
  quote_whatsapp: `Hi {{firstName}}! Your quote from {{businessName}} is ready — total {{total}}.

View & accept here:
{{quoteUrl}}`,
  stale_quote_nudge: `Hi {{firstName}}! Just checking in on the quote we sent for your event ({{daysSinceSent}} days ago). Still interested? Happy to tweak anything — here's the link again:
{{quoteUrl}}

— {{businessName}}`,
  pending_booking_assist: "I've added {{serviceDetail}} — pending team confirm.",
  booking_confirm_email_subject: "Booking confirmed — {{serviceName}} at {{businessName}}",
  booking_confirm_email_body: `Hi {{firstName}},

Your booking is confirmed:

{{serviceName}}{{staffLine}}
{{startLocal}}

Reply to this email if you need to reschedule.`,
  booking_confirm_sms:
    "{{serviceName}} confirmed for {{startLocal}} at {{businessName}}. Reply to reschedule.",
};

/** Legacy event_vendor_site column → platform outbound key. */
export const LIV_EVENT_SITE_OUTBOUND_MAP = {
  declineReplyTemplate: "decline_reply",
  enquiryThanksTemplate: "enquiry_thanks",
  quoteWhatsappTemplate: "quote_whatsapp",
} as const satisfies Record<string, LivOutboundCopyKey>;

export const LIV_OUTBOUND_TEMPLATE_VARS = [
  "{{firstName}}",
  "{{businessName}}",
  "{{reasonSentence}}",
  "{{enquireUrl}}",
  "{{quoteUrl}}",
  "{{total}}",
  "{{daysSinceSent}}",
  "{{serviceDetail}}",
  "{{serviceName}}",
  "{{staffLine}}",
  "{{startLocal}}",
] as const;

function applyTemplateVars(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

export function resolveLivRuntimeCopy(
  key: LivRuntimeCopyKey,
  vars?: Record<string, string>,
  operatorOverride?: string | null,
): string {
  const base = operatorOverride?.trim() || LIV_RUNTIME_DEFAULTS[key];
  return vars ? applyTemplateVars(base, vars).trim() : base.trim();
}

export function resolveLivOutboundCopy(
  key: LivOutboundCopyKey,
  vars: Record<string, string>,
  operatorOverride?: string | null,
): string {
  const base = operatorOverride?.trim() || LIV_OUTBOUND_DEFAULTS[key];
  return applyTemplateVars(base, vars).trim();
}

export function livDefaultGreeting(vertical: string | null | undefined, businessName: string): string {
  const key: LivRuntimeCopyKey = isConsultFirstVertical(vertical)
    ? "default_greeting_consult"
    : "default_greeting_booking";
  return resolveLivRuntimeCopy(key, { businessName });
}

export function livBookingRulesCopy(canBookDirectly: boolean): string {
  return resolveLivRuntimeCopy(
    canBookDirectly ? "booking_rules_can_book" : "booking_rules_no_direct_book",
  );
}

/** Appointment-booking verticals (not consult-first). */
export function isAppointmentBookingVertical(vertical: string | null | undefined): boolean {
  return !isConsultFirstVertical(vertical);
}

/** Outbound keys editable per vertical in Settings / event site. */
export function livOutboundKeysForVertical(
  vertical: string | null | undefined,
): LivOutboundCopyKey[] {
  if (isConsultFirstVertical(vertical)) {
    return ["decline_reply", "enquiry_thanks", "quote_whatsapp", "stale_quote_nudge"];
  }
  if (isAppointmentBookingVertical(vertical)) {
    return [
      "pending_booking_assist",
      "booking_confirm_email_subject",
      "booking_confirm_email_body",
      "booking_confirm_sms",
    ];
  }
  return [];
}

export function livOutboundTemplatesSettingsCopy(vertical: string | null | undefined): {
  sectionTitle: string;
  sectionSubtitle: string;
  fields: Array<{
    key: LivOutboundCopyKey;
    label: string;
    hint: string;
    defaultTemplate: string;
  }>;
} {
  const keys = livOutboundKeysForVertical(vertical);
  const fieldMeta: Record<
    LivOutboundCopyKey,
    { label: string; hint: string }
  > = {
    decline_reply: {
      label: "Not a fit reply",
      hint: "Use {{reasonSentence}} — inbox decline inserts the operator's chosen reason inline.",
    },
    enquiry_thanks: {
      label: "New enquiry thanks",
      hint: "WhatsApp assist after a web enquire.",
    },
    quote_whatsapp: {
      label: "Quote ready message",
      hint: "WhatsApp assist when you send a quote.",
    },
    stale_quote_nudge: {
      label: "Stale quote follow-up",
      hint: "WhatsApp assist when a quote has gone quiet.",
    },
    pending_booking_assist: {
      label: "Pending booking assist",
      hint: "Liv reply when a booking awaits team confirm. Use {{serviceDetail}} for what was added.",
    },
    booking_confirm_email_subject: {
      label: "Booking confirm email subject",
      hint: "Subject when Liv sends a confirmation email after create_booking.",
    },
    booking_confirm_email_body: {
      label: "Booking confirm email body",
      hint: "Body for confirmation email — {{staffLine}} is empty or “ with Name”.",
    },
    booking_confirm_sms: {
      label: "Booking confirm SMS",
      hint: "SMS when Liv books without an email on file.",
    },
  };

  return {
    sectionTitle: "Message templates",
    sectionSubtitle:
      "Prefilled emails and WhatsApp assists Liv sends when you qualify leads, share quotes, and follow up.",
    fields: keys.map((key) => ({
      key,
      label: fieldMeta[key].label,
      hint: fieldMeta[key].hint,
      defaultTemplate: LIV_OUTBOUND_DEFAULTS[key],
    })),
  };
}

/** Back-compat aliases used before platform hub. */
export const LIV_OUTBOUND_TEMPLATES = {
  enquiry_thanks: LIV_OUTBOUND_DEFAULTS.enquiry_thanks,
  quote_whatsapp: LIV_OUTBOUND_DEFAULTS.quote_whatsapp,
} as const;

export type LivOutboundTemplateKey = keyof typeof LIV_OUTBOUND_TEMPLATES;

export function defaultLivOutboundOverridesForVertical(
  vertical: BusinessVertical,
): Partial<Record<LivOutboundCopyKey, string>> {
  if (isConsultFirstVertical(vertical)) {
    return {
      decline_reply: LIV_OUTBOUND_DEFAULTS.decline_reply,
      enquiry_thanks: LIV_OUTBOUND_DEFAULTS.enquiry_thanks,
      quote_whatsapp: LIV_OUTBOUND_DEFAULTS.quote_whatsapp,
    };
  }
  if (isAppointmentBookingVertical(vertical)) {
    return {
      pending_booking_assist: LIV_OUTBOUND_DEFAULTS.pending_booking_assist,
      booking_confirm_email_subject: LIV_OUTBOUND_DEFAULTS.booking_confirm_email_subject,
      booking_confirm_email_body: LIV_OUTBOUND_DEFAULTS.booking_confirm_email_body,
      booking_confirm_sms: LIV_OUTBOUND_DEFAULTS.booking_confirm_sms,
    };
  }
  return {};
}

/** Resolve pending-booking assist with optional service detail (defaults to “your request”). */
export function livPendingBookingAssistCopy(
  serviceDetail?: string | null,
  operatorOverride?: string | null,
): string {
  return resolveLivOutboundCopy(
    "pending_booking_assist",
    { serviceDetail: serviceDetail?.trim() || "your request" },
    operatorOverride,
  );
}
