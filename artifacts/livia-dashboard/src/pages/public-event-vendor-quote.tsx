import { useCallback, useEffect, useState } from "react";
import { useSearch } from "wouter";
import { useGuestQuoteRoute } from "@/lib/use-guest-book-slug";
import { formatCurrency } from "@/lib/format";
import { resolveQuoteMilestonePayment } from "@workspace/policy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CreditCard, Download, Loader2 } from "lucide-react";
import { EventVendorPageShell } from "@/components/event-vendor/event-vendor-page-shell";
import { EventVendorPoweredBy } from "@/components/event-vendor/event-vendor-powered-by";
import { resolveGalleryImage } from "@/lib/event-vendor-media";

type QuotePayload = {
  business: { name: string; slug: string };
  eventType?: string | null;
  similarWork?: Array<{ url: string; caption?: string; eventType?: string }>;
  versionDiff?: Array<{ name: string; change: string; detail: string }>;
  previousVersion?: number | null;
  quote: {
    id: string;
    status: string;
    personalMessage?: string | null;
    subtotalMinor: number;
    depositAmountMinor: number;
    depositPaidMinor: number;
    balanceDueMinor: number;
    depositPercent: number;
    validUntil?: string | null;
    termsSnapshot?: string | null;
    milestoneDeposits?: Array<{ label: string; percent: number; amountMinor: number; dueDate?: string }>;
    lines: Array<{ name: string; quantity: string; unitPriceMinor: number; lineTotalMinor: number }>;
    eventDaySheet?: { setupChecklist?: string[]; theme?: string; venue?: string; eventDate?: string } | null;
  };
};

type PayPayload = {
  depositDueMinor: number;
  nextPaymentLabel?: string;
  nextPaymentDueDate?: string | null;
  dateSecured?: boolean;
  scheduleFullyPaid?: boolean;
  milestones?: Array<{
    label: string;
    percent: number;
    amountMinor: number;
    dueDate?: string;
    paidMinor: number;
    status: "paid" | "due" | "upcoming";
  }>;
  checkoutAvailable: boolean;
  currency: string;
  status: string;
};

export default function PublicEventVendorQuotePage() {
  const { slug, token } = useGuestQuoteRoute();
  const search = useSearch();
  const statusHint = new URLSearchParams(search).get("status");

  const [data, setData] = useState<QuotePayload | null>(null);
  const [pay, setPay] = useState<PayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug || !token) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/public/${slug}/q/${token}`);
      if (!r.ok) throw new Error("not found");
      const d = (await r.json()) as QuotePayload;
      setData(d);

      if (d.quote.status === "accepted") {
        const pr = await fetch(`/api/public/${slug}/q/${token}/pay`);
        if (pr.ok) setPay((await pr.json()) as PayPayload);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (statusHint === "success") {
      const sessionId = new URLSearchParams(search).get("session_id");
      if (slug && token && sessionId) {
        void fetch(`/api/public/${slug}/q/${token}/pay/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
          .then(() => load())
          .catch(() => load());
      } else {
        void load();
      }
      setFlash("Deposit received — your date is secured. Thank you!");
    } else if (statusHint === "cancel") {
      setFlash("Checkout cancelled — you can pay when ready.");
    }
  }, [statusHint, search, slug, token, load]);

  async function declineQuote() {
    if (!slug || !token) return;
    setAcceptBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/public/${slug}/q/${token}/decline`, { method: "POST" });
      if (!r.ok) throw new Error("Could not decline");
      setFlash("Quote declined — thank you for letting us know.");
      await load();
    } catch {
      setErr("Could not update quote.");
    } finally {
      setAcceptBusy(false);
    }
  }

  async function executeCheckout() {
    if (!slug || !token) return;
    setErr(null);
    const r = await fetch(`/api/public/${slug}/q/${token}/pay/checkout`, { method: "POST" });
    const j = (await r.json().catch(() => ({}))) as {
      mode?: string;
      checkoutUrl?: string;
      message?: string;
      error?: string;
    };
    if (!r.ok) {
      const detail =
        j.message ??
        (typeof j.error === "string" && j.error !== "internal_error" ? j.error : null) ??
        `Payment failed (${r.status})`;
      throw new Error(detail);
    }
    if (j.mode === "stripe" && j.checkoutUrl) {
      window.location.href = j.checkoutUrl;
      return;
    }
    if (j.mode === "dev" && j.message) {
      setFlash(j.message);
      await load();
      return;
    }
    throw new Error(j.message ?? "Checkout unavailable");
  }

  async function startCheckout() {
    setPayBusy(true);
    try {
      await executeCheckout();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Payment failed");
    } finally {
      setPayBusy(false);
    }
  }

  async function acceptQuote() {
    if (!slug || !token) return;
    setAcceptBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/public/${slug}/q/${token}/accept`, { method: "POST" });
      if (!r.ok) throw new Error("Could not accept quote");
      await load();
      setPayBusy(true);
      try {
        await executeCheckout();
      } catch (ex) {
        setErr(
          ex instanceof Error
            ? ex.message
            : "Quote accepted — pay your deposit below to secure your date.",
        );
      } finally {
        setPayBusy(false);
      }
    } catch {
      setErr("Could not accept quote — it may have expired.");
    } finally {
      setAcceptBusy(false);
    }
  }

  if (!slug || !token) return null;

  if (loading) {
    return (
      <EventVendorPageShell>
        {() => (
          <section className="ev-section text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-800" />
          </section>
        )}
      </EventVendorPageShell>
    );
  }

  if (!data) {
    return (
      <EventVendorPageShell>
        {() => (
          <section className="ev-section text-center py-20">
            <h1 className="ev-section__title">Quote not found</h1>
            <p className="ev-muted">This link may have expired.</p>
          </section>
        )}
      </EventVendorPageShell>
    );
  }

  const { business, quote, similarWork, eventType, versionDiff, previousVersion } = data;
  const currency = pay?.currency ?? "EUR";
  const paymentState = pay?.milestones
    ? {
        milestones: pay.milestones,
        nextDueMinor: pay.depositDueMinor,
        nextLabel: pay.nextPaymentLabel ?? "Deposit",
        dateSecured: pay.dateSecured ?? false,
        scheduleFullyPaid: pay.scheduleFullyPaid ?? false,
      }
    : (() => {
        const resolved = resolveQuoteMilestonePayment(quote);
        return {
          milestones: resolved.milestones,
          nextDueMinor: resolved.nextDueMinor,
          nextLabel: resolved.nextLabel,
          dateSecured: resolved.dateSecured,
          scheduleFullyPaid: resolved.scheduleFullyPaid,
        };
      })();
  const depositDue = pay?.depositDueMinor ?? paymentState.nextDueMinor;

  return (
    <EventVendorPageShell>
      {() => (
      <section className="ev-section max-w-lg mx-auto w-full space-y-6 ev-quote-invoice">
        <header className="space-y-2 text-center border-b border-amber-900/10 pb-4">
          <p className="text-sm text-muted-foreground uppercase tracking-widest">{business.name}</p>
          <h1 className="font-serif text-2xl md:text-3xl">Event quote</h1>
          <Badge variant="secondary" className="uppercase text-[10px] tracking-wide">{quote.status}</Badge>
        </header>

        {flash ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm flex gap-2 items-start">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            {flash}
          </div>
        ) : null}
        {err ? <p className="text-sm text-destructive text-center">{err}</p> : null}

        {quote.personalMessage ? (
          <p className="text-center text-muted-foreground">{quote.personalMessage}</p>
        ) : null}

        {versionDiff && versionDiff.length > 0 ? (
          <Card data-testid="guest-quote-version-diff">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Updated quote{previousVersion ? ` (was v${previousVersion})` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {versionDiff.map((d) => (
                <p key={`${d.name}-${d.change}`}>
                  <span className="text-foreground font-medium">{d.name}</span> — {d.detail}
                </p>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {similarWork && similarWork.length > 0 ? (
          <div className="space-y-3" data-testid="guest-quote-similar-work">
            <h2 className="text-sm font-medium text-center font-serif">
              Similar work{eventType ? ` — ${eventType}` : ""}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {similarWork.map((item, i) => {
                const resolved = resolveGalleryImage(item, i);
                return (
                  <figure key={`${resolved.url}-${i}`} className="overflow-hidden rounded-lg border border-amber-900/10">
                    <img
                      src={resolved.url}
                      alt={resolved.caption ?? "Event styling"}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    {resolved.caption ? (
                      <figcaption className="px-1.5 py-1 text-[10px] text-muted-foreground truncate">
                        {resolved.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </div>
        ) : null}

        <Card className="shadow-sm border-amber-900/10">
          <CardHeader className="pb-2 bg-muted/20">
            <CardTitle className="text-base font-serif">Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quote.lines.map((line) => (
              <div key={line.name} className="ev-quote-row">
                <span>
                  {line.name} × {line.quantity}
                </span>
                <span className="font-medium">{formatCurrency(line.lineTotalMinor, currency)}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(quote.subtotalMinor, currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Deposit ({quote.depositPercent}%)</span>
              <span>{formatCurrency(quote.depositAmountMinor, currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Balance on event day</span>
              <span>{formatCurrency(quote.balanceDueMinor, currency)}</span>
            </div>
          </CardContent>
        </Card>

        {(quote.milestoneDeposits ?? []).length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payment schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {paymentState.milestones.map((m) => (
                <div key={m.label} className="ev-quote-row">
                  <span className="flex items-center gap-2 min-w-0">
                    {m.status === "paid" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : null}
                    <span>
                      {m.label} ({m.percent}%)
                      {m.dueDate ? ` — due ${m.dueDate}` : ""}
                      {m.status === "upcoming" ? " · not due yet" : ""}
                    </span>
                  </span>
                  <span className={m.status === "paid" ? "text-primary font-medium" : ""}>
                    {m.status === "paid"
                      ? "Paid"
                      : m.status === "due" && m.paidMinor > 0
                        ? `${formatCurrency(m.paidMinor, currency)} / ${formatCurrency(m.amountMinor, currency)}`
                        : formatCurrency(m.amountMinor, currency)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {(quote.status === "accepted" || quote.depositPaidMinor > 0) &&
        quote.eventDaySheet?.setupChecklist?.length ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What happens on your event day</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {quote.eventDaySheet.setupChecklist.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {quote.validUntil ? (
          <p className="text-xs text-center text-muted-foreground">Valid until {quote.validUntil}</p>
        ) : null}
        {quote.termsSnapshot ? (
          <p className="text-xs text-muted-foreground">{quote.termsSnapshot}</p>
        ) : null}

        <div className="ev-quote-actions">
          {quote.status === "sent" ? (
            <>
              <button
                type="button"
                onClick={() => void acceptQuote()}
                disabled={acceptBusy || payBusy}
                className="ev-btn ev-btn--primary"
                data-testid="guest-quote-accept"
              >
                {acceptBusy || payBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Accept quote & pay deposit"
                )}
              </button>
              <button
                type="button"
                onClick={() => void declineQuote()}
                disabled={acceptBusy}
                className="ev-quote-actions__decline"
              >
                Decline quote
              </button>
            </>
          ) : null}

          {quote.status === "accepted" && depositDue > 0 ? (
            <>
              <button
                type="button"
                className="ev-btn ev-btn--primary"
                onClick={() => void startCheckout()}
                disabled={payBusy || acceptBusy || pay?.checkoutAvailable === false}
                data-testid="guest-quote-pay-checkout"
              >
                {payBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay {paymentState.nextLabel.toLowerCase()} {formatCurrency(depositDue, currency)}
                  </>
                )}
              </button>
              {pay?.checkoutAvailable === false ? (
                <p className="text-xs text-center text-muted-foreground max-w-sm">
                  Card checkout isn&apos;t available yet — contact {business.name} to pay your deposit.
                </p>
              ) : null}
            </>
          ) : null}

          {paymentState.scheduleFullyPaid && quote.status === "accepted" ? (
            <p className="text-center text-sm text-primary font-medium">Fully paid — you&apos;re booked!</p>
          ) : paymentState.dateSecured && depositDue <= 0 && quote.status === "accepted" ? (
            <p className="text-center text-sm text-primary font-medium">
              Date secured
              {pay?.nextPaymentDueDate ? ` — balance due ${pay.nextPaymentDueDate}` : " — balance due before your event"}.
            </p>
          ) : null}

          <a
            href={`/api/public/${slug}/q/${token}/html`}
            target="_blank"
            rel="noopener noreferrer"
            className="ev-btn ev-btn--outline !text-stone-800 !border-stone-300 !bg-white"
          >
            <Download className="h-4 w-4" />
            Download invoice
          </a>
        </div>

        <EventVendorPoweredBy compact />
      </section>
      )}
    </EventVendorPageShell>
  );
}
