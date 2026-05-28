import { customFetch } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { PersonaScreenHeader } from "@/components/PersonaScreenHeader";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useContentInsets } from "@/hooks/useContentInsets";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

type PremisesTenant = {
  businessId: string;
  publicLabel: string;
  slug: string;
  name: string;
  vertical: string;
  isPrimary: boolean;
};

type PremisesDetail = {
  id: string;
  slug: string;
  displayName: string;
  city: string | null;
  tenants: PremisesTenant[];
};

export default function PremisesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { horizontalPad, maxContentWidth } = useContentInsets();
  const [rows, setRows] = useState<PremisesDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customFetch<PremisesDetail[]>("/api/me/premises");
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const webPremises = `${getDashboardBaseUrl()}/premises`;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 8,
          paddingHorizontal: horizontalPad,
          maxWidth: maxContentWidth,
          alignSelf: maxContentWidth ? "center" : undefined,
          width: maxContentWidth ? "100%" : undefined,
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />
      }
    >
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>

      <PersonaScreenHeader
        eyebrow="Shared address"
        title="Premises"
        subtitle="One front door, multiple tenants. Full setup (co-tenants, routing) stays on web."
      />

      <Pressable
        onPress={() => void Linking.openURL(webPremises)}
        style={[styles.webCta, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "10" }]}
      >
        <Feather name="external-link" size={16} color={colors.primary} />
        <Text style={[styles.webCtaText, { color: colors.primary }]}>Edit premises on web</Text>
      </Pressable>

      {loading && rows.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="map-pin"
          title="No shared premises yet"
          subtitle="Create Dundrum-style shared buildings from the web premises page."
        />
      ) : (
        rows.map((p) => (
          <View
            key={p.id}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              elevation.resting,
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{p.displayName}</Text>
            {p.city ? (
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{p.city}</Text>
            ) : null}
            <Pressable
              onPress={() => void Linking.openURL(`${getDashboardBaseUrl().replace(/\/+$/, "")}/p/${p.slug}`)}
              style={styles.linkRow}
            >
              <Text style={[styles.link, { color: colors.primary }]}>livia.io/p/{p.slug}</Text>
              <Feather name="external-link" size={14} color={colors.primary} />
            </Pressable>
            <Text style={[styles.tenantLabel, { color: colors.mutedForeground }]}>
              {p.tenants.length} tenant{p.tenants.length === 1 ? "" : "s"}
            </Text>
            {p.tenants.map((t) => (
              <View key={t.businessId} style={[styles.tenantRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.tenantName, { color: colors.foreground }]} numberOfLines={1}>
                  {t.publicLabel || t.name}
                </Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>{t.vertical}</Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 48, gap: 14 },
  back: { marginBottom: 4 },
  webCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  webCtaText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 17 },
  meta: { ...type.caption, fontSize: 12 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  link: { fontFamily: fonts.bodySemi, fontSize: 13 },
  tenantLabel: { ...type.eyebrow, fontSize: 10, marginTop: 8 },
  tenantRow: { paddingTop: 10, marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, gap: 2 },
  tenantName: { fontFamily: fonts.bodyMed, fontSize: 14 },
});
