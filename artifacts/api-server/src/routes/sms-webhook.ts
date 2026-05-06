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
  listConversationsForBusiness,
} from "../services/conversations.service";
import { handlePublicChat } from "../services/ai-chat.service";
import { sendAiSms } from "../services/ai-outbound.service";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Twilio sends application/x-www-form-urlencoded. We need this parser
// scoped to this route because the rest of the app uses express.json().
const formParser = express.urlencoded({ extended: false });

function buildFullUrl(req: Request): string {
  // Twilio signs the exact URL it called — including scheme + host +
  // path + query (no body). We honour the X-Forwarded-* headers since
  // the app sits behind Replit's proxy.
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
        logger.warn({ params }, "Inbound SMS missing required fields");
        ack(400);
        return;
      }

      const authToken = process.env["TWILIO_AUTH_TOKEN"];
      const skipValidation = process.env["TWILIO_SKIP_SIGNATURE_VALIDATION"] === "true";
      if (authToken && !skipValidation) {
        const signature = req.headers["x-twilio-signature"] as string | undefined;
        const ok = validateTwilioSignature({
          authToken,
          signatureHeader: signature,
          url: buildFullUrl(req),
          params,
        });
        if (!ok) {
          logger.warn({ from, to, signature }, "Inbound SMS signature validation failed");
          res.status(403).end();
          return;
        }
      }

      // Look up business by their provisioned number.
      const [business] = await db
        .select()
        .from(businessesTable)
        .where(eq(businessesTable.twilioPhoneNumber, to));
      if (!business) {
        logger.warn({ to }, "Inbound SMS: no business owns this number");
        ack();
        return;
      }

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

      // Find an existing OPEN SMS conversation for this customer, else create one.
      const existing = await listConversationsForBusiness(business.id, {
        status: "OPEN",
        limit: 50,
      });
      const candidate = existing.find(
        (c) => c.channel === "SMS" && c.customerPhone === from,
      );
      const conversation = candidate
        ? candidate
        : await createConversation({
            businessId: business.id,
            channel: "SMS",
            customerName: customer.displayName ?? undefined,
            customerPhone: from,
          });

      // Persist inbound USER message + raw message log.
      await appendMessage({
        conversationId: conversation.id,
        role: "USER",
        content: body,
      });
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

      // ACK Twilio NOW — kick AI work off the request thread so we
      // don't risk a slow Anthropic call timing out the webhook.
      ack();

      // Fire-and-forget AI reply. Errors are logged but don't bubble.
      void (async () => {
        try {
          const result = await handlePublicChat({
            slug: business.slug,
            conversationId: conversation.id,
            message: body,
            customerName: customer.displayName ?? undefined,
            customerPhone: from,
          });
          if (!result?.reply) return;
          await sendAiSms({
            conversationId: conversation.id,
            businessId: business.id,
            businessName: business.name,
            customerId: customer.id,
            customerPhone: from,
            content: result.reply,
            fromPhone: business.twilioPhoneNumber ?? null,
          });
        } catch (err) {
          logger.error(
            { err, conversationId: conversation.id, businessId: business.id },
            "Inbound SMS AI reply failed",
          );
        }
      })();
    } catch (err) {
      logger.error({ err }, "Inbound SMS webhook unexpected error");
      ack(); // Still ACK so Twilio doesn't retry against broken state.
    }
  },
);

export default router;
