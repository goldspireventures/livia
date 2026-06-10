import type { ConversationListItem } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import type { PresentationLayoutMorph } from "@workspace/policy";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { InboxThreadRow } from "@/components/inbox/InboxThreadRow";
import { fonts } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import type { OperationalChrome } from "@/lib/operational-chrome";
import {
  groupInboxThreadsForMorph,
  sortInboxThreadsForMorph,
  type InboxMorphSection,
} from "@/lib/morph-inbox-order";
import { layoutMorphLabel } from "@/lib/presentation-morph-label";

type Props = {
  morph: PresentationLayoutMorph | null;
  threads: ConversationListItem[];
  accent: string;
  chrome: OperationalChrome;
  showQueue: boolean;
  queueLens: string;
  formatRelative: (iso: string) => string;
  queueCounts: Record<string, number>;
};

function MorphMetrics({
  morph,
  queueCounts,
  accent,
}: {
  morph: PresentationLayoutMorph;
  queueCounts: Record<string, number>;
  accent: string;
}) {
  const colors = useColors();
  if (morph === "cockpit") {
    const metrics = [
      ["Needs you", queueCounts.needs_you ?? 0],
      ["Liv", queueCounts.liv_handling ?? 0],
      ["Handoffs", queueCounts.taken_over ?? 0],
    ] as const;
    return (
      <View style={styles.metricsRow} testID="inbox-morph-cockpit-metrics">
        {metrics.map(([label, val]) => (
          <View
            key={label}
            style={[styles.metric, { borderColor: accent + "44", backgroundColor: accent + "10" }]}
          >
            <Text style={[styles.metricVal, { color: accent }]}>{val}</Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (morph === "ledger") {
    return (
      <View
        style={[styles.ledgerBand, { borderColor: accent + "33", backgroundColor: accent + "08" }]}
        testID="inbox-morph-ledger-band"
      >
        <Feather name="book-open" size={14} color={accent} />
        <Text style={[styles.ledgerText, { color: colors.foreground }]}>
          Evening ledger — handoffs and guest settlement first
        </Text>
      </View>
    );
  }
  if (morph === "split-inbox") {
    return (
      <View
        style={[styles.ledgerBand, { borderColor: accent + "33", backgroundColor: accent + "08" }]}
        testID="inbox-morph-split-band"
      >
        <Feather name="inbox" size={14} color={accent} />
        <Text style={[styles.ledgerText, { color: colors.foreground }]}>
          Inbox lane first — DMs before the chair queue
        </Text>
      </View>
    );
  }
  if (morph === "constellation") {
    return (
      <View style={styles.metricsRow} testID="inbox-morph-constellation-signals">
        {[
          ["Signals", (queueCounts.needs_you ?? 0) + (queueCounts.taken_over ?? 0)],
          ["Liv", queueCounts.liv_handling ?? 0],
        ].map(([label, val]) => (
          <View
            key={label}
            style={[styles.metric, { borderColor: "rgba(217,195,154,0.35)", backgroundColor: "rgba(42,45,58,0.45)" }]}
          >
            <Text style={[styles.metricVal, { color: "#d9c39a" }]}>{val}</Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
          </View>
        ))}
      </View>
    );
  }
  return null;
}

function SectionBlock({
  section,
  morph,
  accent,
  chrome,
  showQueue,
  queueLens,
  formatRelative,
  startIndex,
}: {
  section: InboxMorphSection;
  morph: PresentationLayoutMorph | null;
  accent: string;
  chrome: OperationalChrome;
  showQueue: boolean;
  queueLens: string;
  formatRelative: (iso: string) => string;
  startIndex: number;
}) {
  const colors = useColors();
  const menuGrid = morph === "menu-card";

  return (
    <View style={styles.section} testID={`inbox-morph-section-${section.id}`}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{section.title}</Text>
      <View style={menuGrid ? styles.menuGrid : undefined}>
        {section.threads.map((t, i) => {
          const needsYou = t.status === "OPEN" && !t.aiHandled;
          return (
            <View key={t.id} style={menuGrid ? styles.menuCell : undefined}>
              <InboxThreadRow
                thread={t}
                index={startIndex + i}
                accent={accent}
                chrome={chrome}
                formatRelative={formatRelative}
                needsYouHighlight={showQueue && queueLens === "needs_you"}
                beautyAccent={morph === "split-inbox" && needsYou}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function MobileInboxMorphLayout({
  morph,
  threads,
  accent,
  chrome,
  showQueue,
  queueLens,
  formatRelative,
  queueCounts,
}: Props) {
  const colors = useColors();
  const sorted = sortInboxThreadsForMorph(threads, morph);
  const sections = groupInboxThreadsForMorph(sorted, morph);
  const label = morph ? layoutMorphLabel(morph) : null;

  return (
    <View testID={morph ? `mobile-inbox-morph-${morph}` : "mobile-inbox-morph-standard"}>
      {morph && label ? (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={[styles.morphEyebrow, { color: accent }]}>
            {label} · inbox structure
          </Text>
        </Animated.View>
      ) : null}
      {morph ? <MorphMetrics morph={morph} queueCounts={queueCounts} accent={accent} /> : null}

      {sections ? (
        sections.map((section, si) => (
          <SectionBlock
            key={section.id}
            section={section}
            morph={morph}
            accent={accent}
            chrome={chrome}
            showQueue={showQueue}
            queueLens={queueLens}
            formatRelative={formatRelative}
            startIndex={si * 10}
          />
        ))
      ) : (
        <View style={morph === "menu-card" ? styles.menuGrid : undefined}>
          {sorted.map((t, i) => {
            const needsYou = t.status === "OPEN" && !t.aiHandled;
            return (
              <View key={t.id} style={morph === "menu-card" ? styles.menuCell : undefined}>
                <InboxThreadRow
                  thread={t}
                  index={i}
                  accent={accent}
                  chrome={chrome}
                  formatRelative={formatRelative}
                  needsYouHighlight={showQueue && queueLens === "needs_you"}
                  beautyAccent={
                    (morph === "split-inbox" || morph === "cockpit") && needsYou
                  }
                />
              </View>
            );
          })}
        </View>
      )}

      {morph === "timeline-rail" ? (
        <View style={[styles.railHint, { borderColor: colors.border }]}>
          <Text style={[styles.railHintText, { color: colors.mutedForeground }]}>
            Session rail — newest guest thread at the top
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  morphEyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  metricsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  metricVal: { fontFamily: fonts.bodySemi, fontSize: 18 },
  metricLabel: { fontFamily: fonts.mono, fontSize: 9, marginTop: 2, textTransform: "uppercase" },
  ledgerBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  ledgerText: { flex: 1, fontFamily: fonts.bodyMed, fontSize: 13, lineHeight: 18 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  menuCell: { width: "48%" },
  railHint: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 10,
  },
  railHintText: { fontFamily: fonts.mono, fontSize: 10, textAlign: "center" },
});
