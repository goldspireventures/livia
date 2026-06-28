import type { BusinessCommunications } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { channelConnectionStatus, type CommsPayload } from "@/lib/channel-status";
import { dashboardSettingsUrl } from "@/lib/dashboard-url";

function ChannelBadge({
  label,
  connected,
  colors,
}: {
  label: string;
  connected: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: connected ? colors.primary + "66" : colors.border,
          backgroundColor: connected ? colors.primary + "14" : colors.card,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: connected ? colors.primary : colors.mutedForeground },
        ]}
      />
      <Text style={[styles.badgeText, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.badgeMeta, { color: colors.mutedForeground }]}>
        {connected ? "Connected" : "Not set up"}
      </Text>
    </View>
  );
}

export function CommsChannelsBlock({
  businessId,
  comms,
  loading,
}: {
  businessId: string;
  comms: BusinessCommunications | undefined;
  loading: boolean;
}) {
  const colors = useColors();

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!comms) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Comms</Text>
        <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
          Channel status unavailable — pull to refresh or open web settings.
        </Text>
      </View>
    );
  }

  const extended = comms as BusinessCommunications & CommsPayload;
  const social = channelConnectionStatus(extended.messagingChannels);
  const metaReady = extended.metaConfigured === true;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>Comms</Text>
      <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
            SMS · {extended.providerStatus?.smsProvider ?? "—"} · Email ·{" "}
            {extended.providerStatus?.emailProvider ?? "—"}
          </Text>
          {extended.twilioPhoneNumber ? (
            <Text style={[styles.rowValue, { color: colors.foreground }]}>
              {extended.twilioPhoneNumber}
            </Text>
          ) : (
            <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>No SMS number yet</Text>
          )}
          {extended.resendFromAddress ? (
            <Text style={[styles.rowValue, { color: colors.foreground }]}>
              {extended.resendFromAddress}
            </Text>
          ) : (
            <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
              No email sender yet
            </Text>
          )}

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Social inbox {extended.jurisdictionLabel ? `· ${extended.jurisdictionLabel}` : ""}
          </Text>
          <View style={styles.badgeRow}>
            <ChannelBadge label="WhatsApp" connected={social.whatsapp} colors={colors} />
            <ChannelBadge label="Instagram" connected={social.instagram} colors={colors} />
            <ChannelBadge label="Messenger" connected={social.messenger} colors={colors} />
          </View>
          <Text style={[styles.rowMeta, { color: colors.mutedForeground, marginTop: 8 }]}>
            {metaReady
              ? "Finish linking your page IDs in Communications on the web dashboard."
              : "Social inbox linking is not configured yet — your team completes this in Settings."}
            {extended.metaDevSimulate ? " Dev simulate is on for demos." : ""}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.mutedForeground, marginTop: 6 }]}>
            Replies from this app go back on the same channel (WhatsApp, IG, or Messenger) once IDs are saved.
          </Text>
          <Pressable
            onPress={() => void Linking.openURL(dashboardSettingsUrl("comms", businessId))}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Feather name="external-link" size={16} color={colors.primaryForeground} />
            <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
              Open channel setup on web
            </Text>
          </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 16, marginBottom: 4 },
  rowMeta: { ...type.caption, fontSize: 12 },
  rowValue: { fontFamily: fonts.bodySemi, fontSize: 14 },
  sectionLabel: { ...type.eyebrow, marginTop: 12, marginBottom: 6 },
  badgeRow: { gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 13, flex: 1 },
  badgeMeta: { fontSize: 11 },
  mono: { fontFamily: fonts.mono, fontSize: 10, marginTop: 4 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 14 },
});
