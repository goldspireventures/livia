import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

const THREADS = [
  {
    id: "t1",
    from: "Niamh O'Reilly",
    channel: "SMS",
    last: "Can I push tomorrow's blowdry to 4pm? Stuck at work xx",
    unread: 2,
    when: "2m",
  },
  {
    id: "t2",
    from: "Pádraig Murphy",
    channel: "WhatsApp",
    last: "Brilliant, see you Thursday — thanks Lara!",
    unread: 0,
    when: "11m",
  },
  {
    id: "t3",
    from: "Liv (auto-reply)",
    channel: "Email",
    last: "I rebooked Saoirse for Friday 14:30 — ok to confirm?",
    unread: 1,
    when: "1h",
  },
];

export default function InboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const totalUnread = THREADS.reduce((n, t) => n + t.unread, 0);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      <View pointerEvents="none" style={styles.glowWrap}>
        <AuroraHalo tone="ambient" size={420} style={{ top: -160, left: -100 }} intensity={0.65} />
      </View>

      <View style={styles.headerBlock}>
        <LiviaWordmark size="sm" color={colors.foreground} />
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>One inbox, every channel</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Inbox</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {totalUnread > 0
            ? `${totalUnread} unread · Liv has handled the rest.`
            : "Quiet. Liv has handled everything."}
        </Text>
      </View>

      {THREADS.map((t) => (
        <View
          key={t.id}
          style={[
            styles.row,
            { backgroundColor: colors.card, borderColor: colors.border },
            elevation.resting,
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: aurora.cyan + "1c", borderColor: aurora.cyan + "55" },
            ]}
          >
            <Feather
              name={t.channel === "SMS" ? "message-square" : t.channel === "WhatsApp" ? "phone" : "mail"}
              size={16}
              color={aurora.cyan}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.rowTop}>
              <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                {t.from}
              </Text>
              <Text style={[styles.rowWhen, { color: colors.mutedForeground }]}>{t.when}</Text>
            </View>
            <Text style={[styles.rowLast, { color: colors.mutedForeground }]} numberOfLines={2}>
              {t.last}
            </Text>
          </View>
          {t.unread > 0 ? (
            <View style={[styles.unreadDot, { backgroundColor: aurora.cyan }]}>
              <Text style={styles.unreadNum}>{t.unread}</Text>
            </View>
          ) : null}
        </View>
      ))}

      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
        Real channels (SMS, WhatsApp, Email, IG) wire up in the next persona build.
      </Text>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowName: { fontFamily: fonts.bodySemi, fontSize: 14.5, flex: 1 },
  rowWhen: { ...type.caption, fontSize: 11, marginLeft: 6 },
  rowLast: { ...type.body, fontSize: 13, marginTop: 2 },
  unreadDot: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  unreadNum: { color: "#0c0c0f", fontSize: 11, fontFamily: fonts.bodySemi },
  footnote: { ...type.caption, fontSize: 11, textAlign: "center", marginTop: 16, opacity: 0.7 },
});
