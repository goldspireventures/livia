import { useCallback, useEffect, useState } from "react";
import { useParams } from "wouter";
import { formatCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { EventVendorPageShell } from "@/components/event-vendor/event-vendor-page-shell";
import { EventVendorPoweredBy } from "@/components/event-vendor/event-vendor-powered-by";

type PlannerPayload = {
  business: { name: string };
  plannerName: string;
  clients: Array<{
    contactName: string;
    eventType?: string | null;
    eventDate?: string | null;
    status: string;
    quotes: Array<{
      status: string;
      subtotalMinor: number;
      version: number;
      publicPath: string;
    }>;
  }>;
};

export default function PublicEventVendorPlannerPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const [data, setData] = useState<PlannerPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug || !token) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/public/${slug}/planner/${token}`);
      if (!r.ok) throw new Error("not found");
      setData((await r.json()) as PlannerPayload);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <EventVendorPageShell>
      {() => (
        <section className="ev-section max-w-lg mx-auto space-y-6" data-testid="planner-portal">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-800" />
          ) : !data ? (
            <p className="text-center text-muted-foreground">Planner link not found.</p>
          ) : (
            <>
              <header className="text-center space-y-2">
                <p className="text-sm uppercase tracking-widest text-muted-foreground">{data.business.name}</p>
                <h1 className="font-serif text-2xl">Planner portal</h1>
                <p className="text-sm text-muted-foreground">Hi {data.plannerName} — your clients&apos; quotes</p>
              </header>
              <ul className="space-y-4">
                {data.clients.map((client) => (
                  <li key={client.contactName} className="rounded-lg border p-4 space-y-2">
                    <p className="font-medium">{client.contactName}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.eventType ?? "Event"}
                      {client.eventDate ? ` · ${client.eventDate}` : ""} · {client.status}
                    </p>
                    {client.quotes.map((q) => (
                      <a
                        key={q.publicPath}
                        href={q.publicPath}
                        className="flex justify-between text-sm text-primary underline"
                      >
                        <span>
                          Quote v{q.version} · {q.status}
                        </span>
                        <span>{formatCurrency(q.subtotalMinor)}</span>
                      </a>
                    ))}
                  </li>
                ))}
              </ul>
              <EventVendorPoweredBy compact />
            </>
          )}
        </section>
      )}
    </EventVendorPageShell>
  );
}
