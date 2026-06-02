import { useEffect, type ReactNode } from "react";
import { applyGatewaySurfaceTheme } from "@/lib/gateway-surface-theme";
import { Link } from "wouter";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  breadcrumb: string;
  step?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

/** W2 gateway chrome — infused aurora (G1–G3 + sign-in family). */
export function GatewayShell({
  children,
  breadcrumb,
  step,
  backHref = "/demo",
  backLabel = "← Worlds",
  className,
}: Props) {
  useEffect(() => {
    applyGatewaySurfaceTheme();
  }, []);

  return (
    <div
      className={cn(
        "relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#05060c] text-foreground",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-[10%] top-0 h-[55%] w-[70%] rounded-full bg-aurum-champagne/10 blur-[100px]" />
        <div className="absolute right-0 top-[5%] h-[50%] w-[60%] rounded-full bg-aurora-cyan/12 blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 h-[40%] w-[50%] rounded-full bg-primary/8 blur-[90px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="min-w-0">
          <LiviaWordmark size="md" />
          <p className="mt-1 truncate text-xs text-muted-foreground">{breadcrumb}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {step ? (
            <span className="hidden rounded-md border border-aurum-champagne/40 bg-aurum-champagne/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-aurum-champagne sm:inline">
              {step}
            </span>
          ) : null}
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-white/70">
            Demo gateway
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-5 pb-10 pt-2 sm:px-8">{children}</main>

      <footer className="relative z-10 px-5 pb-8 sm:px-8">
        <Link
          href={backHref}
          className="inline-flex min-h-[44px] items-center rounded-full border border-aurum-champagne/35 px-4 text-sm text-aurum-champagne/90 transition hover:border-aurum-champagne/60 hover:text-aurum-champagne"
        >
          {backLabel}
        </Link>
      </footer>
    </div>
  );
}
