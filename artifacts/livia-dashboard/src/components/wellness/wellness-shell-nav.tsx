import { Fragment, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Compass, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PresentationLayoutMorph, WellnessPersonaKind } from "@workspace/policy";
import {
  resolveWellnessShellActiveId,
  resolveWellnessNavContext,
  wellnessQuickAccessIdSet,
  wellnessQuickAccessGrouped,
  wellnessContextExtraItems,
  WELLNESS_GUEST_SURFACE_LINKS,
  resolveWellnessGuestSurfaceHref,
  filterWellnessNavItems,
  type WellnessShellNavItem,
} from "@workspace/policy";
import { WellnessCompassDialog, useWellnessCompassShortcut } from "@/components/wellness/wellness-compass-dialog";

type Props = {
  morph: PresentationLayoutMorph;
  businessName?: string;
  businessSlug?: string;
  teamNoun?: string;
  serviceNoun?: string;
  persona?: WellnessPersonaKind | null;
  utilityActions?: React.ReactNode;
  /** Vertical capability ids that are ready (not deferred-only). */
  readyVerticalCapabilityIds?: string[];
};

function NavPill({
  item,
  active,
  variant = "primary",
}: {
  item: WellnessShellNavItem;
  active: boolean;
  variant?: "primary" | "extra";
}) {
  return (
    <Link
      href={item.href}
      data-testid={`wellness-nav-${item.id}`}
      data-active={active ? "true" : undefined}
      className={cn(
        "wellness-nav-pill rounded-full font-medium transition-colors whitespace-nowrap",
        variant === "primary"
          ? "px-2.5 sm:px-3 py-1 text-xs sm:text-sm"
          : "px-2 py-0.5 text-xs",
        active
          ? "wellness-nav-pill--active bg-primary text-primary-foreground shadow-sm"
          : variant === "primary"
            ? "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            : "text-muted-foreground/90 hover:text-foreground hover:bg-muted/50 border border-border/50",
      )}
    >
      {item.label}
    </Link>
  );
}

function GuestPreviewMenu({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0" data-testid="wellness-guest-preview-menu">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1 px-2 text-xs text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        Guest
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-50", open && "rotate-180")} />
      </Button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border bg-popover p-1 shadow-md">
          {WELLNESS_GUEST_SURFACE_LINKS.map((link) => {
            const href = resolveWellnessGuestSurfaceHref(link.hrefTemplate, slug);
            const row = "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm hover:bg-muted/80";
            return link.external ? (
              <a key={link.id} href={href} target="_blank" rel="noreferrer" className={row}>
                {link.label}
                <ExternalLink className="h-3.5 w-3.5 opacity-50" />
              </a>
            ) : (
              <Link key={link.id} href={href} className={row} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function WellnessShellNav({
  morph,
  businessName,
  businessSlug,
  teamNoun = "Practitioners",
  serviceNoun = "Sessions",
  persona = null,
  utilityActions,
  readyVerticalCapabilityIds,
}: Props) {
  const readyCapSet = useMemo(
    () => new Set(readyVerticalCapabilityIds ?? []),
    [readyVerticalCapabilityIds],
  );
  const filterNav = useCallback(
    <T extends { href: string }>(items: T[]) => filterWellnessNavItems(items, readyCapSet),
    [readyCapSet],
  );
  const [location] = useLocation();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const [compassOpen, setCompassOpen] = useState(false);
  const openCompass = useCallback(() => setCompassOpen(true), []);

  const activeNavId = resolveWellnessShellActiveId(location, morph, search);
  const navContext = resolveWellnessNavContext(location, morph, teamNoun, serviceNoun, search);
  const pinnedIds = wellnessQuickAccessIdSet(morph, persona);
  const quickGroups = wellnessQuickAccessGrouped(morph, teamNoun, serviceNoun, persona).map(
    (group) => ({
      ...group,
      items: filterNav(group.items),
    }),
  ).filter((group) => group.items.length > 0);
  const contextExtras = filterNav(wellnessContextExtraItems(navContext, pinnedIds));

  useWellnessCompassShortcut(openCompass, morph !== "timeline-rail");

  if (morph === "timeline-rail") {
    const rail = filterNav([
      { id: "today", href: "/dashboard", label: "◎", title: "Today" },
      { id: "reception", href: "/wellness-reception", label: "⌂", title: "Reception" },
      { id: "inbox", href: "/inbox", label: "✉", title: "Inbox" },
      { id: "rooms", href: "/bookings", label: "▣", title: "Rooms" },
      { id: "retail", href: "/store", label: "◇", title: "Retail" },
      { id: "sessions", href: "/services", label: "◆", title: serviceNoun },
      { id: "staff", href: "/staff", label: "👥", title: teamNoun },
      { id: "settings", href: "/settings", label: "⚙", title: "Settings" },
    ]);
    return (
      <nav
        className="wellness-rail-shell-nav hidden md:flex flex-col w-14 shrink-0 border-r bg-foreground text-background py-4 gap-3 items-center"
        data-testid="wellness-rail-shell-nav"
        aria-label="Practitioner rail"
      >
        {rail.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.title}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors",
              location.startsWith(item.href) ? "bg-background text-foreground" : "opacity-70 hover:opacity-100",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <>
      <header
        className={cn(
          "wellness-shell-chrome sticky top-0 z-30 shrink-0 border-b bg-background/98 backdrop-blur-md",
          morph === "ledger" ? "border-border" : "wellness-atrium-topnav-bar",
        )}
        data-testid="wellness-shell-topnav"
      >
        <div
          className="wellness-shell-nav-bar flex items-center gap-2 px-3 lg:px-5 min-h-12 py-1.5"
          data-testid="wellness-shell-nav-strip"
        >
          <Link href="/dashboard" className="wellness-nav-brand shrink-0 max-w-[7rem] sm:max-w-[9rem] min-w-0">
            <span className="block truncate font-serif text-sm font-medium text-foreground">
              {businessName ?? "Wellness"}
            </span>
          </Link>

          <nav
            className="wellness-quick-nav flex flex-1 items-center gap-1 min-w-0 overflow-x-auto"
            aria-label="Quick access"
            data-testid="wellness-quick-nav"
          >
            {quickGroups.map((group, groupIndex) => (
              <Fragment key={group.id}>
                {groupIndex > 0 ? (
                  <span className="w-px h-4 bg-border/70 shrink-0 mx-0.5" aria-hidden />
                ) : null}
                {group.items.map((item) => (
                  <NavPill key={item.id} item={item} active={activeNavId === item.id} variant="primary" />
                ))}
              </Fragment>
            ))}

            {contextExtras.length > 0 ? (
              <>
                <span className="w-px h-4 bg-border/60 shrink-0 mx-0.5" aria-hidden />
                {navContext ? (
                  <span className="hidden md:inline text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0 px-0.5">
                    {navContext.cluster.label}
                  </span>
                ) : null}
                {contextExtras.map((item) => (
                  <NavPill key={item.id} item={item} active={activeNavId === item.id} variant="extra" />
                ))}
              </>
            ) : null}
          </nav>

          <div className="flex items-center gap-1 shrink-0 border-l border-border/50 pl-1.5 ml-auto sm:ml-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="wellness-compass-trigger h-8 gap-1 px-2 text-xs font-normal"
              onClick={() => setCompassOpen(true)}
              data-testid="wellness-compass-trigger"
            >
              <Compass className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
              <span className="hidden lg:inline">Go to</span>
              <kbd className="hidden xl:inline rounded border bg-muted px-1 py-px text-[10px] font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
            {businessSlug ? <GuestPreviewMenu slug={businessSlug} /> : null}
            {utilityActions}
          </div>
        </div>
      </header>

      <WellnessCompassDialog
        open={compassOpen}
        onOpenChange={setCompassOpen}
        morph={morph}
        teamNoun={teamNoun}
        serviceNoun={serviceNoun}
        businessSlug={businessSlug}
        activeId={activeNavId}
      />
    </>
  );
}
