import { Badge } from "@/components/ui/badge";
import {
  eur,
  formatQuoteUnit,
  type EventDaySheet,
} from "@/lib/event-vendor-studio";
import { guestQuotePayFlowExplanation, quotePaymentReference } from "@workspace/policy";

type PreviewLine = {
  name: string;
  quantity: string;
  unit: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

type Props = {
  businessName: string;
  logoUrl?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  quoteRef?: string | null;
  status: string;
  personalMessage?: string | null;
  lines: PreviewLine[];
  subtotalMinor: number;
  depositAmountMinor: number;
  balanceDueMinor: number;
  depositPercent: number;
  validUntil?: string | null;
  eventDaySheet?: EventDaySheet | null;
  clientPayUrl?: string | null;
  publicToken?: string | null;
  className?: string;
};

/** Document-shaped invoice preview for the send review step. */
export function QuoteInvoicePreview({
  businessName,
  logoUrl,
  clientName,
  clientEmail,
  quoteRef,
  status,
  personalMessage,
  lines,
  subtotalMinor,
  depositAmountMinor,
  balanceDueMinor,
  depositPercent,
  validUntil,
  eventDaySheet,
  clientPayUrl,
  publicToken,
  className,
}: Props) {
  const issued = new Date().toISOString().slice(0, 10);
  const sheet = eventDaySheet;
  const payRef = publicToken ? quotePaymentReference(publicToken) : quoteRef;
  const qrSrc =
    clientPayUrl != null && clientPayUrl.length > 0
      ? `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(clientPayUrl)}`
      : null;
  const barcodeSrc =
    payRef != null && payRef.length > 0
      ? `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(payRef)}&code=Code128&translate-esc=on&dpi=96`
      : null;

  return (
    <div
      className={`relative mx-auto w-full max-w-[420px] rounded-sm border border-stone-300/90 bg-[#fafaf9] text-[#1c1917] shadow-xl overflow-hidden aspect-[1/1.414] ${className ?? ""}`}
      data-testid="quote-invoice-preview"
      style={{ minHeight: "520px" }}
    >
      {status === "draft" ? (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-[0.06]">
          <span className="text-6xl font-bold uppercase tracking-[0.35em] rotate-[-18deg]">Draft</span>
        </div>
      ) : null}

      <div className="p-5 sm:p-6 space-y-4 text-sm leading-relaxed h-full overflow-y-auto">
        <header className="flex justify-between gap-3 pb-3 border-b-2 border-amber-800/70">
          <div className="flex items-start gap-3 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-10 max-w-[100px] object-contain shrink-0" />
            ) : (
              <div className="h-10 w-10 rounded-md bg-amber-800 text-white flex items-center justify-center font-bold text-base shrink-0">
                {businessName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{businessName}</h3>
              <p className="text-[10px] text-stone-500 uppercase tracking-wide">Quote & invoice</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-stone-500 shrink-0 leading-snug">
            <strong className="block text-stone-800 text-xs">Quote</strong>
            {quoteRef ? <span className="block font-mono text-stone-600">{quoteRef}</span> : null}
            <span>Issued {issued}</span>
            {validUntil ? (
              <>
                <br />
                <span>Valid to {validUntil}</span>
              </>
            ) : null}
          </div>
        </header>

        <div className="rounded-md border border-stone-200 bg-white px-3 py-2.5 border-l-[3px] border-l-amber-700">
          <p className="text-[9px] uppercase tracking-widest font-semibold text-stone-400 mb-1">Bill to</p>
          {clientName ? (
            <>
              <p className="font-semibold text-sm text-stone-900">{clientName}</p>
              {clientEmail ? <p className="text-xs text-stone-500 mt-0.5">{clientEmail}</p> : null}
            </>
          ) : (
            <p className="text-xs text-stone-400 italic">Add client name before sending</p>
          )}
        </div>

        {personalMessage ? (
          <p className="text-stone-600 text-xs border-l-2 border-amber-600/50 pl-2.5 leading-relaxed">
            {personalMessage}
          </p>
        ) : null}

        {sheet && (sheet.eventType || sheet.eventDate || sheet.theme || sheet.venue) ? (
          <div className="grid gap-1 rounded-md border border-stone-200 bg-white/80 p-2.5 text-[10px]">
            {sheet.eventType ? <Row label="Event" value={sheet.eventType} /> : null}
            {sheet.eventDate ? <Row label="Date" value={sheet.eventDate} /> : null}
            {sheet.guestCount ? <Row label="Guests" value={String(sheet.guestCount)} /> : null}
            {sheet.theme ? <Row label="Theme" value={sheet.theme} /> : null}
            {sheet.venue ? <Row label="Venue" value={sheet.venue} /> : null}
          </div>
        ) : null}

        <div className="rounded-md border border-stone-200 overflow-hidden bg-white flex-1">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-amber-900/90 text-amber-50">
                <th className="text-left font-semibold uppercase tracking-wide px-2.5 py-2">Item</th>
                <th className="text-right font-semibold uppercase tracking-wide px-1.5 py-2 w-10">Qty</th>
                <th className="text-right font-semibold uppercase tracking-wide px-1.5 py-2 hidden sm:table-cell w-14">
                  Rate
                </th>
                <th className="text-right font-semibold uppercase tracking-wide px-2.5 py-2 w-16">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-stone-400 text-xs">
                    Add line items to preview your invoice
                  </td>
                </tr>
              ) : (
                lines.map((line, i) => (
                  <tr
                    key={i}
                    className={`border-t border-stone-100 ${i % 2 === 1 ? "bg-stone-50/80" : "bg-white"}`}
                  >
                    <td className="px-2.5 py-2 font-medium text-stone-800">
                      <span className="line-clamp-2">{line.name || "—"}</span>
                      <span className="block text-[9px] text-stone-400 font-normal sm:hidden">
                        {formatQuoteUnit(line.unit)} · {eur(line.unitPriceMinor)}
                      </span>
                    </td>
                    <td className="px-1.5 py-2 text-right tabular-nums text-stone-600">{line.quantity}</td>
                    <td className="px-1.5 py-2 text-right tabular-nums text-stone-600 hidden sm:table-cell">
                      {eur(line.unitPriceMinor)}
                    </td>
                    <td className="px-2.5 py-2 text-right font-semibold tabular-nums text-stone-900">
                      {eur(line.lineTotalMinor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          <div className="ml-auto max-w-[220px] rounded-md border border-stone-200 bg-white p-2.5 space-y-1 text-[10px]">
            <div className="flex justify-between gap-2 text-stone-500">
              <span>Subtotal</span>
              <span className="tabular-nums text-stone-800">{eur(subtotalMinor)}</span>
            </div>
            <div className="flex justify-between gap-2 text-stone-500">
              <span>Balance before event</span>
              <span className="tabular-nums">{eur(balanceDueMinor)}</span>
            </div>
          </div>

          <div
            className="rounded-md bg-gradient-to-r from-amber-800 to-amber-700 px-3 py-2.5 text-amber-50 flex items-center justify-between gap-2 shadow-sm"
            data-testid="quote-deposit-due-bar"
          >
            <div>
              <p className="text-[9px] uppercase tracking-widest font-semibold opacity-90">Due now</p>
              <p className="text-xs font-medium">Deposit · {depositPercent}%</p>
            </div>
            <p className="text-lg font-bold tabular-nums">{eur(depositAmountMinor)}</p>
          </div>
        </div>

        {clientPayUrl ? (
          <div
            className="rounded-md border border-stone-200 bg-white p-2.5 space-y-2"
            data-testid="quote-payment-block"
          >
            <p className="text-[9px] uppercase tracking-widest font-semibold text-stone-400">Payment</p>
            <div className="flex gap-3 items-start">
              {qrSrc ? (
                <div className="shrink-0 text-center">
                  <img src={qrSrc} alt="" width={72} height={72} className="rounded border border-stone-200" />
                  {barcodeSrc ? (
                    <img src={barcodeSrc} alt="" className="mt-1 max-w-[88px] h-auto mx-auto" />
                  ) : null}
                </div>
              ) : null}
              <div className="min-w-0 flex-1 text-[9px] leading-snug">
                {payRef ? (
                  <p className="font-mono font-bold text-stone-800 tracking-wider">Ref {payRef}</p>
                ) : null}
                <p className="text-stone-500 mt-0.5 break-all">{clientPayUrl}</p>
                <p className="text-stone-400 mt-1">{guestQuotePayFlowExplanation()}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-1 border-t border-stone-200">
          <Badge variant="secondary" className="text-[9px] uppercase bg-stone-200 text-stone-700">
            {status}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-stone-400 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-stone-800 text-right">{value}</span>
    </div>
  );
}
