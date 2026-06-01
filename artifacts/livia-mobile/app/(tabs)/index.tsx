import {
  ListBookingsStatus,
  customFetch,
  useGetBusiness,
  useGetDashboardSummary,
  useListBookings,
  useUpdateBooking,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { BookingCard } from "@/components/BookingCard";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LivPulse } from "@/components/brand/LivPulse";
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
import { ScreenTopBar } from "@/components/ScreenTopBar";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { resolveTenantAccentHex } from "@/lib/vertical-theme";
import { useTenantExperience } from "@/hooks/useTenantExperience";
import { useChainRollup } from "@/hooks/useChainRollup";
import { VerticalTodayInsights } from "@/components/VerticalTodayInsights";
import { VerticalHomeShortcuts } from "@/components/VerticalHomeShortcuts";
import { LivProposalsCard } from "@/components/LivProposalsCard";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { isBeautyPublicSurface } from "@/lib/beauty-public";

function timeOfDayGreeting(nowMs: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hour12: false,
    timeZone,
  }).formatToParts(new Date(nowMs));
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? new Date(nowMs).getHours());
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

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
      router.replace("/onboarding");
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
    isRefetching,
  } = useGetDashboardSummary(currentBusiness?.id ?? "", {
    query: {
      enabled: !!currentBusiness?.id,
      refetchInterval: 12_000,
      refetchOnWindowFocus: true,
    } as any,
  });

  const bid = currentBusiness?.id ?? "";
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

  const { data: livPresence } = useQuery({
    queryKey: ["liv-presence", currentBusiness?.id, role],
    queryFn: () =>
      customFetch<{ line: string; source: string }>(
        `/api/businesses/${currentBusiness!.id}/liv-presence?context=${
          role === "ADMIN" ? "manager_today" : "owner_today"
        }`,
      ),
    enabled: !!currentBusiness?.id && (role === "OWNER" || role === "ADMIN"),
    staleTime: 90_000,
  });

  const presenceLine =
    livPresence?.line ??
    (pendingCount > 0
      ? `${pendingCount} booking${pendingCount === 1 ? "" : "s"} need confirmation — tap Pending`
      : "All confirmations caught up");

  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const pack = verticalPackUi(vertical, (bizDetail as { category?: string } | undefined)?.category);
  const tenantAccent =
    (tenantExperience as { presentation?: { brandAccentHex?: string | null } } | null | undefined)
      ?.presentation?.brandAccentHex ??
    (tenantExperience as { publicAppearance?: { brandAccentHex?: string | null } } | null | undefined)
      ?.publicAppearance?.brandAccentHex;
  const verticalAccent = resolveTenantAccentHex(
    vertical,
    (bizDetail as { category?: string } | undefined)?.category,
    tenantAccent,
  );
  const beautyPreset = (
    tenantExperience as { presentation?: { cssPreset?: string; label?: string } } | null | undefined
  )?.presentation;
  const beautyOwner = isBeautyPublicSurface(vertical, beautyPreset?.cssPreset);

  const { data: pendingData } = useListBookings(
    currentBusiness?.id ?? "",
    { status: ListBookingsStatus.PENDING, limit: 20 },
    { query: { enabled: !!currentBusiness?.id && pendingCount > 0 } as never },
  );
  const pendingRows = pendingData?.data ?? [];
  const pendingPreview = pendingRows.slice(0, 5);
  const pendingHidden = Math.max(0, pendingRows.length - pendingPreview.length);

  const schedulePreview = useMemo(() => {
    const list = summary?.upcomingBookings ?? [];
    return list.filter((b) => b.id !== next?.id).slice(0, 2);
  }, [summary?.upcomingBookings, next?.id]);

  const goPending = () => {
    haptics.tap();
    if (persona === "manager" || persona === "org_admin") {
      router.push(asHref("/approvals"));
    } else {
      router.push({ pathname: asHref("/bookings"), params: { status: "PENDING" } } as never);
    }
  };

  // Halo pulse intensifies during pull-to-refresh — replaces the stock spinner
  // feel by tying the refresh state to the always-present aurora.
  const haloIntensity = useSharedValue(0.85);
  useEffect(() => {
    haloIntensity.value = withTiming(isRefetching ? 1.4 : 0.85, { duration: 320 });
  }, [isRefetching, haloIntensity]);
  const refreshHaloStyle = useAnimatedStyle(() => ({
    opacity: haloIntensity.value,
    transform: [{ scale: 0.9 + haloIntensity.value * 0.1 }],
  }));

  if (!currentBusiness) {
    if (bizLoading || businesses.length > 0) {
      return (
        <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
          <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
        </View>
      );
    }
    if (demoBusinessPending) {
      return (
        <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingHorizontal: 24 }]}>
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

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12 }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            haptics.tap();
            refetch();
          }}
          tintColor="transparent"
          colors={["transparent"]}
          progressBackgroundColor="transparent"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.View pointerEvents="none" style={[styles.glowWrap, refreshHaloStyle]}>
        <AuroraHalo tone="primary" size={420} style={{ top: -160, left: -100 }} intensity={1} />
      </Animated.View>

      <ActivationWelcome />

      {/* Header */}
      <Animated.View style={[styles.headerBlock, headStyle]}>
        <ScreenTopBar />
        <View style={styles.presence}>
          <LivPulse size={9} state="idle" />
          <Text style={[styles.presenceText, { color: colors.mutedForeground }]}>
            {presenceLine}
          </Text>
        </View>

        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          {timeOfDayGreeting(clock, businessTz)} ·{" "}
          {new Date(clock).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            timeZone: businessTz,
          })}
        </Text>
        <Text
          style={[
            styles.bizName,
            { color: colors.foreground },
            beautyOwner && { fontFamily: fonts.serif, letterSpacing: 0.3 },
          ]}
          numberOfLines={1}
        >
          {currentBusiness?.name ?? "Loading…"}
        </Text>
        <Text style={[styles.verticalLine, { color: verticalAccent }]} numberOfLines={2}>
          {pack.label} · {pack.ownerTodayLine}
          {beautyOwner && beautyPreset?.label ? ` · ${beautyPreset.label}` : ""}
        </Text>
      </Animated.View>


      {isFounder && businesses.length >= 2 ? (
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
                : rollup?.orgAdminBriefingLine ??
                  "Open Glance for pulse across every shop — Today stays focused on one location at a time."}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={aurora.cyan} />
        </Pressable>
      ) : null}

      {pendingCount > 0 ? (
        <View
          style={[
            styles.pendingBlock,
            beautyOwner && {
              borderWidth: 1,
              borderColor: colors.primary + "44",
              borderRadius: 16,
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
          {pendingPreview.map((b, i) => {
            const reason = (b as { pendingReason?: string | null }).pendingReason;
            const reasonLine = pendingReasonLabel(reason);
            const guide = pendingApprovalGuidance(reason);
            return (
              <View
                key={b.id}
                style={[
                  styles.pendingCard,
                  { backgroundColor: colors.card, borderColor: colors.warning + "55" },
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
                <Text style={[styles.pendingGuide, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {guide}
                </Text>
              </View>
            );
          })}
          {pendingHidden > 0 ? (
            <Pressable onPress={goPending}>
              <Text style={[styles.pendingLink, { color: colors.primary, marginTop: 4 }]}>
                +{pendingHidden} more waiting
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Next-up hero card — only when something is coming up */}
      {!isLoading && next ? (
        <Pressable
          onPress={() => {
            haptics.tap();
            router.push(`/booking/${next.id}`);
          }}
          onLongPress={() => {
            haptics.impact();
            setNextActionsOpen(true);
          }}
          delayLongPress={350}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.99 : 1 }] }]}
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
        </Pressable>
      ) : null}

      {/* Primary CTA — solid cyan (gradients reserved for AI moments per ADR 0007) */}
      <Animated.View style={[ctaStyle, { alignSelf: "flex-start" }]}>
        <Pressable
          onPress={handleNewBooking}
          onPressIn={() => {
            ctaScale.value = withSpring(0.96, { damping: 14, stiffness: 280 });
          }}
          onPressOut={() => {
            ctaScale.value = withSpring(1, { damping: 14, stiffness: 280 });
          }}
          testID="new-booking-button"
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
        </Pressable>
      </Animated.View>

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
            <StatsCard
              label="Done"
              value={summary?.completedTodayCount ?? 0}
              color={colors.success}
              index={2}
            />
          </>
        )}
      </View>

      {schedulePreview.length > 0 && !isLoading ? (
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

      {(role === "OWNER" || role === "ADMIN") && currentBusiness?.id ? (
        <View style={styles.livSection}>
          <Text style={[styles.livSectionTitle, { color: colors.mutedForeground }]}>
            Liv & insights
          </Text>
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
          <LivMomentsCard businessId={currentBusiness.id} />
          <LivIncidentsCard businessId={currentBusiness.id} />
          <LivProposalsCard businessId={currentBusiness.id} />
          <StuckContinuityCard businessId={currentBusiness.id} />
          <VisitFeedbackCard businessId={currentBusiness.id} />
          <VerticalHomeShortcuts />
          <VerticalTodayInsights businessId={currentBusiness.id} />
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 140, gap: 18 },
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
  pendingBlock: { gap: 8 },
  pendingHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pendingTitle: { fontFamily: fonts.bodySemi, fontSize: 16 },
  pendingLink: { fontFamily: fonts.bodySemi, fontSize: 13 },
});
