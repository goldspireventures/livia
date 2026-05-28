import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { applyVerticalTheme } from "@/lib/vertical-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Star, Receipt, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";

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
  feedbackSubmitted: boolean;
  feedbackScore: number | null;
};

const SCORES = [1, 2, 3, 4, 5] as const;

export default function PublicVisitPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const [data, setData] = useState<VisitPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => {
      document.documentElement.removeAttribute("data-vertical");
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
      setErr(e instanceof Error ? e.message : "Try again");
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
      setErr(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <PublicSurfaceLoading />;
  }

  if (!data) {
    return (
      <PublicSurfaceNotFound
        title="Visit link not found"
        detail="This link is invalid or has expired. Contact the business if you need help."
      />
    );
  }

  const canRunLate = data.status === "CONFIRMED" || data.status === "PENDING";
  const canFeedback = data.status === "COMPLETED" && !data.feedbackSubmitted;

  return (
    <div className="min-h-screen bg-background public-booking-shell">
      <div className="public-booking-hero pointer-events-none absolute inset-x-0 top-0 h-40" aria-hidden />
      <div className="max-w-lg mx-auto px-4 py-10 relative z-10 space-y-6">
        <div className="text-center">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="" className="h-12 mx-auto mb-3 rounded-md object-contain" />
          ) : null}
          <p className="text-[10px] uppercase tracking-widest font-mono text-primary">
            Your visit · {data.businessName}
          </p>
          <h1 className="text-2xl font-serif mt-2">
            {data.customerFirstName ? `Hi ${data.customerFirstName}` : "Your appointment"}
          </h1>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Booking summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium">{data.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">When</span>
              <span>
                {formatDate(data.startAt)} {formatTime(data.startAt)}
              </span>
            </div>
            {data.staffDisplayName ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">With</span>
                <span>{data.staffDisplayName}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span>{formatCurrency(data.priceMinor, data.currency)}</span>
            </div>
          </CardContent>
        </Card>

        {message ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            {message}
          </div>
        ) : null}

        {err ? (
          <p className="text-sm text-destructive text-center">{err}</p>
        ) : null}

        {canRunLate ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Running late?
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {[5, 10, 15, 30].map((m) => (
                <Button
                  key={m}
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void sendRunningLate(m)}
                  data-testid={`customer-late-${m}`}
                >
                  {m} min
                </Button>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {canFeedback ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4" />
                How was your visit?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-center gap-2">
                {SCORES.map((s) => (
                  <Button
                    key={s}
                    variant={score === s ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10"
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
                className="w-full"
                disabled={busy || score == null}
                onClick={() => void submitFeedback()}
                data-testid="feedback-submit"
              >
                Send feedback
              </Button>
            </CardContent>
          </Card>
        ) : data.feedbackSubmitted ? (
          <p className="text-center text-sm text-muted-foreground">
            Thanks — you rated this visit {data.feedbackScore}/5.
          </p>
        ) : null}

        <PublicSurfaceFooter />
      </div>
    </div>
  );
}
