import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { requireEntitlement } from "../lib/entitlements-gate";
import { resolveBillingState } from "../services/billing.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const getBizId = (param: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

/**
 * Voice receptionist surface (v1-scope wedge).
 * Entitlement-gated; full Twilio bridge lands in Phase 7.
 */
router.get(
  "/businesses/:businessId/voice/status",
  requireAuth,
  requireRole("ADMIN"),
  requireEntitlement("voice_receptionist"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const billing = await resolveBillingState(businessId);
    const voiceIngress =
      Boolean(process.env["TWILIO_ACCOUNT_SID"] && process.env["TWILIO_AUTH_TOKEN"]) &&
      Boolean(process.env["PUBLIC_BASE_URL"]);

    res.json({
      enabled: true,
      locale: "en-IE",
      outcomeShareRate: billing.voiceOutcomeShareRate,
      outcomeShareEurCentsThisPeriod: billing.voiceOutcomeShareEurCents,
      outcomeCapEurCents: billing.voiceOutcomeCapEurCents,
      ingressReady: voiceIngress,
      webhookPath: "/api/channels/voice/inbound",
      recordingPolicy: "no_recording_v1",
      message: voiceIngress
        ? "Voice receptionist active — provision your shop number in Settings → Communications."
        : "Set TWILIO_* and PUBLIC_BASE_URL to enable voice webhooks.",
    });
  },
);

router.post(
  "/businesses/:businessId/voice/simulate-outcome",
  requireAuth,
  requireRole("OWNER"),
  requireEntitlement("voice_receptionist"),
  async (req, res): Promise<void> => {
    if (process.env.NODE_ENV === "production") {
      sendError(res, req, 403, "Simulator not available in production");
      return;
    }
    const businessId = getBizId(req.params.businessId);
    const bookingId = (req.body?.bookingId as string) ?? "sim-booking";
    const bookingValueEurCents =
      typeof req.body?.bookingValueEurCents === "number"
        ? req.body.bookingValueEurCents
        : 5000;
    const { recordMeter } = await import("../lib/metering-recorder.js");
    await recordMeter(businessId, "voice_booking_outcome", 1, {
      bookingId,
      bookingValueEurCents,
      simulated: true,
    });
    const billing = await resolveBillingState(businessId);
    res.json({ ok: true, voiceOutcomeShareEurCents: billing.voiceOutcomeShareEurCents });
  },
);

export default router;
