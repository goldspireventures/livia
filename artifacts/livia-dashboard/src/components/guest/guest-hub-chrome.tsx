import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { Heart, LogOut } from "lucide-react";
import { GUEST_HUB_COPY } from "@workspace/policy";
import { LiviaLogoLink } from "@/components/brand/livia-logo-link";
import { PublicSurfaceFooter } from "@/components/public/public-surface-chrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  applyGuestHubPlatformTheme,
  clearGuestHubPlatformTheme,
} from "@/lib/experience-theme";
import { GuestShopAvatar } from "@/components/guest/guest-shop-avatar";

export type GuestHubSidebarShop = {
  businessId: string;
  businessName: string;
  slug: string;
  logoUrl: string | null;
  imageUrl?: string | null;
  isFavorite: boolean;
  manageVisitUrl?: string | null;
};

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
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 min-w-0">
          <LiviaLogoLink size="sm" className="shrink-0 opacity-90" home="marketing" />
          <div className="hidden sm:block h-5 w-px bg-border/80" aria-hidden />
          <Link href="/my" className="text-sm font-medium truncate text-foreground">
            {GUEST_HUB_COPY.productName}
          </Link>
          {phoneE164 ? (
            <span className="hidden md:inline text-xs text-muted-foreground font-mono truncate">
              {phoneE164}
            </span>
          ) : null}
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          {phoneE164 && onSignOut ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={onSignOut}
              aria-label={GUEST_HUB_COPY.signOutCta}
              data-testid="guest-hub-sign-out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{GUEST_HUB_COPY.signOutCta}</span>
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

function GuestHubSidebar({ favoriteShops }: { favoriteShops?: GuestHubSidebarShop[] }) {
  const favorites = favoriteShops?.filter((s) => s.isFavorite) ?? [];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:gap-3 lg:sticky lg:top-20 lg:self-start">
      <p className="px-1 text-sm font-medium text-foreground">{GUEST_HUB_COPY.bookingsNav}</p>

      {favorites.length > 0 ? (
        <div className="rounded-xl border border-border/80 bg-card/40 p-2 space-y-0.5">
          {favorites.map((shop) => (
            <Link
              key={shop.businessId}
              href={shop.manageVisitUrl ?? `/my/${shop.slug}`}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <GuestShopAvatar
                businessName={shop.businessName}
                imageUrl={shop.imageUrl}
                logoUrl={shop.logoUrl}
                className="h-8 w-8 shrink-0"
              />
              <span className="truncate flex-1">{shop.businessName}</span>
              <Heart className="h-3.5 w-3.5 text-primary fill-primary shrink-0" aria-hidden />
            </Link>
          ))}
        </div>
      ) : null}

      <Link
        href="/my/account"
        className="text-xs text-muted-foreground hover:text-foreground px-1 transition-colors"
      >
        {GUEST_HUB_COPY.accountSettingsLink}
      </Link>
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
  sidebarShops,
}: {
  children: ReactNode;
  testId?: string;
  phoneE164?: string;
  hubToken?: string | null;
  onSignOut?: () => void;
  centered?: boolean;
  sidebarShops?: GuestHubSidebarShop[];
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
            {showSidebar ? <GuestHubSidebar favoriteShops={sidebarShops} /> : null}
            <main className="min-w-0 space-y-8">{children}</main>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-border/60">
        <PublicSurfaceFooter />
      </div>
    </div>
  );
}

export function GuestHubUpcomingHero({
  businessName,
  serviceName,
  startAt,
  visitUrl,
  formatDateTime,
  replaceHistory,
}: {
  businessName: string;
  serviceName: string;
  startAt: string;
  visitUrl: string;
  formatDateTime: (iso: string) => string;
  /** Skip intermediate hub pages in browser back stack when opening from /my home. */
  replaceHistory?: boolean;
}) {
  return (
    <Link
      href={visitUrl}
      replace={replaceHistory}
      className="block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-5 sm:p-6 shadow-sm hover:border-primary/50 transition-colors"
      data-testid="guest-hub-upcoming-hero"
    >
      <p className="text-[10px] uppercase tracking-widest font-mono text-primary mb-2">
        {GUEST_HUB_COPY.upcomingSection}
      </p>
      <p className="text-xl sm:text-2xl font-serif leading-tight">{businessName}</p>
      <p className="text-sm text-muted-foreground mt-1">{serviceName}</p>
      <p className="text-sm font-mono tabular-nums mt-3">{formatDateTime(startAt)}</p>
      <p className="text-xs text-primary mt-3 font-medium">{GUEST_HUB_COPY.manageVisitCta}</p>
    </Link>
  );
}
