import {
  ListBookingsStatus,
  useGetBusiness,
  useGetDashboardSummary,
  useGetTenantCapabilities,
  useListBookings,
  useListConversations,
  useUpdateBooking,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { asHref } from "@/lib/navigation";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivationWelcome } from "@/components/ActivationWelcome";
import { ActivationMilestone } from "@/components/ActivationMilestone";
import { BookingCard } from "@/components/BookingCard";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { Shimmer } from "@/components/brand/Shimmer";
import { EmptyState } from "@/components/EmptyState";
import { QuickActionsSheet } from "@/components/QuickActionsSheet";
import { StatsCard } from "@/components/StatsCard";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { SPRING_GENTLE } from "@/constants/motion";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useMembership } from "@/hooks/useMembership";
import { usePersona } from "@/hooks/usePersona";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { pickNextUpBooking } from "@/lib/booking-timeline";
import { pendingApprovalGuidance, pendingReasonLabel } from "@/lib/booking-pending";
import { MorningBriefingCard } from "@/components/MorningBriefingCard";
import { LivMomentsCard } from "@/components/LivMomentsCard";
import { LivIncidentsCard } from "@/components/LivIncidentsCard";
import { StuckContinuityCard } from "@/components/StuckContinuityCard";
import { VisitFeedbackCard } from "@/components/VisitFeedbackCard";
import { OwnerIntelligenceHub } from "@/components/OwnerIntelligenceHub";
import { ActNotificationBanner } from "@/components/ActNotificationBanner";
import { OwnerLivOpsCard } from "@/components/OwnerLivOpsCard";
import { SoloOperatorLivStrip } from "@/components/SoloOperatorLivStrip";
import { SoloOperatorFirstRun } from "@/components/SoloOperatorFirstRun";
import {
  OwnerMobileBriefingChips,
  OwnerMobileRevenueStat,
} from "@/components/OwnerMobileBriefing";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import { fetchMeProfile } from "@/lib/platform-legal";
import { PersonaRitualHeader } from "@/components/ritual/PersonaRitualHeader";
import { ScreenTopBar } from "@/components/ScreenTopBar";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { useOnboardingCapabilitySync } from "@/lib/onboarding-capability-sync";
import { useTenantExperience } from "@/hooks/useTenantExperience";
import {
  useMobileSkin,
  usePresentationAccent,
  useTenantPresentation,
} from "@/contexts/PresentationThemeContext";
import { resolveMobileOwnerTodayVariant } from "@/lib/resolve-mobile-skin";
import { useChainRollup } from "@/hooks/useChainRollup";
import { VerticalTodayInsights } from "@/components/VerticalTodayInsights";
import { VerticalHomeShortcuts } from "@/components/VerticalHomeShortcuts";
import { LivProposalsCard } from "@/components/LivProposalsCard";
import { ChainCommerceCard } from "@/components/ChainCommerceCard";
import { ActivityFeedCard } from "@/components/ActivityFeedCard";
import { OwnerLivAssistFab } from "@/components/OwnerLivAssistFab";
import { CapabilityReadinessCard } from "@/components/CapabilityReadinessCard";
import { BeautyTodayHandoffStrip } from "@/components/beauty/BeautyTodayHandoffStrip";
import { MobileTodayMorphStrip } from "@/components/today/MobileTodayMorphStrip";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { WellnessShellAtmosphere } from "@/components/wellness/WellnessShellAtmosphere";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { isBeautyPublicSurface } from "@/lib/beauty-public";
import { useBeautyMobileLayout } from "@/hooks/useBeautyMobileLayout";
import {
  beautyNativeMorphForVertical,
  wellnessNativeMorphForVertical,
} from "@/lib/presentation-layout";
import { usePersonaBriefing } from "@/hooks/usePersonaBriefing";
import { BeautyMorphTodayHome } from "@/components/beauty/BeautyMorphTodayHome";
import { WellnessMorphTodayHome } from "@/components/wellness/WellnessMorphTodayHome";
import { MorphOwnerSignalsFooter } from "@/components/today/MorphOwnerSignalsFooter";
import { ConstellationTodayHome } from "@/components/constellation/ConstellationTodayHome";
import { TENANT_SHELL_LAYOUT, tenantScreenBackground } from "@/lib/tenant-shell-layout";
import { useManualRefresh } from "@/lib/manual-refresh";
import {
  isConsultFirstVertical,
  resolveMobileOwnerLivStack,
  shouldShowMobileOwnerRitualHeader,
} from "@workspace/policy";
import { ConsultFirstTodayHome } from "@/components/event-vendor/ConsultFirstTodayHome";
import { fetchConsultDashboard, type ConsultDashboard } from "@/lib/event-vendor-consult";

function formatTimeInBusinessTz(iso: string, timeZone: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const qc = useQueryClient();
  const {
    currentBusiness,
    isLoading: bizLoading,
    businesses,
    isDemoAccount,
    isError: bizError,
  } = useBusiness();

  const { role, isLoading: roleLoading } = useMembership();
  const { kind: persona, override, isLoading: personaLoading } = usePersona();
  const isOrgAdmin = persona === "org_admin" && !override;
  const isFounder = isOrgAdmin;
  const { rollup } = useChainRollup(isOrgAdmin && businesses.length >= 2);

  useEffect(() => {
    if (bizLoading) return;
    if (!currentBusiness) {
      // Wait for BusinessContext to pick a tenant after /me/businesses loads.
      if (businesses.length > 0) return;
      // Demo accounts already have shops — never send them to "create business".
      if (isDemoAccount) return;
      void fetchMeProfile()
        .then((me) => {
          router.replace(me.platformLegalAccepted ? "/onboarding" : "/legal-acceptance");
        })
        .catch(() => router.replace("/legal-acceptance"));
      return;
    }
    if (personaLoading || roleLoading || override) return;
    if (persona === "staff") {
      router.replace(asHref("/my-day"));
    } else if (persona === "manager") {
      router.replace(asHref("/approvals"));
    }
  }, [
    currentBusiness,
    bizLoading,
    businesses.length,
    isDemoAccount,
    role,
    roleLoading,
    persona,
    personaLoading,
    override,
    router,
  ]);

  const demoBusinessPending =
    isDemoAccount && !bizLoading && !currentBusiness && businesses.length === 0;

  const {
    data: summary,
    isLoading,
    refetch,
  } = useGetDashboardSummary(currentBusiness?.id ?? "", {
    query: {
      enabled: !!currentBusiness?.id,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    } as any,
  });

  const bid = currentBusiness?.id ?? "";
  const { data: tenantCapabilities } = useGetTenantCapabilities(bid, {
    query: { enabled: !!bid } as any,
  });
  useOnboardingCapabilitySync(bid, tenantCapabilities?.onboardingAutoAdvanced);
  const { data: bizDetail } = useGetBusiness(bid, {
    query: { enabled: !!bid } as any,
  });
  const { data: tenantExperience } = useTenantExperience(bid || undefined);
  const onboardingPct =
    (bizDetail as { onboardingState?: { percentComplete?: number } } | undefined)?.onboardingState
      ?.percentComplete ?? 100;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Header settle animation
  const headOpacity = useSharedValue(0);
  const headY = useSharedValue(8);
  useEffect(() => {
    headOpacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    headY.value = withSpring(0, SPRING_GENTLE);
  }, []);
  const headStyle = useAnimatedStyle(() => ({
    opacity: headOpacity.value,
    transform: [{ translateY: headY.value }],
  }));

  // CTA press scale
  const ctaScale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  const handleNewBooking = () => {
    haptics.impact();
    router.push("/booking/new");
  };

  const { mutateAsync: updateBooking } = useUpdateBooking();
  const [nextActionsOpen, setNextActionsOpen] = useState(false);

  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const businessTz =
    currentBusiness?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const next = useMemo(
    () => pickNextUpBooking(summary?.upcomingBookings, clock),
    [summary?.upcomingBookings, clock],
  );
  const nextRelative = useRelativeTime(next?.startAt);

  const pendingCount = summary?.pendingCount ?? 0;
  const operatorXp = (
    tenantExperience as { operatorExperience?: import("@workspace/policy").OperatorExperiencePack } | null
  )?.operatorExperience;
  const isFirstRun =
    !!summary &&
    !isLoading &&
    (summary.todayBookings ?? 0) === 0 &&
    (summary.weekBookings ?? 0) === 0 &&
    (summary.totalCustomers ?? 0) === 0;
  const isOwnerHome = role === "OWNER" || role === "ADMIN";

  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const consultFirst = isConsultFirstVertical(vertical);
  const pack = verticalPackUi(vertical, (bizDetail as { category?: string } | undefined)?.category);
  const [consultDash, setConsultDash] = useState<ConsultDashboard | null>(null);
  const [consultDashLoading, setConsultDashLoading] = useState(false);
  const beautyPreset = (
    tenantExperience as { presentation?: { cssPreset?: string; label?: string } } | null | undefined
  )?.presentation;
  const tenantPresentation = useTenantPresentation();
  const mobileSkin = useMobileSkin();
  const presentationAccent = usePresentationAccent();
  const effectivePreset = tenantPresentation.effectiveCssPreset;
  const beautyOwner = isBeautyPublicSurface(vertical, effectivePreset);
  const { livLine: morphLivLine, livPulse, isLoading: briefingLoading } = usePersonaBriefing();
  const layoutMorph = tenantPresentation.layoutMorph;
  const ownerTodayVariant = resolveMobileOwnerTodayVariant(mobileSkin, persona, layoutMorph);
  const useMorphToday =
    ownerTodayVariant === "beauty-morph" || ownerTodayVariant === "wellness-morph";
  const useConstellationToday = ownerTodayVariant === "constellation";
  const beautyMorph = beautyNativeMorphForVertical(vertical, layoutMorph);
  const wellnessMorph = wellnessNativeMorphForVertical(vertical, layoutMorph);
  const headerDateStr = new Date(clock).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: businessTz,
  });
  const { layout: beautyLayout, lightChrome: beautyLight } = useBeautyMobileLayout();

  const { data: convData } = useListConversations(
    currentBusiness?.id ?? "",
    undefined,
    {
      query: {
        enabled: !!currentBusiness?.id && (beautyLayout === "premium-glow" || useConstellationToday),
        staleTime: 60_000,
      } as never,
    },
  );
  const inboxThreads = useMemo(() => (Array.isArray(convData) ? convData : []), [convData]);
  const handoffCount = useMemo(
    () => inboxThreads.filter((t) => t.status === "OPEN" && !t.aiHandled).length,
    [inboxThreads],
  );
  const handoffThreads = useMemo(
    () => inboxThreads.filter((t) => t.status === "OPEN" && !t.aiHandled),
    [inboxThreads],
  );

  const { data: pendingData } = useListBookings(
    currentBusiness?.id ?? "",
    { status: ListBookingsStatus.PENDING, limit: 20 },
    { query: { enabled: !!currentBusiness?.id && pendingCount > 0 } as never },
  );
  const pendingRows = pendingData?.data ?? [];
  const pendingPreview = pendingRows.slice(0, 5);
  const pendingHidden = Math.max(0, pendingRows.length - pendingPreview.length);

  const livStack = resolveMobileOwnerLivStack({
    useMorphToday,
    soloMode: !!operatorXp?.soloMode,
    pendingCount: consultFirst ? 0 : pendingCount,
    handoffCount,
    onboardingPercent: onboardingPct,
    isFirstRun: isOwnerHome && isFirstRun,
    consultFirst: consultFirst && isOwnerHome,
    newEnquiries: consultDash?.newEnquiries,
    staleQuotes: consultDash?.staleQuotes,
  });
  const showRitualHeader = shouldShowMobileOwnerRitualHeader({
    useMorphToday,
    useConstellationToday,
    isFirstRun: isOwnerHome && isFirstRun,
  });

  const schedulePreview = useMemo(() => {
    const list = summary?.upcomingBookings ?? [];
    const cap = useConstellationToday ? 3 : 2;
    return list.filter((b) => b.id !== next?.id && b.id !== pendingPreview[0]?.id).slice(0, cap);
  }, [summary?.upcomingBookings, next?.id, pendingPreview, useConstellationToday]);

  const goPending = () => {
    haptics.tap();
    if (persona === "manager" || persona === "org_admin") {
      router.push(asHref("/approvals"));
    } else {
      router.push({ pathname: asHref("/bookings"), params: { status: "PENDING" } } as never);
    }
  };

  const { refreshing: pullRefreshing, onRefresh: onPullRefresh } = useManualRefresh(refetch);

  useEffect(() => {
    if (!consultFirst || !currentBusiness?.id) {
      setConsultDash(null);
      return;
    }
    setConsultDashLoading(true);
    void fetchConsultDashboard(currentBusiness.id)
      .then(setConsultDash)
      .catch(() => setConsultDash(null))
      .finally(() => setConsultDashLoading(false));
  }, [consultFirst, currentBusiness?.id, pullRefreshing]);

  if (!currentBusiness) {
    if (bizLoading || businesses.length > 0) {
      return (
        <View style={[styles.root, { backgroundColor: tenantScreenBackground(tenantPresentation.isConstellation, colors.background), paddingTop: topPad }]}>
          <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
        </View>
      );
    }
    if (demoBusinessPending) {
      return (
        <View style={[styles.root, { backgroundColor: tenantScreenBackground(tenantPresentation.isConstellation, colors.background), paddingTop: topPad, paddingHorizontal: 24 }]}>
          <Text style={[type.body, { color: colors.foreground, marginTop: 48 }]}>
            Loading your demo shop…
          </Text>
          <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 8 }]}>
            {bizError
              ? "Could not load businesses — check the API is running and run pnpm demo:provision."
              : "If this sticks, sign out and try again after the API has finished starting."}
          </Text>
        </View>
      );
    }
    return null;
  }

  const confirmPendingBooking = async (bookingId: string) => {
    if (!currentBusiness?.id) return;
    try {
      await updateBooking({
        businessId: currentBusiness.id,
        bookingId,
        data: { status: "CONFIRMED" },
      });
      haptics.success();
      invalidateOperationalState(qc, currentBusiness.id);
      refetch();
    } catch (err: unknown) {
      const e = err as { message?: string };
      haptics.warning();
      Alert.alert("Error", e?.message ?? "Could not confirm booking");
    }
  };

  const advanceNext = async () => {
    if (!currentBusiness?.id || !next) return;
    const ns =
      next.status === "PENDING"
        ? "CONFIRMED"
        : next.status === "CONFIRMED"
          ? "COMPLETED"
          : null;
    if (!ns) return;
    try {
      await updateBooking({
        businessId: currentBusiness.id,
        bookingId: next.id,
        data: { status: ns as "CONFIRMED" | "COMPLETED" },
      });
      haptics.success();
      if (currentBusiness?.id) invalidateOperationalState(qc, currentBusiness.id);
      refetch();
    } catch (err: unknown) {
      const e = err as { message?: string };
      haptics.warning();
      Alert.alert("Error", e?.message ?? "Could not update booking");
    }
  };

  const screenBg = tenantScreenBackground(tenantPresentation.isConstellation, colors.background);
  const contentGap = tenantPresentation.isConstellation
    ? TENANT_SHELL_LAYOUT.contentGap
    : 18;

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 12, gap: contentGap },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={pullRefreshing}
          onRefresh={() => {
            haptics.tap();
            void onPullRefresh();
          }}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {!tenantPresentation.isConstellation && tenantPresentation.isWellnessNative ? (
        <Animated.View pointerEvents="none" style={styles.glowWrap}>
          <WellnessShellAtmosphere cssPreset={effectivePreset} />
        </Animated.View>
      ) : !tenantPresentation.isConstellation && !beautyLight ? (
        <Animated.View pointerEvents="none" style={styles.glowWrap}>
          <AuroraHalo tone="primary" size={420} style={{ top: -160, left: -100 }} intensity={1} />
        </Animated.View>
      ) : null}

      <Animated.View style={[styles.headerBlock, headStyle]}>
        <ScreenTopBar />
        {showRitualHeader ? (
          <>
            <PersonaRitualHeader variant="home" showActions />
            <Text style={[styles.verticalLine, { color: presentationAccent }]} numberOfLines={2}>
              {pack.label}
              {" · "}
              {new Date(clock).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
                timeZone: businessTz,
              })}
            </Text>
          </>
        ) : null}
      </Animated.View>

      {!useConstellationToday && !useMorphToday ? <ActivationMilestone /> : null}
      {showRitualHeader ? <ActivationWelcome /> : null}

      {isOwnerHome && isFirstRun ? <SoloOperatorFirstRun pack={operatorXp} /> : null}
      {isOwnerHome && !isFirstRun && operatorXp?.soloMode ? (
        <SoloOperatorLivStrip pack={operatorXp} />
      ) : null}

      {isFounder && businesses.length >= 2 ? (
        <>
          <Pressable
            onPress={() => router.push(asHref("/shops"))}
            style={[styles.founderStrip, { borderColor: aurora.cyan + "44", backgroundColor: aurora.cyan + "10" }]}
          >
            <Feather name="grid" size={18} color={aurora.cyan} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.founderTitle, { color: colors.foreground }]}>
                {businesses.length} locations
              </Text>
              <Text style={[styles.founderSub, { color: colors.mutedForeground }]} numberOfLines={2}>
                {(rollup?.alerts?.length ?? 0) > 0
                  ? `${rollup!.alerts!.length} cross-shop alert${rollup!.alerts!.length === 1 ? "" : "s"} on Glance`
                  : (rollup?.commerceSummary?.shopsWithActSignal ?? 0) > 0
                    ? `${rollup!.commerceSummary!.shopsWithActSignal} location${rollup!.commerceSummary!.shopsWithActSignal === 1 ? "" : "s"} need commerce attention`
                    : rollup?.orgAdminBriefingLine ??
                      "Open Glance for pulse across every shop — Today stays focused on one location at a time."}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={aurora.cyan} />
          </Pressable>
          {rollup ? <ChainCommerceCard rollup={rollup} /> : null}
        </>
      ) : null}

      {consultFirst && isOwnerHome ? (
        <ConsultFirstTodayHome
          dash={consultDash}
          handoffCount={handoffCount}
          loading={consultDashLoading}
          livLoading={briefingLoading}
        />
      ) : useConstellationToday ? (
        <ConstellationTodayHome
          businessId={currentBusiness.id}
          businessName={currentBusiness.name}
          businessTz={businessTz}
          vertical={vertical}
          category={(bizDetail as { category?: string } | undefined)?.category}
          headerDate={headerDateStr}
          livLine={morphLivLine}
          livLoading={briefingLoading}
          livPulse={livPulse}
          pendingCount={pendingCount}
          handoffCount={handoffCount}
          todayCount={summary?.todayBookings ?? 0}
          completedToday={summary?.completedTodayCount ?? 0}
          isLoading={isLoading}
          heroPending={pendingPreview[0] ?? null}
          next={next ?? null}
          schedulePreview={schedulePreview}
          inboxThreads={handoffThreads}
          onPending={goPending}
          onNewBooking={handleNewBooking}
          onConfirmBooking={confirmPendingBooking}
        />
      ) : useMorphToday && beautyMorph ? (
        <BeautyMorphTodayHome
          morph={beautyMorph}
          accent={presentationAccent}
          vertical={vertical}
          category={(bizDetail as { category?: string } | undefined)?.category}
          cssPreset={effectivePreset}
          livLine={morphLivLine}
          pendingCount={pendingCount}
          handoffCount={handoffCount}
          pendingPreview={pendingPreview}
          pendingHidden={pendingHidden}
          next={next ?? null}
          nextRelative={nextRelative}
          nextTimeLabel={next ? formatTimeInBusinessTz(next.startAt, businessTz) : undefined}
          todayCount={summary?.todayBookings ?? 0}
          confirmedCount={summary?.confirmedCount ?? 0}
          completedToday={summary?.completedTodayCount ?? 0}
          isLoading={isLoading}
          businessTz={currentBusiness?.timezone}
          businessName={currentBusiness?.name}
          onPending={goPending}
          onNewBooking={handleNewBooking}
          onNextLongPress={() => setNextActionsOpen(true)}
        />
      ) : useMorphToday && wellnessMorph ? (
        <WellnessMorphTodayHome
          morph={wellnessMorph}
          accent={presentationAccent}
          vertical={vertical}
          category={(bizDetail as { category?: string } | undefined)?.category}
          cssPreset={effectivePreset}
          livLine={morphLivLine}
          pendingCount={pendingCount}
          handoffCount={handoffCount}
          pendingPreview={pendingPreview}
          pendingHidden={pendingHidden}
          upcoming={schedulePreview}
          next={next ?? null}
          nextRelative={nextRelative}
          todayCount={summary?.todayBookings ?? 0}
          completedToday={summary?.completedTodayCount ?? 0}
          isLoading={isLoading}
          businessTz={currentBusiness?.timezone}
          businessName={currentBusiness?.name}
          headerDate={headerDateStr}
          onPending={goPending}
          onNewBooking={handleNewBooking}
          onInbox={() => router.push(asHref("/inbox"))}
        />
      ) : (
        <>
      <MobileTodayMorphStrip
        vertical={vertical}
        category={(bizDetail as { category?: string } | undefined)?.category}
        cssPreset={beautyPreset?.cssPreset}
      />

      {beautyLayout === "premium-glow" ? (
        <BeautyTodayHandoffStrip handoffCount={handoffCount} pendingCount={pendingCount} />
      ) : null}

      {!consultFirst && pendingCount > 0 ? (
        <View
          style={[
            styles.pendingBlock,
            beautyOwner && {
              borderWidth: 1,
              borderColor: colors.primary + "44",
              borderRadius: beautyLayout === "editorial-menu" ? 8 : 16,
              padding: 12,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Pressable onPress={goPending} style={styles.pendingHead}>
            <Text
              style={[
                styles.pendingTitle,
                { color: colors.foreground },
                beautyOwner && { fontFamily: fonts.serif },
              ]}
            >
              Needs your yes ({pendingRows.length || pendingCount})
            </Text>
            <Text style={[styles.pendingLink, { color: colors.primary }]}>Review all</Text>
          </Pressable>
          <Text style={[styles.pendingLede, { color: colors.mutedForeground }]}>
            Liv only asks when a rule needs you — each item explains why and what to do next.
          </Text>
          {beautyLayout === "premium-glow" ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pendingScroll}
            >
              {pendingPreview.map((b, i) => (
                <View
                  key={b.id}
                  style={[
                    styles.pendingCardWide,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.primary + "44",
                    },
                  ]}
                >
                  <BookingCard
                    booking={b}
                    timeZone={currentBusiness?.timezone}
                    showDate
                    index={i}
                    onPress={() => router.push(`/booking/${b.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            pendingPreview.map((b, i) => {
              const reason = (b as { pendingReason?: string | null }).pendingReason;
              const reasonLine = pendingReasonLabel(
                reason,
                (currentBusiness as { vertical?: string } | null)?.vertical,
                (currentBusiness as { category?: string } | null)?.category,
              );
              const guide = pendingApprovalGuidance(
                reason,
                (currentBusiness as { vertical?: string } | null)?.vertical,
                (currentBusiness as { category?: string } | null)?.category,
              );
              return (
                <View
                  key={b.id}
                  style={[
                    styles.pendingCard,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        beautyLayout === "editorial-menu"
                          ? colors.border
                          : colors.warning + "55",
                    },
                    beautyLayout === "editorial-menu" && styles.pendingCardEditorial,
                  ]}
                >
                  <BookingCard
                    booking={b}
                    timeZone={currentBusiness?.timezone}
                    showDate
                    index={i}
                    onPress={() => router.push(`/booking/${b.id}`)}
                  />
                  {reasonLine ? (
                    <Text style={[styles.pendingWhy, { color: colors.warning }]}>{reasonLine}</Text>
                  ) : null}
                  <Text
                    style={[styles.pendingGuide, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {guide}
                  </Text>
                </View>
              );
            })
          )}
          {pendingHidden > 0 ? (
            <Pressable onPress={goPending}>
              <Text style={[styles.pendingLink, { color: colors.primary, marginTop: 4 }]}>
                +{pendingHidden} more waiting
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!useMorphToday &&
      (summary as { atRiskGuests?: Array<{ customerId: string; displayName: string; headline: string; stage: string }> } | undefined)
        ?.atRiskGuests?.length ? (
        <View
          style={[
            styles.atRiskBlock,
            { borderColor: colors.warning + "55", backgroundColor: colors.warning + "12" },
          ]}
        >
          <Text style={[styles.atRiskEyebrow, { color: colors.warning }]}>Guests to reconnect</Text>
          {(summary as { atRiskGuests: Array<{ customerId: string; displayName: string; headline: string; stage: string }> }).atRiskGuests.map((g) => (
            <Pressable
              key={g.customerId}
              onPress={() => router.push(`/customer/${g.customerId}`)}
              style={styles.atRiskRow}
            >
              <Text style={[styles.atRiskName, { color: colors.foreground }]} numberOfLines={1}>
                {g.displayName}
              </Text>
              <Text style={[styles.atRiskHint, { color: colors.mutedForeground }]} numberOfLines={2}>
                {g.headline}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Next-up hero card — only when something is coming up */}
      {!isLoading && next ? (
        <GlowPressable
          onPress={() => {
            haptics.tap();
            router.push(`/booking/${next.id}`);
          }}
          onLongPress={() => {
            haptics.impact();
            setNextActionsOpen(true);
          }}
          delayLongPress={350}
          glowColor={aurora.cyan}
          haptic="tap"
        >
          <View
            style={[
              styles.nextCard,
              { backgroundColor: colors.card, borderColor: aurora.cyan + "44" },
              elevation.floating,
            ]}
          >
            <View style={styles.nextRow}>
              <Text style={[styles.nextEyebrow, { color: aurora.cyan }]}>NEXT UP</Text>
              <View style={styles.nextTimes}>
                {nextRelative ? (
                  <Text style={[styles.nextCountdown, { color: aurora.cyan }]}>
                    {nextRelative}
                  </Text>
                ) : null}
                <Text style={[styles.nextTime, { color: colors.foreground }]}>
                  {formatTimeInBusinessTz(next.startAt, businessTz)}
                </Text>
              </View>
            </View>
            <Text style={[styles.nextName, { color: colors.foreground }]} numberOfLines={1}>
              {next.customer?.displayName ?? next.customer?.firstName ?? "Walk-in"}
            </Text>
            <Text style={[styles.nextSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {next.service?.name ?? "Service"}
              {next.staff?.displayName ? `  ·  ${next.staff.displayName}` : ""}
            </Text>
          </View>
        </GlowPressable>
      ) : null}

      <Animated.View style={[ctaStyle, { alignSelf: "flex-start" }]}>
        <GlowPressable
          onPress={handleNewBooking}
          onPressIn={() => {
            ctaScale.value = withSpring(0.96, { damping: 14, stiffness: 280 });
          }}
          onPressOut={() => {
            ctaScale.value = withSpring(1, { damping: 14, stiffness: 280 });
          }}
          testID="new-booking-button"
          glowColor={colors.primary}
          haptic="impact"
          style={[
            styles.ctaBtn,
            { backgroundColor: colors.primary },
            elevation.floating,
          ]}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
            New booking
          </Text>
        </GlowPressable>
      </Animated.View>

      {(role === "OWNER" || role === "ADMIN") && !isLoading ? (
        <OwnerMobileBriefingChips
          pendingCount={pendingCount}
          handedOffCount={handoffCount}
          atRiskCount={(summary as { atRiskGuests?: unknown[] } | undefined)?.atRiskGuests?.length ?? 0}
          lowFeedbackCount={(summary as { lowFeedbackCount?: number } | undefined)?.lowFeedbackCount ?? 0}
          confirmedCount={summary?.confirmedCount ?? 0}
          weekBookings={summary?.weekBookings ?? 0}
          commerce={(summary as { commerce?: { capturedLabel?: string; captureRatePercent?: number | null; paymentCount30d?: number; capturedMinor30d?: number } })?.commerce}
        />
      ) : null}

      {/* Stats */}
      <View style={styles.statsRow}>
        {isLoading ? (
          <>
            <Shimmer height={92} radius={16} style={{ flex: 1 }} />
            <Shimmer height={92} radius={16} style={{ flex: 1 }} />
            <Shimmer height={92} radius={16} style={{ flex: 1 }} />
          </>
        ) : (
          <>
            <StatsCard
              label="Today"
              value={summary?.todayBookings ?? 0}
              color={colors.primary}
              variant="hero"
              index={0}
            />
            <StatsCard
              label="Pending"
              value={summary?.pendingCount ?? 0}
              color={colors.warning}
              index={1}
              onPress={(summary?.pendingCount ?? 0) > 0 ? goPending : undefined}
              hint={(summary?.pendingCount ?? 0) > 0 ? "Tap to review" : undefined}
            />
            {beautyLayout !== "premium-glow" ? (
              (summary as { commerce?: { paymentCount30d?: number; capturedLabel?: string } })?.commerce
                ?.paymentCount30d ? (
                <OwnerMobileRevenueStat
                  commerce={(summary as { commerce?: { capturedLabel?: string; captureRatePercent?: number | null; paymentCount30d?: number } }).commerce}
                  onPress={() => void Linking.openURL(`${getDashboardBaseUrl()}/settings?tab=billing`)}
                />
              ) : (
                <StatsCard
                  label="Done"
                  value={summary?.completedTodayCount ?? 0}
                  color={colors.success}
                  index={2}
                />
              )
            ) : (
              <StatsCard
                label="Confirmed"
                value={summary?.confirmedCount ?? 0}
                color={colors.primary}
                index={2}
              />
            )}
          </>
        )}
      </View>
        </>
      )}

      {(role === "OWNER" || role === "ADMIN") && !isLoading && useMorphToday ? (
        <OwnerMobileBriefingChips
          pendingCount={pendingCount}
          handedOffCount={handoffCount}
          atRiskCount={(summary as { atRiskGuests?: unknown[] } | undefined)?.atRiskGuests?.length ?? 0}
          lowFeedbackCount={(summary as { lowFeedbackCount?: number } | undefined)?.lowFeedbackCount ?? 0}
          confirmedCount={summary?.confirmedCount ?? 0}
          weekBookings={summary?.weekBookings ?? 0}
          commerce={(summary as { commerce?: { capturedLabel?: string; captureRatePercent?: number | null; paymentCount30d?: number; capturedMinor30d?: number } })?.commerce}
        />
      ) : null}

      {(summary as { lowFeedbackCount?: number } | undefined)?.lowFeedbackCount && !useMorphToday ? (
        <View
          style={[
            styles.feedbackAlert,
            { borderColor: colors.destructive + "55", backgroundColor: colors.destructive + "12" },
          ]}
        >
          <Text style={[styles.feedbackAlertText, { color: colors.destructive }]}>
            {(summary as { lowFeedbackCount: number }).lowFeedbackCount} low visit score
            {(summary as { lowFeedbackCount: number }).lowFeedbackCount === 1 ? "" : "s"} in Liv & insights
          </Text>
        </View>
      ) : null}

      {!useConstellationToday && schedulePreview.length > 0 && !isLoading ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Later today</Text>
            <Pressable onPress={() => router.push(asHref("/bookings"))}>
              <Text style={[styles.sectionMeta, { color: colors.primary }]}>Full schedule</Text>
            </Pressable>
          </View>
          {schedulePreview.map((b, i) => (
            <BookingCard
              key={b.id}
              booking={b}
              timeZone={currentBusiness?.timezone}
              showDate
              index={i}
              onPress={() => router.push(`/booking/${b.id}`)}
            />
          ))}
        </View>
      ) : null}

      {!(consultFirst && isOwnerHome) &&
      !useConstellationToday &&
      (role === "OWNER" || role === "ADMIN") &&
      currentBusiness?.id &&
      (livStack.showSectionLabel ||
        livStack.showBriefing ||
        livStack.showActBanner ||
        livStack.showMoments ||
        livStack.showIncidents ||
        livStack.showProposals ||
        livStack.showStuckContinuity ||
        livStack.showIntelligenceHub ||
        livStack.showVisitFeedback ||
        livStack.showCapabilityReadiness ||
        livStack.showLivOps ||
        livStack.showVerticalInsights) ? (
        <View style={styles.livSection}>
          {livStack.showSectionLabel ? (
            <Text style={[styles.livSectionTitle, { color: colors.mutedForeground }]}>
              Needs attention
            </Text>
          ) : null}
          {livStack.showBriefing ? (
            <View
              style={
                beautyOwner
                  ? {
                      borderWidth: 1,
                      borderColor: colors.primary + "33",
                      borderRadius: 16,
                      overflow: "hidden",
                    }
                  : undefined
              }
            >
              <MorningBriefingCard
                key={currentBusiness.id}
                businessId={currentBusiness.id}
                businessName={currentBusiness.name}
              />
            </View>
          ) : null}
          {livStack.showActBanner ? <ActNotificationBanner /> : null}
          {livStack.showMoments ? <LivMomentsCard businessId={currentBusiness.id} /> : null}
          {livStack.showIncidents ? <LivIncidentsCard businessId={currentBusiness.id} /> : null}
          {livStack.showProposals ? <LivProposalsCard businessId={currentBusiness.id} /> : null}
          {livStack.showStuckContinuity ? (
            <StuckContinuityCard businessId={currentBusiness.id} />
          ) : null}
          {useMorphToday ? (
            <MorphOwnerSignalsFooter
              businessId={currentBusiness.id}
              atRiskGuests={(summary as { atRiskGuests?: Array<{ customerId: string; displayName: string; headline: string; stage: string }> } | undefined)?.atRiskGuests}
              recentVisitFeedback={summary?.recentVisitFeedback}
              lowFeedbackCount={(summary as { lowFeedbackCount?: number } | undefined)?.lowFeedbackCount}
              atRiskBlock={
                (summary as { atRiskGuests?: Array<{ customerId: string; displayName: string; headline: string; stage: string }> } | undefined)
                  ?.atRiskGuests?.length ? (
                  <View
                    style={[
                      styles.atRiskBlock,
                      { borderColor: colors.warning + "55", backgroundColor: colors.warning + "12" },
                    ]}
                  >
                    <Text style={[styles.atRiskEyebrow, { color: colors.warning }]}>Guests to reconnect</Text>
                    {(summary as { atRiskGuests: Array<{ customerId: string; displayName: string; headline: string; stage: string }> }).atRiskGuests.map((g) => (
                      <Pressable
                        key={g.customerId}
                        onPress={() => router.push(`/customer/${g.customerId}`)}
                        style={styles.atRiskRow}
                      >
                        <Text style={[styles.atRiskName, { color: colors.foreground }]} numberOfLines={1}>
                          {g.displayName}
                        </Text>
                        <Text style={[styles.atRiskHint, { color: colors.mutedForeground }]} numberOfLines={2}>
                          {g.headline}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null
              }
            />
          ) : (
            <>
              {livStack.showIntelligenceHub ? (
                <OwnerIntelligenceHub businessId={currentBusiness.id} />
              ) : null}
              {livStack.showVisitFeedback ? (
                <VisitFeedbackCard
                  businessId={currentBusiness.id}
                  items={summary?.recentVisitFeedback}
                />
              ) : null}
            </>
          )}
          {livStack.showCapabilityReadiness ? (
            <CapabilityReadinessCard businessId={currentBusiness.id} />
          ) : null}
          {livStack.showLivOps ? (
            <OwnerLivOpsCard
              businessId={currentBusiness.id}
              starters={operatorXp?.livOpsStarters ?? []}
              soloMode={operatorXp?.soloMode}
            />
          ) : null}
          {livStack.showActivityFeed ? (
            <ActivityFeedCard businessId={currentBusiness.id} />
          ) : null}
          {livStack.showVerticalShortcuts ? <VerticalHomeShortcuts /> : null}
          {livStack.showVerticalInsights ? (
            <VerticalTodayInsights businessId={currentBusiness.id} />
          ) : null}
        </View>
      ) : null}

      {next ? (
        <QuickActionsSheet
          visible={nextActionsOpen}
          onClose={() => setNextActionsOpen(false)}
          title={(next.customer?.displayName ?? next.customer?.firstName ?? "Walk-in").toUpperCase()}
          actions={[
            ...(next.status === "PENDING"
              ? [{ id: "confirm", label: "Confirm booking", icon: "check-circle" as const, tone: "primary" as const, onPress: advanceNext }]
              : []),
            ...(next.status === "CONFIRMED"
              ? [{ id: "complete", label: "Mark complete", icon: "check-circle" as const, tone: "primary" as const, onPress: advanceNext }]
              : []),
            { id: "open", label: "Open details", icon: "chevron-right" as const, onPress: () => router.push(`/booking/${next.id}`) },
          ]}
        />
      ) : null}
    </ScrollView>
    {(role === "OWNER" || role === "ADMIN") && currentBusiness?.id ? (
      <OwnerLivAssistFab
        businessId={currentBusiness.id}
        starters={operatorXp?.livOpsStarters ?? []}
        soloMode={operatorXp?.soloMode}
      />
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { backgroundColor: "transparent" },
  content: {
    paddingHorizontal: TENANT_SHELL_LAYOUT.contentPadX,
    paddingBottom: TENANT_SHELL_LAYOUT.tabBarClearance + 52,
  },
  livSection: { gap: 12, marginTop: 4 },
  livSectionTitle: {
    fontFamily: fonts.bodyMed,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  glowWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    overflow: "hidden",
  },
  setupBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  setupBannerText: { fontSize: 14, fontFamily: fonts.bodySemi },
  headerBlock: { gap: 6 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  presence: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  presenceText: { ...type.caption, fontSize: 11 },
  greeting: { ...type.label, fontSize: 13 },
  bizName: {
    fontFamily: fonts.serifMedium,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.6,
  },
  nextCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextEyebrow: { ...type.eyebrow, fontSize: 10 },
  nextTimes: { flexDirection: "row", alignItems: "center", gap: 10 },
  nextCountdown: { ...type.numericSm, fontSize: 12, letterSpacing: 0.4 },
  nextTime: { ...type.numericSm, fontSize: 14 },
  nextName: { fontFamily: fonts.serifMedium, fontSize: 24, letterSpacing: -0.3 },
  nextSub: { ...type.body, fontSize: 14 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: fonts.bodySemi,
    letterSpacing: 0.3,
  },
  statsRow: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  pendingLede: { ...type.caption, fontSize: 12, lineHeight: 17, marginBottom: 4 },
  pendingCard: { borderRadius: 16, borderWidth: 1, paddingBottom: 10, marginBottom: 4, overflow: "hidden" },
  pendingWhy: { ...type.label, fontSize: 12, marginHorizontal: 14, marginTop: -4 },
  pendingGuide: { ...type.caption, fontSize: 11, lineHeight: 16, marginHorizontal: 14, marginTop: 4 },
  section: { gap: 10 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  sectionMeta: { ...type.caption, fontSize: 12 },
  subsectionLabel: { ...type.eyebrow, fontSize: 10, letterSpacing: 0.8, marginBottom: 4 },
  verticalLine: { ...type.body, fontSize: 13, lineHeight: 18, marginTop: 2 },
  founderStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  founderTitle: { fontFamily: fonts.bodySemi, fontSize: 15 },
  founderSub: { ...type.caption, fontSize: 12, marginTop: 2 },
  atRiskBlock: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  atRiskEyebrow: { ...type.eyebrow, fontSize: 10, letterSpacing: 0.8 },
  atRiskRow: { gap: 2 },
  atRiskName: { fontFamily: fonts.bodySemi, fontSize: 15 },
  atRiskHint: { ...type.caption, fontSize: 12, lineHeight: 16 },
  feedbackAlert: { borderRadius: 12, borderWidth: 1, padding: 10, marginTop: 8 },
  feedbackAlertText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  pendingBlock: { gap: 8 },
  pendingHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pendingTitle: { fontFamily: fonts.bodySemi, fontSize: 16 },
  pendingLink: { fontFamily: fonts.bodySemi, fontSize: 13 },
  pendingScroll: { gap: 12, paddingVertical: 4, paddingRight: 8 },
  pendingCardWide: {
    width: 280,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  pendingCardEditorial: {
    borderRadius: 8,
  },
});
