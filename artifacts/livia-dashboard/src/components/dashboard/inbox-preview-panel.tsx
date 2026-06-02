import { Link } from "wouter";
import { ChevronRight, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  customerName: string | null;
  lastMessagePreview?: string | null;
  updatedAt?: string;
  status?: string;
  channel?: string;
};

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function InboxPreviewPanel({
  threads,
  loading,
  attentionCount,
  compact = false,
}: {
  threads: Thread[];
  loading?: boolean;
  /** Threads that actually need a human (handoffs / needs-you). */
  attentionCount: number;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border/80 bg-card overflow-hidden flex flex-col",
        !compact && "min-h-[180px]",
      )}
      data-testid="inbox-preview-panel"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
        <h2 className="text-sm font-semibold">Inbox</h2>
        {attentionCount > 0 ? (
          <Badge variant="secondary" className="text-[10px] font-mono tabular-nums">
            {attentionCount} need{attentionCount === 1 ? "s" : ""} you
          </Badge>
        ) : null}
      </div>
      {loading ? (
        <div className="p-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
          <MessageSquare className="h-6 w-6 text-muted-foreground/40 mb-1.5" aria-hidden />
          <p className="text-xs text-muted-foreground">Inbox clear</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/inbox?conversation=${t.id}`}
                className="flex items-start gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {t.customerName?.trim() || "Guest"}
                    </p>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {relativeTime(t.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-snug mt-0.5">
                    {t.lastMessagePreview?.trim() || "Open thread"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto border-t border-border/60 px-3 py-1.5">
        <Link href="/inbox">
          <Button variant="ghost" size="sm" className="w-full text-xs h-8">
            Open inbox
          </Button>
        </Link>
      </div>
    </section>
  );
}
