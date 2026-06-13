import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Copy, Sparkles } from "lucide-react";

type PrepRow = {
  quoteId: string;
  contactName: string;
  eventType?: string | null;
  taskId: string;
  label: string;
  dueDate: string;
  phase: string;
  overdue: boolean;
};

export function EventPrepTasksPanel({
  rows,
  onCopyNudge,
}: {
  rows: PrepRow[];
  onCopyNudge: (quoteId: string, taskId: string) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4 space-y-3"
      data-testid="event-prep-tasks-panel"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Liv event prep
        </h2>
        <Badge variant="secondary">{rows.length}</Badge>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={`${row.quoteId}-${row.taskId}`}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
              row.overdue ? "border-amber-500/40 bg-amber-500/5" : "bg-background/80"
            }`}
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{row.contactName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {row.label} · {row.dueDate}
                {row.overdue ? " · overdue" : ""}
              </p>
            </div>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={`/quotes?id=${row.quoteId}`}>Open</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onCopyNudge(row.quoteId, row.taskId)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Nudge
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
