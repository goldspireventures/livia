// Branded HTML email templates for booking lifecycle. Treated as
// React-Email-equivalent renderers (we render to HTML strings directly to
// avoid pulling 20MB of JSX deps into the api-server bundle). Each template
// returns { subject, html, text } and accepts pre-disclosed body copy from
// the api-server's `composeAiEmailBody` so the EU AI Act Art. 50 disclosure
// block is never duplicated or skipped.
//
// Visual language follows the Aurora brand: midnight base, cyan primary,
// generous spacing, no decorative imagery (transactional emails should look
// like the product, not a marketing blast).

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

interface BookingTemplateContext {
  businessName: string;
  customerFirstName: string;
  serviceName: string;
  staffName?: string | null;
  startAtFormatted: string; // pre-formatted in the business timezone, e.g. "Tue 12 May at 14:30"
  durationMinutes: number;
  locationLine?: string | null;
  manageUrl?: string | null;
  // Plain-text body. sendAiEmail() composes the Art. 50 disclosure once
  // before persisting / sending — DO NOT add disclosure here. The HTML
  // renderer embeds the disclosure block explicitly via `disclosureLine`.
  bodyText: string;
  disclosureLine: string;
}

const cssReset = `
  body { margin: 0; padding: 0; background: #f6f3ec; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Geist, system-ui, sans-serif; color: #0b1020; }
  a { color: #06b6d4; }
  .wrap { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border: 1px solid rgba(15,23,42,0.08); border-radius: 16px; padding: 32px; }
  .h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 12px 0; }
  .meta { font-size: 14px; color: #475569; line-height: 1.6; }
  .meta b { color: #0b1020; font-weight: 600; }
  .divider { height: 1px; background: rgba(15,23,42,0.08); margin: 24px 0; }
  .btn { display: inline-block; background: #06b6d4; color: #ffffff !important; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; }
  .footer { font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.6; }
  .brand { font-family: "Cormorant Garamond", Georgia, serif; font-size: 20px; color: #8a7549; letter-spacing: 0.02em; }
  .brand i { font-style: italic; }
`;

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(args: {
  preheader: string;
  businessName: string;
  inner: string;
  disclosureLine: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escape(args.businessName)}</title>
  <style>${cssReset}</style>
</head>
<body>
  <span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#f6f3ec;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(args.preheader)}</span>
  <div class="wrap">
    <div class="brand">Li<i>v</i>ia</div>
    <div class="card" style="margin-top:16px;">
      ${args.inner}
      <div class="divider"></div>
      <p class="footer">${escape(args.disclosureLine)}</p>
    </div>
    <p class="footer" style="text-align:center;">${escape(args.businessName)} · sent via Livia</p>
  </div>
</body>
</html>`;
}

function bookingMetaBlock(c: BookingTemplateContext): string {
  return `
    <p class="meta">
      <b>${escape(c.serviceName)}</b>${c.staffName ? ` with <b>${escape(c.staffName)}</b>` : ""}<br/>
      ${escape(c.startAtFormatted)} · ${c.durationMinutes} min${c.locationLine ? `<br/>${escape(c.locationLine)}` : ""}
    </p>
  `.trim();
}

export function renderBookingConfirmationEmail(c: BookingTemplateContext): RenderedEmail {
  const subject = `Booked: ${c.serviceName} on ${c.startAtFormatted} — ${c.businessName}`;
  const inner = `
    <h1 class="h1">You're booked, ${escape(c.customerFirstName)}.</h1>
    <p class="meta">Looking forward to seeing you at <b>${escape(c.businessName)}</b>.</p>
    ${bookingMetaBlock(c)}
    ${c.manageUrl ? `<p style="margin-top:24px;"><a href="${escape(c.manageUrl)}" class="btn">View or change booking</a></p>` : ""}
  `;
  return {
    subject,
    html: shell({
      preheader: `Your ${c.serviceName} on ${c.startAtFormatted} is confirmed.`,
      businessName: c.businessName,
      inner,
      disclosureLine: c.disclosureLine,
    }),
    text: c.bodyText,
  };
}

export function renderBookingReminderEmail(c: BookingTemplateContext): RenderedEmail {
  const subject = `Reminder: ${c.serviceName} tomorrow — ${c.businessName}`;
  const inner = `
    <h1 class="h1">See you tomorrow, ${escape(c.customerFirstName)}.</h1>
    <p class="meta">Quick reminder of your appointment with <b>${escape(c.businessName)}</b>.</p>
    ${bookingMetaBlock(c)}
    ${c.manageUrl ? `<p style="margin-top:24px;"><a href="${escape(c.manageUrl)}" class="btn">Manage booking</a></p>` : ""}
    <p class="footer" style="margin-top:16px;">Need to reschedule? Reply to this email and we'll sort it.</p>
  `;
  return {
    subject,
    html: shell({
      preheader: `Tomorrow at ${c.startAtFormatted} — ${c.serviceName}.`,
      businessName: c.businessName,
      inner,
      disclosureLine: c.disclosureLine,
    }),
    text: c.bodyText,
  };
}

export function renderBookingCancellationEmail(
  c: BookingTemplateContext & { reason?: string | null; rebookUrl?: string | null },
): RenderedEmail {
  const subject = `Cancelled: ${c.serviceName} on ${c.startAtFormatted} — ${c.businessName}`;
  const inner = `
    <h1 class="h1">Your booking has been cancelled.</h1>
    <p class="meta">${escape(c.businessName)} has cancelled the appointment below.${c.reason ? ` Reason: ${escape(c.reason)}.` : ""}</p>
    ${bookingMetaBlock(c)}
    ${c.rebookUrl ? `<p style="margin-top:24px;"><a href="${escape(c.rebookUrl)}" class="btn">Rebook</a></p>` : ""}
  `;
  return {
    subject,
    html: shell({
      preheader: `Your ${c.serviceName} on ${c.startAtFormatted} has been cancelled.`,
      businessName: c.businessName,
      inner,
      disclosureLine: c.disclosureLine,
    }),
    text: c.bodyText,
  };
}

export type { BookingTemplateContext };
