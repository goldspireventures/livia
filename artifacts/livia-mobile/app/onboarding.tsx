import { useCreateBusiness } from "@workspace/api-client-react";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";

const TIMEZONES = [
  "Europe/Dublin",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Lisbon",
  "America/New_York",
  "America/Los_Angeles",
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { refetch } = useBusiness();
  const { getToken } = useAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("Europe/Dublin");
  const [showTz, setShowTz] = useState(false);
  const [error, setError] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);

  const { mutateAsync: createBusiness, isPending } = useCreateBusiness();

  const handleSlugFromName = (v: string) => {
    setName(v);
    setSlug(
      v
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40),
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Business name and URL slug are required.");
      haptics.warning();
      return;
    }
    setError("");
    haptics.tap();
    try {
      await createBusiness({
        data: { name: name.trim(), slug: slug.trim(), phone, timezone },
      });
      await refetch();
      haptics.success();
      router.replace("/");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Failed to create business.");
      haptics.warning();
    }
  };

  const handleLoadDemo = async () => {
    setSeedLoading(true);
    setError("");
    haptics.impact();
    try {
      const token = await getToken();
      const apiBase = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
      const res = await fetch(`${apiBase}/api/dev/seed`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Seed failed");
      await refetch();
      haptics.success();
      router.replace("/");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Could not load demo data.");
      haptics.warning();
      setSeedLoading(false);
    }
  };

  const isLoading = isPending || seedLoading;

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input + "55", color: colors.foreground, borderColor: colors.border },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <AuroraHalo tone="ambient" size={500} style={{ top: -200, right: -100 }} intensity={0.6} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LiviaWordmark size="md" color={colors.foreground} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Set up your{"\n"}
            <Text style={[styles.titleItalic, { color: colors.mutedForeground }]}>
              command center.
            </Text>
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            One business, two minutes — Liv handles the rest.
          </Text>
        </View>

        {/* Demo shortcut */}
        <View
          style={[
            styles.demoBox,
            { backgroundColor: colors.card, borderColor: aurora.cyan + "40" },
            elevation.resting,
          ]}
        >
          <Text style={[styles.demoTitle, { color: colors.foreground }]}>
            Just exploring?
          </Text>
          <Text style={[styles.demoSub, { color: colors.mutedForeground }]}>
            Load 3 demo businesses — a hair salon, a tattoo studio, a personal trainer — all wired with real staff, clients, and bookings.
          </Text>
          <TouchableOpacity
            style={[
              styles.demoCta,
              {
                backgroundColor: colors.primary + "1f",
                borderColor: colors.primary + "66",
              },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleLoadDemo}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {seedLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={[styles.demoCtaText, { color: colors.primary }]}>
                Load demo workspace
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
            or set up your own
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Manual form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Business name</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Studio Luxe"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={handleSlugFromName}
              testID="business-name-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              URL slug{" "}
              <Text style={{ color: colors.primary, fontSize: 11, fontFamily: fonts.bodyMed }}>
                livia.io/b/{slug || "your-slug"}
              </Text>
            </Text>
            <TextInput
              style={inputStyle}
              placeholder="studio-luxe"
              placeholderTextColor={colors.mutedForeground}
              value={slug}
              onChangeText={(v) =>
                setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40))
              }
              autoCapitalize="none"
              testID="slug-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Phone</Text>
            <TextInput
              style={inputStyle}
              placeholder="+353 1 234 5678"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Timezone</Text>
            <Pressable
              style={[
                styles.input,
                styles.picker,
                { backgroundColor: colors.input + "55", borderColor: colors.border },
              ]}
              onPress={() => {
                haptics.selection();
                setShowTz(!showTz);
              }}
            >
              <Text style={{ color: colors.foreground, fontFamily: fonts.body, fontSize: 16 }}>
                {timezone}
              </Text>
            </Pressable>
            {showTz && (
              <View
                style={[
                  styles.tzList,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {TIMEZONES.map((tz) => (
                  <Pressable
                    key={tz}
                    style={({ pressed }) => [
                      styles.tzItem,
                      tz === timezone && { backgroundColor: colors.primary + "22" },
                      pressed && { backgroundColor: colors.primary + "10" },
                    ]}
                    onPress={() => {
                      haptics.selection();
                      setTimezone(tz);
                      setShowTz(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.tzText,
                        { color: tz === timezone ? colors.primary : colors.foreground },
                      ]}
                    >
                      {tz}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {error ? (
            <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] },
              isLoading && { opacity: 0.6 },
              elevation.floating,
            ]}
            onPress={handleCreate}
            disabled={isLoading}
            testID="create-business-button"
          >
            {isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
                Create business
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 22, gap: 22 },
  header: { gap: 8, marginTop: 4 },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  titleItalic: {
    fontFamily: fonts.serifMediumItalic,
    fontStyle: "italic",
  },
  sub: { ...type.body, fontSize: 15 },
  demoBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  demoTitle: { fontFamily: fonts.serifMedium, fontSize: 18 },
  demoSub: { ...type.body, fontSize: 13.5, lineHeight: 19 },
  demoCta: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  demoCtaText: { fontSize: 14.5, fontFamily: fonts.bodySemi, letterSpacing: 0.3 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { ...type.caption, fontSize: 12 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { ...type.label, fontSize: 13 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  picker: { justifyContent: "center" },
  tzList: { borderRadius: 12, borderWidth: 1, overflow: "hidden", marginTop: 4 },
  tzItem: { paddingHorizontal: 16, paddingVertical: 12 },
  tzText: { fontSize: 14, fontFamily: fonts.body },
  error: { ...type.body, fontSize: 13, textAlign: "center" },
  cta: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  ctaText: { fontSize: 16, fontFamily: fonts.bodySemi, letterSpacing: 0.3 },
});
