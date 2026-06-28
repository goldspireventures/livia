import { Feather } from "@expo/vector-icons";
import type { PresentationLayoutMorph } from "@workspace/policy";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BookingCard } from "@/components/BookingCard";
import { StatsCard } from "@/components/StatsCard";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { MobileTodayMorphStrip } from "@/components/today/MobileTodayMorphStrip";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";

type BookingPreview = {
  id: string;
  startAt: string;
  endAt?: string;
  status: string;
  customer?: { displayName?: string | null; firstName?: string | null } | null;
  service?: { name?: string | null } | null;
  staff?: { displayName?: string | null } | null;
  notes?: string | null;
};

type Props = {
  morph: PresentationLayoutMorph;
  accent: string;
  vertical?: string | null;
  category?: string | null;
  cssPreset?: string | null;
  livLine: string;
  pendingCount: number;
  handoffCount: number;
  pendingPreview: BookingPreview[];
  pendingHidden: number;
  upcoming: BookingPreview[];
  next: BookingPreview | null;
  nextRelative?: string | null;
  todayCount: number;
  completedToday: number;
  isLoading: boolean;
  businessTz?: string;
  businessName?: string;
  headerDate?: string;
  onPending: () => void;
  onNewBooking: () => void;
  onInbox: () => void;
};

export function WellnessMorphTodayHome({
  morph,
  accent,
  vertical,
  category,
  cssPreset,
  livLine,
  pendingCount,
  handoffCount,
  pendingPreview,
  pendingHidden,
  upcoming,
  next,
  nextRelative,
  todayCount,
  completedToday,
  isLoading,
  businessTz,
  businessName,
  headerDate,
  onPending,
  onNewBooking,
  onInbox,
}: Props) {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();
  const isLedger = morph === "ledger";
  const isRail = morph === "timeline-rail";
  const isAtrium = morph === "atrium";
  const teal = "rgba(13,148,136,1)";
  const heroAccent = isLedger ? "rgba(217,195,154,0.9)" : teal;

  return (
    <View style={styles.root} testID={`wellness-morph-today-${morph}`}>
      <MobileTodayMorphStrip
        vertical={vertical}
        category={category}
        cssPreset={cssPreset}
      />

      <Animated.View
        entering={FadeInDown.duration(380).springify()}
        style={[
          styles.atriumHero,
          {
            borderColor: heroAccent + "44",
            backgroundColor: isLedger ? "rgba(6,78,59,0.22)" : "rgba(13,148,136,0.12)",
            borderRadius: isRail ? 14 : 20,
          },
          elevation.resting,
        ]}
      >
        <Text style={[styles.morphLabel, { color: heroAccent }]}>
          {isAtrium ? "Atrium" : isLedger ? "Evening ledger" : "Session rail"}
        </Text>
        <Text style={[styles.greeting, { color: colors.foreground }]} numberOfLines={2}>
          {livLine}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {businessName ?? "Your business"} · Rooms · {headerDate ?? "today"}
        </Text>
        {(pendingCount > 0 || handoffCount > 0) && (
          <View style={styles.signalRow}>
            {pendingCount > 0 ? (
              <GlowPressable onPress={onPending} glowColor={heroAccent} haptic="tap" style={[styles.signalChip, { borderColor: heroAccent + "55" }]}>
                <Text style={{ color: heroAccent, fontFamily: fonts.bodySemi, fontSize: 12 }}>
                  {pendingCount} to confirm
                </Text>
              </GlowPressable>
            ) : null}
            {handoffCount > 0 ? (
              <GlowPressable onPress={onInbox} glowColor={aurora.cyan} haptic="tap" style={[styles.signalChip, { borderColor: aurora.cyan + "55" }]}>
                <Text style={{ color: aurora.cyan, fontFamily: fonts.bodySemi, fontSize: 12 }}>
                  {handoffCount} inbox
                </Text>
              </GlowPressable>
            ) : null}
          </View>
        )}
      </Animated.View>

      {isRail && upcoming.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {upcoming.slice(0, 8).map((b, i) => (
            <GlowPressable
              key={b.id}
              onPress={() => router.push(`/booking/${b.id}`)}
              glowColor={heroAccent}
              haptic="selection"
              style={[styles.railCard, { borderColor: heroAccent + "44", backgroundColor: colors.card }]}
            >
              <Text style={[styles.railTime, { color: heroAccent }]}>
                {new Date(b.startAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: businessTz })}
              </Text>
              <Text style={[styles.railName, { color: colors.foreground }]} numberOfLines={1}>
                {b.customer?.displayName ?? "Guest"}
              </Text>
              <Text style={[styles.railSvc, { color: colors.mutedForeground }]} numberOfLines={1}>
                {b.service?.name ?? "Session"}
              </Text>
            </GlowPressable>
          ))}
        </ScrollView>
      ) : null}

      {pendingCount > 0 ? (
        <View style={[styles.pendingBlock, { borderColor: heroAccent + "33" }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Needs confirmation</Text>
          {pendingPreview.slice(0, 3).map((b, i) => (
            <BookingCard
              key={b.id}
              booking={{ ...b, endAt: b.endAt ?? b.startAt }}
              timeZone={businessTz}
              showDate
              index={i}
              onPress={() => router.push(`/booking/${b.id}`)}
            />
          ))}
          {pendingHidden > 0 ? (
            <GlowPressable onPress={onPending} glowColor={heroAccent} haptic="tap">
              <Text style={{ color: heroAccent, fontFamily: fonts.bodySemi }}>+{pendingHidden} more</Text>
            </GlowPressable>
          ) : null}
        </View>
      ) : null}

      {!isLoading && next ? (
        <GlowPressable
          onPress={() => {
            haptics.tap();
            router.push(`/booking/${next.id}`);
          }}
          glowColor={aurora.cyan}
          haptic="tap"
        >
          <View style={[styles.nextCard, { backgroundColor: colors.card, borderColor: aurora.cyan + "44" }]}>
            <Text style={[styles.nextEyebrow, { color: aurora.cyan }]}>NEXT SESSION</Text>
            <Text style={[styles.nextName, { color: colors.foreground }]}>{next.customer?.displayName ?? "Guest"}</Text>
            <Text style={[styles.nextSub, { color: colors.mutedForeground }]}>
              {next.service?.name} {nextRelative ? `· ${nextRelative}` : ""}
            </Text>
          </View>
        </GlowPressable>
      ) : null}

      <GlowPressable
        onPress={onNewBooking}
        glowColor={heroAccent}
        haptic="impact"
        style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
        testID="new-booking-button"
      >
        <Feather name="plus" size={16} color={colors.primaryForeground} />
        <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>New session</Text>
      </GlowPressable>

      <View style={styles.statsRow}>
        {!isLoading ? (
          <>
            <StatsCard label="Today" value={todayCount} color={colors.primary} variant="hero" index={0} />
            <StatsCard label="Pending" value={pendingCount} color={colors.warning} index={1} onPress={pendingCount > 0 ? onPending : undefined} />
            <StatsCard label="Complete" value={completedToday} color={colors.success} index={2} />
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  atriumHero: { borderWidth: 1, padding: 18, gap: 8 },
  morphLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  greeting: { fontFamily: fonts.serifMedium, fontSize: 20, lineHeight: 26 },
  meta: { ...type.caption },
  signalRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  signalChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  rail: { gap: 10, paddingVertical: 4 },
  railCard: { width: 140, borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  railTime: { fontFamily: fonts.mono, fontSize: 11 },
  railName: { fontFamily: fonts.bodySemi, fontSize: 14 },
  railSvc: { fontSize: 11 },
  pendingBlock: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 8 },
  sectionTitle: { fontFamily: fonts.bodySemi, fontSize: 15 },
  nextCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  nextEyebrow: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1 },
  nextName: { fontFamily: fonts.serifMedium, fontSize: 22 },
  nextSub: { ...type.body, fontSize: 14 },
  ctaBtn: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999 },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 15 },
  statsRow: { flexDirection: "row", gap: 10 },
});
