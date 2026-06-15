import { Loader2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  provisioned: boolean;
  businessCount: number;
  loading?: boolean;
  error?: string | null;
  busy?: string | null;
  onSetup: () => void;
  onRetry?: () => void;
  className?: string;
};

/** G1 — one glance: is the live demo world seeded and ready to enter? */
export function DemoWorldReadinessStrip({
  provisioned,
  businessCount,
  loading,
  error,
  busy,
  onSetup,
  onRetry,
  className,
}: Props) {
  if (loading && !provisioned && businessCount === 0) {
    return (
      <div
        className={cn(
          "mb-6 flex items-center gap-2 text-sm text-white/55",
          className,
        )}
        data-testid="demo-world-readiness-loading"
      >
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        Checking demo world…
      </div>
    );
  }

  if (provisioned) {
    return (
      <div
        className={cn(
          "mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50",
          className,
        )}
        data-testid="demo-world-readiness-ready"
      >
        <p className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/90 shrink-0" aria-hidden />
          <span>
            Live demo ready · {businessCount} seeded {businessCount === 1 ? "business" : "businesses"}
          </span>
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={!!busy || loading}
            className="inline-flex items-center gap-1 text-white/45 hover:text-white/70 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} aria-hidden />
            Refresh
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/12 bg-white/[0.04] px-4 py-3",
        className,
      )}
      data-testid="demo-world-readiness-setup"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm text-white/80">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300/90" aria-hidden />
          Set up demo world once — then <strong className="font-medium">Enter live demo</strong> unlocks
        </p>
        {error ? (
          <p className="mt-1 text-xs text-white/45">
            Status check: {error}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={onSetup}
          disabled={!!busy}
          id="demo-setup"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          data-testid="demo-world-setup-cta"
        >
          {busy === "provision" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden />
          )}
          Set up demo world
        </button>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={!!busy || loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs text-white/60 hover:bg-white/5 disabled:opacity-60"
          >
            Retry status
          </button>
        ) : null}
      </div>
    </div>
  );
}
