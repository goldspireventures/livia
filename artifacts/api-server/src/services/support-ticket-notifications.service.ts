import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendOperationalEmail } from "./transactional-email.service";

const SUPPORT_INBOX = process.env["SUPPORT_INBOX_EMAIL"] ?? "support@livia.io";

function slaLine(severity: string): string {
  if (severity === "blocking") {
    return "We aim to respond within 4 business hours (Mon–Fri, Ireland).";
  }
  if (severity === "nice_to_have") {
    return "We aim to respond within 5 business days.";
  }
  return "We aim to respond within 2 business days.";
}

export async function sendSupportTicketAckEmails(args: {
  businessId: string;
  userId: string;
  ticketId: string;
  category: string;
  severity: string;
}): Promise<{ reporter: "sent" | "skipped" | "failed"; inbox: "sent" | "skipped" | "failed" }> {
  const [user] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, args.userId))
    .limit(1);

  const reporterEmail = user?.email?.trim();
  const subject = `We received your message — ticket ${args.ticketId.slice(0, 8)}`;
  const body = [
    `Thanks for contacting Livia Support.`,
    ``,
    `Ticket reference: ${args.ticketId}`,
    `Category: ${args.category}`,
    `Severity: ${args.severity}`,
    ``,
    slaLine(args.severity),
    ``,
    `For urgent blocking issues you can also email ${SUPPORT_INBOX} and include this ticket id.`,
    ``,
    `— Livia Support`,
  ].join("\n");

  let reporter: "sent" | "skipped" | "failed" = "skipped";
  if (reporterEmail) {
    reporter = await sendOperationalEmail({
      businessId: args.businessId,
      to: reporterEmail,
      subject,
      body,
      templateKey: "support-ticket-ack",
    });
  }

  const inboxSubject = `[${args.severity}] ${args.category} — ${args.ticketId.slice(0, 8)}`;
  const inboxBody = [
    `New support ticket for internal queue.`,
    ``,
    `Ticket: ${args.ticketId}`,
    `Business: ${args.businessId}`,
    `Reporter user: ${args.userId}`,
    `Reporter email: ${reporterEmail ?? "(unknown)"}`,
    `Category: ${args.category}`,
    `Severity: ${args.severity}`,
    ``,
    `Internal portal: Support tab → ticket ${args.ticketId}`,
  ].join("\n");

  const inbox = await sendOperationalEmail({
    businessId: args.businessId,
    to: SUPPORT_INBOX,
    subject: inboxSubject,
    body: inboxBody,
    templateKey: "support-ticket-inbox",
  });

  return { reporter, inbox };
}
