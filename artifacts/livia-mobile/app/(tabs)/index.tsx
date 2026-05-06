import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookingCard } from "@/components/BookingCard";
import { EmptyState } from "@/components/EmptyState";
import { StatsCard } from "@/components/StatsCard";
import { aurora } from "@/constants/colors";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const handleNewBooking = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    router.push("/booking/new");
  };

  if (!currentBusiness && !bizLoading) return null;

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
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Soft aurora glow behind the header */}
      <View pointerEvents="none" style={styles.glowWrap}>
        <LinearGradient
          colors={[aurora.violet + "33", "transparent"]}
          style={[styles.glow, { top: -100, left: -60, width: 320, height: 320 }]}
        />
        <LinearGradient
          colors={[aurora.cyan + "2a", "transparent"]}
          style={[styles.glow, { top: -40, right: -80, width: 280, height: 280 }]}
        />
      </View>

      {/* Header */}
      <View style={styles.headerBlock}>
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          {timeOfDayGreeting()} ·{" "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
        <Text
          style={[styles.bizName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {currentBusiness?.name ?? "Loading…"}
        </Text>

        <Pressable
          onPress={handleNewBooking}
          testID="new-booking-button"
          style={({ pressed }) => [
            styles.ctaPressable,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={[aurora.violet, aurora.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.ctaText}>New booking</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatsCard
          label="Today"
          value={isLoading ? "—" : (summary?.todayBookings ?? 0)}
          color={colors.primary}
          variant="hero"
        />
        <StatsCard
          label="Pending"
          value={isLoading ? "—" : (summary?.pendingCount ?? 0)}
          color={colors.warning}
        />
        <StatsCard
          label="Done"
          value={isLoading ? "—" : (summary?.completedTodayCount ?? 0)}
          color={colors.success}
        />
      </View>

      {/* Upcoming */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Upcoming bookings
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
            title="No upcoming bookings"
            subtitle="All clear for now"
          />
        ) : (
          summary.upcomingBookings.slice(0, 10).map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              showDate
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
  content: { paddingHorizontal: 16, paddingBottom: 120, gap: 22 },
  glowWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    borderRadius: 9999,
  },
  headerBlock: { gap: 6 },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.1,
  },
  bizName: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.7,
  },
  ctaPressable: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 999,
    shadowColor: aurora.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  section: { gap: 10 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  sectionMeta: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
