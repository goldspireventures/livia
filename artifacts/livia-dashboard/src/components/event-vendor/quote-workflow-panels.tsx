import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle, Calendar, MapPin, Sparkles, Users } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { formatEventTypeLabel, type QuoteBriefHint } from "@workspace/policy";
import type { EventDaySheet } from "@/lib/event-vendor-studio";

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
  businessId,
}: {
  rows: StaleRow[];
  businessId?: string;
}) {
  const { toast } = useToast();

  if (rows.length === 0) return null;

  async function copyFollowUp(quoteId: string) {
    if (!businessId) return;
    try {
      const row = await customFetch<{ whatsappText: string }>(
        `/api/businesses/${businessId}/quotes/${quoteId}/stale-liv-draft`,
      );
      await navigator.clipboard.writeText(row.whatsappText);
      toast({
        title: "Follow-up copied",
        description: "Paste into WhatsApp — Liv drafted it for you.",
      });
    } catch {
      toast({ title: "Could not copy follow-up", variant: "destructive" });
    }
  }

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
                {formatEventTypeLabel(row.eventType)} · {row.daysSinceSent} days ago
              </p>
            </div>
            <div className="flex gap-1">
              {businessId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs"
                  onClick={() => void copyFollowUp(row.quoteId)}
                  data-testid={`stale-nudge-copy-${row.quoteId}`}
                >
                  Copy Liv follow-up
                </Button>
              ) : null}
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

export function EventDaySheetPanel({
  sheet,
  enquiry,
  className,
}: {
  sheet?: EventDaySheet | null;
  enquiry?: {
    eventDate?: string | null;
    eventType?: string | null;
    theme?: string | null;
    guestCount?: number | null;
    venue?: string | null;
  } | null;
  className?: string;
}) {
  const eventDate = sheet?.eventDate ?? enquiry?.eventDate;
  const eventType = sheet?.eventType ?? enquiry?.eventType;
  const theme = sheet?.theme ?? enquiry?.theme;
  const guestCount = sheet?.guestCount ?? enquiry?.guestCount;
  const venue = sheet?.venue ?? enquiry?.venue;
  const checklist = sheet?.setupChecklist ?? [];

  if (!eventDate && !venue && !theme && checklist.length === 0) return null;

  return (
    <section
      className={`rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] via-background to-amber-500/[0.04] p-4 space-y-4 ${className ?? ""}`}
      data-testid="event-day-sheet-panel"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calendar className="h-4 w-4 text-primary shrink-0" />
        Event day sheet
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        {eventDate ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="text-foreground font-medium">{eventDate}</span>
              {eventType ? ` · ${formatEventTypeLabel(eventType)}` : ""}
            </span>
          </p>
        ) : null}
        {venue ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground">{venue}</span>
          </p>
        ) : null}
        {theme ? (
          <p className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>
              Theme: <span className="text-foreground font-medium">{theme}</span>
            </span>
          </p>
        ) : null}
        {guestCount ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{guestCount} guests</span>
          </p>
        ) : null}
      </div>
      {checklist.length > 0 ? (
        <ul className="space-y-1.5 text-xs border-t border-primary/10 pt-3">
          {checklist.map((item) => (
            <li key={item} className="flex gap-2 text-muted-foreground">
              <span className="text-primary font-medium shrink-0">□</span>
              {item}
            </li>
          ))}
        </ul>
      ) : null}
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
          {formatEventTypeLabel(eventType)} · {eventDate}
        </p>
      ) : null}
    </div>
  );
}
