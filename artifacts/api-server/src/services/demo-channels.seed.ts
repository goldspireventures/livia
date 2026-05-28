/**
 * Production-like demo channel stack — WhatsApp, Instagram, Messenger, SMS numbers.
 * Stable IDs so META_DEV_SIMULATE + /dev/meta/inbound resolve the correct tenant.
 */
import { db, businessesTable, conversationsTable, conversationMessagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { MessagingChannels } from "@workspace/policy";
import { generateId } from "../lib/id";
import { updateMessagingChannels } from "./messaging-channels.service";

type CustomerRow = { id: string; displayName: string; email: string; phone: string };

/** Stable Meta lookup IDs — one set per flagship slug. */
const CHANNEL_PROFILES: Record<
  string,
  {
    instagramHandle?: string;
    twilioPhone: string;
    resendFrom?: string;
    channels: MessagingChannels;
  }
> = {
  "aurora-studio": {
    instagramHandle: "aurorastudiodublin",
    twilioPhone: "+35315550101",
    resendFrom: "Aurora Studio <hello@aurora-studio.ie>",
    channels: {
      whatsapp: {
        phoneNumberId: "demo_wa_aurora_studio",
        displayPhone: "+353 87 200 0101",
        wabaId: "demo_waba_aurora",
      },
      instagram: { pageId: "demo_ig_aurora_studio", igAccountId: "178414000101" },
      messenger: { pageId: "demo_ig_aurora_studio" },
    },
  },
  "aurora-mews": {
    instagramHandle: "auroramewssalon",
    twilioPhone: "+35315550102",
    channels: {
      whatsapp: {
        phoneNumberId: "demo_wa_aurora_mews",
        displayPhone: "+353 87 200 0102",
      },
      instagram: { pageId: "demo_ig_aurora_mews" },
      messenger: { pageId: "demo_ig_aurora_mews" },
    },
  },
  "conors-cut-co": {
    instagramHandle: "conorscutco",
    twilioPhone: "+35315550103",
    resendFrom: "Conor's Cut <book@conorscut.ie>",
    channels: {
      whatsapp: {
        phoneNumberId: "demo_wa_conors_cut",
        displayPhone: "+353 87 200 0103",
      },
      instagram: { pageId: "demo_ig_conors_cut" },
    },
  },
  "clarity-medspa-dublin": {
    instagramHandle: "claritymedspa",
    twilioPhone: "+35315550104",
    channels: {
      whatsapp: {
        phoneNumberId: "demo_wa_clarity_medspa",
        displayPhone: "+353 87 200 0104",
      },
      instagram: { pageId: "demo_ig_clarity_medspa" },
    },
  },
  "paws-parlour-dublin": {
    instagramHandle: "pawsparlourdublin",
    twilioPhone: "+35315550105",
    channels: {
      whatsapp: {
        phoneNumberId: "demo_wa_paws_parlour",
        displayPhone: "+353 87 200 0105",
      },
    },
  },
  "london-rose-spa": {
    instagramHandle: "londonrosespa",
    twilioPhone: "+44155550101",
    channels: {
      whatsapp: {
        phoneNumberId: "demo_wa_london_rose",
        displayPhone: "+44 7700 900101",
      },
      instagram: { pageId: "demo_ig_london_rose" },
      messenger: { pageId: "demo_ig_london_rose" },
    },
  },
  "berlin-studio-neun": {
    instagramHandle: "studioneunberlin",
    twilioPhone: "+493015550101",
    channels: {
      whatsapp: {
        phoneNumberId: "demo_wa_berlin_neun",
        displayPhone: "+49 30 5550101",
      },
      instagram: { pageId: "demo_ig_berlin_neun" },
    },
  },
  "paris-belle-vue": {
    instagramHandle: "bellevuesalonparis",
    twilioPhone: "+33155550101",
    channels: {
      whatsapp: {
        phoneNumberId: "demo_wa_paris_belle",
        displayPhone: "+33 6 55 50 01 01",
      },
      instagram: { pageId: "demo_ig_paris_belle" },
    },
  },
};

const DEFAULT_PROFILE = {
  twilioPhone: "+35315550999",
  channels: {
    whatsapp: {
      phoneNumberId: "demo_wa_generic",
      displayPhone: "+353 87 200 0999",
    },
  } satisfies MessagingChannels,
};

type SocialThread = {
  channel: "WHATSAPP" | "INSTAGRAM" | "MESSENGER";
  customerIdx: number;
  name: string;
  externalPhone: string;
  summary: string;
  aiHandled: boolean;
  messages: Array<{ role: "USER" | "ASSISTANT"; content: string; minsAgo: number }>;
};

const FLAGSHIP_SOCIAL_THREADS: SocialThread[] = [
  {
    channel: "WHATSAPP",
    customerIdx: 0,
    name: "Emma Walsh",
    externalPhone: "353872001111",
    summary: "WhatsApp — Saturday blowdry; Liv held 10:30 with Lara.",
    aiHandled: true,
    messages: [
      { role: "USER", content: "Hey! Can I book a blowdry for Saturday morning? 💇‍♀️", minsAgo: 18 },
      {
        role: "ASSISTANT",
        content:
          "Hi Emma — I'm Liv at Aurora Studio. Saturday 10:30 with Lara (Blowdry €55) is free. Reply YES to confirm.",
        minsAgo: 16,
      },
      { role: "USER", content: "Yes perfect!", minsAgo: 4 },
    ],
  },
  {
    channel: "INSTAGRAM",
    customerIdx: 1,
    name: "@sophie_styles",
    externalPhone: "meta:ig_demo_sophie",
    summary: "Instagram DM — colour consult; handed to senior stylist.",
    aiHandled: false,
    messages: [
      { role: "USER", content: "Do you do balayage for dark hair? First time client", minsAgo: 55 },
      {
        role: "ASSISTANT",
        content:
          "Yes — we do balayage from €120. I've asked Lara to jump in; she'll reply here shortly.",
        minsAgo: 52,
      },
    ],
  },
  {
    channel: "WHATSAPP",
    customerIdx: 2,
    name: "Niamh O'Brien",
    externalPhone: "353872002222",
    summary: "WhatsApp — running late; Liv suggested 15 min push.",
    aiHandled: true,
    messages: [
      { role: "USER", content: "Running 15 mins late for my 2pm colour 😬", minsAgo: 12 },
      {
        role: "ASSISTANT",
        content: "Thanks Niamh — I've noted it for the team. Your chair is held until 2:15.",
        minsAgo: 10,
      },
    ],
  },
  {
    channel: "MESSENGER",
    customerIdx: 3,
    name: "Cian Walsh",
    externalPhone: "meta:fb_demo_cian",
    summary: "Messenger — asking about gift vouchers.",
    aiHandled: true,
    messages: [
      { role: "USER", content: "Do you sell gift vouchers online?", minsAgo: 90 },
      {
        role: "ASSISTANT",
        content: "We do — €50 / €100 / €150. Want me to send the booking link to buy one?",
        minsAgo: 88,
      },
    ],
  },
];

function ago(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

export async function applyDemoChannelProfile(businessId: string, slug: string): Promise<boolean> {
  const profile = CHANNEL_PROFILES[slug] ?? DEFAULT_PROFILE;
  const channels = "channels" in profile ? profile.channels : DEFAULT_PROFILE.channels;
  const twilio = profile.twilioPhone ?? DEFAULT_PROFILE.twilioPhone;

  await db
    .update(businessesTable)
    .set({
      twilioPhoneNumber: twilio,
      twilioPhoneSid: `demo_sid_${slug.replace(/-/g, "_")}`,
      resendFromAddress: "resendFrom" in profile ? profile.resendFrom ?? null : null,
      instagramHandle:
        "instagramHandle" in profile ? profile.instagramHandle ?? null : `demo_${slug}`,
      messagingChannels: channels as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(businessesTable.id, businessId));

  await updateMessagingChannels(businessId, channels);
  return Boolean(CHANNEL_PROFILES[slug]);
}

export async function seedDemoSocialInbox(
  businessId: string,
  customers: CustomerRow[],
  opts?: { flagship?: boolean },
) {
  if (!opts?.flagship) return;

  const existing = await db
    .select({ channel: conversationsTable.channel })
    .from(conversationsTable)
    .where(eq(conversationsTable.businessId, businessId));
  if (existing.some((r) => r.channel === "WHATSAPP" || r.channel === "INSTAGRAM")) {
    return;
  }

  for (const t of FLAGSHIP_SOCIAL_THREADS) {
    const cid = customers[t.customerIdx]?.id ?? customers[0]?.id;
    const convId = generateId();
    const lastAt = ago(Math.min(...t.messages.map((m) => m.minsAgo)));
    await db.insert(conversationsTable).values({
      id: convId,
      businessId,
      customerId: cid,
      channel: t.channel,
      status: t.aiHandled ? "OPEN" : "HANDED_OFF",
      customerName: t.name,
      customerPhone: t.externalPhone,
      customerEmail: customers[t.customerIdx]?.email ?? null,
      aiHandled: t.aiHandled,
      summary: t.summary,
      lastMessageAt: lastAt,
    });
    for (const m of t.messages) {
      await db.insert(conversationMessagesTable).values({
        id: generateId(),
        conversationId: convId,
        role: m.role,
        content: m.content,
        createdAt: ago(m.minsAgo),
      });
    }
  }
}

/** Wire channel profiles + social inbox for all demo shops. */
export async function seedDemoChannelStack(
  shops: Array<{ id: string; slug: string; customers?: CustomerRow[] }>,
): Promise<{ profiles: number; socialThreads: number }> {
  let profiles = 0;
  let socialThreads = 0;

  const flagshipSlugs = new Set(Object.keys(CHANNEL_PROFILES));

  for (const shop of shops) {
    const isFlagship = flagshipSlugs.has(shop.slug);
    await applyDemoChannelProfile(shop.id, shop.slug);
    if (isFlagship) profiles += 1;

    if (shop.customers?.length && isFlagship) {
      await seedDemoSocialInbox(shop.id, shop.customers, { flagship: true });
      socialThreads += 1;
    }
  }

  return { profiles, socialThreads };
}

/** Surfaced on GET /demo/status — confirms WhatsApp/IG stack is live for demos. */
export async function getDemoChannelReadiness(slug = "aurora-studio") {
  const [biz] = await db
    .select({
      id: businessesTable.id,
      messagingChannels: businessesTable.messagingChannels,
      twilioPhoneNumber: businessesTable.twilioPhoneNumber,
    })
    .from(businessesTable)
    .where(eq(businessesTable.slug, slug))
    .limit(1);

  if (!biz) {
    return {
      slug,
      ready: false,
      whatsappConfigured: false,
      instagramConfigured: false,
      smsNumberConfigured: false,
      whatsappThreads: 0,
      instagramThreads: 0,
      messengerThreads: 0,
    };
  }

  const ch = biz.messagingChannels as MessagingChannels | null;
  const convos = await db
    .select({ channel: conversationsTable.channel })
    .from(conversationsTable)
    .where(eq(conversationsTable.businessId, biz.id));

  const count = (c: string) => convos.filter((r) => r.channel === c).length;

  return {
    slug,
    ready: Boolean(ch?.whatsapp?.phoneNumberId) && count("WHATSAPP") > 0,
    whatsappConfigured: Boolean(ch?.whatsapp?.phoneNumberId),
    instagramConfigured: Boolean(ch?.instagram?.pageId),
    smsNumberConfigured: Boolean(biz.twilioPhoneNumber),
    whatsappThreads: count("WHATSAPP"),
    instagramThreads: count("INSTAGRAM"),
    messengerThreads: count("MESSENGER"),
    metaDevSimulate: process.env.META_DEV_SIMULATE === "true",
  };
}
