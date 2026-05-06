import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
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
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookingCard } from "@/components/BookingCard";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LivPulse } from "@/components/brand/LivPulse";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { Shimmer } from "@/components/brand/Shimmer";
import { EmptyState } from "@/components/EmptyState";
import { StatsCard } from "@/components/StatsCard";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { SPRING_GENTLE } from "@/constants/motion";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { currentBusiness, isLoading: bizLoading } = useBusiness();

  useEffect(() => {
    if (!bizLoading && !currentBusiness) {
      router.replace("/onboarding");
    }
  }, [currentBusiness, bizLoading]);

  const {
    data: summary,
    isLoading,
    refetch,
    isRefetching,
  } = useGetDashboardSummary(currentBusiness?.id ?? "", {
    query: { enabled: !!currentBusiness?.id } as any,
  });

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

  if (!currentBusiness && !bizLoading) return null;

  const next = summary?.upcomingBookings?.[0];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12 }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Single soft halo behind the greeting — replaces the two-orb glow */}
      <View pointerEvents="none" style={styles.glowWrap}>
        <AuroraHalo tone="primary" size={420} style={{ top: -160, left: -100 }} intensity={0.85} />
      </View>

      {/* Header */}
      <Animated.View style={[styles.headerBlock, headStyle]}>
        <View style={styles.brandRow}>
          <LiviaWordmark size="sm" color={colors.foreground} />
          <View style={styles.presence}>
            <LivPulse size={9} state="idle" />
            <Text style={[styles.presenceText, { color: colors.mutedForeground }]}>
              Liv is watching
            </Text>
          </View>
        </View>

        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          {timeOfDayGreeting()} ·{" "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
        <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>
          {currentBusiness?.name ?? "Loading…"}
        </Text>
      </Animated.View>

      {/* Next-up hero card — only when something is coming up */}
      {!isLoading && next ? (
        <Pressable
          onPress={() => {
            haptics.tap();
            router.push(`/booking/${next.id}`);
          }}
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
              <Text style={[styles.nextTime, { color: colors.foreground }]}>
                {new Date(next.startAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
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

      {/* Upcoming */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Upcoming
          </Text>
          {summary?.upcomingBookings && summary.upcomingBookings.length > 0 ? (
            <Text style={[styles.sectionMeta, { color: colors.mutedForeground }]}>
              {summary.upcomingBookings.length} scheduled
            </Text>
          ) : null}
        </View>
        {isLoading ? (
          <EmptyState icon="calendar" title="Loading…" isLoading />
        ) : !summary?.upcomingBookings?.length ? (
          <EmptyState
            icon="calendar"
            title="All clear"
            subtitle="Nothing on the books — a rare and beautiful thing."
          />
        ) : (
          summary.upcomingBookings.slice(0, 10).map((b, i) => (
            <BookingCard
              key={b.id}
              booking={b}
              showDate
              index={i}
              onPress={() => router.push(`/booking/${b.id}`)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 140, gap: 22 },
  glowWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    overflow: "hidden",
  },
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
  statsRow: { flexDirection: "row", gap: 10 },
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
});
