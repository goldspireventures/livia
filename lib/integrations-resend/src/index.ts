// Thin Resend transactional-email client. Pure fetch — no SDK pulled — so
// the api-server bundle stays small. Used by api-server's transport wiring
// (`lib/transports.ts`) when RESEND_API_KEY is present; absent → no-op
// transport keeps writing PENDING rows to notificationLogs.

export interface ResendSendArgs {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface ResendSendResult {
  id: string;
}

export class ResendError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Resend HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

export interface ResendClient {
  send(args: ResendSendArgs): Promise<ResendSendResult>;
}

export function createResendClient(args: { apiKey: string; baseUrl?: string }): ResendClient {
  const base = (args.baseUrl ?? "https://api.resend.com").replace(/\/+$/, "");
  return {
    async send(send) {
      const res = await fetch(`${base}/emails`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${args.apiKey}`,
        },
        body: JSON.stringify({
          from: send.from,
          to: send.to,
          subject: send.subject,
          html: send.html,
          ...(send.text ? { text: send.text } : {}),
          ...(send.replyTo ? { reply_to: send.replyTo } : {}),
          ...(send.tags ? { tags: send.tags } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok || !body.id) {
        throw new ResendError(res.status, body, body.message);
      }
      return { id: body.id };
    },
  };
}
