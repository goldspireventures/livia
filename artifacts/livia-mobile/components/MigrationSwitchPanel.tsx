import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import {
  getMigrationSource,
  listMigrationSourcesForVertical,
  resolveMigrationLivWalkthrough,
} from "@workspace/policy";
import { UniversalImportPanel } from "@/components/UniversalImportPanel";

type Props = {
  businessId: string;
  vertical?: string | null;
  onImported?: () => void;
};

/** Mobile parity — source picker + Liv guide + CSV import. */
export function MigrationSwitchPanel({ businessId, vertical, onImported }: Props) {
  const colors = useColors();
  const sources = useMemo(() => listMigrationSourcesForVertical(vertical), [vertical]);
  const [selected, setSelected] = useState(sources[0]?.id ?? "spreadsheet");
  const source = getMigrationSource(selected);
  const walkthrough = resolveMigrationLivWalkthrough(selected);

  return (
    <View style={styles.wrap} testID="migration-switch-panel">
      <Text style={[styles.heading, { color: colors.foreground }]}>Where are you coming from?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceRow}>
        {sources.map((s) => {
          const active = s.id === selected;
          return (
            <Pressable
              key={s.id}
              onPress={() => setSelected(s.id)}
              style={[
                styles.sourceChip,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary + "14" : colors.card,
                },
              ]}
            >
              <Text style={[styles.sourceName, { color: colors.foreground }]}>{s.displayName}</Text>
              <Text style={[styles.sourceMeta, { color: colors.mutedForeground }]} numberOfLines={2}>
                {s.pickerSubtitle}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {source ? (
        <View style={[styles.livBox, { borderColor: colors.border, backgroundColor: colors.muted + "22" }]}>
          <View style={styles.livHead}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[styles.livTitle, { color: colors.foreground }]}>
              Liv · {source.displayName}
            </Text>
          </View>
          <Text style={[styles.livIntro, { color: colors.mutedForeground }]}>{walkthrough.intro}</Text>
          {walkthrough.steps.slice(0, 4).map((step, i) => (
            <Text key={i} style={[styles.livStep, { color: colors.mutedForeground }]}>
              {i + 1}. {step.detail}
            </Text>
          ))}
        </View>
      ) : null}

      <UniversalImportPanel businessId={businessId} onImported={onImported} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginBottom: 16 },
  heading: { fontFamily: fonts.bodySemi, fontSize: 14 },
  sourceRow: { marginHorizontal: -4 },
  sourceChip: {
    width: 148,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
  },
  sourceName: { fontFamily: fonts.bodySemi, fontSize: 13 },
  sourceMeta: { fontFamily: fonts.body, fontSize: 10, marginTop: 4, lineHeight: 14 },
  livBox: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  livHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  livTitle: { fontFamily: fonts.bodySemi, fontSize: 12 },
  livIntro: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },
  livStep: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15 },
});
