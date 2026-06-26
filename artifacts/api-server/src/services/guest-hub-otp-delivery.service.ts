import { GUEST_HUB_COPY, type GuestHubAuthChannel } from "@workspace/policy";
import { getStagingRelaxations } from "../lib/staging-relaxations";
import { logger } from "../lib/logger";

export type GuestHubOtpDeliveryCode =
  | "OTP_SMS_NOT_CONFIGURED"
  | "OTP_EMAIL_NOT_CONFIGURED"
  | "OTP_DELIVERY_FAILED";

export class GuestHubOtpDeliveryError extends Error {
  readonly code: GuestHubOtpDeliveryCode;
  readonly channel: GuestHubAuthChannel;

  constructor(code: GuestHubOtpDeliveryCode, channel: GuestHubAuthChannel, message?: string) {
    super(message ?? code);
    this.name = "GuestHubOtpDeliveryError";
    this.code = code;
    this.channel = channel;
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

/** Send OTP when strict — skipped when staging exposes code in API response. */
export async function deliverGuestHubOtp(args: {
  channel: GuestHubAuthChannel;
  code: string;
  phoneE164?: string | null;
  email?: string | null;
}): Promise<{ delivered: boolean }> {
  const relax = getStagingRelaxations();
  if (relax.guestHub.exposeDevOtp) {
    return { delivered: false };
  }

  const { getPlatformEmailTransport, getPlatformSmsTransport, getTransportStatus } =
    await import("../lib/transports");

  if (args.channel === "email") {
    const to = args.email?.trim();
    if (!to) throw new GuestHubOtpDeliveryError("OTP_EMAIL_NOT_CONFIGURED", "email");
    const status = getTransportStatus();
    if (status.emailProvider !== "resend" || !status.hasResendKey) {
      throw new GuestHubOtpDeliveryError("OTP_EMAIL_NOT_CONFIGURED", "email");
    }
    const transport = getPlatformEmailTransport();
    if (!transport) {
      throw new GuestHubOtpDeliveryError("OTP_EMAIL_NOT_CONFIGURED", "email");
    }
    const subject = GUEST_HUB_COPY.otpEmailSubject;
    const text = GUEST_HUB_COPY.otpEmailBody(args.code);
    const html = `<div style="font-family:system-ui,sans-serif;max-width:420px;line-height:1.5;color:#111">
<p style="margin:0 0 16px">Your My Livia sign-in code:</p>
<p style="margin:0 0 16px;font-size:28px;font-weight:600;letter-spacing:0.2em;font-family:ui-monospace,monospace">${escapeHtml(args.code)}</p>
<p style="margin:0;color:#555;font-size:14px">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
</div>`;
    try {
      await transport({ to, subject, body: text, html });
      logger.info({ channel: "email", toDomain: to.split("@")[1] ?? "unknown" }, "Guest hub OTP sent");
      return { delivered: true };
    } catch (err) {
      logger.error({ err, channel: "email" }, "Guest hub OTP email failed");
      throw new GuestHubOtpDeliveryError("OTP_DELIVERY_FAILED", "email");
    }
  }

  const to = args.phoneE164?.trim();
  if (!to) throw new GuestHubOtpDeliveryError("OTP_SMS_NOT_CONFIGURED", "phone");
  const status = getTransportStatus();
  if (status.smsProvider !== "twilio" || !status.hasTwilioCreds) {
    throw new GuestHubOtpDeliveryError("OTP_SMS_NOT_CONFIGURED", "phone");
  }
  if (!status.twilioDefaultFrom) {
    throw new GuestHubOtpDeliveryError("OTP_SMS_NOT_CONFIGURED", "phone");
  }
  const transport = getPlatformSmsTransport();
  if (!transport) {
    throw new GuestHubOtpDeliveryError("OTP_SMS_NOT_CONFIGURED", "phone");
  }
  const body = GUEST_HUB_COPY.otpSmsBody(args.code);
  try {
    await transport({ to, body });
    logger.info({ channel: "phone" }, "Guest hub OTP SMS sent");
    return { delivered: true };
  } catch (err) {
    logger.error({ err, channel: "phone" }, "Guest hub OTP SMS failed");
    throw new GuestHubOtpDeliveryError("OTP_DELIVERY_FAILED", "phone");
  }
}
