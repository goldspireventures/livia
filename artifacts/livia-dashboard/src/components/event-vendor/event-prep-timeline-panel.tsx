import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Sparkles } from "lucide-react";
import {
  eventPrepTimelineLoadingLine,
  type EventPrepTask,
} from "@workspace/policy";

type PrepView = {
  eventDate?: string | null;
  prepInitializedAt?: string | null;
  lifecycle: { prepTasks: EventPrepTask[] };
  upcoming: EventPrepTask[];
  overdue: EventPrepTask[];
};

export type { PrepView };

type Props = {
  prep: PrepView | null;
  loading?: boolean;
  onComplete: (taskId: string) => void;
  onCopyNudge: (taskId: string) => void;
};

const PHASE_LABEL: Record<string, string> = {
  venue_access: "2 weeks out",
  load_list: "Event eve",
  day_of_setup: "Event day",
  post_event_review: "After event",
};

/** Liv-managed prep timeline — shown once booking is secured. */
export function EventPrepTimelinePanel({ prep, loading, onComplete, onCopyNudge }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        {eventPrepTimelineLoadingLine()}
      </div>
    );
  }

  if (!prep?.prepInitializedAt) {
    return null;
  }

  const tasks = prep.lifecycle.prepTasks;
  const done = tasks.filter((t) => t.completedAt).length;

  return (
    <section
      className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] to-transparent p-4 space-y-3"
      data-testid="event-prep-timeline"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          Liv event prep
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {done}/{tasks.length} done
        </Badge>
      </div>
      {prep.eventDate ? (
        <p className="text-xs text-muted-foreground">
          Event {prep.eventDate} — Liv scheduled reminders from your quote line items.
        </p>
      ) : null}

      <ul className="space-y-2">
        {tasks.map((task) => {
          const overdue = prep.overdue.some((t) => t.id === task.id);
          const upcoming = prep.upcoming.some((t) => t.id === task.id);
          return (
            <li
              key={task.id}
              className={`rounded-lg border px-3 py-2.5 text-sm ${
                task.completedAt
                  ? "bg-muted/30 border-border/60 opacity-80"
                  : overdue
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "bg-background/80"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className={`font-medium ${task.completedAt ? "line-through text-muted-foreground" : ""}`}>
                    {task.label}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {PHASE_LABEL[task.phase] ?? task.phase} · due {task.dueDate}
                    {overdue && !task.completedAt ? " · overdue" : null}
                    {upcoming && !task.completedAt ? " · coming up" : null}
                  </p>
                </div>
                {!task.completedAt ? (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => onCopyNudge(task.id)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Liv nudge
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onComplete(task.id)}
                    >
                      Done
                    </Button>
                  </div>
                ) : null}
              </div>
              {task.phase === "load_list" && task.detail?.length && !task.completedAt ? (
                <ul className="mt-2 text-xs text-muted-foreground space-y-0.5 pl-3 border-l border-primary/20">
                  {task.detail.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              ) : null}
              {task.phase === "day_of_setup" && task.checklist?.length && !task.completedAt ? (
                <ul className="mt-2 text-xs text-muted-foreground space-y-0.5 pl-3 border-l border-primary/20">
                  {task.checklist.slice(0, 5).map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
