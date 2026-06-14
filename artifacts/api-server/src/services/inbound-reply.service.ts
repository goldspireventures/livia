/**
 * Inbound reply hub — Liv AI response + channel send after thread persist.
 * Webhooks ACK fast; reply work runs async via Inngest when enabled.
 */
import type { InboundReplyJob } from "@workspace/policy";
import { isSubsystemEnabled, resolveSideEffectMode } from "@workspace/policy";
import { isAnthropicConfigured } from "@workspace/integrations-anthropic-ai";
import { inngest, isInngestWorkflowsEnabled } from "../lib/inngest";
import { logger } from "../lib/logger";
import {
  isSubsystemCircuitOpen,
  recordSubsystemFailure,
  recordSubsystemSuccess,
} from "../lib/subsystem-circuit";
import { handlePublicChat } from "./ai-chat.service";
import { sendAiInstagram, sendAiMessenger, sendAiSms, sendAiWhatsapp } from "./ai-outbound.service";

/** Never throws — safe from webhook handlers. */
export async function scheduleInboundReply(job: InboundReplyJob): Promise<void> {
  if (!isSubsystemEnabled("messaging_inbound", resolveSideEffectMode())) return;
  if (!isAnthropicConfigured()) return;
  if (isSubsystemCircuitOpen("messaging_inbound")) return;

  if (isInngestWorkflowsEnabled()) {
    try {
      await inngest.send({
        name: "livia/platform.inbound.reply",
        data: { job },
      });
      return;
    } catch (err) {
      logger.warn(
        { err, conversationId: job.conversationId },
        "inbound reply Inngest enqueue failed — sync fallback",
      );
    }
  }

  await executeInboundReply(job);
}

export async function executeInboundReply(job: InboundReplyJob): Promise<{
  replied: boolean;
  channelStatus?: "PENDING" | "SENT" | "FAILED";
}> {
  if (!isSubsystemEnabled("messaging_inbound", resolveSideEffectMode())) {
    return { replied: false };
  }
  if (isSubsystemCircuitOpen("messaging_inbound")) {
    logger.warn(
      { conversationId: job.conversationId },
      "messaging_inbound circuit open — skipping Liv reply",
    );
    return { replied: false };
  }

  try {
    const result = await handlePublicChat({
      slug: job.businessSlug,
      conversationId: job.conversationId,
      message: job.message,
      customerName: job.customerName ?? undefined,
      customerPhone: job.customerPhone ?? undefined,
      channelType: job.channel,
      skipPersistence: true,
    });

    if (!result?.reply) {
      recordSubsystemSuccess("messaging_inbound");
      return { replied: false };
    }

    let channelStatus: "PENDING" | "SENT" | "FAILED" | undefined;

    if (job.channel === "SMS" && job.customerPhone) {
      const sent = await sendAiSms({
        conversationId: job.conversationId,
        businessId: job.businessId,
        businessName: job.businessName,
        customerId: job.customerId,
        customerPhone: job.customerPhone,
        content: result.reply,
        fromPhone: job.fromPhone ?? null,
      });
      channelStatus = sent.status;
    } else if (job.channel === "WHATSAPP" && job.customerPhone) {
      const sent = await sendAiWhatsapp({
        conversationId: job.conversationId,
        businessId: job.businessId,
        businessName: job.businessName,
        customerId: job.customerId,
        customerPhone: job.customerPhone,
        content: result.reply,
      });
      channelStatus = sent.status;
    } else if (job.channel === "INSTAGRAM" && job.recipientId) {
      const sent = await sendAiInstagram({
        conversationId: job.conversationId,
        businessId: job.businessId,
        businessName: job.businessName,
        customerId: job.customerId,
        recipientId: job.recipientId,
        content: result.reply,
      });
      channelStatus = sent.status;
    } else if (job.channel === "MESSENGER" && job.recipientId) {
      const sent = await sendAiMessenger({
        conversationId: job.conversationId,
        businessId: job.businessId,
        businessName: job.businessName,
        customerId: job.customerId,
        recipientId: job.recipientId,
        content: result.reply,
      });
      channelStatus = sent.status;
    }

    recordSubsystemSuccess("messaging_inbound");
    return { replied: true, channelStatus };
  } catch (err) {
    recordSubsystemFailure("messaging_inbound", err);
    logger.warn(
      { err, conversationId: job.conversationId, channel: job.channel },
      "inbound Liv reply failed",
    );
    return { replied: false };
  }
}
