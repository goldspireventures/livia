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
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useContentInsets } from "@/hooks/useContentInsets";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

type DayPackageStep = {
  id: string;
  sequence: number;
  durationMinutes: number;
  label?: string | null;
};

type DayPackage = {
  id: string;
  name: string;
  description?: string | null;
  totalDurationMinutes: number;
  priceMinor?: number | null;
  currency?: string | null;
  steps: DayPackageStep[];
};

function formatPrice(minor: number | null | undefined, currency: string | null | undefined) {
  if (minor == null) return null;
  const cur = currency ?? "EUR";
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: cur }).format(minor / 100);
}

export default function DayPackagesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useBusiness();
  const { horizontalPad, maxContentWidth } = useContentInsets();
  const bid = currentBusiness?.id ?? "";
  const [packages, setPackages] = useState<DayPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const load = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    try {
      const data = await customFetch<DayPackage[]>(`/api/businesses/${bid}/day-packages`);
      setPackages(data);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [bid]);

  useEffect(() => {
    void load();
  }, [load]);

  const webUrl = `${getDashboardBaseUrl()}/day-packages`;

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
        eyebrow={currentBusiness?.name ?? "Workspace"}
        title="Day packages"
        subtitle="Spa-day itineraries — view steps here; create and edit on web."
      />

      <Pressable
        onPress={() => void Linking.openURL(webUrl)}
        style={[styles.webCta, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "10" }]}
      >
        <Feather name="external-link" size={16} color={colors.primary} />
        <Text style={[styles.webCtaText, { color: colors.primary }]}>Manage packages on web</Text>
      </Pressable>

      {loading && packages.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : packages.length === 0 ? (
        <EmptyState
          icon="sun"
          title="No day packages"
          subtitle="Day packages appear for wellness or medspa locations — add or edit them on web."
        />
      ) : (
        packages.map((pkg) => {
          const price = formatPrice(pkg.priceMinor, pkg.currency);
          const hours = Math.round((pkg.totalDurationMinutes / 60) * 10) / 10;
          return (
            <View
              key={pkg.id}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                elevation.resting,
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{pkg.name}</Text>
              {pkg.description ? (
                <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={3}>
                  {pkg.description}
                </Text>
              ) : null}
              <Text style={[styles.stats, { color: colors.mutedForeground }]}>
                {pkg.steps.length} step{pkg.steps.length === 1 ? "" : "s"} · ~{hours}h
                {price ? ` · ${price}` : ""}
              </Text>
              {pkg.steps.slice(0, 4).map((s) => (
                <Text key={s.id} style={[styles.step, { color: colors.foreground }]}>
                  {s.sequence}. {s.label ?? "Service"} · {s.durationMinutes}m
                </Text>
              ))}
              {pkg.steps.length > 4 ? (
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  +{pkg.steps.length - 4} more on web
                </Text>
              ) : null}
            </View>
          );
        })
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
  meta: { ...type.body, fontSize: 13, lineHeight: 20 },
  stats: { ...type.caption, fontSize: 12 },
  step: { ...type.caption, fontSize: 13, marginTop: 2 },
});
