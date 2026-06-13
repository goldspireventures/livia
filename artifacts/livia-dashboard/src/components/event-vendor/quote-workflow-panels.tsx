import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle, Sparkles } from "lucide-react";
import type { QuoteBriefHint } from "@workspace/policy";

type Props = {
  hints: QuoteBriefHint[];
  suggestedTemplateName?: string | null;
  suggestedMessage?: string;
  onUseMessage?: () => void;
  className?: string;
};

export function QuoteBriefPanel({
  hints,
  suggestedTemplateName,
  suggestedMessage,
  onUseMessage,
  className,
}: Props) {
  if (hints.length === 0 && !suggestedTemplateName) return null;

  return (
    <div
      className={`rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2 ${className ?? ""}`}
      data-testid="quote-brief-panel"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-primary" />
        Quote brief
      </div>
      {suggestedTemplateName ? (
        <p className="text-xs text-muted-foreground">
          Suggested template: <span className="font-medium text-foreground">{suggestedTemplateName}</span>
        </p>
      ) : null}
      {hints.map((h) => (
        <div key={h.id} className="flex gap-2 text-xs">
          <AlertCircle
            className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
              h.severity === "warn" ? "text-amber-600" : h.severity === "action" ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <span>{h.message}</span>
        </div>
      ))}
      {suggestedMessage && onUseMessage ? (
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onUseMessage}>
          Preview suggested cover message
        </Button>
      ) : null}
    </div>
  );
}

type StaleRow = {
  quoteId: string;
  enquiryId?: string | null;
  contactName: string;
  eventType?: string | null;
  subtotalMinor?: number;
  daysSinceSent: number;
};

export function StaleQuotesPanel({
  rows,
}: {
  rows: StaleRow[];
}) {
  if (rows.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3"
      data-testid="stale-quotes-panel"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Follow up — quotes sent 5+ days ago</h2>
        <Badge variant="secondary">{rows.length}</Badge>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.quoteId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/80 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{row.contactName}</p>
              <p className="text-xs text-muted-foreground">
                {row.eventType ?? "Event"} · {row.daysSinceSent} days ago
              </p>
            </div>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={`/quotes?id=${row.quoteId}`}>Open</Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LivEventPrepTeaser({
  eventDate,
  eventType,
  className,
}: {
  eventDate?: string | null;
  eventType?: string | null;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-transparent to-amber-500/[0.04] p-4 space-y-3 ${className ?? ""}`}
      data-testid="liv-event-prep-teaser"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        Event day prep
      </div>
      <ul className="text-xs space-y-1.5 text-muted-foreground">
        <li className="flex gap-2">
          <span className="text-primary font-medium shrink-0">→</span>
          <span>2 weeks out: venue access + travel buffer</span>
        </li>
        <li className="flex gap-2">
          <span className="text-primary font-medium shrink-0">→</span>
          <span>Event eve: load list from your catalogue items</span>
        </li>
        <li className="flex gap-2">
          <span className="text-primary font-medium shrink-0">→</span>
          <span>Day of: setup checklist</span>
        </li>
      </ul>
      {eventDate ? (
        <p className="text-xs font-medium text-primary/90 pt-1 border-t border-primary/10">
          {eventType ?? "Event"} · {eventDate}
        </p>
      ) : null}
    </div>
  );
}
