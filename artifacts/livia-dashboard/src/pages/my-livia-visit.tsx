import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PublicSurfaceLoading } from "@/components/public/public-surface-chrome";
import { GuestHubPageHeader, GuestHubShell } from "@/components/guest/guest-hub-chrome";
import { GuestHubLivChat } from "@/components/guest/guest-hub-liv-chat";
import { GuestVisitSummaryCard } from "@/components/guest/guest-visit-summary-card";
import { formatVisitHeroTime } from "@/lib/format";
import { GUEST_HUB_COPY, guestMyQuickActions } from "@workspace/policy";
import { GuestMyVaultModules } from "@/components/guest/guest-my-vault-modules";
import { GuestMyArtifactPanels } from "@/components/guest/guest-my-artifact-panels";
import { GuestStudioEngagementPanel } from "@/components/guest/guest-studio-engagement-panel";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
} from "lucide-react";
const HUB_TOKEN_KEY = "livia_guest_hub_token";

type VisitPayload = {
  booking: {
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
    timezone: string;
    depositPaidEurCents: number;
    priceMinor?: number;
    currency?: string;
    depositPercent?: number;
    depositRequired?: boolean;
    depositDueMinor?: number;
    pendingReason?: string | null;
    depositLine?: { label: string; tone: "paid" | "due" | "hold" | "none" } | null;
    logoUrl: string | null;
  };
  prepNotes: string[];
  visitGreeting: string;
  relationship: { headline: string; memoryHighlight: string | null } | null;
  beautyPrefs: {
    preferences: Record<string, unknown> | null;
    patchTestLabel: string;
  } | null;
  packageCredits: Array<{
    packageName: string;
    creditsRemaining: number;
    creditsTotal: number;
  }>;
  verticalArtifacts?: {
    pets: Array<{
      id: string;
      name: string;
      species: string;
      breed: string | null;
      behaviourNotes: string | null;
      allergyNotes: string | null;
    }>;
    proofs: Array<{
      proofId: string;
      status: string;
      note: string | null;
      imageUrl?: string | null;
      reviewUrl: string;
    }>;
    vehicleHighlight: string | null;
    consentItems?: Array<{
      id: string;
      label: string;
      status: string;
      kind: "consent" | "intake";
      actionUrl: string | null;
    }>;
  };
  bookUrl: string;
  shopRelationshipUrl: string;
  depositPayUrl?: string | null;
};

export default function MyLiviaVisitPage() {
  const { slug, bookingId } = useParams<{ slug: string; bookingId: string }>();
  const [hubToken] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(HUB_TOKEN_KEY) : null,
  );
  const [data, setData] = useState<VisitPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!hubToken || !slug || !bookingId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/public/guest-hub/shops/${encodeURIComponent(slug)}/visits/${encodeURIComponent(bookingId)}`, {
      headers: { "X-Guest-Hub-Token": hubToken },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json() as Promise<VisitPayload>;
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [hubToken, slug, bookingId]);

  async function runningLate(minutes: number) {
    if (!hubToken || !slug || !bookingId) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(
        `/api/public/guest-hub/shops/${encodeURIComponent(slug)}/visits/${encodeURIComponent(bookingId)}/running-late`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Guest-Hub-Token": hubToken,
          },
          body: JSON.stringify({ minutesLate: minutes }),
        },
      );
      if (!r.ok) throw new Error("failed");
      setMessage(GUEST_HUB_COPY.runningLateConfirmed);
    } catch {
      setErr(GUEST_HUB_COPY.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    if (!hubToken || !slug || !bookingId || !replyDraft.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(
        `/api/public/guest-hub/shops/${encodeURIComponent(slug)}/visits/${encodeURIComponent(bookingId)}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Guest-Hub-Token": hubToken,
          },
          body: JSON.stringify({ content: replyDraft.trim() }),
        },
      );
      if (!r.ok) throw new Error("failed");
      setReplyDraft("");
      setMessage(GUEST_HUB_COPY.messageSent);
    } catch {
      setErr(GUEST_HUB_COPY.actionFailed);
    } finally {
      setBusy(false);
    }
  }

  if (!hubToken) {
    return (
      <GuestHubShell centered>
        <p className="text-sm text-center text-muted-foreground">{GUEST_HUB_COPY.signInRequired}</p>
        <Button asChild className="w-full">
          <Link href="/my">Sign in</Link>
        </Button>
      </GuestHubShell>
    );
  }

  if (loading) return <PublicSurfaceLoading />;

  if (!data || !slug) {
    return (
      <GuestHubShell hubToken={hubToken} centered>
        <p className="text-sm text-center text-muted-foreground">{GUEST_HUB_COPY.visitNotFound}</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/my">Back to My Livia</Link>
        </Button>
      </GuestHubShell>
    );
  }

  const b = data.booking;
  const tz = { timeZone: b.timezone };
  const canRunLate = b.status === "CONFIRMED" || b.status === "PENDING";
  const quickActions = guestMyQuickActions(b.vertical);

  return (
    <GuestHubShell hubToken={hubToken} testId="guest-hub-visit-manage">
      <Link
        href={`/my/${slug}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {b.businessName}
      </Link>

      <GuestHubPageHeader
        title={GUEST_HUB_COPY.manageVisitTitle}
        subtitle={data.visitGreeting}
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6 min-w-0">
          <section
            className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 shadow-sm"
            data-testid="guest-hub-visit-hero"
          >
            <p className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
              {formatVisitHeroTime(b.startAt, tz)}
            </p>
            <p className="text-xl font-medium mt-3">{b.serviceName}</p>
            {b.staffDisplayName ? (
              <p className="text-sm text-muted-foreground mt-1">with {b.staffDisplayName}</p>
            ) : null}
          </section>

          <GuestStudioEngagementPanel
            vertical={b.vertical}
            bookUrl={data.bookUrl}
            proofs={data.verticalArtifacts?.proofs}
            hubToken={hubToken}
            shopSlug={slug}
            onMessage={() =>
              document
                .getElementById("guest-hub-visit-message")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          />

          {data.relationship?.memoryHighlight ? (
            <p
              className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3"
              id="guest-hub-memory"
            >
              {data.relationship.memoryHighlight}
            </p>
          ) : null}

          {data.beautyPrefs?.patchTestLabel ? (
            <p className="text-sm text-muted-foreground">{data.beautyPrefs.patchTestLabel}</p>
          ) : null}

          {data.prepNotes.length > 0 ? (
            <section className="rounded-xl border border-border/80 p-5">
              <h2 className="text-sm font-medium mb-3">{GUEST_HUB_COPY.prepSection}</h2>
              <ul className="text-sm space-y-2 list-disc pl-4 text-foreground/90">
                {data.prepNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.verticalArtifacts ? (
            <GuestMyArtifactPanels
              artifacts={data.verticalArtifacts}
              vertical={b.vertical}
              hideProofs
            />
          ) : null}

          <GuestMyVaultModules vertical={b.vertical} displayOnly={false} bookUrl={data.bookUrl} />
        </div>

        <aside className="lg:col-span-2 space-y-6 min-w-0">
          <GuestVisitSummaryCard
            serviceName={b.serviceName}
            startAt={b.startAt}
            staffDisplayName={b.staffDisplayName}
            status={b.status}
            currency={b.currency ?? "EUR"}
            priceMinor={b.priceMinor}
            depositPercent={b.depositPercent}
            depositDueMinor={b.depositDueMinor}
            depositPaidMinor={b.depositPaidEurCents}
            depositRequired={b.depositRequired}
            depositLineLabel={b.depositLine?.label}
            depositPayUrl={data.depositPayUrl}
            timezone={b.timezone}
          />

          {message ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              {message}
            </div>
          ) : null}
          {err ? <p className="text-sm text-destructive">{err}</p> : null}

          {data.packageCredits.length > 0 ? (
            <Card>
              <CardContent className="py-4 text-sm">
                <p className="font-medium">{GUEST_HUB_COPY.packageCreditsSection}</p>
                {data.packageCredits.map((p, i) => (
                  <p key={i} className="text-muted-foreground mt-2 tabular-nums">
                    {p.packageName} — {p.creditsRemaining} of {p.creditsTotal} left
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {canRunLate ? (
            <section
              id="guest-hub-visit-actions"
              className="space-y-3 rounded-xl border border-border/80 p-4 scroll-mt-24"
              data-testid="guest-hub-visit-actions"
            >
              <h2 className="text-sm font-medium">{GUEST_HUB_COPY.quickActionsTitle}</h2>
              <div className="flex flex-wrap gap-2">
                {quickActions
                  .filter((a) => a.id === "running_late")
                  .flatMap(() => [
                    { minutes: 5, label: "5 min late" },
                    { minutes: 10, label: "10 min late" },
                    { minutes: 15, label: "15 min late" },
                  ])
                  .map((opt) => (
                    <Button
                      key={opt.minutes}
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      className="gap-1.5"
                      onClick={() => void runningLate(opt.minutes)}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {opt.label}
                    </Button>
                  ))}
              </div>
            </section>
          ) : null}

          <section
            id="guest-hub-visit-message"
            className="space-y-3 rounded-xl border border-border/80 p-4 scroll-mt-24"
          >
            <h2 className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {GUEST_HUB_COPY.messageStudioTitle}
            </h2>
            <p className="text-xs text-muted-foreground">{GUEST_HUB_COPY.messageStudioBody}</p>
            <Textarea
              placeholder={GUEST_HUB_COPY.messagePlaceholder}
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              rows={4}
              className="resize-none text-sm"
              data-testid="guest-hub-visit-message"
            />
            <Button
              className="w-full"
              size="sm"
              disabled={busy || !replyDraft.trim()}
              onClick={() => void sendMessage()}
            >
              Send to studio
            </Button>
          </section>

          <div className="flex flex-col gap-2">
            <Button asChild variant="secondary" size="sm" className="w-full gap-2">
              <a href={data.bookUrl}>
                <CalendarCheck className="h-4 w-4" />
                {GUEST_HUB_COPY.bookAgainCta}
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full text-muted-foreground">
              <Link href="/my">{GUEST_HUB_COPY.backToVault}</Link>
            </Button>
          </div>

          <GuestHubLivChat hubToken={hubToken} variant="inline" />
        </aside>
      </div>
    </GuestHubShell>
  );
}
