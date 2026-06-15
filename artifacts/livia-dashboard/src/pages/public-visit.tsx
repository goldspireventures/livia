import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGuestBookTokenRoute } from "@/lib/use-guest-book-slug";
import { clientGuestBookHref } from "@/lib/guest-book-url";
import { applyVerticalTheme } from "@/lib/vertical-theme";
import { applyExperienceTheme, clearExperienceTheme } from "@/lib/experience-theme";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Star, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { formatVisitHeroTime, visitDateChip } from "@/lib/format";
import { parsePublicApiError } from "@/lib/public-booking-helpers";
import { guestPublicVisitPrep } from "@workspace/policy";
import { PublicSurfaceNotFound } from "@/components/public/public-surface-chrome";
import { PublicVisitLoading } from "@/components/public/public-visit-loading";
import { usePublicGuestPwa } from "@/lib/public-guest-pwa";
import { GuestVisitSummaryCard } from "@/components/guest/guest-visit-summary-card";

type VisitPayload = {
  bookingId: string;
  businessName: string;
  slug: string;
  vertical: string | null;
  status: string;
  startAt: string;
  endAt: string;
  serviceName: string;
  staffDisplayName: string | null;
  customerFirstName: string | null;
  currency: string;
  priceMinor: number;
  logoUrl: string | null;
  timezone: string;
  feedbackSubmitted: boolean;
  feedbackScore: number | null;
  depositPaidEurCents?: number;
  depositPercent?: number;
  depositRequired?: boolean;
  depositDueMinor?: number;
  depositPayUrl?: string | null;
  depositLine?: { label: string; tone: "paid" | "due" | "hold" | "none" } | null;
};

const SCORES = [1, 2, 3, 4, 5] as const;

export default function PublicVisitPage() {
  const { slug, token } = useGuestBookTokenRoute("visit");
  const [data, setData] = useState<VisitPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  usePublicGuestPwa(slug);

  useEffect(() => {
    if (!slug || !token) return;
    setLoading(true);
    fetch(`/api/public/b/${slug}/visit/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Link not found");
        return r.json() as Promise<VisitPayload>;
      })
      .then((d) => {
        setData(d);
        applyVerticalTheme(d.vertical, null);
        applyExperienceTheme({ vertical: d.vertical ?? undefined });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => {
      document.documentElement.removeAttribute("data-vertical");
      clearExperienceTheme();
    };
  }, [slug, token]);

  async function sendRunningLate(minutes: number) {
    if (!slug || !token) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/public/b/${slug}/visit/${token}/running-late`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutesLate: minutes }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Could not notify");
      }
      setMessage("We've let the team know you're on your way. Thank you.");
    } catch (e) {
      setErr(parsePublicApiError(e, "Try again"));
    } finally {
      setBusy(false);
    }
  }

  async function submitFeedback() {
    if (!slug || !token || score == null) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/public/b/${slug}/visit/${token}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment: comment.trim() || undefined }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Could not submit");
      }
      setMessage("Thank you — your feedback helps the team improve.");
      setData((d) => (d ? { ...d, feedbackSubmitted: true, feedbackScore: score } : d));
    } catch (e) {
      setErr(parsePublicApiError(e, "Try again"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <PublicVisitLoading />;
  }

  if (!data) {
    return (
      <PublicSurfaceNotFound
        title="This visit link has expired"
        detail="This link is invalid or has expired."
      />
    );
  }

  const tzOpts = { timeZone: data.timezone };
  const canRunLate = data.status === "CONFIRMED" || data.status === "PENDING";
  const canFeedback = data.status === "COMPLETED" && !data.feedbackSubmitted;
  const isCancelled = data.status === "CANCELLED";
  const prepNotes = guestPublicVisitPrep(data.vertical, null);
  const bookUrl = clientGuestBookHref(data.slug);

  return (
    <div className="min-h-screen bg-background" data-testid="guest-visit-page">
      <div className="max-w-xl mx-auto px-4 py-5 pb-28">
        <header className="flex items-center gap-3 mb-5" data-testid="guest-visit-header">
          {data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover border border-border/60"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-serif border border-border/60">
              {data.businessName.charAt(0)}
            </div>
          )}
          <p className="flex-1 min-w-0 font-semibold truncate">{data.businessName}</p>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums">
            {visitDateChip(data.startAt, tzOpts)}
          </span>
        </header>

        {isCancelled ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center space-y-3">
            <p className="font-medium">This appointment was cancelled</p>
            <Button asChild variant="outline" className="w-full">
              <Link href={bookUrl}>Book again</Link>
            </Button>
          </div>
        ) : (
          <section
            className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm motion-hero-fade-in"
            data-testid="guest-visit-hero"
          >
            <p
              className="text-[2.25rem] leading-tight font-bold tabular-nums tracking-tight"
              data-testid="guest-visit-time"
            >
              {formatVisitHeroTime(data.startAt, tzOpts)}
            </p>
            <p className="text-lg font-medium mt-2">{data.serviceName}</p>
            {data.staffDisplayName ? (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                  {data.staffDisplayName.charAt(0)}
                </span>
                with {data.staffDisplayName}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground mt-3 flex items-start gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
              See you at the studio
            </p>
          </section>
        )}

        {!isCancelled ? (
          <div className="mt-4">
            <GuestVisitSummaryCard
              serviceName={data.serviceName}
              startAt={data.startAt}
              staffDisplayName={data.staffDisplayName}
              status={data.status}
              currency={data.currency}
              priceMinor={data.priceMinor}
              depositPercent={data.depositPercent}
              depositDueMinor={data.depositDueMinor}
              depositPaidMinor={data.depositPaidEurCents}
              depositRequired={data.depositRequired}
              depositLineLabel={data.depositLine?.label}
              depositPayUrl={data.depositPayUrl}
              timezone={data.timezone}
            />
          </div>
        ) : null}

        {!isCancelled && prepNotes.length > 0 ? (
          <section className="mt-8" data-testid="guest-visit-prep">
            <h2 className="text-[13px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              For your visit
            </h2>
            <ul className="space-y-2 text-[15px] leading-relaxed text-foreground/90 list-disc pl-5">
              {prepNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            {message}
          </div>
        ) : null}

        {err ? <p className="mt-4 text-sm text-destructive text-center">{err}</p> : null}

        {canFeedback ? (
          <section className="mt-8 space-y-3 rounded-2xl border border-border/80 p-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Star className="h-4 w-4" />
              How was your visit?
            </h2>
            <div className="flex justify-center gap-2">
              {SCORES.map((s) => (
                <Button
                  key={s}
                  variant={score === s ? "default" : "outline"}
                  size="icon"
                  className="h-11 w-11"
                  aria-label={`Rate ${s} out of 5`}
                  onClick={() => setScore(s)}
                  data-testid={`feedback-score-${s}`}
                >
                  {s}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Anything we should know? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <Button
              className="w-full min-h-[44px]"
              disabled={busy || score == null}
              onClick={() => void submitFeedback()}
              data-testid="feedback-submit"
            >
              Send feedback
            </Button>
          </section>
        ) : data.feedbackSubmitted ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Thanks — you rated this visit {data.feedbackScore}/5.
          </p>
        ) : null}
      </div>

      {canRunLate ? (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-xl mx-auto space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Running late?
            </p>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 30].map((m) => (
                <Button
                  key={m}
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] flex-1"
                  disabled={busy}
                  onClick={() => void sendRunningLate(m)}
                  data-testid={`customer-late-${m}`}
                >
                  {m} min
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
