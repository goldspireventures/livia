import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGuestBookTokenRoute } from "@/lib/use-guest-book-slug";
import { clientGuestBookHref } from "@/lib/guest-book-url";
import {
  applyTenantPresentationSurface,
  clearPresentationTheme,
} from "@/lib/experience-theme";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ChevronLeft, ImageIcon, Loader2, XCircle } from "lucide-react";
import { PublicSurfaceNotFound } from "@/components/public/public-surface-chrome";
import { PublicProofLoading } from "@/components/public/public-proof-loading";
import { usePublicGuestPwa } from "@/lib/public-guest-pwa";
import { useEdgeSwipeBack } from "@/lib/use-edge-swipe-back";
import { cn } from "@/lib/utils";

type ProofPayload = {
  proofId: string;
  businessName: string;
  slug: string;
  vertical: string | null;
  status: string;
  imageUrl: string | null;
  note: string | null;
  customerFirstName: string | null;
  logoUrl: string | null;
  createdAt: string;
  experienceSkin?: {
    presentation?: string;
    presentationColorMode?: "light" | "dark";
    brandAccentHex?: string | null;
  };
};

const COMMENT_MAX = 500;
const FALLBACK_ART = "/w2-gateway/cards/tattoo.jpg";

export default function PublicProofPage() {
  const { slug, token } = useGuestBookTokenRoute("proof");
  const [data, setData] = useState<ProofPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [depositPayUrl, setDepositPayUrl] = useState<string | null>(null);
  const [sessionBookUrl, setSessionBookUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [imageBroken, setImageBroken] = useState(false);

  usePublicGuestPwa(slug);
  useEdgeSwipeBack(Boolean(data));

  useEffect(() => {
    if (!slug || !token) return;
    setLoading(true);
    fetch(`/api/public/b/${slug}/proof/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Link not found");
        return r.json() as Promise<ProofPayload>;
      })
      .then((d) => {
        setData(d);
        setImageBroken(false);
        applyTenantPresentationSurface({
          vertical: d.vertical,
          cssPreset: d.experienceSkin?.presentation ?? null,
          brandAccentHex: d.experienceSkin?.brandAccentHex ?? null,
          colorMode: d.experienceSkin?.presentationColorMode ?? null,
        });
        document.documentElement.dataset.guestSurface = "proof";
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => {
      clearPresentationTheme();
      document.documentElement.removeAttribute("data-vertical");
      delete document.documentElement.dataset.guestSurface;
    };
  }, [slug, token]);

  async function submitDecision(decision: "approved" | "rejected") {
    if (!slug || !token) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/public/b/${slug}/proof/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          comment: comment.trim() || undefined,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Could not submit");
      }
      const j = (await r.json()) as {
        status: string;
        depositBind?: {
          depositPayUrl: string | null;
          sessionBookUrl: string;
          message: string;
          depositDueMinor: number;
        } | null;
      };
      setData((d) => (d ? { ...d, status: j.status ?? decision } : d));
      if (decision === "approved" && j.depositBind) {
        setMessage(j.depositBind.message);
        setDepositPayUrl(j.depositBind.depositPayUrl);
        setSessionBookUrl(j.depositBind.sessionBookUrl);
      } else {
        setMessage(
          decision === "approved"
            ? "Approved — the studio will be in touch to book your session."
            : "Feedback sent — the artist will revise and send an updated proof.",
        );
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <PublicProofLoading />;
  }

  if (!data) {
    return (
      <PublicSurfaceNotFound
        title="This link has expired"
        detail="This design proof link is invalid or has expired."
      />
    );
  }

  const canDecide = data.status === "pending_review";
  const bookUrl = clientGuestBookHref(data.slug);
  const artSrc = imageBroken || !data.imageUrl ? FALLBACK_ART : data.imageUrl;

  return (
    <div
      className="min-h-screen bg-background text-foreground public-proof-shell preset-guest-surface"
      data-testid="guest-proof-page"
    >
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 px-3 border-b border-border/80 bg-background/92 backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Go back"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-center text-base font-semibold tracking-tight">Design proof</h1>
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="h-8 w-8 shrink-0" aria-hidden />
        )}
      </header>

      <section
        className="relative border-b border-border bg-card/40 motion-hero-fade-in"
        data-testid="guest-proof-artwork"
      >
        <div className="flex h-[55vh] min-h-[240px] items-center justify-center p-3 sm:p-4">
          {data.imageUrl || !imageBroken ? (
            <img
              src={artSrc}
              alt="Design proof"
              className="max-h-full max-w-full object-contain rounded-md"
              data-testid="guest-proof-image"
              onError={() => setImageBroken(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-10 w-10 opacity-40" aria-hidden />
              <p className="text-sm">Artwork preview unavailable</p>
            </div>
          )}
        </div>
      </section>

      <div className={cn("max-w-lg mx-auto px-4 pt-4", canDecide ? "pb-36" : "pb-10")}>
        <div className="space-y-1 mb-4">
          <p className="text-sm text-muted-foreground">{data.businessName}</p>
          {data.customerFirstName ? (
            <p className="text-base">
              Hi {data.customerFirstName} — review your design below.
            </p>
          ) : null}
          {data.note ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap pt-1">{data.note}</p>
          ) : null}
        </div>

        {message ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm flex flex-col gap-3 mb-4 motion-glow-success">
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              {message}
            </div>
            {depositPayUrl ? (
              <Button asChild>
                <a href={depositPayUrl}>Pay deposit</a>
              </Button>
            ) : sessionBookUrl ? (
              <Button asChild variant="secondary">
                <a href={sessionBookUrl}>Book your session</a>
              </Button>
            ) : null}
          </div>
        ) : null}

        {err ? <p className="text-sm text-destructive text-center mb-4">{err}</p> : null}

        {canDecide ? (
          <div className="space-y-2">
            <label htmlFor="guest-proof-comment" className="text-xs text-muted-foreground">
              Notes for your artist
            </label>
            <Textarea
              id="guest-proof-comment"
              placeholder="Be specific — placement, size, shading…"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
              rows={3}
              maxLength={COMMENT_MAX}
              className="resize-none"
              data-testid="guest-proof-comment"
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {comment.length}/{COMMENT_MAX}
            </p>
          </div>
        ) : data.status === "approved" ? (
          <div className="text-center text-sm text-muted-foreground flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p>You approved this design.</p>
            <Button asChild variant="secondary">
              <Link href={bookUrl}>Book your session</Link>
            </Button>
          </div>
        ) : data.status === "rejected" ? (
          <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2 py-6">
            <XCircle className="h-4 w-4" />
            Change requests were sent to the studio.
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground capitalize py-4">
            Status: {data.status.replace(/_/g, " ")}
          </p>
        )}

        {!canDecide && !message ? (
          <p className="text-center pt-4">
            <Link href={bookUrl} className="text-sm text-muted-foreground underline underline-offset-2">
              Message the studio
            </Link>
          </p>
        ) : null}
      </div>

      {canDecide ? (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="min-h-[52px]"
              disabled={busy}
              onClick={() => void submitDecision("rejected")}
              data-testid="guest-proof-reject"
            >
              Request changes
            </Button>
            <Button
              type="button"
              className="min-h-[52px] bg-emerald-600 hover:bg-emerald-500 text-white"
              disabled={busy}
              onClick={() => void submitDecision("approved")}
              data-testid="guest-proof-approve"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve design"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
