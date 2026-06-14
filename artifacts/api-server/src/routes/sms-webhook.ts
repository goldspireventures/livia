// Inbound SMS webhook from Twilio. Validates signature, resolves the
// business by To-number, persists the inbound message, then fires the AI
// reply off-thread. Always ACKs 200 with empty TwiML so Twilio doesn't
// retry against a broken state.

import { Router, type IRouter, type Request } from "express";
import express from "express";
import {
  validateTwilioSignature,
  TWIML_EMPTY_RESPONSE,
} from "@workspace/integrations-twilio";
import { db, businessesTable, customersTable, messageLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { generateId } from "../lib/id";
import {
  createConversation,
  appendMessage,
  findOpenConversationByChannelAndPhone,
} from "../services/conversations.service";
import { extractTwilioMediaUrls } from "../services/booking-media.service";
import { handleContinuityInbound } from "../services/continuity-inbound.service";
import { resolveInboundSmsBusiness } from "../services/channel-routing.service";
import { sendDirectSms } from "../services/ai-outbound.service";
import { scheduleInboundReply } from "../services/inbound-reply.service";
import { isAnthropicConfigured } from "@workspace/integrations-anthropic-ai";
import { logger } from "../lib/logger";
import { twilioSignatureRequired } from "../lib/webhook-guard";

const router: IRouter = Router();

const YES_LIKE = /^(yes|y|yeah|yep|ok|okay|confirm|book)\b/i;

// Twilio sends application/x-www-form-urlencoded. We need this parser
// scoped to this route because the rest of the app uses express.json().
const formParser = express.urlencoded({ extended: false });

function buildFullUrl(req: Request): string {
  // Twilio signs the exact URL it called — including scheme + host +
  // path + query (no body). We honour the X-Forwarded-* headers since
  // the app may sit behind a reverse proxy (honour X-Forwarded-*).
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim()
    ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim()
    ?? req.get("host")
    ?? "";
  const originalUrl = req.originalUrl ?? req.url;
  return `${proto}://${host}${originalUrl}`;
}

router.post(
  "/channels/sms/inbound",
  formParser,
  async (req, res): Promise<void> => {
    // Always ACK quickly — even on hard errors. Twilio retries on 5xx
    // would create duplicate AI replies / double-charge.
    const ack = (status = 200) => {
      res.status(status).type("text/xml").send(TWIML_EMPTY_RESPONSE);
    };

    try {
      const params = req.body as Record<string, string>;
      const from = params["From"];
      const to = params["To"];
      const body = params["Body"];
      const externalMessageId = params["MessageSid"];

      if (!from || !to || typeof body !== "string") {
        logger.warn(
          { messageSid: externalMessageId, fromLast4: from?.slice(-4), toLast4: to?.slice(-4) },
          "Inbound SMS missing required fields",
        );
        ack(400);
        return;
      }

      if (twilioSignatureRequired()) {
        const authToken = process.env["TWILIO_AUTH_TOKEN"];
        if (!authToken) {
          logger.error("Inbound SMS rejected — TWILIO_AUTH_TOKEN missing in production");
          ack();
          return;
        }
        const signature = req.headers["x-twilio-signature"] as string | undefined;
        const ok = validateTwilioSignature({
          authToken,
          signatureHeader: signature,
          url: buildFullUrl(req),
          params,
        });
        if (!ok) {
          logger.warn(
            { messageSid: externalMessageId, fromLast4: from.slice(-4), toLast4: to.slice(-4) },
            "Inbound SMS signature validation failed",
          );
          res.status(403).end();
          return;
        }
      }

      const route = await resolveInboundSmsBusiness(to, from, body);
      if (route.kind === "not_found") {
        logger.warn({ to }, "Inbound SMS: no business or premises owns this number");
        ack();
        return;
      }
      if (route.kind === "menu_required") {
        ack();
        void sendDirectSms({
          to: from,
          body: route.menuText,
          from: to,
          templateKey: "premises-menu-sms",
        }).catch((err) => logger.error({ err }, "Premises menu SMS failed"));
        return;
      }
      const business = route.business;

      // Find / create customer by phone (scoped to this business).
      let [customer] = await db
        .select()
        .from(customersTable)
        .where(and(eq(customersTable.businessId, business.id), eq(customersTable.phone, from)));
      if (!customer) {
        const [created] = await db
          .insert(customersTable)
          .values({
            id: generateId(),
            businessId: business.id,
            phone: from,
            displayName: from,
          })
          .returning();
        customer = created;
      }

      const { tryAcceptWaitlistOfferFromSms } = await import(
        "../services/waitlist-inbound.service"
      );
      const waitlistResult = await tryAcceptWaitlistOfferFromSms({
        businessId: business.id,
        customerId: customer.id,
        phone: from,
        body,
      });
      if (waitlistResult.accepted && waitlistResult.message) {
        ack();
        void sendDirectSms({
          to: from,
          body: waitlistResult.message,
          from: to,
          businessId: business.id,
          templateKey: "waitlist-accept-sms",
        }).catch((err) => logger.error({ err }, "Waitlist accept SMS failed"));
        return;
      }
      if (waitlistResult.message && !waitlistResult.accepted && YES_LIKE.test(body.trim())) {
        ack();
        void sendDirectSms({
          to: from,
          body: waitlistResult.message,
          from: to,
          businessId: business.id,
          templateKey: "waitlist-expiry-sms",
        }).catch((err) => logger.error({ err }, "Waitlist expiry SMS failed"));
        return;
      }

      // DB-level lookup of the existing OPEN SMS conversation for
      // (businessId, customerPhone). Indexed scan, no list cap, so
      // older threads in high-volume shops still resume cleanly.
      const candidate = await findOpenConversationByChannelAndPhone(
        business.id,
        "SMS",
        from,
      );
      const conversation = candidate
        ? candidate
        : await createConversation({
            businessId: business.id,
            channel: "SMS",
            customerName: customer.displayName ?? undefined,
            customerPhone: from,
          });

      // Persist inbound USER message + raw message log. handlePublicChat
      // is invoked below with skipPersistence:true so it does NOT
      // re-append the USER row (or the ASSISTANT — sendAiSms owns that).
      const mediaUrls = extractTwilioMediaUrls(params);

      await appendMessage({
        conversationId: conversation.id,
        role: "USER",
        content: body || (mediaUrls.length ? "[image attached]" : ""),
      });

      void handleContinuityInbound({
        businessId: business.id,
        conversationId: conversation.id,
        body,
        mediaUrls,
      }).catch((err) => logger.error({ err }, "Continuity inbound handler failed"));
      await db.insert(messageLogsTable).values({
        id: generateId(),
        businessId: business.id,
        customerId: customer.id,
        bookingId: null,
        channelType: "SMS",
        direction: "INBOUND",
        externalMessageId: externalMessageId ?? null,
        content: body,
        metadata: { from, to, conversationId: conversation.id },
      });

      const livWillReply =
        conversation.aiHandled && conversation.status === "OPEN" && isAnthropicConfigured();
      void import("../services/notification-orchestrator.service")
        .then(({ notifyInboxInbound }) =>
          notifyInboxInbound({
            businessId: business.id,
            conversationId: conversation.id,
            channel: "SMS",
            customerName: customer.displayName,
            preview: body,
            livWillReply,
          }),
        )
        .catch((err) => logger.warn({ err }, "SMS inbound studio notify failed"));

      // ACK Twilio NOW — Liv reply runs async via inbound queue.
      ack();

      if (livWillReply) {
        void scheduleInboundReply({
          businessId: business.id,
          businessSlug: business.slug,
          businessName: business.name,
          conversationId: conversation.id,
          channel: "SMS",
          message: body,
          customerName: customer.displayName,
          customerPhone: from,
          customerId: customer.id,
          fromPhone: business.twilioPhoneNumber ?? null,
        }).catch((err) =>
          logger.error(
            { err, conversationId: conversation.id, businessId: business.id },
            "Inbound SMS AI reply queue failed",
          ),
        );
      }
    } catch (err) {
      logger.error({ err }, "Inbound SMS webhook unexpected error");
      ack(); // Still ACK so Twilio doesn't retry against broken state.
    }
  },
);

export default router;
