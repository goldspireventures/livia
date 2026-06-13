import { db, businessesTable, enquiriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendOperationalEmail } from "./transactional-email.service";
import type { QuoteLineItem } from "@workspace/db";
import { getPublicAppOrigin } from "../lib/public-app-origin";
import {
  eventVendorPoweredByLine,
  guestQuotePayFlowExplanation,
  quotePaymentReference,
} from "@workspace/policy";

function eur(minor: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(minor / 100);
}

function formatUnit(unit?: string | null): string {
  switch (unit) {
    case "per_guest":
      return "per guest";
    case "per_table":
      return "per table";
    case "per_item":
      return "per item";
    case "per_metre":
      return "per metre";
    default:
      return "flat";
  }
}

export type QuoteHtmlEventBrief = {
  eventDate?: string | null;
  eventType?: string | null;
  theme?: string | null;
  guestCount?: number | null;
  venue?: string | null;
};

export function renderQuoteHtml(args: {
  businessName: string;
  slug: string;
  token: string;
  logoUrl?: string | null;
  personalMessage?: string | null;
  lines: Array<
    Pick<QuoteLineItem, "name" | "quantity" | "unit" | "unitPriceMinor" | "lineTotalMinor">
  >;
  subtotalMinor: number;
  depositAmountMinor: number;
  balanceDueMinor: number;
  depositPercent: number;
  validUntil?: string | null;
  termsSnapshot?: string | null;
  milestoneDeposits?: Array<{ label: string; percent: number; amountMinor: number; dueDate?: string }>;
  eventBrief?: QuoteHtmlEventBrief | null;
  status?: string;
  invoiceNumber?: string;
}) {
  const quoteUrl = `${getPublicAppOrigin()}/e/${args.slug}/q/${args.token}`;
  const payRef = quotePaymentReference(args.token);
  const qrData = encodeURIComponent(quoteUrl);
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${qrData}`;
  const barcodeImg = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(payRef)}&code=Code128&translate-esc=on&dpi=96`;
  const issued = new Date().toISOString().slice(0, 10);
  const lineRows = args.lines
    .map(
      (l) =>
        `<tr>
          <td>${escapeHtml(l.name)}</td>
          <td class="num">${l.quantity}</td>
          <td class="num muted">${formatUnit(l.unit)}</td>
          <td class="num">${eur(l.unitPriceMinor)}</td>
          <td class="num strong">${eur(l.lineTotalMinor)}</td>
        </tr>`,
    )
    .join("");

  const milestones = (args.milestoneDeposits ?? [])
    .map(
      (m) =>
        `<li><span>${escapeHtml(m.label)}</span><span>${eur(m.amountMinor)}${m.dueDate ? ` · due ${m.dueDate}` : ""}</span></li>`,
    )
    .join("");

  const brief = args.eventBrief;
  const briefRows = [
    brief?.eventType ? `<div class="brief-row"><span>Event</span><span>${escapeHtml(brief.eventType)}</span></div>` : "",
    brief?.eventDate ? `<div class="brief-row"><span>Date</span><span>${escapeHtml(brief.eventDate)}</span></div>` : "",
    brief?.guestCount ? `<div class="brief-row"><span>Guests</span><span>${brief.guestCount}</span></div>` : "",
    brief?.theme ? `<div class="brief-row"><span>Theme</span><span>${escapeHtml(brief.theme)}</span></div>` : "",
    brief?.venue ? `<div class="brief-row"><span>Venue</span><span>${escapeHtml(brief.venue)}</span></div>` : "",
  ]
    .filter(Boolean)
    .join("");

  const logoBlock = args.logoUrl
    ? `<img src="${escapeHtml(args.logoUrl)}" alt="" class="logo" />`
    : `<div class="logo-fallback">${escapeHtml(args.businessName.charAt(0))}</div>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Quote — ${escapeHtml(args.businessName)}</title>
<style>
:root{--ink:#1c1917;--muted:#78716c;--accent:#b45309;--line:#e7e5e4;--bg:#fafaf9}
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:720px;margin:0 auto;padding:2rem 1.25rem;color:var(--ink);background:var(--bg);line-height:1.5}
header{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:2rem;padding-bottom:1.25rem;border-bottom:2px solid var(--accent)}
.logo{max-height:48px;max-width:140px;object-fit:contain}
.logo-fallback{width:48px;height:48px;border-radius:8px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.25rem}
.invoice-meta{text-align:right;font-size:.85rem;color:var(--muted)}
.invoice-meta strong{display:block;color:var(--ink);font-size:1rem}
h1{font-size:1.35rem;margin:0 0 .25rem;font-weight:600}
.lead{color:var(--muted);margin:0 0 1.5rem;font-size:.95rem}
.brief{display:grid;gap:.35rem;margin-bottom:1.5rem;padding:1rem;border:1px solid var(--line);border-radius:8px;background:#fff}
.brief-row{display:flex;justify-content:space-between;gap:1rem;font-size:.875rem}
.brief-row span:first-child{color:var(--muted);text-transform:uppercase;letter-spacing:.04em;font-size:.7rem;font-weight:600;padding-top:.15rem}
table{width:100%;border-collapse:collapse;margin:0 0 1rem;background:#fff;border-radius:8px;overflow:hidden;border:1px solid var(--line)}
th,td{padding:.65rem .75rem;text-align:left;border-bottom:1px solid var(--line);font-size:.875rem}
th{background:#fffbeb;color:var(--ink);font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
td.num{text-align:right;white-space:nowrap}
.muted{color:var(--muted);font-size:.8rem}
.strong{font-weight:600}
.totals{margin-left:auto;max-width:280px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:1rem}
.totals div{display:flex;justify-content:space-between;gap:1rem;padding:.25rem 0;font-size:.9rem}
.totals .grand{font-weight:700;font-size:1rem;border-top:1px solid var(--line;margin-top:.5rem;padding-top:.65rem}
.schedule{margin:1.25rem 0;padding:0;list-style:none}
.schedule li{display:flex;justify-content:space-between;gap:1rem;padding:.35rem 0;font-size:.875rem;border-bottom:1px dashed var(--line)}
.terms{font-size:.8rem;color:var(--muted);margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--line)}
.pay-block{margin-top:1.75rem;padding:1.25rem;border:1px solid var(--line);border-radius:10px;background:#fff}
.pay-block h2{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 .75rem;font-weight:700}
.pay-amount{font-size:1.35rem;font-weight:700;color:var(--accent);margin:0 0 .35rem}
.pay-sub{font-size:.8rem;color:var(--muted);margin:0 0 1rem}
.pay-grid{display:flex;flex-wrap:wrap;gap:1.25rem;align-items:flex-start}
.pay-qr{text-align:center;flex:0 0 auto}
.pay-qr img{display:block;border:1px solid var(--line);border-radius:6px;background:#fff}
.pay-qr .barcode{margin-top:.5rem;max-width:180px;height:auto}
.pay-qr p{font-size:.7rem;color:var(--muted);margin:.5rem 0 0}
.pay-links{flex:1;min-width:200px;font-size:.8rem}
.pay-ref{font-family:ui-monospace,monospace;font-size:.95rem;font-weight:700;letter-spacing:.12em;margin:0 0 .5rem}
.pay-url{word-break:break-all;color:var(--accent);text-decoration:none;font-weight:500}
.pay-note{font-size:.75rem;color:var(--muted);margin:.75rem 0 0;line-height:1.45}
.btn{display:inline-block;margin-top:1rem;padding:.85rem 1.5rem;background:var(--accent);color:#fff!important;text-decoration:none;border-radius:8px;font-weight:600;font-size:.95rem}
.status{display:inline-block;padding:.2rem .55rem;border-radius:999px;background:#fef3c7;color:#92400e;font-size:.7rem;text-transform:uppercase;font-weight:600;letter-spacing:.04em}
.platform-foot{margin-top:2rem;padding-top:1rem;border-top:1px solid var(--line);text-align:center;font-size:.68rem;color:var(--muted);letter-spacing:.04em}
.platform-foot a{color:var(--accent);font-weight:600;text-decoration:none}
@media print{body{padding:0;background:#fff}.btn{display:none}}
</style></head><body>
<header>
  <div>${logoBlock}<h1 style="margin-top:.75rem">${escapeHtml(args.businessName)}</h1></div>
  <div class="invoice-meta">
    <strong>Event quote</strong>
    ${args.invoiceNumber ? `Ref ${escapeHtml(args.invoiceNumber.slice(0, 8))}<br/>` : ""}
    Issued ${issued}
    ${args.validUntil ? `<br/>Valid until ${escapeHtml(args.validUntil)}` : ""}
    ${args.status ? `<br/><span class="status">${escapeHtml(args.status)}</span>` : ""}
  </div>
</header>
${args.personalMessage ? `<p class="lead">${escapeHtml(args.personalMessage)}</p>` : ""}
${briefRows ? `<div class="brief">${briefRows}</div>` : ""}
<table>
  <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Price</th><th class="num">Total</th></tr></thead>
  <tbody>${lineRows}</tbody>
</table>
<div class="totals">
  <div><span>Subtotal</span><span>${eur(args.subtotalMinor)}</span></div>
  <div><span>Deposit (${args.depositPercent}%)</span><span>${eur(args.depositAmountMinor)}</span></div>
  <div class="grand"><span>Balance before event</span><span>${eur(args.balanceDueMinor)}</span></div>
</div>
${milestones ? `<h2 style="font-size:.85rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:1.5rem 0 .5rem">Payment schedule</h2><ul class="schedule">${milestones}</ul>` : ""}
${args.termsSnapshot ? `<p class="terms">${escapeHtml(args.termsSnapshot)}</p>` : ""}
<section class="pay-block">
  <h2>Payment</h2>
  <p class="pay-amount">${eur(args.depositAmountMinor)} deposit</p>
  <p class="pay-sub">Due after you accept this quote online (${args.depositPercent}% of total)</p>
  <div class="pay-grid">
    <div class="pay-qr">
      <img src="${qrImg}" width="140" height="140" alt="QR code — view quote"/>
      <img class="barcode" src="${barcodeImg}" alt="Payment reference barcode"/>
      <p>Scan or use reference below</p>
    </div>
    <div class="pay-links">
      <p class="pay-ref">Ref ${escapeHtml(payRef)}</p>
      <a class="pay-url" href="${quoteUrl}">${escapeHtml(quoteUrl)}</a>
      <p class="pay-note">${escapeHtml(guestQuotePayFlowExplanation())}</p>
      <a class="btn" href="${quoteUrl}">View quote &amp; pay deposit</a>
    </div>
  </div>
</section>
<p class="platform-foot">${escapeHtml(eventVendorPoweredByLine())}</p>
</body></html>`;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function emailQuoteToClient(args: {
  businessId: string;
  businessName: string;
  slug: string;
  to: string;
  contactName: string;
  token: string;
  personalMessage?: string | null;
  lines: Array<Pick<QuoteLineItem, "name" | "quantity" | "unit" | "unitPriceMinor" | "lineTotalMinor">>;
  subtotalMinor: number;
  depositAmountMinor: number;
  balanceDueMinor: number;
  depositPercent: number;
  validUntil?: string | null;
  termsSnapshot?: string | null;
  milestoneDeposits?: Array<{ label: string; percent: number; amountMinor: number; dueDate?: string }>;
  logoUrl?: string | null;
  eventBrief?: QuoteHtmlEventBrief | null;
}) {
  const quoteUrl = `${getPublicAppOrigin()}/e/${args.slug}/q/${args.token}`;
  const html = renderQuoteHtml({ ...args, status: "sent" });
  const body = `Hi ${args.contactName},\n\nYour quote from ${args.businessName} is ready.\n\nTotal: ${eur(args.subtotalMinor)}\nDeposit: ${eur(args.depositAmountMinor)}\n\nView and accept: ${quoteUrl}\n`;
  return sendOperationalEmail({
    businessId: args.businessId,
    to: args.to,
    subject: `Your quote from ${args.businessName}`,
    body,
    html,
    templateKey: "event.quote.sent",
  });
}

export async function sendPostEventReviewRequest(args: {
  businessId: string;
  businessName: string;
  to: string;
  contactName: string;
}) {
  const body = `Hi ${args.contactName},\n\nWe hope your event with ${args.businessName} was wonderful! If you have a moment, we'd love a quick review or a photo — just reply to this email.\n\nThank you!\n${args.businessName}`;
  return sendOperationalEmail({
    businessId: args.businessId,
    to: args.to,
    subject: `How was your event with ${args.businessName}?`,
    body,
    templateKey: "event.review.request",
  });
}

export async function emailEnquiryDecline(args: {
  businessId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<"sent" | "skipped" | "failed"> {
  return sendOperationalEmail({
    businessId: args.businessId,
    to: args.to,
    subject: args.subject,
    body: args.body,
    templateKey: "event.enquiry.declined",
  });
}

export async function emailDepositDueReminder(args: {
  businessId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<"sent" | "skipped" | "failed"> {
  return sendOperationalEmail({
    businessId: args.businessId,
    to: args.to,
    subject: args.subject,
    body: args.body,
    templateKey: "event.deposit.due",
  });
}

export async function notifyOperatorNewEnquiry(businessId: string, enquiryId: string) {
  const [enq] = await db
    .select()
    .from(enquiriesTable)
    .where(eq(enquiriesTable.id, enquiryId))
    .limit(1);
  if (!enq) return;
  const [biz] = await db
    .select({ name: businessesTable.name, email: businessesTable.email })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (!biz?.email) return;
  await sendOperationalEmail({
    businessId,
    to: biz.email,
    subject: `New enquiry — ${enq.contactName}`,
    body: `New event enquiry from ${enq.contactName} (${enq.eventType ?? "event"}).\n\nOpen your studio to respond.`,
    templateKey: "event.enquiry.new",
  });
}
