import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { useBusiness } from "@/lib/business-context";
import { dedupeLivMomentsByTitle, resolveLivMomentsHomeCap } from "@workspace/policy";
import { cn } from "@/lib/utils";

type LivMoment = {
  id: string;
  kind: string;
  priority: "info" | "watch" | "act";
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
};

const PRIORITY_STYLES = {
  act: "border-destructive/40 bg-destructive/5",
  watch: "border-amber-500/40 bg-amber-500/5",
  info: "border-border/80 bg-muted/30",
} as const;

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return "earlier";
}

export function LivMomentsStrip({ className }: { className?: string }) {
  const { business } = useBusiness();
  const bid = business?.id ?? "";

  const { data } = useQuery({
    queryKey: ["liv-moments", bid],
    queryFn: () => apiFetch<{ data: LivMoment[] }>(`/businesses/${bid}/liv-moments`),
    enabled: !!bid,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const vertical = (business as { vertical?: string } | null)?.vertical ?? null;
  const moments = dedupeLivMomentsByTitle(
    data?.data ?? [],
    resolveLivMomentsHomeCap(vertical),
  );
  if (moments.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)} data-testid="liv-moments-strip">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
        Liv moments
      </div>
      <ul className="space-y-2">
        {moments.map((m) => (
          <li key={m.id}>
            {m.href ? (
              <Link
                href={m.href}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-muted/50",
                  PRIORITY_STYLES[m.priority],
                )}
              >
                <MomentBody moment={m} />
                <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
              </Link>
            ) : (
              <div
                className={cn(
                  "rounded-xl border px-4 py-3",
                  PRIORITY_STYLES[m.priority],
                )}
              >
                <MomentBody moment={m} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MomentBody({ moment: m }: { moment: LivMoment }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium leading-snug">{m.title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.body}</p>
      <p className="text-[10px] font-mono text-muted-foreground/80 mt-1">
        {relativeTime(m.createdAt)}
      </p>
    </div>
  );
}
