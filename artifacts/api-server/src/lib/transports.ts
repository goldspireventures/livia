// Boot wiring for outbound communication transports. Reads secrets at
// startup and binds Twilio + Resend into the ai-outbound service if the
// secrets are present. Absent secrets → the default no-op transports stay
// in place so disclosure-correct PENDING rows still land in
// notificationLogs (Closed-Beta safe behaviour).
//
// Per-shop sender selection happens here too: the SMS transport accepts an
// optional `from` (the shop's Twilio phone number); if missing it falls
// back to TWILIO_DEFAULT_FROM. The email transport uses the
// per-business `resendFromAddress` if provided in the call site, else
// RESEND_DEFAULT_FROM.

import { createResendClient } from "@workspace/integrations-resend";
import { createTwilioClient } from "@workspace/integrations-twilio";
import {
  setSmsTransport,
  setEmailTransport,
  type SmsTransport,
  type EmailTransport,
} from "../services/ai-outbound.service";
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
    setSmsTransport(transport);
    _status.smsProvider = "twilio";
    logger.info(
      { twilioDefaultFrom: twilioDefaultFrom ?? "(none — per-shop only)" },
      "Twilio SMS transport wired",
    );
  } else {
    logger.warn(
      "TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN not set — SMS sends will write PENDING rows only.",
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
    setEmailTransport(transport);
    _status.emailProvider = "resend";
    logger.info({ resendDefaultFrom }, "Resend email transport wired");
  } else {
    logger.warn(
      "RESEND_API_KEY not set — email sends will write PENDING rows only.",
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
