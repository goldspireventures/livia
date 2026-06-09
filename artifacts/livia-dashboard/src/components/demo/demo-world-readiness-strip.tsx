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
          "mb-6 flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white/60",
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
          "mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3",
          className,
        )}
        data-testid="demo-world-readiness-ready"
      >
        <p className="flex items-center gap-2 text-sm text-emerald-100">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <span>
            <strong className="font-semibold">Live demo ready</strong>
            {" · "}
            {businessCount} seeded {businessCount === 1 ? "business" : "businesses"} — pick a world, then
            Enter live demo.
          </span>
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={!!busy || loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 hover:bg-white/5 disabled:opacity-60"
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
        "mb-6 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-4",
        className,
      )}
      data-testid="demo-world-readiness-setup"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-100">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
            Set up demo world once — then Enter live demo unlocks
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-200/80 max-w-xl">
            Unlocked trades (Beauty, Wellness, Hair, Medspa) need a one-time seed (~30–60s). After that,
            G2 → Enter live demo signs you in as owner.
          </p>
          {error ? (
            <p className="mt-2 text-xs text-amber-200/70">
              Status check slow — you can still run setup. ({error})
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onSetup}
            disabled={!!busy}
            id="demo-setup"
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-60"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 px-3 py-2 text-xs text-amber-100 hover:bg-amber-400/10 disabled:opacity-60"
            >
              Retry status
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
