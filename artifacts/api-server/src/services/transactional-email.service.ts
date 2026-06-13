import { db, notificationLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateId } from "../lib/id";
import { getTransportStatus } from "../lib/transports";

type EmailTransport = (args: {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
}) => Promise<{ externalMessageId?: string }>;

let emailTransport: EmailTransport | null = null;

export function setTransactionalEmailTransport(t: EmailTransport): void {
  emailTransport = t;
}

/** Human ops email — no AI disclosure block. */
export async function sendOperationalEmail(args: {
  businessId: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  templateKey: string;
}): Promise<"sent" | "skipped" | "failed"> {
  if (!emailTransport) {
    if (!getTransportStatus().hasResendKey) return "skipped";
    return "failed";
  }

  const notifId = generateId();
  const from = getTransportStatus().resendDefaultFrom ?? undefined;
  await db.insert(notificationLogsTable).values({
    id: notifId,
    businessId: args.businessId,
    channel: "EMAIL",
    templateKey: args.templateKey,
    status: "PENDING",
    payload: { to: args.to, subject: args.subject, body: args.body },
  });

  try {
    const result = await emailTransport({
      to: args.to,
      subject: args.subject,
      body: args.body,
      html: args.html,
      from: from ?? undefined,
    });
    await db
      .update(notificationLogsTable)
      .set({
        status: "SENT",
        sentAt: new Date(),
        payload: {
          to: args.to,
          subject: args.subject,
          body: args.body,
          externalMessageId: result.externalMessageId ?? null,
        },
      })
      .where(eq(notificationLogsTable.id, notifId));
    return "sent";
  } catch (err) {
    await db
      .update(notificationLogsTable)
      .set({
        status: "FAILED",
        payload: {
          to: args.to,
          subject: args.subject,
          error: err instanceof Error ? err.message : String(err),
        },
      })
      .where(eq(notificationLogsTable.id, notifId));
    return "failed";
  }
}
