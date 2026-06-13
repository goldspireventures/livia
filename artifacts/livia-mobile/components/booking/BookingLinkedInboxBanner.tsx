import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { refundLinkedInboxBannerBody } from "@workspace/policy";
import { resolutionSummary } from "@/lib/conversation-resolution";

export type LinkedInboxCaseDto = {
  conversationId: string;
  status: string;
  caseIntent?: string | null;
  summary?: string | null;
  resolution?: {
    outcome?: string;
    refundMinor?: number | null;
    at?: string;
  } | null;
};

function isRefundCase(c: LinkedInboxCaseDto): boolean {
  return (
    c.caseIntent === "refund_request" || (c.summary?.toLowerCase().includes("refund") ?? false)
  );
}

type Props = {
  bookingStatus: string;
  linkedCase: LinkedInboxCaseDto | null | undefined;
  onCancelBooking?: () => void;
  cancelPending?: boolean;
};

export function BookingLinkedInboxBanner({
  bookingStatus,
  linkedCase,
  onCancelBooking,
  cancelPending,
}: Props) {
  const colors = useColors();
  const router = useRouter();

  if (!linkedCase || !isRefundCase(linkedCase)) return null;

  const status = bookingStatus;
  const outcome = linkedCase.resolution?.outcome;
  const closed = linkedCase.status === "CLOSED";
  const open = linkedCase.status === "OPEN" || linkedCase.status === "HANDED_OFF";
  const active = status !== "CANCELLED" && status !== "COMPLETED" && status !== "NO_SHOW";
  const resolvedLabel = resolutionSummary(linkedCase.resolution);

  if (open && active) {
    return (
      <Animated.View
        entering={FadeInDown.duration(320).springify()}
        style={[styles.banner, { borderColor: colors.warning + "55", backgroundColor: colors.warning + "14" }]}
        testID="booking-inbox-case-open"
      >
        <View style={styles.titleRow}>
          <Feather name="inbox" size={16} color={colors.warning} />
          <Text style={[styles.title, { color: colors.foreground }]}>Refund request open in inbox</Text>
        </View>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          {linkedCase.summary ?? refundLinkedInboxBannerBody()}
        </Text>
        <GlowPressable
          onPress={() => router.push(`/conversation/${linkedCase.conversationId}` as never)}
          glowColor={colors.warning}
          haptic="tap"
          style={[styles.cta, { backgroundColor: colors.primary }]}
        >
          <Feather name="message-circle" size={14} color={colors.primaryForeground} />
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Resolve in inbox</Text>
        </GlowPressable>
      </Animated.View>
    );
  }

  if (
    closed &&
    active &&
    (outcome === "cancel_no_refund" ||
      outcome === "refund_and_cancel" ||
      outcome === "close_no_action")
  ) {
    const shouldBeCancelled =
      outcome === "cancel_no_refund" || outcome === "refund_and_cancel";
    const mismatch = shouldBeCancelled && status !== "CANCELLED";

    if (outcome === "close_no_action" && status !== "CANCELLED") {
      return (
        <View
          style={[styles.banner, { borderColor: colors.border, backgroundColor: colors.muted + "33" }]}
          testID="booking-inbox-case-kept"
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Refund declined — appointment kept</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            You closed the case without a refund. The slot is still on the calendar unless you cancel it.
          </Text>
        </View>
      );
    }

    if (mismatch) {
      return (
        <View
          style={[styles.banner, { borderColor: colors.destructive + "55", backgroundColor: colors.destructive + "12" }]}
          testID="booking-inbox-case-mismatch"
        >
          <View style={styles.titleRow}>
            <Feather name="alert-triangle" size={16} color={colors.destructive} />
            <Text style={[styles.title, { color: colors.destructive }]}>
              Inbox says cancelled — booking still {status.toLowerCase()}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {resolvedLabel}. Finish by cancelling the appointment so the calendar matches what you told the customer.
          </Text>
          {onCancelBooking ? (
            <GlowPressable
              onPress={onCancelBooking}
              disabled={cancelPending}
              glowColor={colors.destructive}
              haptic="impact"
              style={[styles.cta, { backgroundColor: colors.destructive }]}
            >
              <Text style={[styles.ctaText, { color: "#fff" }]}>Cancel appointment now</Text>
            </GlowPressable>
          ) : null}
        </View>
      );
    }

    if (status === "CANCELLED" && resolvedLabel) {
      return (
        <View
          style={[styles.banner, { borderColor: colors.border, backgroundColor: colors.muted + "22" }]}
          testID="booking-inbox-case-closed"
        >
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            <Text style={{ fontFamily: fonts.bodySemi, color: colors.foreground }}>Inbox resolved: </Text>
            {resolvedLabel}
          </Text>
        </View>
      );
    }
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 4,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.bodySemi, fontSize: 14, flex: 1 },
  body: { ...type.caption, lineHeight: 18 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 13 },
});
