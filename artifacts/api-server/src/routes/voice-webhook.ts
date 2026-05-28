/**
 * Twilio Voice ingress (Phase 7).
 * - No call recording in v1 (no <Record/> — disclosure-only, per EU AI Act posture).
 * - English-IE speech gather → Liv tools → TwiML Say loop.
 * - Status callback meters voice_minute_inbound.
 */

import { Router, type IRouter, type Request } from "express";
import express from "express";
import {
  validateTwilioSignature,
  buildTwimlSayAndGather,
  buildTwimlSayAndHangup,
} from "@workspace/integrations-twilio";
import { logger } from "../lib/logger";
import { redactObject } from "../lib/pii-redaction";
import { twilioSignatureRequired } from "../lib/webhook-guard";
import {
  businessHasVoiceEntitlement,
  businessWithinVoiceCap,
  processVoiceSpeechTurn,
  publicVoiceWebhookBase,
  recordVoiceCallDuration,
  resolveBusinessForVoiceNumber,
  startVoiceCallSession,
} from "../services/voice-call.service";

const router: IRouter = Router();
const formParser = express.urlencoded({ extended: false });

function buildFullUrl(req: Request): string {
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() ??
    req.protocol;
  const host =
    (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim() ??
    req.get("host") ??
    "";
  return `${proto}://${host}${req.originalUrl ?? req.url}`;
}

function validateTwilio(req: Request, params: Record<string, string>): boolean {
  if (!twilioSignatureRequired()) return true;
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  if (!authToken) {
    logger.error("Voice webhook rejected — TWILIO_AUTH_TOKEN missing in production");
    return false;
  }
  const signature = req.headers["x-twilio-signature"] as string | undefined;
  return validateTwilioSignature({
    authToken,
    signatureHeader: signature,
    url: buildFullUrl(req),
    params,
  });
}

function gatherActionUrl(conversationId: string, businessSlug: string): string {
  const base = publicVoiceWebhookBase();
  if (!base) return "";
  const u = new URL(`${base}/gather`);
  u.searchParams.set("conversationId", conversationId);
  u.searchParams.set("slug", businessSlug);
  return u.toString();
}

router.post("/channels/voice/inbound", formParser, async (req, res): Promise<void> => {
  try {
    const params = req.body as Record<string, string>;
    const from = params["From"];
    const to = params["To"];
    const callSid = params["CallSid"];

    if (!from || !to || !callSid) {
      res.status(400).type("text/xml").send(buildTwimlSayAndHangup({ say: "Invalid call." }));
      return;
    }

    if (!validateTwilio(req, params)) {
      res.status(403).end();
      return;
    }

    const business = await resolveBusinessForVoiceNumber(to);
    if (!business) {
      logger.warn({ to }, "Voice inbound: no business for number");
      res
        .status(200)
        .type("text/xml")
        .send(buildTwimlSayAndHangup({ say: "This number is not in service." }));
      return;
    }

    const entitled = await businessHasVoiceEntitlement(business.id);
    if (!entitled) {
      res
        .status(200)
        .type("text/xml")
        .send(
          buildTwimlSayAndHangup({
            say: "Voice booking is not available on this plan. Please visit our website or send a text message.",
          }),
        );
      return;
    }

    const withinCap = await businessWithinVoiceCap(business.id);
    if (!withinCap) {
      res
        .status(200)
        .type("text/xml")
        .send(
          buildTwimlSayAndHangup({
            say: "We're at capacity for voice calls right now. Please text us instead.",
          }),
        );
      return;
    }

    const { conversationId, openingLine } = await startVoiceCallSession({
      callSid,
      businessId: business.id,
      customerPhone: from,
    });

    const action = gatherActionUrl(conversationId, business.slug);
    if (!action) {
      res
        .status(200)
        .type("text/xml")
        .send(buildTwimlSayAndHangup({ say: "Voice is not configured. Please try again later." }));
      return;
    }

    res
      .status(200)
      .type("text/xml")
      .send(buildTwimlSayAndGather({ say: openingLine, gatherActionUrl: action }));
  } catch (err) {
    logger.error({ err: redactObject(err) }, "Voice inbound webhook error");
    res
      .status(200)
      .type("text/xml")
      .send(buildTwimlSayAndHangup({ say: "Sorry, something went wrong. Goodbye." }));
  }
});

router.post("/channels/voice/gather", formParser, async (req, res): Promise<void> => {
  try {
    const params = req.body as Record<string, string>;
    const callSid = params["CallSid"];
    const speech = params["SpeechResult"] ?? "";

    if (!validateTwilio(req, params)) {
      res.status(403).end();
      return;
    }

    const slug = typeof req.query.slug === "string" ? req.query.slug : "";
    if (!callSid || !slug) {
      res
        .status(200)
        .type("text/xml")
        .send(buildTwimlSayAndHangup({ say: "Session error. Goodbye." }));
      return;
    }

    const turn = await processVoiceSpeechTurn({
      callSid,
      speechResult: speech,
      businessSlug: slug,
    });

    if (turn.endCall || !turn.gatherAgain) {
      res.status(200).type("text/xml").send(buildTwimlSayAndHangup({ say: turn.twimlSay }));
      return;
    }

    const conversationId =
      typeof req.query.conversationId === "string" ? req.query.conversationId : "";
    const action = gatherActionUrl(conversationId, slug);
    if (!action) {
      res.status(200).type("text/xml").send(buildTwimlSayAndHangup({ say: turn.twimlSay }));
      return;
    }

    res
      .status(200)
      .type("text/xml")
      .send(buildTwimlSayAndGather({ say: turn.twimlSay, gatherActionUrl: action }));
  } catch (err) {
    logger.error({ err: redactObject(err) }, "Voice gather webhook error");
    res
      .status(200)
      .type("text/xml")
      .send(buildTwimlSayAndHangup({ say: "Sorry, something went wrong. Goodbye." }));
  }
});

router.post("/channels/voice/status", formParser, async (req, res): Promise<void> => {
  const ack = () => res.status(200).end();
  try {
    const params = req.body as Record<string, string>;
    if (!validateTwilio(req, params)) {
      res.status(403).end();
      return;
    }

    const callSid = params["CallSid"];
    const callStatus = params["CallStatus"] ?? "";
    const duration = parseInt(params["CallDuration"] ?? "0", 10);

    if (callSid) {
      await recordVoiceCallDuration({
        callSid,
        callDurationSec: Number.isFinite(duration) ? duration : 0,
        callStatus,
      });
    }
    ack();
  } catch (err) {
    logger.error({ err: redactObject(err) }, "Voice status webhook error");
    ack();
  }
});

export default router;
