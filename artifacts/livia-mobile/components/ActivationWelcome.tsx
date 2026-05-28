import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useBusiness } from "@/contexts/BusinessContext";
import { fetchTenantExperience } from "@/lib/tenant-experience";
import { useColors } from "@/hooks/useColors";
import { verticalAccentHex } from "@/lib/vertical-theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DISMISS_KEY = "livia.activationWelcomeDismissed";

export function ActivationWelcome() {
  const colors = useColors();
  const { getToken } = useAuth();
  const { currentBusiness } = useBusiness();
  const [dismissed, setDismissed] = useState(true);
  const [experience, setExperience] = useState<Awaited<
    ReturnType<typeof fetchTenantExperience>
  > | null>(null);

  const bid = currentBusiness?.id;
  const bizMeta = currentBusiness as { vertical?: string; category?: string } | null;
  const accent = verticalAccentHex(bizMeta?.vertical, bizMeta?.category);

  useEffect(() => {
    if (!bid) return;
    void AsyncStorage.getItem(`${DISMISS_KEY}:${bid}`).then((v) => setDismissed(v === "1"));
  }, [bid]);

  useEffect(() => {
    if (!bid || dismissed) return;
    void fetchTenantExperience(bid, getToken).then(setExperience);
  }, [bid, dismissed, getToken]);

  if (!bid || dismissed || !experience) return null;

  const pending = experience.onboarding.activationSteps.filter((s) => !s.done);
  if (pending.length === 0 && experience.onboarding.appUnlocked) return null;

  return (
    <View
      style={[
        styles.card,
        { borderColor: accent + "55", backgroundColor: accent + "12" },
      ]}
      testID="activation-welcome"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>
        {experience.onboarding.welcomeHeadline}
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        {experience.onboarding.welcomeSubline}
      </Text>
      {pending.slice(0, 4).map((step) => (
        <Text key={step.id} style={[styles.step, { color: colors.foreground }]}>
          {step.done ? "✓" : "○"} {step.label}
        </Text>
      ))}
      <View style={styles.row}>
        <Link href="/onboarding-continue" asChild>
          <Pressable style={[styles.btn, { backgroundColor: accent }]}>
            <Text style={styles.btnText}>Continue setup</Text>
          </Pressable>
        </Link>
        <Pressable
          onPress={() => {
            void AsyncStorage.setItem(`${DISMISS_KEY}:${bid}`, "1");
            setDismissed(true);
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12, gap: 6 },
  title: { fontSize: 17, fontWeight: "700" },
  sub: { fontSize: 13, lineHeight: 18 },
  step: { fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  btn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
