import { useCallback, useEffect, useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";
import { EventVendorPageShell } from "@/components/event-vendor/event-vendor-page-shell";
import { EventVendorPoweredBy } from "@/components/event-vendor/event-vendor-powered-by";

type MoodPayload = {
  business: { name: string };
  enquiry: { contactName: string; eventType?: string; theme?: string; status: string };
  items: Array<{ id: string; imageUrl?: string | null; note?: string | null }>;
};

export default function PublicEventVendorMoodPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const [data, setData] = useState<MoodPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug || !token) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/public/${slug}/mood/${token}`);
      if (!r.ok) throw new Error("not found");
      setData((await r.json()) as MoodPayload);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(decision: "approved" | "changes_requested") {
    if (!slug || !token) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/public/${slug}/mood/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: note.trim() || undefined }),
      });
      if (!r.ok) throw new Error("failed");
      setFlash(
        decision === "approved"
          ? "Palette approved — your studio can proceed!"
          : "Feedback sent — the studio will revise.",
      );
      await load();
    } catch {
      setFlash("Could not submit — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <EventVendorPageShell>
      {() => (
        <section className="ev-section max-w-lg mx-auto space-y-6" data-testid="guest-mood-board">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-800" />
          ) : !data ? (
            <p className="text-center text-muted-foreground">Mood board link not found.</p>
          ) : (
            <>
              <header className="text-center space-y-2">
                <p className="text-sm uppercase tracking-widest text-muted-foreground">{data.business.name}</p>
                <h1 className="font-serif text-2xl">Approve your mood board</h1>
                <p className="text-sm text-muted-foreground">
                  {data.enquiry.eventType ?? "Event"}
                  {data.enquiry.theme ? ` · ${data.enquiry.theme}` : ""}
                </p>
              </header>
              {flash ? (
                <p className="text-sm text-center text-primary flex gap-2 justify-center items-center">
                  <CheckCircle2 className="h-4 w-4" />
                  {flash}
                </p>
              ) : null}
              <div className="grid gap-3">
                {data.items.map((item) => (
                  <figure key={item.id} className="rounded-lg border overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full aspect-video object-cover" />
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground bg-muted/30">Inspiration note</div>
                    )}
                    {item.note ? <figcaption className="p-3 text-sm">{item.note}</figcaption> : null}
                  </figure>
                ))}
              </div>
              {data.enquiry.status !== "approved" ? (
                <>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note for the studio…"
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button disabled={busy} onClick={() => void submit("approved")} data-testid="mood-approve">
                      Approve palette
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void submit("changes_requested")}
                      data-testid="mood-request-changes"
                    >
                      Request changes
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-center text-sm font-medium text-primary">Approved</p>
              )}
              <EventVendorPoweredBy compact />
            </>
          )}
        </section>
      )}
    </EventVendorPageShell>
  );
}
