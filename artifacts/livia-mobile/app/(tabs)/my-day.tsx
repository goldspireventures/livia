// STAFF-first landing on mobile. Owners can navigate here too via a
// future entry point, but the tab bar only surfaces it for STAFF.

import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
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
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { Shimmer } from "@/components/brand/Shimmer";
import { EmptyState } from "@/components/EmptyState";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useRelativeTime } from "@/hooks/useRelativeTime";

const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

interface MyDayResponse {
  staffId: string | null;
  todayCount: number;
  weekCount: number;
  today: Array<{
    id: string;
    startAt: string;
    endAt: string;
    status: string;
    customer?: { id: string; displayName: string | null } | null;
    service?: { id: string; name: string } | null;
  }>;
  next: MyDayResponse["today"][number] | null;
  myCustomers: Array<{ id: string; displayName: string | null; email: string | null }>;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MyDayScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { currentBusiness } = useBusiness();
  const { getToken } = useAuth();
  const bid = currentBusiness?.id ?? "";

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-day", bid],
    enabled: !!bid,
    staleTime: 30_000,
    queryFn: async (): Promise<MyDayResponse> => {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/businesses/${bid}/my-day`, {
        headers: token
          ? { Accept: "application/json", Authorization: `Bearer ${token}` }
          : { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`my-day ${res.status}`);
      return res.json();
    },
  });

  const next = data?.next ?? null;
  const nextRelative = useRelativeTime(next?.startAt);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            haptics.tap();
            refetch();
          }}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View pointerEvents="none" style={styles.glowWrap}>
        <AuroraHalo tone="primary" size={420} style={{ top: -160, left: -100 }} intensity={0.85} />
      </View>

      <View style={styles.headerBlock}>
        <LiviaWordmark size="sm" color={colors.foreground} />
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>My day</Text>
        {data ? (
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {data.todayCount === 0
              ? "Nothing on the books today."
              : `${data.todayCount} today · ${data.weekCount} more this week`}
          </Text>
        ) : null}
      </View>

      {/* Up next */}
      {!isLoading && next ? (
        <Pressable
          onPress={() => {
            haptics.tap();
            router.push(`/booking/${next.id}`);
          }}
        >
          <View
            style={[
              styles.nextCard,
              { backgroundColor: colors.card, borderColor: aurora.cyan + "44" },
              elevation.floating,
            ]}
          >
            <View style={styles.nextRow}>
              <Text style={[styles.nextEyebrow, { color: aurora.cyan }]}>UP NEXT</Text>
              <View style={styles.nextTimes}>
                {nextRelative ? (
                  <Text style={[styles.nextCountdown, { color: aurora.cyan }]}>{nextRelative}</Text>
                ) : null}
                <Text style={[styles.nextTime, { color: colors.foreground }]}>{fmtTime(next.startAt)}</Text>
              </View>
            </View>
            <Text style={[styles.nextName, { color: colors.foreground }]} numberOfLines={1}>
              {next.customer?.displayName ?? "Walk-in"}
            </Text>
            <Text style={[styles.nextSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {next.service?.name ?? "Appointment"}
            </Text>
          </View>
        </Pressable>
      ) : null}

      {/* Today's slate */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today</Text>
        {isLoading ? (
          <>
            <Shimmer height={64} radius={14} />
            <Shimmer height={64} radius={14} />
          </>
        ) : !data?.today.length ? (
          <EmptyState
            icon="calendar"
            title="All clear"
            subtitle={
              data?.staffId
                ? "Nothing on your slate today."
                : "Your account isn't linked to a staff row yet — ask your manager to link it."
            }
          />
        ) : (
          data.today.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => {
                haptics.tap();
                router.push(`/booking/${b.id}`);
              }}
            >
              <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.rowTime}>
                  <Text style={[styles.rowTimeText, { color: colors.foreground }]}>{fmtTime(b.startAt)}</Text>
                  <Text style={[styles.rowTimeSub, { color: colors.mutedForeground }]}>{fmtTime(b.endAt)}</Text>
                </View>
                <View style={styles.rowMain}>
                  <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                    {b.customer?.displayName ?? "Walk-in"}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {b.service?.name ?? "Appointment"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* My customers */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My customers</Text>
        {isLoading ? (
          <Shimmer height={64} radius={14} />
        ) : !data?.myCustomers.length ? (
          <EmptyState
            icon="users"
            title="No customers yet"
            subtitle="They'll show up here as you work through bookings."
          />
        ) : (
          data.myCustomers.slice(0, 20).map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                haptics.tap();
                router.push(`/customer/${c.id}`);
              }}
            >
              <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.rowMain}>
                  <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                    {c.displayName ?? "Unnamed"}
                  </Text>
                  {c.email ? (
                    <Text style={[styles.rowSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {c.email}
                    </Text>
                  ) : null}
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 140, gap: 22 },
  glowWrap: { position: "absolute", top: 0, left: 0, right: 0, height: 320, overflow: "hidden" },
  headerBlock: { gap: 6 },
  greeting: { ...type.label, fontSize: 13 },
  title: { fontFamily: fonts.serifMedium, fontSize: 38, lineHeight: 44, letterSpacing: -0.6 },
  sub: { ...type.body, fontSize: 14 },
  nextCard: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 6 },
  nextRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nextEyebrow: { ...type.eyebrow, fontSize: 10 },
  nextTimes: { flexDirection: "row", alignItems: "center", gap: 10 },
  nextCountdown: { ...type.numericSm, fontSize: 12, letterSpacing: 0.4 },
  nextTime: { ...type.numericSm, fontSize: 14 },
  nextName: { fontFamily: fonts.serifMedium, fontSize: 24, letterSpacing: -0.3 },
  nextSub: { ...type.body, fontSize: 14 },
  section: { gap: 10 },
  sectionTitle: { fontFamily: fonts.serifMedium, fontSize: 22, letterSpacing: -0.3 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowTime: { width: 70 },
  rowTimeText: { ...type.numericSm, fontSize: 15 },
  rowTimeSub: { ...type.caption, fontSize: 11 },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: fonts.bodySemi, fontSize: 15 },
  rowSub: { ...type.caption, fontSize: 12, marginTop: 2 },
});
