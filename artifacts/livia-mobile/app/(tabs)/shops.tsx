import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { aurum } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

const SHOP_DEMO = [
  { name: "Aoife & Co. — Dublin", city: "Dublin 2", today: 18, revenue: "€1,240", util: "86%", trend: "up" as const },
  { name: "Aoife & Co. — Cork", city: "Cork City", today: 12, revenue: "€880", util: "71%", trend: "flat" as const },
  { name: "Aoife & Co. — Galway", city: "Galway", today: 9, revenue: "€540", util: "58%", trend: "down" as const },
];

export default function ShopsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { businesses, currentBusiness, setCurrentBusiness } = useBusiness();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const realRows = businesses.length > 0 ? businesses : null;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      <View pointerEvents="none" style={styles.glowWrap}>
        <AuroraHalo tone="ambient" size={420} style={{ top: -160, left: -100 }} intensity={0.7} />
      </View>

      <View style={styles.headerBlock}>
        <LiviaWordmark size="sm" color={colors.foreground} />
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Your rooms</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Shops</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {realRows ? `${realRows.length} business${realRows.length === 1 ? "" : "es"}` : "Three rooms, one quiet read."}
        </Text>
      </View>

      {realRows
        ? realRows.map((b) => {
            const isActive = b.id === currentBusiness?.id;
            return (
              <View
                key={b.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: isActive ? aurum.champagne + "55" : colors.border },
                  elevation.resting,
                ]}
              >
                <View style={[styles.dot, { backgroundColor: isActive ? aurum.champagne : colors.mutedForeground }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                    {b.name}
                  </Text>
                  {b.slug ? (
                    <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>livia.io/b/{b.slug}</Text>
                  ) : null}
                </View>
                {!isActive ? (
                  <Feather name="arrow-right" size={18} color={aurum.champagne} onPress={() => setCurrentBusiness(b)} />
                ) : (
                  <Text style={[styles.activePill, { color: aurum.champagne }]}>Active</Text>
                )}
              </View>
            );
          })
        : SHOP_DEMO.map((s) => (
            <View
              key={s.name}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, elevation.resting]}
            >
              <View style={[styles.dot, { backgroundColor: aurum.champagne }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  {s.city} · {s.today} today · {s.revenue} · {s.util} util
                </Text>
              </View>
              <Feather
                name={s.trend === "up" ? "trending-up" : s.trend === "down" ? "trending-down" : "minus"}
                size={16}
                color={s.trend === "up" ? "#34d399" : s.trend === "down" ? "#fb7185" : colors.mutedForeground}
              />
            </View>
          ))}

      {!realRows ? (
        <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
          Demo data shown — sign in as a real founder with multi-shop memberships to see live numbers.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 140, gap: 12 },
  glowWrap: { position: "absolute", top: 0, left: 0, right: 0, height: 320, overflow: "hidden" },
  headerBlock: { gap: 4, marginBottom: 4 },
  eyebrow: { ...type.eyebrow, fontSize: 11 },
  title: { fontFamily: fonts.serifMedium, fontSize: 38, lineHeight: 44, letterSpacing: -0.6 },
  sub: { ...type.body, fontSize: 14, marginTop: 2 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  dot: { width: 8, height: 8, borderRadius: 8 },
  cardName: { fontFamily: fonts.bodySemi, fontSize: 15 },
  cardSub: { ...type.caption, fontSize: 12, marginTop: 2 },
  activePill: { ...type.eyebrow, fontSize: 10, letterSpacing: 0.6 },
  footnote: { ...type.caption, fontSize: 11, textAlign: "center", marginTop: 16, opacity: 0.7 },
});
