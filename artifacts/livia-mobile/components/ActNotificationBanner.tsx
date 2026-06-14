import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

const TOAST_KINDS = new Set([
  "twin.risk",
  "twin.opportunity",
  "commerce.signal",
  "design-proof.changes_requested",
  "quote.accepted",
  "booking.pending",
]);

/** Foreground banner for act-priority Twin/commerce in-app alerts. */
export function ActNotificationBanner() {
  const colors = useColors();
  const router = useRouter();
  const { notifications } = useInAppNotifications();
  const seenRef = useRef<Set<string>>(new Set());
  const [active, setActive] = useState<{
    id: string;
    title: string;
    body: string;
    mobileHref: string | null;
    kind: string;
  } | null>(null);

  useEffect(() => {
    for (const n of notifications) {
      if (n.readAt || n.priority !== "act" || !TOAST_KINDS.has(n.kind)) continue;
      if (seenRef.current.has(n.id)) continue;
      seenRef.current.add(n.id);
      setActive({
        id: n.id,
        title: n.title,
        body: n.body,
        mobileHref: n.mobileHref,
        kind: n.kind,
      });
      break;
    }
  }, [notifications]);

  if (!active) return null;

  const isRisk = active.kind === "twin.risk";
  const isProof = active.kind.startsWith("design-proof.");
  const isQuote = active.kind.startsWith("quote.");

  return (
    <Pressable
      onPress={() => {
        if (active.mobileHref) router.push(active.mobileHref as never);
        setActive(null);
      }}
      style={[
        styles.wrap,
        {
          backgroundColor: isRisk ? "#7f1d1d" : isProof || isQuote ? colors.primary + "18" : colors.card,
          borderColor: isRisk ? "#b91c1c" : colors.primary + "44",
        },
      ]}
      testID="act-notification-banner"
    >
      <Feather
        name={isRisk ? "alert-triangle" : isProof ? "image" : isQuote ? "file-text" : "zap"}
        size={16}
        color={isRisk ? "#fecaca" : colors.primary}
      />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: isRisk ? "#fff" : colors.foreground }]} numberOfLines={1}>
          {active.title}
        </Text>
        <Text
          style={[styles.body, { color: isRisk ? "#fecaca" : colors.mutedForeground }]}
          numberOfLines={2}
        >
          {active.body}
        </Text>
      </View>
      <Pressable onPress={() => setActive(null)} hitSlop={10}>
        <Feather name="x" size={18} color={isRisk ? "#fecaca" : colors.mutedForeground} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bodySemi, fontSize: 13 },
  body: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
});
