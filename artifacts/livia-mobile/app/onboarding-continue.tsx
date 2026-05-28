import { useGetBusiness } from "@workspace/api-client-react";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { fetchTenantExperience } from "@/lib/tenant-experience";
import { verticalAccentHex } from "@/lib/vertical-theme";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { isOnboardingAppUnlocked, type OnboardingState } from "@workspace/policy";

export default function OnboardingContinueScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";

  const { data: biz, isLoading } = useGetBusiness(bid, { query: { enabled: !!bid } } as never);
  const state = (biz as { onboardingState?: OnboardingState } | undefined)?.onboardingState;
  const slug = currentBusiness?.slug;
  const bizMeta = currentBusiness as { vertical?: string; category?: string } | null;
  const vocab = verticalPackUi(bizMeta?.vertical, bizMeta?.category);
  const accent = verticalAccentHex(bizMeta?.vertical, bizMeta?.category);

  const [experience, setExperience] = useState<Awaited<
    ReturnType<typeof fetchTenantExperience>
  > | null>(null);

  useEffect(() => {
    if (!bid) return;
    void fetchTenantExperience(bid, getToken).then(setExperience);
  }, [bid, getToken]);

  const dashboardUrl =
    process.env.EXPO_PUBLIC_DASHBOARD_URL?.replace(/\/+$/, "") ?? "https://app.livia.io";

  const steps = experience?.onboarding.activationSteps ?? [];
  const appUnlocked = isOnboardingAppUnlocked(state);

  if (!bid) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Create your business first.</Text>
        <Pressable onPress={() => router.replace("/onboarding")}>
          <Text style={{ color: colors.primary, marginTop: 12 }}>Start onboarding</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}
    >
      <Text style={[styles.pack, { color: accent }]}>{vocab.label}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {experience?.onboarding.welcomeHeadline ?? "Finish setup"}
      </Text>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        {experience?.onboarding.welcomeSubline ??
          `Complete essentials for your ${vocab.locationNoun.toLowerCase()}.`}
      </Text>

      {isLoading ? (
        <ActivityIndicator color={accent} style={{ marginVertical: 24 }} />
      ) : (
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {steps.map((item) => (
            <Text key={item.id} style={[styles.row, { color: colors.foreground }]}>
              {item.done ? "✓" : "○"} {item.label}
            </Text>
          ))}
        </View>
      )}

      {!appUnlocked ? (
        <Pressable
          style={[styles.btn, { backgroundColor: accent }]}
          onPress={() => router.push("/onboarding-setup")}
        >
          <Text style={styles.btnText}>Complete essentials</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={[styles.btnOutline, { borderColor: colors.border, marginTop: appUnlocked ? 0 : 10 }]}
        onPress={() => void Linking.openURL(`${dashboardUrl}/onboarding`)}
      >
        <Text style={{ color: accent, fontWeight: "600" }}>Full wizard on web</Text>
      </Pressable>

      {slug ? (
        <Pressable
          style={[styles.btnOutline, { borderColor: colors.border }]}
          onPress={() => void Linking.openURL(`${dashboardUrl}/b/${slug}`)}
        >
          <Text style={{ color: accent, fontWeight: "600" }}>
            {experience?.playbook.publicCta ?? "Test booking page"}
          </Text>
        </Pressable>
      ) : null}

      {appUnlocked ? (
        <Pressable onPress={() => router.replace("/")} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
            Enter the app — finish optional steps later
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  pack: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 24, fontWeight: "700", marginTop: 4 },
  meta: { fontSize: 14, marginTop: 8, marginBottom: 20, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 10, marginBottom: 20 },
  row: { fontSize: 15 },
  btn: { borderRadius: 10, padding: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600" },
  btnOutline: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
  },
});
