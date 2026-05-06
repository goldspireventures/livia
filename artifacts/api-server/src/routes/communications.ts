// Owner/admin routes for the per-shop Twilio number + Resend from-address
// + a test-send box. When Twilio creds are absent endpoints return 503
// (TWILIO_NOT_CONFIGURED) so the Settings UI can surface it cleanly.
//
// Access: OWNER+ADMIN. Comms config is sensitive (provisioning costs $$
// and outbound copy is brand-tone) so it's gated above STAFF.

import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { getBusinessById, updateBusiness } from "../services/businesses.service";
import { createTwilioClient } from "@workspace/integrations-twilio";
import { sendAiSms, sendAiEmail } from "../services/ai-outbound.service";
import { createConversation } from "../services/conversations.service";
import { getTransportStatus } from "../lib/transports";

const router: IRouter = Router();
const getBizId = (param: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

function smsWebhookUrl(): string | null {
  const base = process.env["PUBLIC_BASE_URL"];
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/api/channels/sms/inbound`;
}

router.get(
  "/businesses/:businessId/communications",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const id = getBizId(req.params.businessId);
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

router.get(
  "/businesses/:businessId/communications/sms/available-numbers",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
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
        countryCode: country, areaCode, smsEnabled: true, limit: 5,
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

router.post(
  "/businesses/:businessId/communications/sms/provision-number",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const id = getBizId(req.params.businessId);
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

    let phoneNumber = (req.body?.phoneNumber as string | undefined)?.trim();
    const country = (req.body?.countryCode as string | undefined)?.trim() || "IE";
    const preferredArea = (req.body?.areaCode as string | undefined)?.trim()
      || (country === "IE" ? "1" : undefined);

    try {
      const twilio = createTwilioClient({ accountSid: sid, authToken: token });
      if (!phoneNumber) {
        const candidates = await twilio.searchAvailableLocalNumbers({
          countryCode: country, areaCode: preferredArea, smsEnabled: true, limit: 1,
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
        phoneNumber, smsUrl: webhook, friendlyName: `Livia · ${biz.name}`,
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

router.delete(
  "/businesses/:businessId/communications/sms/number",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const id = getBizId(req.params.businessId);
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
        // Best-effort — clear our row even if Twilio release fails.
      }
    }
    await updateBusiness(id, { twilioPhoneNumber: null, twilioPhoneSid: null });
    res.status(204).end();
  },
);

router.put(
  "/businesses/:businessId/communications/email/from",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const id = getBizId(req.params.businessId);
    const fromAddress = (req.body?.fromAddress as string | undefined)?.trim() || null;
    await updateBusiness(id, { resendFromAddress: fromAddress });
    res.json({ resendFromAddress: fromAddress });
  },
);

router.post(
  "/businesses/:businessId/communications/test-send",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const id = getBizId(req.params.businessId);
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
      const convo = await createConversation({
        businessId: biz.id, channel: "SMS", customerPhone: to,
      });
      const result = await sendAiSms({
        conversationId: convo.id, businessId: biz.id, businessName: biz.name,
        customerPhone: to, content: message,
        fromPhone: biz.twilioPhoneNumber ?? null,
      });
      res.json({ channel, status: result.status, body: result.body, conversationId: convo.id });
      return;
    }

    const result = await sendAiEmail({
      businessId: biz.id, businessName: biz.name, to,
      subject: `Livia test message · ${biz.name}`, body: message,
      templateKey: "test-send", fromAddress: biz.resendFromAddress ?? null,
    });
    res.json({ channel, status: result.status, body: result.body });
  },
);

export default router;
