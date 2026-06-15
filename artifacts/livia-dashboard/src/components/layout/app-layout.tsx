import { Link, useLocation } from "wouter";

import { ReactNode, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/lib/business-context";

import { useMembership, type Role } from "@/lib/membership-context";

import { PERSONA_ACCENT, isDemoLoginEnabled, usePersona } from "@/lib/persona";

import { getRitualNav } from "@/lib/persona-rituals";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { LiviaLogoLink } from "@/components/brand/livia-logo-link";
import {
  resolvePresentationColorMode,
} from "@/lib/experience-theme";
import {
  applyTenantPresentationSkin,
  warmTenantPresentationSkin,
} from "@/lib/tenant-presentation-sync";
import {
  applyAppearancePreviewFromSearch,
  isAppearanceEmbed,
  readAppearancePreviewParams,
} from "@/lib/appearance-preview-mode";
import { PlatformDefaultAmbient } from "@/components/layout/platform-default-ambient";
import { SIGN_IN_AFTER_SIGN_OUT } from "@/lib/auth-routes";
import {
  isBeautyPresentationPreset,
  isBeautyVertical,
  wellnessNativeMorphForVertical,
} from "@/lib/presentation-layout";
import { WellnessShellNav } from "@/components/wellness/wellness-shell-nav";
import { applyBeautyAmbient } from "@/lib/beauty-ambient";
import { applyWellnessAmbient } from "@/lib/wellness-ambient";
import { useSurfaceClass } from "@/hooks/use-surface-class";
import { WellnessAtmosphere } from "@/components/wellness/wellness-atmosphere";
import { isWellnessCssPreset } from "@workspace/policy";
import { applyGatewaySurfaceTheme } from "@/lib/gateway-surface-theme";
import { useTheme } from "next-themes";
import { fetchUserLifecycle } from "@/lib/lifecycle-api";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { useGetTenantCapabilities } from "@workspace/api-client-react";
import { useOnboardingCapabilitySync } from "@/hooks/use-onboarding-capability-sync";
import {
  filterNavItemsByCapabilities,
  filterNavItemsByOperatorShape,
  filterWellnessNavItems,
} from "@workspace/policy";
import { applyTenantShellFromCache } from "@/lib/prefetch-tenant-dashboard";

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
import { LivNotificationToastBridge } from "@/components/liv/liv-notification-toast-bridge";
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
  const queryClient = useQueryClient();

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

  const bid = business?.id ?? "";
  const previewSearch =
    typeof window !== "undefined" ? window.location.search : "";

  useLayoutEffect(() => {
    if (!bid) return;
    const biz = business as { vertical?: string; category?: string; country?: string } | null;
    warmTenantPresentationSkin(queryClient, bid, biz, persona);
    applyTenantShellFromCache(queryClient, bid);
  }, [bid, business, persona, queryClient]);

  useLayoutEffect(() => {
    return () => {
      const path = window.location.pathname.replace(/\/+$/, "") || "/";
      if (path === "/demo" || path.startsWith("/demo/") || path === "/sign-in" || path === "/sign-up") {
        applyGatewaySurfaceTheme();
      }
    };
  }, []);

  useLayoutEffect(() => {
    const biz = business as { vertical?: string; category?: string; country?: string } | null;
    const teVertical = (tenantExperience as { vertical?: string } | undefined)?.vertical;
    const draft = readAppearancePreviewParams(previewSearch);
    if (
      applyAppearancePreviewFromSearch(previewSearch, {
        vertical: biz?.vertical ?? teVertical ?? null,
        category: biz?.category ?? null,
        country: biz?.country ?? null,
      })
    ) {
      const mode = draft.cssPreset ? resolvePresentationColorMode(draft.cssPreset) : null;
      if (mode) setTheme(mode);
      return;
    }

    const p = tenantExperience?.presentation;
    const colorMode = p?.tokens?.colorMode;
    applyTenantPresentationSkin(
      {
        businessId: bid,
        vertical: biz?.vertical ?? teVertical ?? null,
        category: biz?.category ?? null,
        country: biz?.country ?? null,
        cssPreset: p?.cssPreset ?? "platform-default",
        brandAccentHex: p?.brandAccentHex,
        colorMode: colorMode === "light" || colorMode === "dark" ? colorMode : null,
      },
      persona,
    );
    if (colorMode === "light" || colorMode === "dark") {
      setTheme(colorMode);
    }
  }, [
    tenantExperience?.presentation?.cssPreset,
    tenantExperience?.presentation?.brandAccentHex,
    tenantExperience?.presentation?.tokens?.colorMode,
    tenantExperience,
    business,
    persona,
    setTheme,
    location,
    previewSearch,
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

  const { data: tenantCapabilities } = useGetTenantCapabilities(bid, {
    query: { enabled: !!bid } as never,
  });

  useOnboardingCapabilitySync(bid, tenantCapabilities?.onboardingAutoAdvanced);

  const readyVerticalCapabilityIds = useMemo(
    () => tenantCapabilities?.verticalCapabilities?.map((c) => c.id) ?? [],
    [tenantCapabilities],
  );
  const readyVerticalCapSet = useMemo(
    () => new Set(readyVerticalCapabilityIds),
    [readyVerticalCapabilityIds],
  );

  const operatorSignals = useMemo(() => {
    const te = tenantExperience as { operator?: { tier?: string; activeStaffCount?: number } } | undefined;
    const staffCount = tenantCapabilities?.readinessFacts?.staffCount ?? te?.operator?.activeStaffCount ?? 1;
    return {
      tier: (business as { tier?: string } | null)?.tier ?? te?.operator?.tier ?? "solo",
      activeStaffCount: typeof staffCount === "number" ? staffCount : 1,
    };
  }, [business, tenantCapabilities?.readinessFacts?.staffCount, tenantExperience]);

  const vertical =
    (business as { vertical?: string } | null)?.vertical ?? tenantExperience?.vertical ?? null;

  const items = filterWellnessNavItems(
    filterNavItemsByOperatorShape(
      filterNavItemsByCapabilities(
        getRitualNav(
          persona,
          effectiveRole,
          businesses.length,
          isDemoLoginEnabled,
          operatorSignals.tier,
          (business as { vertical?: string } | null)?.vertical,
          (business as { category?: string } | null)?.category,
          { showLifecycle },
        ),
        tenantCapabilities?.platformCapabilities,
        vertical,
      ),
      operatorSignals,
    ),
    readyVerticalCapSet,
  );



  const { pendingCount, handedOffCount, inboxAttentionCount, inboxAttentionLabel, consultFirst, settingsAttentionLabel, intelBadges } =
    useNavActionCounts();
  const navBadges = useMemo(() => {
    const badges: Record<string, number> = { ...intelBadges };
    const inboxCount = consultFirst ? inboxAttentionCount : handedOffCount;
    if (inboxCount > 0) badges["/inbox"] = inboxCount;
    if (pendingCount > 0) badges["/bookings"] = pendingCount;
    return badges;
  }, [handedOffCount, inboxAttentionCount, consultFirst, pendingCount, intelBadges]);

  const navBadgeLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    const inboxCount = consultFirst ? inboxAttentionCount : handedOffCount;
    if (inboxCount > 0) {
      labels["/inbox"] =
        consultFirst && inboxAttentionLabel
          ? inboxAttentionLabel
          : `${inboxCount} handoff${inboxCount === 1 ? "" : "s"} waiting`;
    }
    if (pendingCount > 0) {
      labels["/bookings"] = `${pendingCount} pending booking${pendingCount === 1 ? "" : "s"}`;
    }
    if ((intelBadges["/settings"] ?? 0) > 0 && settingsAttentionLabel) {
      labels["/settings"] = settingsAttentionLabel;
    }
    return labels;
  }, [handedOffCount, inboxAttentionCount, inboxAttentionLabel, consultFirst, pendingCount, settingsAttentionLabel, intelBadges]);

  const appearanceDraft = readAppearancePreviewParams(previewSearch);
  const storedCssPreset =
    appearanceDraft.cssPreset ?? tenantExperience?.presentation?.cssPreset ?? "platform-default";
  const effectiveCssPreset = storedCssPreset;
  const showBeautyFlower =
    isBeautyVertical(vertical) && isBeautyPresentationPreset(effectiveCssPreset);
  const isPlatformDefault = effectiveCssPreset === "platform-default";
  const layoutMorph =
    typeof document !== "undefined"
      ? document.documentElement.dataset.layoutMorph
      : undefined;
  const wellnessNativeMorph = wellnessNativeMorphForVertical(vertical, layoutMorph);
  const wellnessTopNav =
    wellnessNativeMorph === "atrium" || wellnessNativeMorph === "ledger";
  const wellnessTimelineRail = wellnessNativeMorph === "timeline-rail";
  const wellnessVocab = verticalPackUi(vertical, (business as { category?: string } | null)?.category);
  const surfaceClass = useSurfaceClass();

  useEffect(() => {
    applyWellnessAmbient({
      vertical,
      cssPreset: isWellnessCssPreset(effectiveCssPreset) ? effectiveCssPreset : null,
      surface: surfaceClass,
    });
  }, [vertical, effectiveCssPreset, surfaceClass]);

  return (

    <div
      className={cn(
        "flex w-full flex-col bg-background md:flex-row",
        appearanceEmbed ? "min-h-0 h-auto overflow-visible" : "h-[100dvh] overflow-hidden",
        wellnessNativeMorph && "wellness-native-shell",
      )}
    >

      <aside
        data-testid="app-shell-sidebar"
        className={cn(
          "app-shell-sidebar hidden w-[13.5rem] max-w-[13.5rem] shrink-0 flex-col border-r border-border/40 bg-card/50 md:flex relative overflow-hidden",
          wellnessNativeMorph && "!hidden",
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
                badgeLabels={navBadgeLabels}
                beautyNav
              />
            </div>
          </>
        ) : (
          <>
            <div className="beauty-skin-hairline shrink-0 border-b px-3 py-3.5 space-y-1.5">
              <LiviaLogoLink size="sm" home="dashboard" className="opacity-90" />
              <p className="font-medium text-[11px] truncate text-muted-foreground leading-tight">
                {business?.name || "Your shop"}
              </p>
            </div>
            <BusinessSwitcher />
            <SidebarNav items={items} accent={accent} badges={navBadges} badgeLabels={navBadgeLabels} />
          </>
        )}
      </aside>



      {wellnessTimelineRail && !appearanceEmbed ? (
        <WellnessShellNav
          morph="timeline-rail"
          businessName={business?.name ?? undefined}
          businessSlug={business?.slug ?? undefined}
          teamNoun={wellnessVocab.teamNoun}
          serviceNoun={wellnessVocab.serviceNoun === "Session" ? "Sessions" : wellnessVocab.serviceNoun}
          persona={persona}
          readyVerticalCapabilityIds={readyVerticalCapabilityIds}
        />
      ) : null}

      <main
        className={cn(
          "app-shell-main relative flex flex-1 min-h-0 flex-col",
          appearanceEmbed
            ? "h-auto overflow-visible pb-0"
            : wellnessNativeMorph
              ? "pb-4 md:pb-0 overflow-y-auto overscroll-y-contain"
              : "pb-16 md:pb-0 overflow-y-auto overscroll-y-contain",
        )}
      >
        {isPlatformDefault && !appearanceEmbed ? <PlatformDefaultAmbient /> : null}
        {wellnessNativeMorph && isWellnessCssPreset(effectiveCssPreset) && !appearanceEmbed ? (
          <div className="wellness-atmosphere-wrap pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <WellnessAtmosphere cssPreset={effectiveCssPreset} />
          </div>
        ) : null}

        {wellnessTopNav && !appearanceEmbed ? (
          <WellnessShellNav
            morph={wellnessNativeMorph!}
            businessName={business?.name ?? undefined}
            businessSlug={business?.slug ?? undefined}
            teamNoun={wellnessVocab.teamNoun}
            serviceNoun={wellnessVocab.serviceNoun === "Session" ? "Sessions" : wellnessVocab.serviceNoun}
            persona={persona}
            readyVerticalCapabilityIds={readyVerticalCapabilityIds}
            utilityActions={
              <>
                <HelpSupportDialog />
                <NotificationCenter />
                <UserButton
                  afterSignOutUrl={SIGN_IN_AFTER_SIGN_OUT}
                  userProfileUrl="/settings?tab=account"
                  appearance={accountMenuAppearance}
                />
              </>
            }
          />
        ) : null}

        <header
          className={cn(
            "flex h-14 items-center justify-between border-b border-border bg-card/50 px-4 md:hidden sticky top-0 z-10",
            wellnessNativeMorph && "hidden",
          )}
        >

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
              afterSignOutUrl={SIGN_IN_AFTER_SIGN_OUT}
              userProfileUrl="/settings?tab=account"
              appearance={accountMenuAppearance}
            />
          </div>

        </header>



        {!appearanceEmbed && !wellnessNativeMorph ? (
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
            afterSignOutUrl={SIGN_IN_AFTER_SIGN_OUT}
            userProfileUrl="/settings?tab=account"
            appearance={accountMenuAppearance}
          />
          </div>
        </div>
        ) : null}

        <div
          className={cn(
            "relative z-10 p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto min-w-0",
            showBeautyFlower && isBeautyPresentationPreset() && "beauty-skin-surface",
          )}
        >
          {!appearanceEmbed ? <OnboardingProgressBanner /> : null}
          {!appearanceEmbed && !wellnessNativeMorph ? <OperatorMaturityBanner /> : null}
          {!appearanceEmbed ? <PlatformTour /> : null}
          <ErrorBoundary key={location}>{children}</ErrorBoundary>
        </div>
        <KeysChangedRitual />
        {!appearanceEmbed ? <LivNotificationToastBridge /> : null}

      </main>



      {!appearanceEmbed && !wellnessNativeMorph ? (
        <MobileBottomNav items={items} accent={accent} badges={navBadges} />
      ) : null}


    </div>

  );

}


