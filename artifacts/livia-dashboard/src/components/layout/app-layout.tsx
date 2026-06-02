import { Link, useLocation } from "wouter";

import { ReactNode, useEffect, useMemo, useState } from "react";

import { useBusiness } from "@/lib/business-context";

import { useMembership, type Role } from "@/lib/membership-context";

import { PERSONA_ACCENT, isDemoLoginEnabled, usePersona } from "@/lib/persona";

import { getRitualNav } from "@/lib/persona-rituals";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { applyExperienceTheme, applyPresentationTheme, resolvePresentationColorMode } from "@/lib/experience-theme";
import {
  isAppearanceEmbed,
  readAppearancePreviewParams,
  shouldApplyUrlPreviewToDocument,
} from "@/lib/appearance-preview-mode";
import { isBeautyPresentationPreset, isBeautyVertical } from "@/lib/presentation-layout";
import { applyBeautyAmbient } from "@/lib/beauty-ambient";
import { useTheme } from "next-themes";
import { fetchUserLifecycle } from "@/lib/lifecycle-api";
import { useTenantExperience } from "@/lib/tenant-experience-api";

import { UserButton } from "@clerk/clerk-react";

const accountMenuAppearance = {
  elements: {
    userButtonTrigger: { "aria-label": "Open account menu" },
  },
} as const;

import { BeautySidebarBrand } from "@/components/brand/beauty-sidebar-brand";
import { StudioHeaderBrand } from "@/components/brand/studio-header-brand";

import { cn } from "@/lib/utils";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import { KeysChangedRitual } from "@/components/lifecycle/keys-changed-ritual";
import { OnboardingProgressBanner } from "@/components/onboarding-progress-banner";
import { OperatorMaturityBanner } from "@/components/operator-maturity-banner";
import { PlatformTour } from "@/components/platform-tour";
import { NotificationCenter } from "@/components/notification-center";
import { useNavActionCounts } from "@/hooks/use-nav-action-counts";
import { useWebPush } from "@/hooks/useWebPush";
import { HelpSupportDialog } from "@/components/help-support-dialog";
import { ErrorBoundary } from "@/components/error-boundary";



function BusinessSwitcher() {

  const { business, businesses, setBusinessById } = useBusiness();

  if (!Array.isArray(businesses) || businesses.length < 2 || !business) return null;

  return (

    <div className="beauty-skin-hairline px-3 py-2 border-b border-border" data-testid="business-switcher">

      <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">

        Location

      </label>

      <Select value={business.id} onValueChange={setBusinessById}>

        <SelectTrigger
          className="h-8 text-xs"
          data-testid="business-switcher-trigger"
          aria-label="Switch location"
        >

          <SelectValue />

        </SelectTrigger>

        <SelectContent>

          {businesses.map((b) => (

            <SelectItem key={b.id} value={b.id} data-testid={`business-switcher-option-${b.id}`}>

              {b.name ?? b.slug ?? b.id}

            </SelectItem>

          ))}

        </SelectContent>

      </Select>

    </div>

  );

}



export function AppLayout({ children }: { children: ReactNode }) {
  useWebPush();

  const [location] = useLocation();

  const appearanceEmbed = isAppearanceEmbed();

  useEffect(() => {
    if (appearanceEmbed) {
      document.documentElement.classList.add("appearance-embed-dashboard");
      return () => document.documentElement.classList.remove("appearance-embed-dashboard");
    }
    document.documentElement.classList.add("app-shell-locked");
    return () => document.documentElement.classList.remove("app-shell-locked");
  }, [appearanceEmbed]);

  useEffect(() => {
    applyBeautyAmbient();
    const id = window.setInterval(() => applyBeautyAmbient(), 60 * 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { business, businesses } = useBusiness();
  const { data: tenantExperience } = useTenantExperience(business?.id);
  const { setTheme } = useTheme();

  const { effectiveRole, role } = useMembership();

  const { kind: persona } = usePersona();

  const [showLifecycle, setShowLifecycle] = useState(false);

  useEffect(() => {
    applyExperienceTheme({
      vertical: (business as { vertical?: string } | null)?.vertical,
      category: (business as { category?: string } | null)?.category,
      country: (business as { country?: string } | null)?.country,
      persona,
    });
  }, [business, persona]);

  useEffect(() => {
    const draft = readAppearancePreviewParams();
    if (shouldApplyUrlPreviewToDocument() && draft.isPreview && draft.cssPreset) {
      const colorMode = resolvePresentationColorMode(draft.cssPreset);
      applyPresentationTheme({
        cssPreset: draft.cssPreset,
        brandAccentHex: draft.brandAccentHex,
        colorMode,
      });
      if (colorMode) setTheme(colorMode);
      return;
    }

    const p = tenantExperience?.presentation;
    const colorMode = p?.tokens?.colorMode;
    applyPresentationTheme({
      cssPreset: p?.cssPreset ?? "platform-default",
      brandAccentHex: p?.brandAccentHex,
      colorMode: colorMode === "light" || colorMode === "dark" ? colorMode : null,
    });
    if (colorMode === "light" || colorMode === "dark") {
      setTheme(colorMode);
    }
  }, [
    tenantExperience?.presentation?.cssPreset,
    tenantExperience?.presentation?.brandAccentHex,
    tenantExperience?.presentation?.tokens?.colorMode,
    setTheme,
    location,
  ]);

  useEffect(() => {
    if (role !== "OWNER" && persona !== "org_admin") {
      setShowLifecycle(false);
      return;
    }
    if (businesses.length >= 2) {
      setShowLifecycle(true);
      return;
    }
    void fetchUserLifecycle()
      .then((d) => setShowLifecycle(d.suggestions.length > 0))
      .catch(() => setShowLifecycle(false));
  }, [role, persona, businesses.length]);

  /** Vertical theme sets `--primary`; persona tint only for badge copy. */
  const accent = "hsl(var(--primary))";

  const items = getRitualNav(
    persona,
    effectiveRole,
    businesses.length,
    isDemoLoginEnabled,
    (business as { tier?: string } | null)?.tier,
    (business as { vertical?: string } | null)?.vertical,
    (business as { category?: string } | null)?.category,
    { showLifecycle },
  );



  const { pendingCount, handedOffCount } = useNavActionCounts();
  const navBadges = useMemo(() => {
    const badges: Record<string, number> = {};
    if (handedOffCount > 0) badges["/inbox"] = handedOffCount;
    if (pendingCount > 0) badges["/bookings"] = pendingCount;
    return badges;
  }, [handedOffCount, pendingCount]);

  const vertical =
    (business as { vertical?: string } | null)?.vertical ?? tenantExperience?.vertical ?? null;
  const showBeautyFlower = isBeautyVertical(vertical);

  return (

    <div
      className={cn(
        "flex w-full flex-col bg-background md:flex-row",
        appearanceEmbed ? "min-h-0 h-auto overflow-visible" : "h-[100dvh] overflow-hidden",
      )}
    >

      <aside
        data-testid="app-shell-sidebar"
        className={cn(
          "app-shell-sidebar hidden w-[13.5rem] max-w-[13.5rem] shrink-0 flex-col border-r border-border/40 bg-card/50 md:flex relative overflow-hidden",
        )}
      >
        {showBeautyFlower ? (
          <>
            <div className="beauty-sidebar-stack relative z-10 flex min-h-0 flex-1 flex-col">
              <BeautySidebarBrand
                businessName={business?.name || "Your shop"}
                logoUrl={(business as { logoUrl?: string | null } | null)?.logoUrl}
                lockup="platform"
              />
              <BusinessSwitcher />
              <SidebarNav
                items={items}
                accent={accent}
                badges={navBadges}
                beautyNav
              />
            </div>
          </>
        ) : (
          <>
            <div className="beauty-skin-hairline shrink-0 border-b px-3 py-3.5 space-y-1.5">
              <LiviaWordmark size="sm" className="opacity-90" />
              <p className="font-medium text-[11px] truncate text-muted-foreground leading-tight">
                {business?.name || "Your shop"}
              </p>
            </div>
            <BusinessSwitcher />
            <SidebarNav items={items} accent={accent} badges={navBadges} />
          </>
        )}
      </aside>



      <main
        className={cn(
          "app-shell-main flex flex-1 min-h-0 flex-col",
          appearanceEmbed
            ? "h-auto overflow-visible pb-0"
            : "pb-16 md:pb-0 overflow-y-auto overscroll-y-contain",
        )}
      >

        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-4 md:hidden sticky top-0 z-10">

          <div className="flex items-center gap-2 min-w-0 flex-1">
            {showBeautyFlower ? (
              <StudioHeaderBrand
                businessName={business?.name || "Your shop"}
                logoUrl={(business as { logoUrl?: string | null } | null)?.logoUrl}
                showName
                className="max-w-[calc(100%-3rem)]"
              />
            ) : (
              <>
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                  style={{ backgroundColor: `${accent}33`, color: accent }}
                >
                  {business?.name?.charAt(0)?.toUpperCase() || "L"}
                </div>
                <span className="font-semibold text-sm truncate">{business?.name || "Livia"}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <NotificationCenter />
            <UserButton
              afterSignOutUrl="/sign-in"
              userProfileUrl="/settings?tab=account"
              appearance={accountMenuAppearance}
            />
          </div>

        </header>



        {!appearanceEmbed ? (
        <div className="hidden md:flex h-12 shrink-0 items-center justify-between gap-3 sticky top-0 z-20 bg-background/90 backdrop-blur-sm -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-2 border-b border-border/60">
          {showBeautyFlower ? (
            <StudioHeaderBrand
              businessName={business?.name || "Your shop"}
              logoUrl={(business as { logoUrl?: string | null } | null)?.logoUrl}
            />
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}
          <div className="flex items-center gap-2 shrink-0">
          <HelpSupportDialog />
          <NotificationCenter />
          <UserButton
            afterSignOutUrl="/sign-in"
            userProfileUrl="/settings?tab=account"
            appearance={accountMenuAppearance}
          />
          </div>
        </div>
        ) : null}

        <div
          className={cn(
            "p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto min-w-0",
            showBeautyFlower && isBeautyPresentationPreset() && "beauty-skin-surface",
          )}
        >
          {!appearanceEmbed ? <OnboardingProgressBanner /> : null}
          {!appearanceEmbed ? <OperatorMaturityBanner /> : null}
          {!appearanceEmbed ? <PlatformTour /> : null}
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
        <KeysChangedRitual />

      </main>



      {!appearanceEmbed ? (
        <MobileBottomNav items={items} accent={accent} badges={navBadges} />
      ) : null}


    </div>

  );

}


