import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { applyVerticalTheme } from "@/lib/vertical-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ImageIcon, Loader2, XCircle } from "lucide-react";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";

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
};

export default function PublicProofPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const [data, setData] = useState<ProofPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
        applyVerticalTheme(d.vertical, null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => {
      document.documentElement.removeAttribute("data-vertical");
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
      const j = (await r.json()) as { status: string };
      setData((d) => (d ? { ...d, status: j.status } : d));
      setMessage(
        decision === "approved"
          ? "Approved — the studio will be in touch to book your session."
          : "Feedback sent — the artist will revise and send an updated proof.",
      );
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
        title="Design proof link not found"
        detail="This link is invalid or has expired. Contact the studio if you need help."
      />
    );
  }

  const canDecide = data.status === "pending_review";

  return (
    <div className="min-h-screen bg-background public-booking-shell" data-testid="guest-proof-page">
      <div className="public-booking-hero pointer-events-none absolute inset-x-0 top-0 h-40" aria-hidden />
      <div className="max-w-lg mx-auto px-4 py-10 relative z-10 space-y-6">
        <div className="text-center">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="" className="h-12 mx-auto mb-3 rounded-md object-contain" />
          ) : null}
          <p className="text-[10px] uppercase tracking-widest font-mono text-primary">
            Design proof · {data.businessName}
          </p>
          <h1 className="text-2xl font-serif mt-2">
            {data.customerFirstName ? `Hi ${data.customerFirstName}` : "Your design"}
          </h1>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Artwork preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt="Design proof"
                className="w-full rounded-lg border object-contain max-h-[min(420px,60vh)]"
                data-testid="guest-proof-image"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No image attached yet.</p>
            )}
            {data.note ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.note}</p>
            ) : null}
          </CardContent>
        </Card>

        {message ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            {message}
          </div>
        ) : null}

        {err ? <p className="text-sm text-destructive text-center">{err}</p> : null}

        {canDecide ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Notes or change requests (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                data-testid="guest-proof-comment"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="flex-1"
                  disabled={busy}
                  onClick={() => void submitDecision("approved")}
                  data-testid="guest-proof-approve"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve design"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => void submitDecision("rejected")}
                  data-testid="guest-proof-reject"
                >
                  Request changes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : data.status === "approved" ? (
          <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            This design was approved.
          </div>
        ) : data.status === "rejected" ? (
          <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <XCircle className="h-4 w-4" />
            Change requests were sent to the studio.
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground capitalize">
            Status: {data.status.replace(/_/g, " ")}
          </p>
        )}

        <PublicSurfaceFooter />
      </div>
    </div>
  );
}
