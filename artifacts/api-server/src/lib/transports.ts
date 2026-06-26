// Boot wiring for outbound transports. Binds Twilio + Resend into the
// ai-outbound service when their creds are present; otherwise the default
// throwing transports stay in place so missing-secret sends land FAILED
// (never silently SENT). Per-shop sender (`from`) falls back to
// TWILIO_DEFAULT_FROM / RESEND_DEFAULT_FROM.

import { createResendClient } from "@workspace/integrations-resend";
import { createTwilioClient } from "@workspace/integrations-twilio";
import type { SmsTransport, EmailTransport } from "../services/ai-outbound.service";
import { setTransactionalEmailTransport } from "../services/transactional-email.service";
import { initOutboundChannels } from "./channel-router";
import { logger } from "./logger";

export interface TransportStatus {
  smsProvider: "twilio" | "noop";
  emailProvider: "resend" | "noop";
  twilioDefaultFrom: string | null;
  resendDefaultFrom: string | null;
  hasTwilioCreds: boolean;
  hasResendKey: boolean;
}

let _status: TransportStatus = {
  smsProvider: "noop",
  emailProvider: "noop",
  twilioDefaultFrom: null,
  resendDefaultFrom: null,
  hasTwilioCreds: false,
  hasResendKey: false,
};

export function getTransportStatus(): TransportStatus {
  return { ..._status };
}

/** Platform SMS for guest-hub OTP and other non-tenant sends. */
export function getPlatformSmsTransport(): SmsTransport | null {
  return smsTransportImpl;
}

/** Platform email for guest-hub OTP and transactional sends. */
export function getPlatformEmailTransport(): EmailTransport | null {
  return emailTransportImpl;
}

let smsTransportImpl: SmsTransport | null = null;
let emailTransportImpl: EmailTransport | null = null;

export function initTransports(): void {
  const twilioSid = process.env["TWILIO_ACCOUNT_SID"];
  const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
  const twilioDefaultFrom = process.env["TWILIO_DEFAULT_FROM"] ?? null;

  const resendKey = process.env["RESEND_API_KEY"];
  const resendDefaultFrom =
    process.env["RESEND_DEFAULT_FROM"] ?? "Livia <onboarding@resend.dev>";

  _status.twilioDefaultFrom = twilioDefaultFrom;
  _status.resendDefaultFrom = resendDefaultFrom;
  _status.hasTwilioCreds = Boolean(twilioSid && twilioToken);
  _status.hasResendKey = Boolean(resendKey);

  if (twilioSid && twilioToken) {
    const twilio = createTwilioClient({ accountSid: twilioSid, authToken: twilioToken });
    const transport: SmsTransport = async ({ to, body, from }) => {
      const sender = from ?? twilioDefaultFrom;
      if (!sender) {
        throw new Error(
          "No SMS sender — set business.twilioPhoneNumber or TWILIO_DEFAULT_FROM",
        );
      }
      const r = await twilio.sendSms({ from: sender, to, body });
      return { externalMessageId: r.sid };
    };
    smsTransportImpl = transport;
    _status.smsProvider = "twilio";
    logger.info(
      { twilioDefaultFrom: twilioDefaultFrom ?? "(none — per-shop only)" },
      "Twilio SMS transport wired",
    );
  } else {
    logger.warn(
      "TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN not set — outbound SMS sends will be logged as FAILED until provisioned.",
    );
  }

  if (resendKey) {
    const resend = createResendClient({ apiKey: resendKey });
    const transport: EmailTransport = async ({ to, subject, body, html, from, replyTo }) => {
      const sender = from ?? resendDefaultFrom;
      const r = await resend.send({
        from: sender,
        to,
        subject,
        html: html ?? `<pre style="font-family:inherit;white-space:pre-wrap;">${escapeHtml(body)}</pre>`,
        text: body,
        ...(replyTo ? { replyTo } : {}),
      });
      return { externalMessageId: r.id };
    };
    emailTransportImpl = transport;
    _status.emailProvider = "resend";
    logger.info({ resendDefaultFrom }, "Resend email transport wired");
  } else {
    logger.warn(
      "RESEND_API_KEY not set — outbound email sends will be logged as FAILED until provisioned.",
    );
  }

  const sms: SmsTransport =
    smsTransportImpl ??
    (async () => {
      throw new Error(
        "TRANSPORT_NOT_CONFIGURED: SMS transport not configured (missing TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN)",
      );
    });
  const email: EmailTransport =
    emailTransportImpl ??
    (async () => {
      throw new Error("TRANSPORT_NOT_CONFIGURED: Email transport not configured (missing RESEND_API_KEY)");
    });

  setTransactionalEmailTransport(email);
  initOutboundChannels({ sms, email });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
