import {
  db,
  businessesTable,
  customersTable,
  voiceCallSessionsTable,
  bookingsTable,
  servicesTable,
  usageEventsTable,
} from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { AI_DISCLOSURE } from "../lib/ai-disclosure";
import { generateId } from "../lib/id";
import { recordMeter } from "../lib/metering-recorder";
import { tenantHasEntitlementForBusiness } from "./billing.service";
import {
  createConversation,
  appendMessage,
  findOpenConversationByChannelAndPhone,
  updateConversationStatus,
  type ConversationChannel,
} from "./conversations.service";
import { handlePublicChat } from "./ai-chat.service";
import { logger } from "../lib/logger";

const MAX_VOICE_TURNS = 8;
const VOICE_CHANNEL: ConversationChannel = "VOICE";

function normalizePhone(raw: string): string {
  return raw.replace(/\s/g, "");
}

function voiceMonthlyMinuteCap(): number {
  const raw = process.env["VOICE_MONTHLY_MINUTE_CAP"];
  const n = raw ? parseInt(raw, 10) : 500;
  return Number.isFinite(n) && n > 0 ? n : 500;
}

export async function resolveBusinessForVoiceNumber(to: string) {
  const normalized = normalizePhone(to);
  const rows = await db
    .select()
    .from(businessesTable)
    .where(
      sql`replace(${businessesTable.twilioPhoneNumber}, ' ', '') = ${normalized}`,
    );
  return rows[0] ?? null;
}

export async function businessVoiceMinutesThisMonth(businessId: string): Promise<number> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${usageEventsTable.quantity}), 0)::int` })
    .from(usageEventsTable)
    .where(
      and(
        eq(usageEventsTable.businessId, businessId),
        eq(usageEventsTable.meterKey, "voice_minute_inbound"),
        gte(usageEventsTable.occurredAt, monthStart),
      ),
    );
  return row?.total ?? 0;
}

export async function businessWithinVoiceCap(businessId: string): Promise<boolean> {
  const used = await businessVoiceMinutesThisMonth(businessId);
  return used < voiceMonthlyMinuteCap();
}

export function publicVoiceWebhookBase(): string | null {
  const base = process.env["PUBLIC_BASE_URL"]?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/api/channels/voice`;
}

export async function businessHasVoiceEntitlement(businessId: string): Promise<boolean> {
  return tenantHasEntitlementForBusiness(businessId, "voice_receptionist");
}

export async function startVoiceCallSession(args: {
  callSid: string;
  businessId: string;
  customerPhone: string;
}): Promise<{ conversationId: string; openingLine: string }> {
  const [business] = await db
    .select({ name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, args.businessId));
  const businessName = business?.name ?? "the business";

  let [customer] = await db
    .select()
    .from(customersTable)
    .where(
      and(
        eq(customersTable.businessId, args.businessId),
        eq(customersTable.phone, args.customerPhone),
      ),
    );
  if (!customer) {
    const [created] = await db
      .insert(customersTable)
      .values({
        id: generateId(),
        businessId: args.businessId,
        phone: args.customerPhone,
        displayName: args.customerPhone,
      })
      .returning();
    customer = created;
  }

  const existing = await findOpenConversationByChannelAndPhone(
    args.businessId,
    VOICE_CHANNEL,
    args.customerPhone,
  );
  const conversation =
    existing ??
    (await createConversation({
      businessId: args.businessId,
      channel: VOICE_CHANNEL,
      customerName: customer.displayName ?? undefined,
      customerPhone: args.customerPhone,
    }));

  await db
    .insert(voiceCallSessionsTable)
    .values({
      callSid: args.callSid,
      businessId: args.businessId,
      conversationId: conversation.id,
      customerPhone: args.customerPhone,
      turnCount: 0,
    })
    .onConflictDoUpdate({
      target: voiceCallSessionsTable.callSid,
      set: {
        conversationId: conversation.id,
        updatedAt: new Date(),
      },
    });

  return {
    conversationId: conversation.id,
    openingLine: AI_DISCLOSURE.voiceOpeningLine(businessName),
  };
}

export async function getVoiceCallSession(callSid: string) {
  const [row] = await db
    .select()
    .from(voiceCallSessionsTable)
    .where(eq(voiceCallSessionsTable.callSid, callSid));
  return row ?? null;
}

export async function processVoiceSpeechTurn(args: {
  callSid: string;
  speechResult: string;
  businessSlug: string;
}): Promise<{ twimlSay: string; endCall: boolean; gatherAgain: boolean }> {
  const session = await getVoiceCallSession(args.callSid);
  if (!session) {
    return {
      twimlSay: "Sorry, this call session expired. Please call again.",
      endCall: true,
      gatherAgain: false,
    };
  }

  if (session.turnCount >= MAX_VOICE_TURNS) {
    return {
      twimlSay: "I've taken quite a few notes. A team member will follow up. Goodbye.",
      endCall: true,
      gatherAgain: false,
    };
  }

  const utterance = args.speechResult.trim();
  if (!utterance) {
    return {
      twimlSay: "I didn't catch that. What would you like to book?",
      endCall: false,
      gatherAgain: true,
    };
  }

  await appendMessage({
    conversationId: session.conversationId,
    role: "USER",
    content: utterance,
  });

  await db
    .update(voiceCallSessionsTable)
    .set({
      turnCount: session.turnCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(voiceCallSessionsTable.callSid, args.callSid));

  try {
    const result = await handlePublicChat({
      slug: args.businessSlug,
      conversationId: session.conversationId,
      message: utterance,
      customerPhone: session.customerPhone,
      skipPersistence: true,
      channelType: "VOICE",
    });

    await appendMessage({
      conversationId: session.conversationId,
      role: "ASSISTANT",
      content: result.reply,
      bookingId: result.bookingId,
    });

    if (result.status === "HANDED_OFF") {
      await updateConversationStatus(session.conversationId, "HANDED_OFF", false);
      return {
        twimlSay:
          "I'll have someone from the team get back to you shortly. Thank you for calling. Goodbye.",
        endCall: true,
        gatherAgain: false,
      };
    }

    if (result.bookingId) {
      return {
        twimlSay: `${result.reply} Your booking reference is noted. Anything else?`,
        endCall: false,
        gatherAgain: true,
      };
    }

    return {
      twimlSay: result.reply,
      endCall: false,
      gatherAgain: true,
    };
  } catch (err) {
    logger.error({ err, callSid: args.callSid }, "Voice Liv turn failed");
    return {
      twimlSay:
        "Sorry, I'm having trouble right now. Please call back in a few minutes or text us instead.",
      endCall: true,
      gatherAgain: false,
    };
  }
}

/** Record inbound minutes when Twilio reports CallDuration (seconds). */
export async function recordVoiceCallDuration(args: {
  callSid: string;
  callDurationSec: number;
  callStatus: string;
}): Promise<void> {
  if (args.callStatus !== "completed" || args.callDurationSec <= 0) return;

  const session = await getVoiceCallSession(args.callSid);
  if (!session) return;

  const minutes = Math.max(1, Math.ceil(args.callDurationSec / 60));
  await recordMeter(session.businessId, "voice_minute_inbound", minutes, {
    callSid: args.callSid,
    callDurationSec: args.callDurationSec,
    conversationId: session.conversationId,
  });
}

export async function getVoiceDigestForBusiness(businessId: string): Promise<{
  voiceBookingsThisWeek: number;
  voiceRecoveredValueEurCents: number;
}> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const rows = await db
    .select({
      priceMinor: servicesTable.priceMinor,
    })
    .from(bookingsTable)
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        eq(bookingsTable.source, "voice"),
        gte(bookingsTable.createdAt, weekStart),
        sql`${bookingsTable.status} IN ('PENDING', 'CONFIRMED', 'COMPLETED')`,
      ),
    );

  const voiceBookingsThisWeek = rows.length;
  const voiceRecoveredValueEurCents = rows.reduce((sum, r) => sum + (r.priceMinor ?? 0), 0);

  return { voiceBookingsThisWeek, voiceRecoveredValueEurCents };
}
