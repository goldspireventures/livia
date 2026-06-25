import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { customFetch } from "@workspace/api-client-react";
import {
  listFeaturedMigrationSources,
  searchMigrationSources,
  type MigrationAutomationTruth,
  type MigrationIngestProfile,
  type MigrationSourceId,
} from "@workspace/policy";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";
import { UniversalImportPanel } from "@/components/UniversalImportPanel";
import { webOnboardingUrl } from "@/lib/cross-surface-handoff";

type RuntimeProfile = {
  profile: MigrationIngestProfile;
  automation: MigrationAutomationTruth | null;
  oauth: { brokerId: string; live: boolean; connected: boolean } | null;
  partner: { brokerId: string; live: boolean } | null;
};

type Props = {
  businessId: string;
  vertical?: string | null;
  onImported?: () => void;
};

/** Mobile migration — profile API, honest limits, file import; OAuth/partner via web handoff. */
export function MigrationSwitchPanel({ businessId, vertical, onImported }: Props) {
  const colors = useColors();
  const featured = useMemo(() => listFeaturedMigrationSources(vertical, 5), [vertical]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(featured[0]?.id ?? "spreadsheet");
  const [runtime, setRuntime] = useState<RuntimeProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const searchHits = useMemo(
    () => (query.trim() ? searchMigrationSources(query, vertical) : []),
    [query, vertical],
  );

  useEffect(() => {
    if (!businessId || !selected) return;
    setLoadingProfile(true);
    void customFetch<RuntimeProfile>(
      `/api/businesses/${businessId}/migration/source/${selected}/profile`,
    )
      .then(setRuntime)
      .catch(() => setRuntime(null))
      .finally(() => setLoadingProfile(false));
  }, [businessId, selected]);

  const automation = runtime?.automation;
  const oauth = runtime?.oauth;
  const partner = runtime?.partner;
  const needsWebConnect =
    (automation?.tier === "oauth_live" && oauth?.live) ||
    (automation?.tier === "partner_live" && partner?.live);

  return (
    <View style={styles.wrap} testID="migration-switch-panel">
      <Text style={[styles.heading, { color: colors.foreground }]}>Where are you coming from?</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search other tools…"
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.search,
          { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
        ]}
      />
      {searchHits.length > 0 ? (
        <View style={[styles.searchList, { borderColor: colors.border }]}>
          {searchHits.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setSelected(s.id);
                setQuery("");
              }}
            >
              <Text style={{ color: colors.foreground, padding: 8, fontSize: 13 }}>
                {s.displayName}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceRow}>
        {featured.map((s) => {
          const active = s.id === selected;
          return (
            <Pressable
              key={s.id}
              onPress={() => setSelected(s.id as MigrationSourceId)}
              style={[
                styles.sourceChip,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary + "14" : colors.card,
                },
              ]}
            >
              <Text style={[styles.sourceName, { color: colors.foreground }]}>{s.displayName}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loadingProfile ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
      ) : null}

      {automation ? (
        <View
          style={[styles.livBox, { borderColor: colors.border, backgroundColor: colors.muted + "22" }]}
          testID="migration-honest-limit"
        >
          <Text style={[styles.livTitle, { color: colors.foreground }]}>{automation.statusLine}</Text>
          <Text style={[styles.livIntro, { color: colors.mutedForeground }]}>{automation.honestLimit}</Text>
        </View>
      ) : null}

      {needsWebConnect ? (
        <Pressable
          style={[styles.connectBtn, { backgroundColor: colors.primary }]}
          onPress={() => void Linking.openURL(webOnboardingUrl(businessId))}
        >
          <Feather name="external-link" size={14} color="#fff" />
          <Text style={styles.connectBtnText}>{automation?.primaryCta ?? "Connect on web"}</Text>
        </Pressable>
      ) : null}

      {automation?.showFileUpload !== false ? (
        <UniversalImportPanel businessId={businessId} onImported={onImported} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginBottom: 16 },
  heading: { fontFamily: fonts.bodySemi, fontSize: 14 },
  search: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  searchList: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  sourceRow: { marginHorizontal: -4 },
  sourceChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    minWidth: 120,
  },
  sourceName: { fontFamily: fonts.bodySemi, fontSize: 13 },
  livBox: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  livTitle: { fontFamily: fonts.bodySemi, fontSize: 12 },
  livIntro: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
  },
  connectBtnText: { color: "#fff", fontFamily: fonts.bodySemi, fontSize: 14 },
});
