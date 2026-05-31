import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Shield, Sparkles, ChevronRight } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import { LivProposalsPanel } from "@/components/liv-proposals-panel";
import { LIV_MANDATE_RUNG_LABELS, type LivAutonomyRung } from "@workspace/policy";
import { OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";
import { cn } from "@/lib/utils";

type MandatePeek = {
  mandate: { rung: string; trustScore: number };
};

export function OwnerLivGuardrails() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";

  const { data: mandateData, isLoading: mandateLoading } = useQuery({
    queryKey: ["liv-mandate-peek", bid],
    queryFn: () => customFetch<MandatePeek>(`/api/businesses/${bid}/liv-mandate`),
    enabled: !!bid,
    staleTime: 60_000,
    refetchInterval: OPERATIONAL_REFETCH_MS,
  });

  const rung = (mandateData?.mandate.rung ?? "R1") as LivAutonomyRung;
  const rungCopy = LIV_MANDATE_RUNG_LABELS[rung] ?? LIV_MANDATE_RUNG_LABELS.R1;
  const trust = mandateData?.mandate.trustScore ?? 40;

  return (
    <div className="space-y-4" data-testid="owner-liv-guardrails">
      <LivProposalsPanel variant="home" maxItems={3} />

      <div
        className={cn(
          "rounded-xl border border-border/80 bg-card/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3",
          !mandateLoading && "border-violet-500/20",
        )}
        data-testid="owner-liv-trust-strip"
      >
        <div className="flex gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">
              Liv guardrails · <span className="text-violet-600 dark:text-violet-400">{rungCopy.short}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {mandateLoading ? "Loading mandate…" : rungCopy.description}
              {!mandateLoading ? (
                <span className="font-mono text-[10px] ml-1">· trust {trust}%</span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/settings?tab=liv"
            className="inline-flex items-center text-xs font-medium text-primary hover:underline min-h-[44px] sm:min-h-0"
          >
            Tune Liv
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>
          <Link
            href="/settings?tab=legal"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground min-h-[44px] sm:min-h-0"
          >
            <Shield className="h-3 w-3 mr-1" aria-hidden />
            Legal & trust
          </Link>
        </div>
      </div>
    </div>
  );
}
