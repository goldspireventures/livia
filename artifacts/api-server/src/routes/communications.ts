// Owner-facing routes for managing the per-shop Twilio number and the
// Resend "from" address, plus a test-send box that exercises both
// transports end-to-end.
//
// Provisioning calls Twilio's AvailablePhoneNumbers + IncomingPhoneNumbers
// APIs and writes the resulting number + sid back to the business row.
// When TWILIO_ACCOUNT_SID is absent these endpoints return 503 with a
// clear "not configured" message, which the Settings UI surfaces to the
// owner — no silent failure.

import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  userIsOwnerOrAdmin,
  getBusinessById,
  updateBusiness,
} from "../services/businesses.service";
import { createTwilioClient } from "@workspace/integrations-twilio";
import { sendAiSms, sendAiEmail } from "../services/ai-outbound.service";
import { createConversation } from "../services/conversations.service";
import { getTransportStatus } from "../lib/transports";

const router: IRouter = Router();

function smsWebhookUrl(): string | null {
  const base = process.env["PUBLIC_BASE_URL"];
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/api/channels/sms/inbound`;
}

router.get(
  "/businesses/:businessId/communications",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const { businessId } = req.params;
    const id = Array.isArray(businessId) ? businessId[0] : businessId;

    if (!(await userIsOwnerOrAdmin(userId, id))) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const biz = await getBusinessById(id);
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

    const status = getTransportStatus();
    res.json({
      twilioPhoneNumber: biz.twilioPhoneNumber,
      twilioPhoneSid: biz.twilioPhoneSid,
      resendFromAddress: biz.resendFromAddress,
      providerStatus: {
        smsProvider: status.smsProvider,
        emailProvider: status.emailProvider,
        emailDefaultFrom: status.resendDefaultFrom,
      },
      smsWebhookUrl: smsWebhookUrl(),
    });
  },
);

// List a few available Twilio local numbers in a country so the owner can
// pick one. countryCode defaults to IE for Ireland (Closed Beta target).
router.get(
  "/businesses/:businessId/communications/sms/available-numbers",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const { businessId } = req.params;
    const id = Array.isArray(businessId) ? businessId[0] : businessId;
    if (!(await userIsOwnerOrAdmin(userId, id))) {
      res.status(404).json({ error: "Business not found" }); return;
    }

    const sid = process.env["TWILIO_ACCOUNT_SID"];
    const token = process.env["TWILIO_AUTH_TOKEN"];
    if (!sid || !token) {
      res.status(503).json({
        error: "Twilio is not configured for this environment yet.",
        code: "TWILIO_NOT_CONFIGURED",
      });
      return;
    }

    const country = (req.query["countryCode"] as string | undefined) ?? "IE";
    const areaCode = req.query["areaCode"] as string | undefined;

    try {
      const twilio = createTwilioClient({ accountSid: sid, authToken: token });
      const numbers = await twilio.searchAvailableLocalNumbers({
        countryCode: country,
        areaCode,
        smsEnabled: true,
        limit: 5,
      });
      res.json({ numbers });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : "Twilio search failed",
        code: "TWILIO_SEARCH_FAILED",
      });
    }
  },
);

// Provision (purchase) a Twilio number and bind it to this business.
// If a number is already bound, returns 409 — owner must release first.
router.post(
  "/businesses/:businessId/communications/sms/provision-number",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const { businessId } = req.params;
    const id = Array.isArray(businessId) ? businessId[0] : businessId;
    if (!(await userIsOwnerOrAdmin(userId, id))) {
      res.status(404).json({ error: "Business not found" }); return;
    }

    const sid = process.env["TWILIO_ACCOUNT_SID"];
    const token = process.env["TWILIO_AUTH_TOKEN"];
    if (!sid || !token) {
      res.status(503).json({
        error: "Twilio is not configured for this environment yet.",
        code: "TWILIO_NOT_CONFIGURED",
      });
      return;
    }
    const webhook = smsWebhookUrl();
    if (!webhook) {
      res.status(503).json({
        error: "PUBLIC_BASE_URL must be set so Twilio knows where to deliver inbound SMS.",
        code: "PUBLIC_BASE_URL_MISSING",
      });
      return;
    }

    const biz = await getBusinessById(id);
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    if (biz.twilioPhoneSid) {
      res.status(409).json({
        error: "This shop already has a number provisioned. Release it first.",
        code: "ALREADY_PROVISIONED",
        twilioPhoneNumber: biz.twilioPhoneNumber,
      });
      return;
    }

    const phoneNumber = (req.body?.phoneNumber as string | undefined)?.trim();
    if (!phoneNumber) {
      res.status(400).json({ error: "phoneNumber is required (E.164, e.g. +35315551234)" });
      return;
    }

    try {
      const twilio = createTwilioClient({ accountSid: sid, authToken: token });
      const purchased = await twilio.purchasePhoneNumber({
        phoneNumber,
        smsUrl: webhook,
        friendlyName: `Livia · ${biz.name}`,
      });
      await updateBusiness(id, {
        twilioPhoneNumber: purchased.phoneNumber,
        twilioPhoneSid: purchased.sid,
      });
      res.status(201).json({
        twilioPhoneNumber: purchased.phoneNumber,
        twilioPhoneSid: purchased.sid,
        smsWebhookUrl: webhook,
      });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : "Twilio purchase failed",
        code: "TWILIO_PURCHASE_FAILED",
      });
    }
  },
);

// Release the provisioned number (returns it to Twilio's pool).
router.delete(
  "/businesses/:businessId/communications/sms/number",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const { businessId } = req.params;
    const id = Array.isArray(businessId) ? businessId[0] : businessId;
    if (!(await userIsOwnerOrAdmin(userId, id))) {
      res.status(404).json({ error: "Business not found" }); return;
    }
    const biz = await getBusinessById(id);
    if (!biz?.twilioPhoneSid) {
      res.status(404).json({ error: "No number provisioned" }); return;
    }
    const sid = process.env["TWILIO_ACCOUNT_SID"];
    const token = process.env["TWILIO_AUTH_TOKEN"];
    if (sid && token) {
      try {
        const twilio = createTwilioClient({ accountSid: sid, authToken: token });
        await twilio.releasePhoneNumber(biz.twilioPhoneSid);
      } catch {
        // Best-effort — even if Twilio release fails we clear our row so
        // the owner is unblocked. They can clean up in Twilio console.
      }
    }
    await updateBusiness(id, { twilioPhoneNumber: null, twilioPhoneSid: null });
    res.status(204).end();
  },
);

// Update the per-shop "from" email address (e.g. "Acme Salon <hi@acme.com>").
router.put(
  "/businesses/:businessId/communications/email/from",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const { businessId } = req.params;
    const id = Array.isArray(businessId) ? businessId[0] : businessId;
    if (!(await userIsOwnerOrAdmin(userId, id))) {
      res.status(404).json({ error: "Business not found" }); return;
    }
    const fromAddress = (req.body?.fromAddress as string | undefined)?.trim() || null;
    await updateBusiness(id, { resendFromAddress: fromAddress });
    res.json({ resendFromAddress: fromAddress });
  },
);

// Test-send box: sends a single SMS or email through the real transports
// so the owner can verify their setup. Always writes to notificationLogs
// so failures are inspectable.
router.post(
  "/businesses/:businessId/communications/test-send",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getUserId(req);
    const { businessId } = req.params;
    const id = Array.isArray(businessId) ? businessId[0] : businessId;
    if (!(await userIsOwnerOrAdmin(userId, id))) {
      res.status(404).json({ error: "Business not found" }); return;
    }
    const biz = await getBusinessById(id);
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

    const channel = req.body?.channel as "SMS" | "EMAIL" | undefined;
    const to = (req.body?.to as string | undefined)?.trim();
    const message = (req.body?.message as string | undefined)?.trim()
      ?? "Hi — this is a Livia test message. Reply OK if you received it.";

    if (channel !== "SMS" && channel !== "EMAIL") {
      res.status(400).json({ error: "channel must be 'SMS' or 'EMAIL'" }); return;
    }
    if (!to) {
      res.status(400).json({ error: "to is required" }); return;
    }

    if (channel === "SMS") {
      // Test SMS uses a transient conversation so it routes through the
      // disclosure-prefix path, faithful to a real customer reply.
      const convo = await createConversation({
        businessId: biz.id,
        channel: "SMS",
        customerPhone: to,
      });
      const result = await sendAiSms({
        conversationId: convo.id,
        businessId: biz.id,
        businessName: biz.name,
        customerPhone: to,
        content: message,
        fromPhone: biz.twilioPhoneNumber ?? null,
      });
      res.json({ channel, status: result.status, body: result.body, conversationId: convo.id });
      return;
    }

    const result = await sendAiEmail({
      businessId: biz.id,
      businessName: biz.name,
      to,
      subject: `Livia test message · ${biz.name}`,
      body: message,
      templateKey: "test-send",
      fromAddress: biz.resendFromAddress ?? null,
    });
    res.json({ channel, status: result.status, body: result.body });
  },
);

export default router;
