import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useGuestBookTokenRoute } from "@/lib/use-guest-book-slug";
import {
  warmPublicGuestSurfaceTheme,
  clearPublicGuestSurfaceTheme,
  type PublicGuestExperienceSkin,
} from "@/lib/apply-public-guest-theme";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";
import { usePublicGuestPwa } from "@/lib/public-guest-pwa";

type WaitlistPayload = {
  entryId: string;
  businessName: string;
  slug: string;
  vertical: string | null;
  status: string;
  serviceName: string | null;
  startAt: string | null;
  expiresAt: string | null;
  logoUrl: string | null;
  customerFirstName: string | null;
  experienceSkin?: PublicGuestExperienceSkin;
};

function formatTtl(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} min left`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m left` : `${hrs}h left`;
}

export default function PublicWaitlistPage() {
  const { slug, token } = useGuestBookTokenRoute("waitlist");
  const [data, setData] = useState<WaitlistPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ttl, setTtl] = useState<string | null>(null);

  usePublicGuestPwa(slug);

  useLayoutEffect(() => {
    if (!slug) return;
    void warmPublicGuestSurfaceTheme({ slug });
    return () => clearPublicGuestSurfaceTheme();
  }, [slug]);

  useEffect(() => {
    if (!slug || !token) return;
    setLoading(true);
    fetch(`/api/public/b/${slug}/waitlist/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json() as Promise<WaitlistPayload>;
      })
      .then((d) => {
        setData(d);
        void warmPublicGuestSurfaceTheme({
          slug: d.slug ?? slug,
          vertical: d.vertical,
          experienceSkin: d.experienceSkin,
        });
        setTtl(formatTtl(d.expiresAt));
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug, token]);

  useEffect(() => {
    if (!data?.expiresAt || data.status !== "offered") return;
    const tick = () => setTtl(formatTtl(data.expiresAt));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [data?.expiresAt, data?.status]);

  const greeting = useMemo(() => {
    if (!data?.customerFirstName) return "A spot opened up";
    return `Hi ${data.customerFirstName} — a spot opened up`;
  }, [data?.customerFirstName]);

  async function accept() {
    if (!slug || !token) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/public/b/${slug}/waitlist/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const j = (await r.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Could not accept");
      setMessage(j.message ?? "You're booked!");
      setData((d) => (d ? { ...d, status: "accepted" } : d));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PublicSurfaceLoading />;
  if (!data) {
    return (
      <PublicSurfaceNotFound
        title="Waitlist offer not found"
        detail="This offer is invalid or has expired. Reply to the studio's message if you still want a slot."
      />
    );
  }

  const when = data.startAt ? formatDateTime(data.startAt) : null;
  const canAccept = data.status === "offered" && ttl !== "Expired";
  const accepted = data.status === "accepted" || !!message;

  return (
    <div
      className="min-h-screen bg-background public-booking-shell has-sticky-cta"
      data-testid="guest-waitlist-page"
    >
      <div className="max-w-md mx-auto px-4 py-10 pb-28 space-y-6">
        <div className="text-center space-y-2" data-testid="guest-waitlist-hero">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="" className="h-12 mx-auto object-contain rounded-lg" />
          ) : null}
          <p className="text-[10px] uppercase tracking-widest font-mono text-primary flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3" aria-hidden />
            Waitlist offer
          </p>
          <h1 className="text-2xl font-serif">{data.businessName}</h1>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{data.serviceName ?? "Session"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium">{greeting}</p>
            {when ? <p className="text-muted-foreground">{when}</p> : null}
            {ttl && data.status === "offered" ? (
              <p
                className="text-xs text-muted-foreground flex items-center gap-1"
                data-testid="guest-waitlist-ttl"
              >
                <Clock className="h-3 w-3" aria-hidden />
                {ttl}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              {accepted
                ? "You're confirmed — we'll send details shortly."
                : canAccept
                  ? "Accept to lock in this slot before someone else does."
                  : "This offer is no longer available."}
            </p>
            {message ? (
              <p className="text-sm text-primary flex items-center gap-2" data-testid="guest-waitlist-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {message}
              </p>
            ) : null}
            {err ? <p className="text-sm text-destructive">{err}</p> : null}
          </CardContent>
        </Card>

        <PublicSurfaceFooter />
      </div>

      {canAccept ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3"
          data-testid="guest-waitlist-sticky-cta"
        >
          <div className="max-w-md mx-auto flex flex-col gap-2">
            <Button
              className="w-full min-h-[48px]"
              size="lg"
              disabled={busy}
              data-testid="guest-waitlist-accept"
              onClick={() => void accept()}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept slot"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Not this time? Ignore this link — the offer will expire on its own.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
