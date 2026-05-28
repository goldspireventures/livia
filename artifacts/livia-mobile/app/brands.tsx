import { customFetch } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PersonaScreenHeader } from "@/components/PersonaScreenHeader";
import { ScreenPurpose } from "@/components/ScreenPurpose";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import { Linking } from "react-native";

type BrandGroup = {
  brandShell: { id: string; name: string; slug: string };
  locations: Array<{ id: string; name: string; slug: string; city: string | null }>;
};

export default function BrandsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { businesses, setCurrentBusiness } = useBusiness();
  const [groups, setGroups] = useState<BrandGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    customFetch<BrandGroup[]>("/api/me/brand-portfolio")
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16, gap: 14 }}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>

      <PersonaScreenHeader
        eyebrow="Multi-brand operators"
        title="Brand portfolio"
        subtitle="When one company runs separate customer-facing brands (e.g. a hair line and a nail line), each brand has its own Liv wall and billing."
      />

      <ScreenPurpose
        icon="layers"
        title="Do you need this?"
        body="Most single salons can ignore this. It appears when you run white-label or chain-tier setups with more than one brand shell. Use the Shops / Glance tab to switch day-to-day locations."
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      ) : groups.length === 0 ? (
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No brand groups yet</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            Your locations still work from More → switch business, or the Glance tab. Brand shells are
            set up on web when you operate multiple distinct brands under one login.
          </Text>
          <Pressable
            onPress={() => void Linking.openURL(`${getDashboardBaseUrl()}/settings?tab=billing`)}
            style={[styles.linkBtn, { borderColor: colors.primary }]}
          >
            <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi }}>Learn more on web</Text>
          </Pressable>
        </View>
      ) : (
        groups.map((g) => (
          <View key={g.brandShell.id} style={{ gap: 8 }}>
            <Text style={[styles.brandName, { color: colors.foreground }]}>{g.brandShell.name}</Text>
            {g.locations.map((loc) => (
              <Pressable
                key={loc.id}
                style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }, elevation.resting]}
                onPress={() => {
                  const match = businesses.find((b) => b.id === loc.id);
                  if (match) setCurrentBusiness(match);
                  router.replace("/");
                }}
              >
                <Text style={[styles.locName, { color: colors.foreground }]}>{loc.name}</Text>
                {loc.city ? (
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>{loc.city}</Text>
                ) : null}
                <Text style={[styles.tap, { color: colors.primary }]}>Open this location →</Text>
              </Pressable>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { marginBottom: 4 },
  empty: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8, marginTop: 8 },
  emptyTitle: { fontFamily: fonts.bodySemi, fontSize: 16 },
  emptyBody: { ...type.body, fontSize: 14, lineHeight: 20 },
  linkBtn: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8 },
  brandName: { fontFamily: fonts.bodySemi, fontSize: 15, marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  locName: { fontFamily: fonts.bodyMed, fontSize: 15 },
  meta: { ...type.caption, fontSize: 12 },
  tap: { fontFamily: fonts.bodySemi, fontSize: 13, marginTop: 6 },
});
