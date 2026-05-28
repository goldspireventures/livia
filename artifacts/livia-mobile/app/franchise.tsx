import { customFetch } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenTopBar } from "@/components/ScreenTopBar";
import { useColors } from "@/hooks/useColors";
import { fonts, type } from "@/constants/typography";

type FranchiseRollup = {
  franchiseeCount: number;
  franchisees: Array<{
    businessId: string;
    name: string;
    slug: string;
    city: string | null;
    royaltyBps: number;
  }>;
};

export default function FranchiseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<FranchiseRollup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    customFetch<FranchiseRollup>("/api/me/franchise-rollup")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40, paddingHorizontal: 16 }}
    >
      <ScreenTopBar />
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: colors.mutedForeground }}>← Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.foreground }]}>Franchise network</Text>
      <Text style={[type.body, { color: colors.mutedForeground, marginBottom: 16 }]}>
        Aggregated signal across franchisees — no customer PII crosses the wall.
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : !data ? (
        <Text style={{ color: colors.mutedForeground }}>Unable to load franchise rollup.</Text>
      ) : data.franchiseeCount === 0 ? (
        <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>
          No franchisees linked yet. When locations join your network, they appear here with royalty terms — no customer PII crosses brands.
        </Text>
      ) : (
        <>
          <Text style={[type.numericSm, { color: colors.foreground, marginBottom: 12 }]}>
            {data.franchiseeCount} franchisee{data.franchiseeCount === 1 ? "" : "s"}
          </Text>
          {data.franchisees.map((f) => (
            <View
              key={f.businessId}
              style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Text style={{ fontFamily: fonts.bodySemi, color: colors.foreground }}>{f.name}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                {f.city ?? f.slug} · royalty {(f.royaltyBps / 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontFamily: fonts.serifMedium, fontSize: 32, marginTop: 12, marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
});
