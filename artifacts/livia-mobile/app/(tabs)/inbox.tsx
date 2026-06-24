import { useListConversations, type ConversationListItem } from "@workspace/api-client-react";
import {
  countUnifiedInboxQueueLens,
  defaultInboxQueueLens,
  groupInboxThreadsByCustomer,
  inboxScreenTitle,
  INBOX_QUEUE_LENS_LABELS,
  inboxMultiChannelListHint,
  inboxUnifiedListRowToThreadRow,
  isUnifiedConsultInboxVertical,
  matchesUnifiedInboxQueueLens,
  type InboxQueueLens,
} from "@workspace/policy";
import EventVendorEnquiriesScreen from "../enquiries";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { InboxThreadRow } from "@/components/inbox/InboxThreadRow";
import { OperationalScreen } from "@/components/OperationalScreen";
import { GlowPressable } from "@/components/ui/GlowPressable";
import { usePresentationAccent } from "@/contexts/PresentationThemeContext";
import { useTenantExperience } from "@/hooks/useTenantExperience";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { MobileInboxMorphLayout } from "@/components/inbox/MobileInboxMorphLayout";
import { usePresentationMorph } from "@/hooks/usePresentationMorph";
import { useColors } from "@/hooks/useColors";
import { usePersona } from "@/hooks/usePersona";
import { asHref } from "@/lib/navigation";
import { OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";
import { useOperationalChrome } from "@/lib/operational-chrome";
import { useTenantPresentation } from "@/contexts/PresentationThemeContext";
import { tenantScreenBackground } from "@/lib/tenant-shell-layout";
import { useHaptics } from "@/hooks/useHaptics";

const QUEUE_LENSES: InboxQueueLens[] = [
  "needs_you",
  "liv_handling",
  "taken_over",
  "closed",
];

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function InboxScreen() {
  const { currentBusiness } = useBusiness();
  const tenantVertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  if (isUnifiedConsultInboxVertical(tenantVertical)) {
    return <EventVendorEnquiriesScreen />;
  }
  return <MessagingInboxScreen />;
}

function MessagingInboxScreen() {
  const { currentBusiness } = useBusiness();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const { kind: persona } = usePersona();
  const businessId = currentBusiness?.id ?? "";
  const bizMeta = currentBusiness as { vertical?: string; category?: string } | undefined;
  const { data: tenantExperience } = useTenantExperience(businessId || undefined);
  const accent = usePresentationAccent();
  const { nativeMorph } = usePresentationMorph();
  const chrome = useOperationalChrome(businessId || undefined);
  const presentation = useTenantPresentation();
  const haptics = useHaptics();

  const showQueue = persona === "manager" || persona === "owner" || persona === "org_admin";
  const canQuickBook =
    persona === "owner" || persona === "manager" || persona === "org_admin" || persona === "receptionist";
  const [queueLens, setQueueLens] = useState<InboxQueueLens>("liv_handling");

  useEffect(() => {
    if (showQueue) setQueueLens(defaultInboxQueueLens(persona));
  }, [persona, showQueue]);

  const { data, isLoading, refetch, isRefetching } = useListConversations(
    businessId,
    undefined,
    { query: { enabled: !!businessId, refetchInterval: OPERATIONAL_REFETCH_MS } as never },
  );

  const threads: ConversationListItem[] = Array.isArray(data) ? data : [];
  const guestGroups = useMemo(() => groupInboxThreadsByCustomer(threads), [threads]);
  const queueCounts = useMemo(() => countUnifiedInboxQueueLens(guestGroups), [guestGroups]);
  const filtered = useMemo(() => {
    if (!showQueue) return threads;
    return guestGroups
      .filter((g) => matchesUnifiedInboxQueueLens(g, queueLens))
      .map((g) => {
        const aggregate = inboxUnifiedListRowToThreadRow(g);
        const primaryFull = threads.find((t) => t.id === g.primaryConversationId);
        return (primaryFull
          ? { ...primaryFull, ...aggregate, id: g.primaryConversationId }
          : aggregate) as ConversationListItem;
      });
  }, [threads, guestGroups, queueLens, showQueue]);

  const activeChannelCountByCustomer = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of guestGroups) {
      if (g.customerId && g.activeChannels.length > 1) {
        counts.set(g.customerId, g.activeChannels.length);
      }
    }
    return counts;
  }, [guestGroups]);

  useEffect(() => {
    const cid = params.conversationId;
    if (typeof cid === "string" && cid.length > 0) {
      router.push(`/conversation/${cid}` as never);
    }
  }, [params.conversationId, router]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const screenTitle = inboxScreenTitle(persona);
  const lede = showQueue
    ? INBOX_QUEUE_LENS_LABELS[queueLens].description
    : "Tap a thread to open the full conversation — take over, reply, or return to Liv.";

  return (
    <View style={[styles.root, { backgroundColor: tenantScreenBackground(presentation.isConstellation, colors.background) }]}>
      <OperationalScreen
        ritualPage
        title={screenTitle}
        subtitle={lede}
        onRefresh={() => {
          void refetch();
        }}
        contentStyle={{ paddingBottom: 120 }}
      >
        {showQueue ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipScroll}
          >
            {QUEUE_LENSES.map((lens, i) => {
              const active = queueLens === lens;
              const count = queueCounts[lens];
              return (
                <Animated.View
                  key={lens}
                  entering={FadeInDown.delay(i * 40).duration(300).springify()}
                >
                  <GlowPressable
                    onPress={() => {
                      haptics.selection();
                      setQueueLens(lens);
                    }}
                    glowColor={accent}
                    haptic="selection"
                    style={[
                      styles.chip,
                      chrome.native
                        ? chrome.chip(active)
                        : {
                            backgroundColor: active ? colors.primary + "22" : colors.card,
                            borderColor: active ? colors.primary : colors.border,
                          },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        chrome.native
                          ? chrome.chipText(active)
                          : { color: active ? colors.primary : colors.mutedForeground },
                      ]}
                    >
                      {INBOX_QUEUE_LENS_LABELS[lens].short}
                      {count > 0 ? ` (${count})` : ""}
                    </Text>
                  </GlowPressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        ) : null}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="message-circle"
            title={
              showQueue
                ? `Nothing in ${INBOX_QUEUE_LENS_LABELS[queueLens].short}`
                : "Inbox is quiet"
            }
            subtitle={
              showQueue
                ? INBOX_QUEUE_LENS_LABELS[queueLens].description
                : "When customers message on WhatsApp, Instagram, SMS, or your booking page, threads land here."
            }
            actionLabel={canQuickBook ? "New booking" : undefined}
            onAction={canQuickBook ? () => router.push(asHref("/booking/new")) : undefined}
          />
        ) : nativeMorph ? (
          <MobileInboxMorphLayout
            morph={nativeMorph}
            threads={filtered}
            accent={accent}
            chrome={chrome}
            showQueue={showQueue}
            queueLens={queueLens}
            formatRelative={formatRelative}
            queueCounts={queueCounts}
          />
        ) : (
          filtered.map((t, i) => (
            <InboxThreadRow
              key={t.id}
              thread={t}
              index={i}
              accent={accent}
              chrome={chrome}
              formatRelative={formatRelative}
              needsYouHighlight={showQueue && queueLens === "needs_you"}
              multiChannelHint={
                t.customerId
                  ? inboxMultiChannelListHint(activeChannelCountByCustomer.get(t.customerId) ?? 0)
                  : null
              }
            />
          ))
        )}
      </OperationalScreen>

      {canQuickBook ? (
        <GlowPressable
          onPress={() => router.push(asHref("/booking/new"))}
          glowColor={accent}
          haptic="impact"
          contentStyle={styles.fabInner}
          style={[
            styles.fab,
            chrome.native ? chrome.primaryButton() : { backgroundColor: colors.primary },
            { bottom: insets.bottom + 72 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="New booking"
        >
          <Feather name="plus" size={22} color="#fff" />
        </GlowPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chipScroll: { marginBottom: 14, marginHorizontal: -4 },
  chipRow: { gap: 8, paddingHorizontal: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontFamily: fonts.bodyMed, fontSize: 13 },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
