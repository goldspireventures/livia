import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { useBusiness } from "@/lib/business-context";
import { cn } from "@/lib/utils";
import { HelpSupportDialog } from "@/components/help-support-dialog";
import { Button } from "@/components/ui/button";

type LivIncidentItem = {
  id: string;
  kind: "incident" | "support_ticket";
  createdAt: string;
  ticketId: string | null;
  conversationId: string | null;
  bookingId: string | null;
  status: string;
  summary: string;
};

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return "earlier";
}

export function LivIncidentsStrip({ className }: { className?: string }) {
  const { business } = useBusiness();
  const bid = business?.id ?? "";

  const { data } = useQuery({
    queryKey: ["liv-incidents", bid],
    queryFn: () =>
      apiFetch<{ data: LivIncidentItem[]; openCount: number }>(
        `/api/businesses/${bid}/liv-incidents`,
      ),
    enabled: !!bid,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const items = data?.data ?? [];
  if (items.length === 0) return null;

  return (
    <div
      className={cn("space-y-2", className)}
      data-testid="liv-incidents-strip"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          Liv was wrong
          {data?.openCount ? ` · ${data.openCount} open` : null}
        </div>
        <HelpSupportDialog
          trigger={
            <Button variant="outline" size="sm" data-testid="button-report-liv-incidents">
              Report Liv
            </Button>
          }
          defaultCategory="liv_error"
        />
      </div>
      <ul className="space-y-2">
        {items.slice(0, 3).map((item) => {
          const href = item.bookingId
            ? `/bookings/${item.bookingId}`
            : item.conversationId
              ? `/inbox?conversation=${item.conversationId}`
              : null;
          const inner = (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{item.summary}</p>
                <p className="text-[10px] font-mono text-muted-foreground/80 mt-1">
                  {item.status} · {relativeTime(item.createdAt)}
                </p>
              </div>
              {href ? (
                <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
              ) : null}
            </>
          );
          return (
            <li key={item.id}>
              {href ? (
                <Link
                  href={href}
                  className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 transition-colors hover:bg-amber-500/10"
                >
                  {inner}
                </Link>
              ) : (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        Automation is paused on reported errors until your team reviews. Support is copied on new
        reports.
      </p>
    </div>
  );
}
