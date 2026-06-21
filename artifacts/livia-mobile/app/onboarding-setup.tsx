import {
  useGetBusiness,
  useListStaff,
  useListServices,
  useUpdateBusiness,
  useGetLivSetupGuidedFlow,
  useGetTenantCapabilities,
  UpdateBusinessBodyAiTone,
} from "@workspace/api-client-react";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { fetchTenantExperience } from "@/lib/tenant-experience";
import { verticalAccentHex } from "@/lib/vertical-theme";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import { getPublicBookingUrl, getPublicBookingLabel } from "@/lib/public-booking-url";
import {
  blockingOnboardingPercent,
  isOnboardingAppUnlocked,
  menuActivationLabel,
  type OnboardingActId,
  type OnboardingState,
} from "@workspace/policy";
import {
  completeBlockingAct,
  DEFAULT_WEEKDAY_HOURS,
  nextBlockingAct,
  type AvailRule,
} from "@/lib/onboarding-blocking";
import { customFetch } from "@workspace/api-client-react";
import { CrossSurfaceContinueCard } from "@/components/CrossSurfaceContinueCard";
import { SetupGuidedFlowCard } from "@/components/SetupGuidedFlowCard";
import { useOnboardingCapabilitySync } from "@/lib/onboarding-capability-sync";

const ACT_LABELS: Partial<Record<OnboardingActId, string>> = {
  a2_shop_profile: "Location profile",
  a3_service_menu: "Service menu",
  a5_hours: "Opening hours",
  a6_liv: "Liv voice & booking",
  a8_public_link: "Public booking link",
};

export default function OnboardingSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { getToken } = useAuth();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const slug = currentBusiness?.slug;

  const { data: biz, isLoading, refetch } = useGetBusiness(bid, {
    query: { enabled: !!bid },
  } as never);
  const { mutateAsync: patchBusiness } = useUpdateBusiness();
  const { data: staffList } = useListStaff(bid, { query: { enabled: !!bid } } as never);
  const { data: servicesList } = useListServices(bid, { query: { enabled: !!bid } } as never);

  const state = (biz as { onboardingState?: OnboardingState } | undefined)?.onboardingState;
  const bizMeta = biz as {
    vertical?: string;
    category?: string;
    name?: string;
    phone?: string;
    city?: string;
    description?: string;
    aiEnabled?: string;
    aiTone?: string;
    aiGreeting?: string;
  } | undefined;
  const vertical = bizMeta?.vertical ?? null;
  const vocab = verticalPackUi(bizMeta?.vertical, bizMeta?.category);
  const accent = verticalAccentHex(bizMeta?.vertical, bizMeta?.category);

  const [experience, setExperience] = useState<Awaited<ReturnType<typeof fetchTenantExperience>> | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiTone, setAiTone] = useState("FRIENDLY");
  const [aiGreeting, setAiGreeting] = useState("");
  const [avail, setAvail] = useState<AvailRule[] | null>(null);

  const { data: guidedFlow } = useGetLivSetupGuidedFlow(bid, {
    query: { enabled: !!bid } as never,
  });
  const { data: tenantCapabilities } = useGetTenantCapabilities(bid, {
    query: { enabled: !!bid } as never,
  });
  useOnboardingCapabilitySync(bid, tenantCapabilities?.onboardingAutoAdvanced);

  const readinessHints = (guidedFlow?.readinessActHints ?? []) as OnboardingActId[];
  const currentAct = useMemo(
    () => nextBlockingAct(state, readinessHints, vertical),
    [state, readinessHints, vertical],
  );
  const blockingPct = blockingOnboardingPercent(state?.completedActs ?? [], vertical);
  const appUnlocked = isOnboardingAppUnlocked(state, vertical);
  const serviceCount = servicesList?.length ?? 0;
  const menuActLabel = menuActivationLabel(vertical);

  const publicUrl = slug ? getPublicBookingUrl(slug) : null;

  useEffect(() => {
    if (!bid) return;
    void fetchTenantExperience(bid, getToken).then(setExperience);
  }, [bid, getToken]);

  useEffect(() => {
    if (!bizMeta) return;
    setName(bizMeta.name ?? "");
    setPhone(bizMeta.phone ?? "");
    setCity(bizMeta.city ?? "");
    setDescription(bizMeta.description ?? "");
    setAiEnabled(String(bizMeta.aiEnabled ?? "true") !== "false");
    setAiTone(String(bizMeta.aiTone ?? "FRIENDLY").toUpperCase());
    setAiGreeting(String(bizMeta.aiGreeting ?? ""));
  }, [bizMeta?.name, bizMeta?.phone]);

  useEffect(() => {
    if (!bid || currentAct !== "a5_hours") return;
    void customFetch<AvailRule[]>(`/api/businesses/${bid}/availability`)
      .then(setAvail)
      .catch(() => setAvail([]));
  }, [bid, currentAct]);

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

  async function saveShopAndContinue() {
    setSaving(true);
    try {
      await patchBusiness({
        businessId: bid,
        data: {
          name: name.trim() || undefined,
          phone: phone || undefined,
          city: city || undefined,
          description: description || undefined,
        },
      });
      await completeBlockingAct(bid, "a2_shop_profile", state, undefined, vertical);
      haptics.success();
      await refetch();
    } catch {
      haptics.warning();
    } finally {
      setSaving(false);
    }
  }

  async function saveDefaultHoursAndContinue() {
    setSaving(true);
    try {
      const staffId = staffList?.[0]?.id;
      const rules = avail && avail.length > 0 ? avail : DEFAULT_WEEKDAY_HOURS;
      await customFetch(`/api/businesses/${bid}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules, staffId }),
      });
      await completeBlockingAct(bid, "a5_hours", state, { hoursConfirmed: true }, vertical);
      haptics.success();
      await refetch();
    } catch {
      haptics.warning();
    } finally {
      setSaving(false);
    }
  }

  async function saveLivAndContinue() {
    setSaving(true);
    try {
      await patchBusiness({
        businessId: bid,
        data: {
          aiEnabled: aiEnabled ? "true" : "false",
          aiTone: aiTone as UpdateBusinessBodyAiTone,
          aiGreeting: aiGreeting || undefined,
        },
      });
      await completeBlockingAct(bid, "a6_liv", state, { livEnabled: aiEnabled }, vertical);
      haptics.success();
      await refetch();
    } catch {
      haptics.warning();
    } finally {
      setSaving(false);
    }
  }

  async function confirmServiceMenu() {
    setSaving(true);
    try {
      await completeBlockingAct(
        bid,
        "a3_service_menu",
        state,
        { servicesConfirmed: true },
        vertical,
      );
      haptics.success();
      await refetch();
    } catch {
      haptics.warning();
    } finally {
      setSaving(false);
    }
  }

  async function confirmPublicLink() {
    setSaving(true);
    try {
      await completeBlockingAct(bid, "a8_public_link", state, { publicLinkShared: true }, vertical);
      haptics.success();
      await refetch();
    } catch {
      haptics.warning();
    } finally {
      setSaving(false);
    }
  }

  const headline =
    experience?.onboarding.welcomeHeadline ??
    `Set up your ${vocab.locationNoun.toLowerCase()}`;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      bottomOffset={insets.bottom + 24}
      extraKeyboardSpace={20}
    >
      <Text style={[styles.pack, { color: accent }]}>{vocab.label}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{headline}</Text>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        {blockingPct}% essentials · complete on mobile
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${blockingPct}%`, backgroundColor: accent }]} />
      </View>

      <SetupGuidedFlowCard
        businessId={bid}
        onboardingState={state}
        vertical={bizMeta?.vertical}
        slug={slug}
        sacredMetricMet={state?.checklist?.testBooking === true}
      />

      {isLoading ? (
        <ActivityIndicator color={accent} style={{ marginVertical: 32 }} />
      ) : appUnlocked ? (
        <View style={{ gap: 12, marginTop: 16 }}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
            Essentials complete
          </Text>
          <Pressable
            style={[styles.btn, { backgroundColor: accent }]}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.btnText}>Enter Livia</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/onboarding-continue")}>
            <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
              View activation checklist
            </Text>
          </Pressable>
          <CrossSurfaceContinueCard businessId={bid} variant="appearance" />
        </View>
      ) : (
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            {currentAct === "a3_service_menu" ? menuActLabel : ACT_LABELS[currentAct] ?? currentAct}
          </Text>

          {currentAct === "a2_shop_profile" ? (
            <View style={{ gap: 10 }}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                {vocab.locationNoun} name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your brand and area"
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+353 …"
                keyboardType="phone-pad"
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.label, { color: colors.mutedForeground }]}>City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea, { color: colors.foreground, borderColor: colors.border }]}
                placeholderTextColor={colors.mutedForeground}
              />
              <Pressable
                style={[styles.btn, { backgroundColor: accent, opacity: saving ? 0.6 : 1 }]}
                disabled={saving || !name.trim()}
                onPress={() => void saveShopAndContinue()}
              >
                <Text style={styles.btnText}>{saving ? "Saving…" : "Save & continue"}</Text>
              </Pressable>
            </View>
          ) : null}

          {currentAct === "a3_service_menu" ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20 }}>
                {serviceCount > 0
                  ? `${serviceCount} ${vocab.serviceNoun.toLowerCase()}(s) on your menu. Confirm or edit on web.`
                  : `Add your ${vocab.serviceNoun.toLowerCase()} menu — fastest on web.`}
              </Text>
              <Pressable
                style={[styles.btnOutline, { borderColor: accent }]}
                onPress={() => void Linking.openURL(`${getDashboardBaseUrl()}/services`)}
              >
                <Text style={{ color: accent, fontWeight: "600" }}>Edit menu on web</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, { backgroundColor: accent, opacity: saving || serviceCount === 0 ? 0.6 : 1 }]}
                disabled={saving || serviceCount === 0}
                onPress={() => void confirmServiceMenu()}
              >
                <Text style={styles.btnText}>{saving ? "Saving…" : "Menu looks good"}</Text>
              </Pressable>
            </View>
          ) : null}

          {currentAct === "a5_hours" ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20 }}>
                {avail && avail.length > 0
                  ? `${avail.length} rules on file. Confirm or apply Mon–Fri 9am–5pm.`
                  : "No hours yet — we'll add Mon–Fri 9am–5pm for your team."}
              </Text>
              <Pressable
                style={[styles.btn, { backgroundColor: accent, opacity: saving ? 0.6 : 1 }]}
                disabled={saving}
                onPress={() => void saveDefaultHoursAndContinue()}
              >
                <Text style={styles.btnText}>{saving ? "Saving…" : "Confirm hours"}</Text>
              </Pressable>
            </View>
          ) : null}

          {currentAct === "a6_liv" ? (
            <View style={{ gap: 10 }}>
              <View style={styles.row}>
                <Text style={{ color: colors.foreground }}>Liv enabled</Text>
                <Switch value={aiEnabled} onValueChange={setAiEnabled} />
              </View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Greeting</Text>
              <TextInput
                value={aiGreeting}
                onChangeText={setAiGreeting}
                multiline
                placeholder={`Hi! I'm Liv, assistant for ${name || "your team"}…`}
                style={[styles.input, styles.textArea, { color: colors.foreground, borderColor: colors.border }]}
                placeholderTextColor={colors.mutedForeground}
              />
              <Pressable
                style={[styles.btn, { backgroundColor: accent, opacity: saving ? 0.6 : 1 }]}
                disabled={saving}
                onPress={() => void saveLivAndContinue()}
              >
                <Text style={styles.btnText}>{saving ? "Saving…" : "Save Liv & continue"}</Text>
              </Pressable>
            </View>
          ) : null}

          {currentAct === "a8_public_link" ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20 }}>
                Your booking page is live{slug ? ` at ${getPublicBookingLabel(slug)}` : ""}. Open it to test, then continue.
              </Text>
              {publicUrl ? (
                <Pressable
                  style={[styles.btnOutline, { borderColor: accent }]}
                  onPress={() => void Linking.openURL(publicUrl)}
                >
                  <Text style={{ color: accent, fontWeight: "600" }}>Open booking page</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.btn, { backgroundColor: accent, opacity: saving ? 0.6 : 1 }]}
                disabled={saving}
                onPress={() => void confirmPublicLink()}
              >
                <Text style={styles.btnText}>{saving ? "Saving…" : "I've checked my link"}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      <CrossSurfaceContinueCard businessId={bid} variant="onboarding" />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  pack: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 24, fontWeight: "700", marginTop: 4 },
  meta: { fontSize: 14, marginTop: 8, marginBottom: 12 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(128,128,128,0.25)", overflow: "hidden", marginBottom: 16 },
  progressFill: { height: "100%", borderRadius: 3 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  stepTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "500" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  textArea: { minHeight: 72, textAlignVertical: "top" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  btn: { borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8 },
  btnOutline: { borderRadius: 10, padding: 14, alignItems: "center", borderWidth: 1 },
  btnText: { color: "#fff", fontWeight: "600" },
});
