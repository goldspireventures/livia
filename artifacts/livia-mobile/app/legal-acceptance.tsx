import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { dpaUrl, privacyPolicyUrl, termsOfServiceUrl } from "@/lib/marketing-legal-urls";
import { acceptPlatformLegal, fetchMeProfile } from "@/lib/platform-legal";
import { resolveStaffInviteLandingForUser } from "@/lib/staff-invite-landing";
import {
  platformLegalAcceptanceBullets,
  platformLegalAcceptanceCheckboxLabel,
  platformLegalAcceptanceContinueCta,
  platformLegalAcceptanceDescription,
  platformLegalAcceptanceTitle,
} from "@workspace/policy";

export default function LegalAcceptanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const fromStaffInvite = params.from === "staff-invite";
  const haptics = useHaptics();
  const { user } = useUser();
  const clerkEmail = user?.primaryEmailAddress?.emailAddress;
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchMeProfile()
      .then(async (me) => {
        if (!me.platformLegalAccepted) return;
        if (fromStaffInvite) {
          const path = await resolveStaffInviteLandingForUser({
            surface: "mobile",
            clerkEmail: clerkEmail ?? null,
          });
          router.replace(path as never);
          return;
        }
        router.replace("/onboarding");
      })
      .catch(() => {
        /* stay on screen — user can retry accept */
      })
      .finally(() => setChecking(false));
  }, [router, fromStaffInvite, clerkEmail]);

  const openLink = (url: string) => {
    haptics.selection();
    void Linking.openURL(url);
  };

  const submit = async () => {
    if (!agreed || saving) return;
    haptics.tap();
    setSaving(true);
    setError("");
    try {
      await acceptPlatformLegal(clerkEmail ?? undefined);
      haptics.success();
      if (fromStaffInvite) {
        const path = await resolveStaffInviteLandingForUser({
          surface: "mobile",
          clerkEmail: clerkEmail ?? null,
        });
        router.replace(path as never);
      } else {
        router.replace("/onboarding");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save acceptance";
      setError(msg);
      haptics.warning();
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <AuroraHalo tone="primary" size={480} intensity={0.85} style={{ top: -100, left: -60 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 22,
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={insets.bottom + 20}
      >
        <LiviaWordmark size="md" color={colors.foreground} />

        <Text style={[styles.title, { color: colors.foreground }]}>{platformLegalAcceptanceTitle()}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          {platformLegalAcceptanceDescription()}
        </Text>

        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {platformLegalAcceptanceBullets().map((bullet) => (
            <Text key={bullet} style={[styles.bullet, { color: colors.mutedForeground }]}>
              • {bullet}
            </Text>
          ))}
        </View>

        <View style={styles.links}>
          <Pressable onPress={() => openLink(termsOfServiceUrl())}>
            <Text style={[styles.link, { color: colors.primary }]}>Terms of service</Text>
          </Pressable>
          <Pressable onPress={() => openLink(privacyPolicyUrl())}>
            <Text style={[styles.link, { color: colors.primary }]}>Privacy policy</Text>
          </Pressable>
          <Pressable onPress={() => openLink(dpaUrl())}>
            <Text style={[styles.link, { color: colors.primary }]}>DPA (processor)</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.checkRow}
          onPress={() => {
            haptics.selection();
            setAgreed((v) => !v);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: agreed ? colors.primary : colors.border,
                backgroundColor: agreed ? colors.primary : "transparent",
              },
            ]}
          >
            {agreed ? <Feather name="check" size={14} color={colors.primaryForeground} /> : null}
          </View>
          <Text style={[styles.checkLabel, { color: colors.foreground }]}>
            {platformLegalAcceptanceCheckboxLabel()}
          </Text>
        </Pressable>

        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

        <Pressable
          style={[
            styles.cta,
            { backgroundColor: colors.primary, opacity: !agreed || saving ? 0.55 : 1 },
          ]}
          onPress={() => void submit()}
          disabled={!agreed || saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
              {platformLegalAcceptanceContinueCta()}
            </Text>
          )}
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 28,
    lineHeight: 34,
    marginTop: 28,
    letterSpacing: -0.4,
  },
  body: { ...type.body, marginTop: 12, lineHeight: 22 },
  card: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  bullet: { ...type.body, fontSize: 14, lineHeight: 20 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 20 },
  link: { fontFamily: fonts.bodySemi, fontSize: 14 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 24 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkLabel: { ...type.body, flex: 1, fontSize: 14, lineHeight: 20 },
  error: { ...type.body, fontSize: 13, marginTop: 12, textAlign: "center" },
  cta: {
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 15 },
});
