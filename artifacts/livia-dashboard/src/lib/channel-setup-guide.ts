/** Jurisdiction-aware copy for WhatsApp / Instagram / Messenger setup. */
import { isOwnerConfiguredChannelId } from "@workspace/policy";

export type ChannelSetupJurisdiction = "IE" | "GB" | "DE" | "ES" | "IT" | "NL" | "PL" | "FR";

export type ChannelPriority = {
  id: "whatsapp" | "instagram" | "messenger" | "sms";
  label: string;
  hint: string;
};

const PRIORITY_BY_JURISDICTION: Record<ChannelSetupJurisdiction, ChannelPriority[]> = {
  IE: [
    { id: "whatsapp", label: "WhatsApp", hint: "Most common for bookings and reminders in Ireland." },
    { id: "instagram", label: "Instagram DMs", hint: "Beauty, hair, and tattoo enquiries often start here." },
    { id: "sms", label: "SMS", hint: "Fallback when customers do not use WhatsApp." },
  ],
  GB: [
    { id: "whatsapp", label: "WhatsApp", hint: "Growing share of salon DMs in the UK." },
    { id: "instagram", label: "Instagram DMs", hint: "Primary discovery channel for many studios." },
    { id: "sms", label: "SMS", hint: "Reliable for day-of reminders." },
  ],
  ES: [
    { id: "whatsapp", label: "WhatsApp", hint: "Default customer channel in Spain — connect this first." },
    { id: "instagram", label: "Instagram DMs", hint: "Strong for beauty and wellness brands." },
    { id: "messenger", label: "Messenger", hint: "Optional; same Meta page as Instagram." },
  ],
  IT: [
    { id: "whatsapp", label: "WhatsApp", hint: "Primary booking channel for Italian salons." },
    { id: "instagram", label: "Instagram DMs", hint: "Visual verticals (beauty, tattoo) live here." },
    { id: "messenger", label: "Messenger", hint: "Optional Facebook page inbox." },
  ],
  DE: [
    { id: "whatsapp", label: "WhatsApp", hint: "Expected for appointment businesses in Germany." },
    { id: "instagram", label: "Instagram DMs", hint: "Studio discovery and style consults." },
    { id: "messenger", label: "Messenger", hint: "Some older demographics prefer Facebook." },
  ],
  NL: [
    { id: "whatsapp", label: "WhatsApp", hint: "High adoption in the Netherlands." },
    { id: "instagram", label: "Instagram DMs", hint: "Brand-led studios." },
    { id: "sms", label: "SMS", hint: "Day-of confirmations." },
  ],
  PL: [
    { id: "whatsapp", label: "WhatsApp", hint: "Very common for local service businesses." },
    { id: "messenger", label: "Messenger", hint: "Popular alongside WhatsApp." },
    { id: "instagram", label: "Instagram DMs", hint: "Beauty and fitness brands." },
  ],
  FR: [
    { id: "instagram", label: "Instagram DMs", hint: "Primary discovery for beauty institutes in France." },
    { id: "whatsapp", label: "WhatsApp", hint: "Growing for confirmations and rebooking." },
    { id: "messenger", label: "Messenger", hint: "Optional — same Meta page as Instagram." },
  ],
};

export function resolveChannelPriorities(
  jurisdiction: string | null | undefined,
): ChannelPriority[] {
  const code = (jurisdiction ?? "IE").toUpperCase() as ChannelSetupJurisdiction;
  return PRIORITY_BY_JURISDICTION[code] ?? PRIORITY_BY_JURISDICTION.IE;
}

export type MessagingChannelsSnapshot = {
  whatsapp?: { phoneNumberId?: string; displayPhone?: string };
  instagram?: { pageId?: string };
  messenger?: { pageId?: string };
};

export function channelConnectionStatus(channels: MessagingChannelsSnapshot | undefined): {
  whatsapp: boolean;
  instagram: boolean;
  messenger: boolean;
  anySocial: boolean;
  allRecommended: boolean;
} {
  const whatsapp = isOwnerConfiguredChannelId(channels?.whatsapp?.phoneNumberId);
  const instagram = isOwnerConfiguredChannelId(channels?.instagram?.pageId);
  const messenger = isOwnerConfiguredChannelId(channels?.messenger?.pageId);
  return {
    whatsapp,
    instagram,
    messenger,
    anySocial: whatsapp || instagram || messenger,
    allRecommended: whatsapp && instagram,
  };
}

/** Honest UI label — configured IDs in DB vs verified delivery. */
export function channelConfiguredLabel(connected: boolean): string {
  return connected ? "Configured in Livia" : "Not configured";
}

export const META_PREREQUISITE_STEPS = [
  {
    title: "Meta Business Portfolio",
    body: "Use a Business Portfolio you control. Link your WhatsApp Business Account (WABA) and Facebook Page for Instagram.",
  },
  {
    title: "Professional Instagram",
    body: "Switch the shop account to Professional (Business or Creator) and connect it to the Facebook Page.",
  },
  {
    title: "Livia app access",
    body: "Grant the Livia Meta app access to WhatsApp and Instagram messaging. Your onboarding contact or support can confirm the app is subscribed.",
  },
] as const;

export const POST_CONNECT_TIPS = [
  "Add your Livia booking link to your Instagram bio (Settings → Public link in onboarding).",
  "Send yourself a test WhatsApp from a personal phone — you should see the thread in Inbox within seconds.",
  "Turn on Liv auto-book only after you have watched a few real conversations.",
  "Take over in Inbox to reply yourself — Liv resumes after you send.",
] as const;
