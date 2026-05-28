import { Router, type IRouter, type Request } from "express";
import express from "express";
import {
  parseMetaWebhookPayload,
  verifyMetaWebhookSignature,
} from "@workspace/integrations-meta";
import { logger } from "../lib/logger";
import { redactObject } from "../lib/pii-redaction";
import { requireWebhookSecretInProduction } from "../lib/webhook-guard";
import { processInboundMetaMessage } from "../services/meta-inbound.service";

const router: IRouter = Router();
const jsonWithRaw = express.json({
  verify: (req: Request, _res, buf) => {
    (req as Request & { rawBody?: Buffer }).rawBody = buf;
  },
});

router.get("/channels/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const expected = process.env["META_WEBHOOK_VERIFY_TOKEN"];
  if (mode === "subscribe" && token === expected && typeof challenge === "string") {
    res.status(200).send(challenge);
    return;
  }
  res.status(403).end();
});

router.post("/channels/meta", jsonWithRaw, async (req, res): Promise<void> => {
  res.status(200).json({ ok: true });

  const secret = process.env["META_APP_SECRET"];
  const raw = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!requireWebhookSecretInProduction("META_APP_SECRET")) {
    logger.error("Meta webhook rejected — META_APP_SECRET missing in production");
    return;
  }
  if (!secret || !raw) {
    logger.warn("Meta webhook missing secret or raw body");
    return;
  }
  const ok = verifyMetaWebhookSignature({
    appSecret: secret,
    signatureHeader: req.headers["x-hub-signature-256"] as string | undefined,
    rawBody: raw,
  });
  if (!ok) {
    logger.warn("Meta webhook signature invalid");
    return;
  }

  const messages = parseMetaWebhookPayload(req.body);
  for (const msg of messages) {
    void processInboundMetaMessage(msg).catch((err) => {
      logger.error({ err: redactObject(err), channel: msg.channel }, "Meta inbound processing failed");
    });
  }
});

export default router;
