import { db, messageLogsTable } from "@workspace/db";
import type { InboundMetaMessage } from "@workspace/integrations-meta";
import { isAnthropicConfigured } from "@workspace/integrations-anthropic-ai";
import { generateId } from "../lib/id";
import { logger } from "../lib/logger";
import { redactObject } from "../lib/pii-redaction";
import { handlePublicChat } from "./ai-chat.service";
import {
  appendMessage,
  createConversation,
  findOpenConversationByChannelAndPhone,
  type ConversationChannel,
} from "./conversations.service";
import { upsertChannelIdentity } from "./channel-identities.service";
import { findBusinessByMessagingLookup } from "./messaging-channels.service";
import { resolveInboundWhatsappBusiness } from "./channel-routing.service";
import { sendAiInstagram, sendAiMessenger, sendAiWhatsapp, sendDirectWhatsapp } from "./ai-outbound.service";

function mapChannel(ch: InboundMetaMessage["channel"]): ConversationChannel {
  if (ch === "MESSENGER") return "MESSENGER";
  if (ch === "INSTAGRAM") return "INSTAGRAM";
  return "WHATSAPP";
}

function channelTypeForIdentity(ch: InboundMetaMessage["channel"]): "WHATSAPP" | "INSTAGRAM" {
  return ch === "WHATSAPP" ? "WHATSAPP" : "INSTAGRAM";
}

export async function processInboundMetaMessage(msg: InboundMetaMessage): Promise<{
  handled: boolean;
  businessId?: string;
  conversationId?: string;
  aiReplySkipped?: boolean;
  aiReplySkipReason?: string;
}> {
  let business = await findBusinessByMessagingLookup(msg.businessLookup);
  if (
    !business &&
    msg.channel === "WHATSAPP" &&
    msg.businessLookup.whatsappPhoneNumberId
  ) {
    const route = await resolveInboundWhatsappBusiness(
      msg.businessLookup.whatsappPhoneNumberId,
      msg.externalParticipantId,
      msg.text,
    );
    if (route.kind === "business") business = route.business;
    if (route.kind === "menu_required" && msg.businessLookup.whatsappPhoneNumberId) {
      await sendDirectWhatsapp({
        phoneNumberId: msg.businessLookup.whatsappPhoneNumberId,
        to: msg.externalParticipantId,
        body: route.menuText,
      }).catch(() => undefined);
      return { handled: true };
    }
  }
  if (!business) {
    logger.warn({ lookup: msg.businessLookup }, "Meta inbound: no business for channel lookup");
    return { handled: false };
  }

  const channel = mapChannel(msg.channel);
  const identityChannel = channelTypeForIdentity(msg.channel);

  const { customerId } = await upsertChannelIdentity({
    businessId: business.id,
    channelType: identityChannel,
    externalId: msg.externalParticipantId,
    displayName: msg.displayName,
  });

  const phoneKey =
    channel === "WHATSAPP" ? msg.externalParticipantId : `meta:${msg.externalParticipantId}`;

  let conversation = await findOpenConversationByChannelAndPhone(
    business.id,
    channel,
    phoneKey,
  );
  if (!conversation) {
    conversation = await createConversation({
      businessId: business.id,
      channel,
      customerName: msg.displayName,
      customerPhone: phoneKey,
    });
  }

  await appendMessage({
    conversationId: conversation.id,
    role: "USER",
    content: msg.text,
  });

  const livWillReply =
    conversation.aiHandled && conversation.status === "OPEN" && isAnthropicConfigured();
  void import("./notification-orchestrator.service")
    .then(({ notifyInboxInbound }) =>
      notifyInboxInbound({
        businessId: business.id,
        conversationId: conversation.id,
        channel: msg.channel,
        customerName: msg.displayName,
        preview: msg.text,
        livWillReply,
      }),
    )
    .catch(() => undefined);

  await db.insert(messageLogsTable).values({
    id: generateId(),
    businessId: business.id,
    customerId,
    channelType: channel,
    direction: "INBOUND",
    externalMessageId: msg.externalMessageId,
    content: msg.text,
    metadata: { channel, participantId: msg.externalParticipantId },
  });

  if (!conversation.aiHandled || conversation.status !== "OPEN") {
    return { handled: true, businessId: business.id, conversationId: conversation.id };
  }

  if (!isAnthropicConfigured()) {
    logger.warn(
      { businessId: business.id, channel },
      "Meta inbound: AI reply skipped — Anthropic not configured",
    );
    return {
      handled: true,
      businessId: business.id,
      conversationId: conversation.id,
      aiReplySkipped: true,
      aiReplySkipReason:
        "Set ANTHROPIC_API_KEY (or AI_INTEGRATIONS_ANTHROPIC_*) on the API server for Liv to reply.",
    };
  }

  let result: Awaited<ReturnType<typeof handlePublicChat>> | undefined;
  try {
    result = await handlePublicChat({
      slug: business.slug,
      conversationId: conversation.id,
      message: msg.text,
      customerName: msg.displayName,
      customerPhone: channel === "WHATSAPP" ? msg.externalParticipantId : undefined,
      channelType:
        channel === "WHATSAPP" || channel === "INSTAGRAM" || channel === "MESSENGER"
          ? channel
          : "WEB",
      skipPersistence: true,
    });
  } catch (err) {
    logger.error(
      { err: redactObject(err), businessId: business.id, channel },
      "Meta inbound: Liv reply failed",
    );
    return {
      handled: true,
      businessId: business.id,
      conversationId: conversation.id,
      aiReplySkipped: true,
      aiReplySkipReason: err instanceof Error ? err.message : "Liv reply failed",
    };
  }

  if (!result?.reply) {
    return { handled: true, businessId: business.id, conversationId: conversation.id };
  }

  if (channel === "WHATSAPP") {
    await sendAiWhatsapp({
      conversationId: conversation.id,
      businessId: business.id,
      businessName: business.name,
      customerId,
      customerPhone: msg.externalParticipantId,
      content: result.reply,
    });
  } else if (channel === "INSTAGRAM") {
    await sendAiInstagram({
      conversationId: conversation.id,
      businessId: business.id,
      businessName: business.name,
      customerId,
      recipientId: msg.externalParticipantId,
      content: result.reply,
    });
  } else {
    await sendAiMessenger({
      conversationId: conversation.id,
      businessId: business.id,
      businessName: business.name,
      customerId,
      recipientId: msg.externalParticipantId,
      content: result.reply,
    });
  }

  return { handled: true, businessId: business.id, conversationId: conversation.id };
}
