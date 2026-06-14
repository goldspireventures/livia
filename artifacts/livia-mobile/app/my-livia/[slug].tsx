import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@/lib/api-base";
import { GUEST_HUB_TOKEN_KEY, openGuestBookUrl } from "@/lib/guest-hub";
import { GUEST_HUB_COPY } from "@workspace/policy";
import { GuestDesignProofPanel } from "@/components/guest/GuestDesignProofPanel";
import { verticalAccentHex } from "@/lib/vertical-theme";

type GuestProofArtifact = {
  proofId: string;
  status: string;
  note: string | null;
  imageUrl?: string | null;
  reviewUrl: string;
  version?: number;
  versions?: Array<{ version: number; imageUrl: string | null; createdAt?: string }>;
};

type ShopRelationship = {
  shop: { businessName: string; slug: string; vertical?: string | null };
  upcomingBookings: Array<{
    bookingId: string;
    serviceName: string;
    startAt: string;
    manageUrl: string;
  }>;
  packageCredits: Array<{
    packageName: string;
    creditsRemaining: number;
    creditsTotal: number;
  }>;
  relationship: { headline: string; memoryHighlight: string | null } | null;
  bookUrl: string;
  verticalArtifacts?: {
    proofs: GuestProofArtifact[];
  };
};

export default function MyLiviaShopScreen() {
  const colors = useColors();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const api = getApiBaseUrl();
  const [data, setData] = useState<ShopRelationship | null>(null);
  const [loading, setLoading] = useState(true);
  const [hubToken, setHubToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await AsyncStorage.getItem(GUEST_HUB_TOKEN_KEY);
    if (!token || !slug) {
      setLoading(false);
      return;
    }
    setHubToken(token);
    const r = await fetch(`${api}/api/public/guest-hub/shops/${encodeURIComponent(slug)}`, {
      headers: { "X-Guest-Hub-Token": token },
    });
    if (!r.ok) {
      setData(null);
      setLoading(false);
      return;
    }
    setData((await r.json()) as ShopRelationship);
    setLoading(false);
  }, [api, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[type.body, { color: colors.mutedForeground, padding: 16 }]}>
          {GUEST_HUB_COPY.shopNotFound}
        </Text>
      </SafeAreaView>
    );
  }

  const accent = verticalAccentHex(data.shop.vertical ?? undefined, undefined);
  const activeProof =
    data.verticalArtifacts?.proofs.find((p) => p.status === "pending_review") ??
    data.verticalArtifacts?.proofs.find((p) => p.status === "rejected") ??
    data.verticalArtifacts?.proofs[0];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={[type.title, { color: colors.foreground }]}>{data.shop.businessName}</Text>
        {data.relationship?.memoryHighlight ? (
          <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 8 }]}>
            {data.relationship.memoryHighlight}
          </Text>
        ) : null}

        {activeProof && hubToken && slug ? (
          <GuestDesignProofPanel
            proof={activeProof}
            hubToken={hubToken}
            shopSlug={slug}
            accent={accent}
          />
        ) : null}

        {data.upcomingBookings.map((b) => (
          <Pressable
            key={b.bookingId}
            style={[styles.card, { borderColor: colors.border }]}
            onPress={() =>
              router.push(`/my-livia/${slug}/visit/${b.bookingId}` as never)
            }
          >
            <Text style={[type.body, { fontFamily: fonts.bodyMed, color: colors.foreground }]}>
              {b.serviceName}
            </Text>
            <Text style={[type.caption, { color: colors.primary, marginTop: 4 }]}>
              Manage visit →
            </Text>
          </Pressable>
        ))}

        {data.packageCredits.length > 0 ? (
          <View style={[styles.card, { borderColor: colors.border }]}>
            <Text style={[type.body, { fontFamily: fonts.bodyMed, color: colors.foreground }]}>
              Package credits
            </Text>
            {data.packageCredits.map((p, i) => (
              <Text key={i} style={[type.caption, { color: colors.mutedForeground, marginTop: 4 }]}>
                {p.packageName} — {p.creditsRemaining} of {p.creditsTotal} left
              </Text>
            ))}
          </View>
        ) : null}

        <Pressable
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => openGuestBookUrl(data.bookUrl)}
        >
          <Text style={[type.body, { color: colors.primaryForeground, fontFamily: fonts.bodyMed }]}>
            Book again
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { padding: 16 },
  pad: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  btn: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
});
