import { useCreateBusiness } from "@workspace/api-client-react";
import { useAuth } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refetch } = useBusiness();
  const { getToken } = useAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
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
        .slice(0, 40)
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Business name and URL slug are required.");
      return;
    }
    setError("");
    try {
      await createBusiness({
        data: { name: name.trim(), slug: slug.trim(), phone, timezone },
      });
      await refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Failed to create business.");
    }
  };

  const handleLoadDemo = async () => {
    setSeedLoading(true);
    setError("");
    try {
      const token = await getToken();
      const apiBase = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
      const res = await fetch(`${apiBase}/api/dev/seed`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Seed failed");
      await refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Could not load demo data.");
      setSeedLoading(false);
    }
  };

  const isLoading = isPending || seedLoading;

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Set up your business
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            You're almost ready to manage appointments with Livia.
          </Text>
        </View>

        {/* ── Demo shortcut ──────────────────────────────────────────── */}
        <View style={[styles.demoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.demoTitle, { color: colors.foreground }]}>
            ✦  Just exploring?
          </Text>
          <Text style={[styles.demoSub, { color: colors.mutedForeground }]}>
            Load 3 demo businesses instantly — a hair salon, a tattoo studio, and a personal training gym — each with real staff, clients, and bookings.
          </Text>
          <TouchableOpacity
            style={[
              styles.demoCta,
              { backgroundColor: colors.primary + "18", borderColor: colors.primary + "55" },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleLoadDemo}
            disabled={isLoading}
            activeOpacity={0.8}
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
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or set up your own</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* ── Manual form ────────────────────────────────────────────── */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Business name *</Text>
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
              URL slug *{" "}
              <Text style={{ color: colors.primary, fontSize: 11 }}>
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
              placeholder="+1 555 000 0000"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Timezone</Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.picker,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
              onPress={() => setShowTz(!showTz)}
            >
              <Text style={{ color: colors.foreground, fontFamily: "Inter_400Regular", fontSize: 16 }}>
                {timezone}
              </Text>
            </TouchableOpacity>
            {showTz && (
              <View style={[styles.tzList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {TIMEZONES.map((tz) => (
                  <TouchableOpacity
                    key={tz}
                    style={[
                      styles.tzItem,
                      tz === timezone && { backgroundColor: colors.primary + "22" },
                    ]}
                    onPress={() => { setTimezone(tz); setShowTz(false); }}
                  >
                    <Text
                      style={[
                        styles.tzText,
                        { color: tz === timezone ? colors.primary : colors.foreground },
                      ]}
                    >
                      {tz}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {error ? (
            <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.primary }, isLoading && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={isLoading}
            activeOpacity={0.85}
            testID="create-business-button"
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Create Business</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 24, gap: 24 },
  header: { gap: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  demoBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  demoTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  demoSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  demoCta: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 2,
  },
  demoCtaText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  picker: { justifyContent: "center" },
  tzList: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 4,
  },
  tzItem: { paddingHorizontal: 16, paddingVertical: 12 },
  tzText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  error: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  cta: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
