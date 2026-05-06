// Owner/admin routes for the per-shop Twilio number + Resend from-address
// + a test-send box. When Twilio creds are absent endpoints return 503
// (TWILIO_NOT_CONFIGURED) so the Settings UI can surface it cleanly.

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

// List available Twilio local numbers (defaults to IE, Closed Beta).
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

// Provision a Twilio number for this business. If body.phoneNumber is
// omitted the server picks the first available SMS-enabled IE/areaCode=1
// number (Closed Beta default). 409 if a number is already bound.
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

    // Server-driven default: Closed Beta target is Ireland (IE), preferred
    // area code "1" (Dublin). When the client doesn't pass an explicit
    // E.164, search Twilio for the first SMS-enabled local IE/areaCode=1
    // number and provision that. Explicit phoneNumber overrides this path.
    let phoneNumber = (req.body?.phoneNumber as string | undefined)?.trim();
    const country = (req.body?.countryCode as string | undefined)?.trim() || "IE";
    const preferredArea = (req.body?.areaCode as string | undefined)?.trim()
      || (country === "IE" ? "1" : undefined);

    try {
      const twilio = createTwilioClient({ accountSid: sid, authToken: token });
      if (!phoneNumber) {
        const candidates = await twilio.searchAvailableLocalNumbers({
          countryCode: country,
          areaCode: preferredArea,
          smsEnabled: true,
          limit: 1,
        });
        if (candidates.length === 0) {
          res.status(404).json({
            error: `No available ${country} numbers${preferredArea ? ` in area ${preferredArea}` : ""}. Pass phoneNumber explicitly or try a different areaCode.`,
            code: "NO_AVAILABLE_NUMBERS",
          });
          return;
        }
        phoneNumber = candidates[0].phoneNumber;
      }
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

// Test-send: SMS or email through the real transports. Writes to
// notificationLogs either way so failures are inspectable.
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
      // Transient conversation so the disclosure-prefix path runs.
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
