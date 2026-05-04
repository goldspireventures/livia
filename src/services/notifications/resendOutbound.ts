import "server-only";

import { env } from "@/lib/env";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmailViaResend(args: SendEmailArgs): Promise<{ id: string } | { error: string }> {
  const apiKey = env.RESEND_API_KEY;
  const from = env.NOTIFICATION_EMAIL_FROM;
  if (!apiKey || !from) {
    return { error: "missing_resend_config" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return { error: json.message ?? `resend_http_${res.status}` };
  }
  if (!json.id) {
    return { error: "resend_no_id" };
  }
  return { id: json.id };
}
