import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { CalendarDays, Heart, LogOut, Sparkles } from "lucide-react";
import { GUEST_HUB_COPY } from "@workspace/policy";
import { LiviaLogoLink } from "@/components/brand/livia-logo-link";
import { PublicSurfaceFooter } from "@/components/public/public-surface-chrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  applyGuestHubPlatformTheme,
  clearGuestHubPlatformTheme,
} from "@/lib/experience-theme";

export function GuestHubPageHeader({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-serif tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}

function GuestHubTopNav({
  phoneE164,
  onSignOut,
}: {
  phoneE164?: string;
  onSignOut?: () => void;
}) {
  const [location] = useLocation();
  const onHome = location === "/my" || location === "/my/";

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 min-w-0">
          <LiviaLogoLink size="sm" className="shrink-0 opacity-90" home="marketing" />
          <div className="hidden sm:block h-5 w-px bg-border/80" aria-hidden />
          <Link
            href="/my"
            className={cn(
              "text-sm font-medium truncate transition-colors",
              onHome ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {GUEST_HUB_COPY.productName}
          </Link>
          {phoneE164 ? (
            <span className="hidden md:inline text-xs text-muted-foreground font-mono truncate">
              {phoneE164}
            </span>
          ) : null}
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          {phoneE164 ? (
            <>
              <Button
                variant={onHome ? "secondary" : "ghost"}
                size="sm"
                className="hidden sm:inline-flex gap-1.5"
                asChild
              >
                <Link href="/my">
                  <Heart className="h-3.5 w-3.5" />
                  Studios
                </Link>
              </Button>
              {onSignOut ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={onSignOut}
                  data-testid="guest-hub-sign-out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{GUEST_HUB_COPY.signOutCta}</span>
                </Button>
              ) : null}
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

function GuestHubSidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-20 lg:self-start">
      <nav className="rounded-xl border border-border/80 bg-card/40 p-2 space-y-0.5">
        <Link
          href="/my"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
            location === "/my" || location === "/my/"
              ? "bg-primary/10 text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <Heart className="h-4 w-4 shrink-0" />
          Your studios
        </Link>
      </nav>
      <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 flex gap-2">
        <CalendarDays className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {GUEST_HUB_COPY.sidebarWebHint}
        </p>
      </div>
    </aside>
  );
}

/** W6 guest hub chrome — desktop-first web layout (not a phone column). */
export function GuestHubShell({
  children,
  testId,
  phoneE164,
  hubToken,
  onSignOut,
  centered,
}: {
  children: ReactNode;
  testId?: string;
  phoneE164?: string;
  hubToken?: string | null;
  onSignOut?: () => void;
  /** Narrow centered column for minimal error / sign-in-required states */
  centered?: boolean;
}) {
  useEffect(() => {
    applyGuestHubPlatformTheme();
    return () => clearGuestHubPlatformTheme();
  }, []);

  const showSidebar = Boolean(hubToken) && !centered;

  return (
    <div
      className="min-h-screen flex flex-col bg-background guest-hub-shell guest-hub-platform"
      data-testid={testId}
    >
      <GuestHubTopNav phoneE164={phoneE164} onSignOut={onSignOut} />

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {centered ? (
          <main className="mx-auto max-w-md space-y-6">{children}</main>
        ) : (
          <div
            className={cn(
              "grid gap-8 lg:gap-10",
              showSidebar && "lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]",
            )}
          >
            {showSidebar ? <GuestHubSidebar /> : null}
            <main className="min-w-0 space-y-8">{children}</main>
          </div>
        )}

        {!hubToken ? <GuestHubLivStrip /> : null}
      </div>

      <div className="mt-auto border-t border-border/60">
        <PublicSurfaceFooter />
      </div>
    </div>
  );
}

function GuestHubLivStrip() {
  return (
    <aside
      className="mx-auto max-w-2xl mb-6 px-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent py-3 flex gap-2 items-start"
      data-testid="guest-hub-liv-strip"
    >
      <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="text-foreground font-medium">{GUEST_HUB_COPY.livStripTitle}</span> —{" "}
        {GUEST_HUB_COPY.livStripBody}
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
    <Link
      href={visitUrl}
      className="block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-5 sm:p-6 shadow-sm hover:border-primary/50 transition-colors"
      data-testid="guest-hub-upcoming-hero"
    >
      <p className="text-[10px] uppercase tracking-widest font-mono text-primary mb-2">
        {GUEST_HUB_COPY.upcomingSection}
      </p>
      <p className="text-xl sm:text-2xl font-serif leading-tight">{businessName}</p>
      <p className="text-sm text-muted-foreground mt-1">{serviceName}</p>
      <p className="text-sm font-mono tabular-nums mt-3">{formatDateTime(startAt)}</p>
      <p className="text-xs text-primary mt-3 font-medium">Manage visit →</p>
    </Link>
  );
}
