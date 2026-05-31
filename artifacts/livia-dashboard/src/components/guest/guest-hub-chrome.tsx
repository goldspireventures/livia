import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { PublicSurfaceFooter } from "@/components/public/public-surface-chrome";

export function GuestHubShell({
  children,
  testId,
  phoneE164,
}: {
  children: ReactNode;
  testId?: string;
  phoneE164?: string;
}) {
  return (
    <div
      className="min-h-screen bg-background guest-hub-shell public-booking-shell"
      data-testid={testId}
    >
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <header className="text-center space-y-2">
          <LiviaWordmark size="md" className="mx-auto opacity-90" />
          <p className="text-[10px] uppercase tracking-widest font-mono text-primary">My Livia</p>
          {phoneE164 ? (
            <p className="text-xs text-muted-foreground font-mono">{phoneE164}</p>
          ) : null}
        </header>
        {children}
        <GuestHubLivStrip />
        <PublicSurfaceFooter />
      </div>
    </div>
  );
}

function GuestHubLivStrip() {
  return (
    <aside
      className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 flex gap-2 items-start"
      data-testid="guest-hub-liv-strip"
    >
      <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="text-foreground font-medium">Liv orchestrator</span> — your bookings across
        every Livia shop live here. Book again in one tap; complex changes open the shop page.
      </p>
    </aside>
  );
}

export function GuestHubUpcomingHero({
  businessName,
  serviceName,
  startAt,
  visitUrl,
  formatDateTime,
}: {
  businessName: string;
  serviceName: string;
  startAt: string;
  visitUrl: string;
  formatDateTime: (iso: string) => string;
}) {
  return (
    <a
      href={visitUrl}
      className="block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-sm hover:border-primary/50 transition-colors"
      data-testid="guest-hub-upcoming-hero"
    >
      <p className="text-[10px] uppercase tracking-widest font-mono text-primary mb-2">Next visit</p>
      <p className="text-xl font-serif leading-tight">{businessName}</p>
      <p className="text-sm text-muted-foreground mt-1">{serviceName}</p>
      <p className="text-sm font-mono tabular-nums mt-3">{formatDateTime(startAt)}</p>
      <p className="text-xs text-primary mt-3 font-medium">Manage visit →</p>
    </a>
  );
}
