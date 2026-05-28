import { customFetch } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { fonts, type } from "@/constants/typography";

type HostDashboard = {
  activeChairs: number;
  totalChairs: number;
  rentDueCount: number;
  rentDueTotalMinor: number;
  renters: Array<{
    id: string;
    chairLabel: string;
    weeklyRentMinor: number;
    currency: string;
    rentStatus: string;
    renter: { name: string; slug: string };
  }>;
};

export default function HostScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const [data, setData] = useState<HostDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bid) return;
    setLoading(true);
    customFetch<HostDashboard>(`/api/businesses/${bid}/host/dashboard`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [bid]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={[type.caption, { color: colors.mutedForeground }]}>← Back</Text>
      </Pressable>
      <Text style={[type.title, { color: colors.foreground, fontFamily: fonts.serifMedium }]}>Host floor</Text>
      <Text style={[type.body, { color: colors.muted, marginTop: 8 }]}>
        Chair occupancy and rent queue — renter client lists stay on their own tenant.
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      ) : !data ? (
        <Text style={[type.body, { color: colors.mutedForeground, marginTop: 24 }]}>
          Unable to load host dashboard.
        </Text>
      ) : data.totalChairs === 0 ? (
        <Text style={[type.body, { color: colors.mutedForeground, marginTop: 24 }]}>
          Chair rental is not set up for this location yet — configure chairs on web under Host / chair rental.
        </Text>
      ) : (
        <View style={{ marginTop: 24, gap: 16 }}>
          <View style={[styles.statRow, { borderColor: colors.border }]}>
            <Text style={[type.caption, { color: colors.mutedForeground }]}>Chairs in use</Text>
            <Text style={[type.numericSm, { color: colors.foreground }]}>
              {data.activeChairs} / {data.totalChairs}
            </Text>
          </View>
          <View style={[styles.statRow, { borderColor: colors.border }]}>
            <Text style={[type.caption, { color: colors.mutedForeground }]}>Rent due</Text>
            <Text style={[type.numericSm, { color: colors.foreground }]}>
              {data.rentDueCount} · {(data.rentDueTotalMinor / 100).toFixed(2)}
            </Text>
          </View>
          {data.renters.map((r) => (
            <View key={r.id} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[type.label, { color: colors.foreground }]}>{r.renter.name}</Text>
              <Text style={[type.caption, { color: colors.mutedForeground }]}>
                {r.chairLabel} · {r.rentStatus} · {(r.weeklyRentMinor / 100).toFixed(2)} {r.currency}/wk
              </Text>
              {r.rentStatus === "due" ? (
                <Pressable
                  onPress={() => {
                    void customFetch(`/api/businesses/${bid}/host/renters/${r.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ rentStatus: "paid" }),
                    }).then(() =>
                      customFetch<HostDashboard>(`/api/businesses/${bid}/host/dashboard`).then(setData),
                    );
                  }}
                  style={{ marginTop: 8, paddingVertical: 8, alignItems: "center", backgroundColor: colors.primary, borderRadius: 8 }}
                >
                  <Text style={{ color: colors.primaryForeground, fontFamily: fonts.bodySemi, fontSize: 13 }}>
                    Mark paid
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { marginBottom: 12 },
  statRow: { borderWidth: 1, borderRadius: 12, padding: 16 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14 },
});
