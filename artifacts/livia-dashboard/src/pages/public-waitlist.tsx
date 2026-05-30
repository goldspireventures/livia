import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { applyVerticalTheme } from "@/lib/vertical-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";

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
};

export default function PublicWaitlistPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const [data, setData] = useState<WaitlistPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
        applyVerticalTheme(d.vertical, null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => {
      document.documentElement.removeAttribute("data-vertical");
    };
  }, [slug, token]);

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

  const when = data.startAt
    ? new Date(data.startAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;
  const canAccept = data.status === "offered";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-8 space-y-4">
        <div className="text-center space-y-1 pt-4">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="" className="h-12 mx-auto rounded-lg object-contain" />
          ) : null}
          <h1 className="text-xl font-semibold">{data.businessName}</h1>
          <p className="text-sm text-muted-foreground">Waitlist slot available</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.serviceName ?? "Class session"}
              {when ? ` · ${when}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {canAccept
                ? "A spot opened up from the waitlist. Accept to confirm your booking."
                : data.status === "accepted"
                  ? "This offer has been accepted."
                  : "This offer is no longer available."}
            </p>
            {message ? <p className="text-sm text-green-600">{message}</p> : null}
            {err ? <p className="text-sm text-destructive">{err}</p> : null}
            {canAccept ? (
              <Button className="w-full" onClick={accept} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept slot"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </main>
      <PublicSurfaceFooter />
    </div>
  );
}
