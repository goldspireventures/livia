import webpush from "web-push";
import { logger } from "../lib/logger";

let configured = false;

export function isWebPushConfigured(): boolean {
  const pub = process.env["VAPID_PUBLIC_KEY"]?.trim();
  const priv = process.env["VAPID_PRIVATE_KEY"]?.trim();
  return Boolean(pub && priv);
}

export function getVapidPublicKey(): string | null {
  return process.env["VAPID_PUBLIC_KEY"]?.trim() ?? null;
}

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!isWebPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env["VAPID_SUBJECT"]?.trim() || "mailto:support@livia.io",
    process.env["VAPID_PUBLIC_KEY"]!.trim(),
    process.env["VAPID_PRIVATE_KEY"]!.trim(),
  );
  configured = true;
  return true;
}

export async function sendWebPushToSubscription(
  subscriptionJson: string,
  payload: { title: string; body: string; data?: Record<string, string> },
): Promise<boolean> {
  if (!ensureConfigured()) return false;
  try {
    const sub = JSON.parse(subscriptionJson) as webpush.PushSubscription;
    await webpush.sendNotification(
      sub,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    );
    return true;
  } catch (err) {
    logger.warn({ err }, "web push send failed");
    return false;
  }
}
