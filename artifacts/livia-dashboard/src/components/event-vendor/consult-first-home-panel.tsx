import { Link } from "wouter";
import { ArrowRight, CalendarClock, ClipboardList, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type StaleRow = {
  quoteId: string;
  contactName: string;
  eventType?: string | null;
  daysSinceSent: number;
};

type PrepRow = {
  quoteId: string;
  contactName: string;
  taskId: string;
  label: string;
  dueDate: string;
  overdue: boolean;
};

type LowFitRow = {
  enquiryId: string;
  contactName: string;
  eventType?: string | null;
  headline: string;
};

type Props = {
  newEnquiries: number;
  lowFitNewEnquiries?: number;
  lowFitList?: LowFitRow[];
  staleQuotesList?: StaleRow[];
  prepTaskList?: PrepRow[];
  pipelineForecast?: { quotedMinor: number; expectedMinor: number; weightLabel: string };
  replyBenchmark?: { label: string; percentile: number } | null;
  loading?: boolean;
};

/** Consult-first Today module — pipeline signal + follow-ups + event prep. */
export function ConsultFirstHomePanel({
  newEnquiries,
  lowFitNewEnquiries = 0,
  lowFitList = [],
  staleQuotesList = [],
  prepTaskList = [],
  pipelineForecast,
  replyBenchmark,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground" data-testid="consult-first-home-panel">
        Loading pipeline…
      </div>
    );
  }

  const stale = staleQuotesList.slice(0, 4);
  const prep = prepTaskList.slice(0, 3);

  return (
    <section className="space-y-3" data-testid="consult-first-home-panel">
      {newEnquiries > 0 ? (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <ClipboardList className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                {newEnquiries} new lead{newEnquiries === 1 ? "" : "s"} to review
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lowFitNewEnquiries > 0
                  ? `Liv flagged ${lowFitNewEnquiries} as low-fit — skim and let Liv decline if not worth your time.`
                  : "Qualify each enquiry — draft a quote or let Liv close politely."}
              </p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href="/inbox?lens=leads">
              Open inbox
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ) : null}

      {pipelineForecast && pipelineForecast.quotedMinor > 0 ? (
        <div
          className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 flex flex-wrap items-center justify-between gap-2"
          data-testid="pipeline-forecast-kpi"
        >
          <div>
            <p className="text-sm font-medium">Pipeline forecast</p>
            <p className="text-xs text-muted-foreground">{pipelineForecast.weightLabel}</p>
          </div>
          <p className="text-lg font-semibold tabular-nums">
            €{(pipelineForecast.expectedMinor / 100).toLocaleString("en-IE", { minimumFractionDigits: 0 })}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              of €{(pipelineForecast.quotedMinor / 100).toLocaleString("en-IE", { minimumFractionDigits: 0 })} quoted
            </span>
          </p>
        </div>
      ) : null}

      {replyBenchmark ? (
        <p className="text-xs text-muted-foreground px-1" data-testid="reply-time-benchmark">
          Reply speed: {replyBenchmark.label}
        </p>
      ) : null}

      {lowFitList.length > 0 ? (
        <div className="rounded-xl border border-muted-foreground/25 bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium">Liv pre-screen — quick review</p>
          <ul className="space-y-2">
            {lowFitList.map((row) => (
              <li key={row.enquiryId}>
                <Link
                  href={`/inbox?lead=${encodeURIComponent(row.enquiryId)}`}
                  className="text-sm hover:underline flex flex-wrap items-center gap-2"
                >
                  <span className="font-medium">{row.contactName}</span>
                  <span className="text-xs text-muted-foreground">{row.headline}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {stale.length > 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Quotes to follow up</p>
            <Badge variant="secondary">{stale.length}</Badge>
          </div>
          <ul className="space-y-2">
            {stale.map((row) => (
              <li
                key={row.quoteId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/80 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.contactName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.eventType ?? "Event"} · sent {row.daysSinceSent}d ago
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={`/quotes?id=${row.quoteId}`}>Open quote</Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {prep.length > 0 ? (
        <div className="rounded-xl border p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="h-4 w-4 text-primary" />
            Event prep due
          </div>
          <ul className="space-y-2">
            {prep.map((row) => (
              <li key={`${row.quoteId}-${row.taskId}`} className="text-sm flex flex-wrap justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.contactName} · due {row.dueDate}
                    {row.overdue ? " · overdue" : ""}
                  </p>
                </div>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" asChild>
                  <Link href={`/quotes?id=${row.quoteId}`}>
                    <FileText className="h-3 w-3 mr-1" />
                    Prep
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
