/**
 * Customer-facing public booking (direct link) — no Clerk required.
 * Parity with dashboard /b/:slug for demo and on-device testing.
 */
import {
  useCreatePublicBooking,
  useGetPublicBusiness,
  useGetPublicSlots,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import {
  guessMedspaProcedureCode,
  publicCareNotes,
} from "@/lib/public-booking-helpers";
import { resolvePublicExperience } from "@/lib/public-experience";
import {
  BEAUTY_LIGHT_PUBLIC_COLORS,
  beautyPublicHeroTagline,
  beautyPublicUseGrid,
  isBeautyLightPreset,
  isBeautyPublicSurface,
} from "@/lib/beauty-public";
import { resolvePresentationMobileColors } from "@/lib/presentation-preset-colors";

type Step = "services" | "slots" | "details" | "consent" | "done";

type MedspaProcedure = {
  code: string;
  label: string;
  summary?: string;
  risks?: string[];
};

function formatMoney(minor: number, currency: string) {
  if (minor === 0) return "Free";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);
}

export default function PublicBookScreen() {
  const colors = useColors();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const sl = slug ?? "";

  const [step, setStep] = useState<Step>("services");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [slot, setSlot] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [medspaProcedure, setMedspaProcedure] = useState("");
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [consentSignature, setConsentSignature] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: biz, isLoading } = useGetPublicBusiness(sl, {
    query: { enabled: !!sl } as any,
  });

  const selectedService = useMemo(
    () => (biz as any)?.services?.find((s: { id: string }) => s.id === serviceId),
    [biz, serviceId],
  );

  const { data: slotsData, isLoading: slotsLoading } = useGetPublicSlots(
    sl,
    { serviceId: serviceId ?? "", date, staffId: staffId || undefined },
    { query: { enabled: !!sl && !!serviceId && step === "slots" } as any },
  );

  const createBooking = useCreatePublicBooking();

  const availableSlots =
    ((slotsData as { slots?: { startAt: string; available: boolean }[] })?.slots ?? []).filter(
      (s) => s.available,
    );

  const bEarly = biz as { vertical?: string; medspaProcedures?: MedspaProcedure[] } | undefined;
  const needsMedspaConsent =
    bEarly?.vertical === "medspa" && (bEarly.medspaProcedures?.length ?? 0) > 0;

  useEffect(() => {
    if (step !== "consent" || !selectedService || !bEarly?.medspaProcedures?.length) return;
    if (medspaProcedure) return;
    setMedspaProcedure(
      guessMedspaProcedureCode(selectedService.name, bEarly.medspaProcedures),
    );
  }, [step, selectedService, bEarly?.medspaProcedures, medspaProcedure]);

  async function submit() {
    setErr(null);
    if (!serviceId || !slot || !firstName.trim()) return;
    if (!email.trim() && !phone.trim()) {
      setErr("Add email or phone so we can reach you.");
      return;
    }
    if (
      needsMedspaConsent &&
      (!medspaProcedure || !consentAgreed || !consentSignature.trim())
    ) {
      setErr("Complete treatment consent before confirming.");
      return;
    }
    try {
      await createBooking.mutateAsync({
        slug: sl,
        data: {
          serviceId,
          staffId: staffId || undefined,
          startAt: slot,
          customerFirstName: firstName.trim(),
          customerEmail: email.trim() || undefined,
          customerPhone: phone.trim() || undefined,
          ...(needsMedspaConsent
            ? {
                medspaConsent: {
                  procedureCode: medspaProcedure,
                  signatureName: consentSignature.trim(),
                },
              }
            : {}),
        } as any,
      });
      setStep("done");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Booking failed");
    }
  }

  if (!sl) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Missing business slug</Text>
      </SafeAreaView>
    );
  }

  if (isLoading || !biz) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  const b = biz as any;
  const xp = resolvePublicExperience({
    vertical: b.vertical,
    category: b.category,
    country: b.country,
    experienceSkin: b.experienceSkin,
  });
  const cssPreset = b.experienceSkin?.presentation as string | undefined;
  const beautyPublic = isBeautyPublicSurface(b.vertical, cssPreset);
  const beautyGrid = beautyPublicUseGrid(cssPreset);
  const presetTint = resolvePresentationMobileColors(
    cssPreset,
    b.experienceSkin?.brandAccentHex,
  );
  const lightPublic =
    beautyPublic && isBeautyLightPreset(cssPreset)
      ? BEAUTY_LIGHT_PUBLIC_COLORS[cssPreset as keyof typeof BEAUTY_LIGHT_PUBLIC_COLORS]
      : null;
  const surface = {
    ...colors,
    ...(lightPublic?.background ?? presetTint.background
      ? { background: lightPublic?.background ?? presetTint.background }
      : {}),
    ...(lightPublic?.foreground ? { foreground: lightPublic.foreground } : {}),
    ...(lightPublic?.card ?? presetTint.card ? { card: lightPublic?.card ?? presetTint.card } : {}),
    ...(lightPublic?.primary ?? presetTint.primary
      ? { primary: lightPublic?.primary ?? presetTint.primary, tint: lightPublic?.primary ?? presetTint.primary }
      : {}),
    ...(lightPublic?.border ?? presetTint.border
      ? { border: lightPublic?.border ?? presetTint.border }
      : {}),
    ...(lightPublic?.mutedForeground ?? presetTint.mutedForeground
      ? { mutedForeground: lightPublic?.mutedForeground ?? presetTint.mutedForeground }
      : {}),
  };
  const pb = b.countryPack?.publicBooking;
  const chooseServiceTitle = pb?.chooseService ?? "Choose a service";
  const confirmLabel = pb?.confirmBooking ?? "Confirm booking";
  const bookCta = b.publicCta ?? "Book now";
  const services = (b.services ?? []) as Array<{
    id: string;
    name: string;
    durationMinutes: number;
    priceMinor: number;
    currency: string;
    imageUrl?: string | null;
  }>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: surface.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!beautyPublic || step !== "services" ? (
          b.coverImageUrl ? (
            <Image source={{ uri: b.coverImageUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, { backgroundColor: xp.hero }]} />
          )
        ) : null}
        <View style={styles.body}>
          {xp.marketRibbon ? (
            <Text style={[type.eyebrow, { color: xp.primary, marginBottom: 6 }]}>
              {xp.marketRibbon}
            </Text>
          ) : null}
          {beautyPublic && step === "services" ? (
            <View style={styles.beautyBrand}>
              {b.logoUrl ? (
                <Image source={{ uri: b.logoUrl }} style={styles.beautyLogo} />
              ) : (
                <View style={[styles.beautyLogo, { backgroundColor: surface.primary + "22" }]} />
              )}
              <Text
                style={[
                  type.serifSm,
                  styles.beautyBrandName,
                  { color: surface.foreground, fontFamily: xp.titleFontFamily },
                ]}
              >
                {b.name.toUpperCase()}
              </Text>
              <Text style={[type.eyebrow, { color: surface.primary, letterSpacing: 3 }]}>
                {beautyPublicHeroTagline(cssPreset)}
              </Text>
              <Text
                style={[
                  type.serifSm,
                  { color: surface.foreground, fontFamily: xp.titleFontFamily, marginTop: 16, fontSize: 26 },
                ]}
              >
                Book a treatment
              </Text>
            </View>
          ) : (
            <Text style={[type.title, { color: surface.foreground, fontFamily: xp.titleFontFamily }]}>
              {b.name}
            </Text>
          )}
          {b.socialProof ? (
            <View style={{ marginTop: 8, gap: 6 }}>
              <Text style={[type.caption, { color: colors.mutedForeground }]}>
                ★ {b.socialProof.rating} · {b.socialProof.reviewCount}+ reviews
              </Text>
              {(b.socialProof.highlights as string[] | undefined)?.slice(0, 2).map((h: string) => (
                <Text key={h} style={[type.caption, { color: colors.mutedForeground }]}>
                  · {h}
                </Text>
              ))}
            </View>
          ) : null}
          {b.policyTrust?.depositSummary ? (
            <Text style={[type.caption, { color: xp.primary, marginTop: 8 }]}>
              {b.policyTrust.depositSummary}
            </Text>
          ) : null}
          {b.city ? (
            <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 4 }]}>
              {b.city}
            </Text>
          ) : null}
          {b.description ? (
            <Text style={[type.body, { color: colors.mutedForeground, marginTop: 8 }]}>
              {b.description}
            </Text>
          ) : null}
          {step === "services" && publicCareNotes(b.vertical).length > 0 ? (
            <View style={[styles.careBox, { borderColor: colors.border, borderRadius: xp.cardRadius }]}>
              {publicCareNotes(b.vertical).map((note) => (
                <Text key={note} style={[type.caption, { color: colors.mutedForeground, marginTop: 4 }]}>
                  · {note}
                </Text>
              ))}
            </View>
          ) : null}

          {step === "done" ? (
            <View style={styles.doneBox}>
              <Feather name="check-circle" size={40} color={xp.primary} />
              <Text style={[type.title, { color: colors.foreground, marginTop: 12, fontSize: 22 }]}>You're booked</Text>
              <Text style={[type.body, { color: colors.mutedForeground, marginTop: 8, textAlign: "center" }]}>
                We'll confirm by message if needed. See you soon.
              </Text>
            </View>
          ) : null}

          {step === "services" ? (
            <>
              {!beautyPublic ? (
                <Text style={[type.label, { color: surface.mutedForeground, marginTop: 20, marginBottom: 8 }]}>
                  {chooseServiceTitle}
                </Text>
              ) : null}
              {beautyPublic && beautyGrid ? (
                <View style={styles.beautyGrid}>
                  {services.slice(0, 4).map((svc) => (
                    <Pressable
                      key={svc.id}
                      style={[styles.beautyCard, { borderColor: surface.border, backgroundColor: surface.card }]}
                      onPress={() => {
                        setServiceId(svc.id);
                        setStep("slots");
                      }}
                    >
                      {svc.imageUrl ? (
                        <Image source={{ uri: svc.imageUrl }} style={styles.beautyCardImage} />
                      ) : (
                        <View style={[styles.beautyCardImage, { backgroundColor: surface.border }]} />
                      )}
                      <View style={styles.beautyCardBody}>
                        <Text
                          style={[
                            type.serifSm,
                            { color: surface.foreground, fontFamily: xp.titleFontFamily, fontSize: 15 },
                          ]}
                        >
                          {svc.name}
                        </Text>
                        <Text style={[type.eyebrow, { color: surface.mutedForeground, marginTop: 4 }]}>
                          FROM
                        </Text>
                        <Text style={[type.serifSm, { color: surface.primary, fontSize: 17 }]}>
                          {formatMoney(svc.priceMinor, svc.currency)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : beautyPublic ? (
                services.map((svc) => (
                  <Pressable
                    key={svc.id}
                    style={[
                      styles.card,
                      { borderColor: surface.border, borderRadius: 6, paddingVertical: 16 },
                    ]}
                    onPress={() => {
                      setServiceId(svc.id);
                      setStep("slots");
                    }}
                  >
                    <Text
                      style={[
                        type.serifSm,
                        { color: surface.foreground, fontFamily: xp.titleFontFamily, fontSize: 17 },
                      ]}
                    >
                      {svc.name}
                    </Text>
                    <Text style={[type.caption, { color: surface.primary, marginTop: 6 }]}>
                      From {formatMoney(svc.priceMinor, svc.currency)}
                    </Text>
                  </Pressable>
                ))
              ) : (
                services.map((svc) => (
                  <Pressable
                    key={svc.id}
                    style={[styles.card, { borderColor: surface.border }]}
                    onPress={() => {
                      setServiceId(svc.id);
                      setStep("slots");
                    }}
                  >
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      {svc.imageUrl ? (
                        <Image source={{ uri: svc.imageUrl }} style={styles.serviceThumb} />
                      ) : null}
                      <View style={{ flex: 1 }}>
                        <Text style={[type.label, { color: surface.foreground, fontSize: 15 }]}>
                          {svc.name}
                        </Text>
                        <Text style={[type.caption, { color: surface.mutedForeground, marginTop: 4 }]}>
                          {svc.durationMinutes} min · {formatMoney(svc.priceMinor, svc.currency)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
              {beautyPublic ? (
                <View style={styles.beautyDualCta}>
                  <Pressable
                    style={[styles.beautyOutlineBtn, { borderColor: surface.primary }]}
                    onPress={() => {
                      const first = services[0];
                      if (first) {
                        setServiceId(first.id);
                        setStep("slots");
                      }
                    }}
                  >
                    <Text style={{ color: surface.foreground, fontSize: 13, fontWeight: "600" }}>
                      {bookCta}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: surface.primary, flex: 1, marginTop: 0 }]}
                    onPress={() => {
                      const first = services[0];
                      if (first) {
                        setServiceId(first.id);
                        setStep("slots");
                      }
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Book now</Text>
                  </Pressable>
                </View>
              ) : null}
              {beautyPublic ? (
                <Text style={[type.caption, { color: surface.mutedForeground, textAlign: "center", marginTop: 16 }]}>
                  No login required · Secure booking · Free cancellation 24h
                </Text>
              ) : null}
            </>
          ) : null}

          {step === "slots" && selectedService ? (
            <>
              <Pressable onPress={() => setStep("services")} style={styles.back}>
                <Feather name="chevron-left" size={18} color={xp.primary} />
                <Text style={{ color: xp.primary }}>Back</Text>
              </Pressable>
              <Text style={[type.serifSm, { color: colors.foreground, fontFamily: xp.titleFontFamily }]}>
                {selectedService.name}
              </Text>
              {(b.staff?.length ?? 0) > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
                  <Pressable
                    style={[
                      styles.chip,
                      { borderColor: colors.border },
                      !staffId && { borderColor: xp.primary, backgroundColor: xp.primary + "18" },
                    ]}
                    onPress={() => setStaffId("")}
                  >
                    <Text style={[styles.chipText, { color: colors.foreground }]}>Any</Text>
                  </Pressable>
                  {b.staff.map((s: { id: string; displayName: string }) => (
                    <Pressable
                      key={s.id}
                      style={[
                        styles.chip,
                        { borderColor: colors.border },
                        staffId === s.id && {
                          borderColor: xp.primary,
                          backgroundColor: xp.primary + "18",
                        },
                      ]}
                      onPress={() => setStaffId(s.id)}
                    >
                      <Text style={[styles.chipText, { color: colors.foreground }]}>
                        {s.displayName.split(" ")[0]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              />
              {slotsLoading ? (
                <ActivityIndicator color={xp.primary} style={{ marginTop: 16 }} />
              ) : (
                <View style={styles.slotGrid}>
                  {availableSlots.map((s) => (
                    <Pressable
                      key={s.startAt}
                      style={[
                        styles.slotBtn,
                        { borderColor: colors.border, borderRadius: xp.cardRadius - 4 },
                      ]}
                      onPress={() => {
                        setSlot(s.startAt);
                        setStep("details");
                      }}
                    >
                      <Text style={{ color: colors.foreground, fontSize: 13 }}>
                        {new Date(s.startAt).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          ) : null}

          {step === "details" ? (
            <>
              <Pressable onPress={() => setStep("slots")} style={styles.back}>
                <Feather name="chevron-left" size={18} color={xp.primary} />
                <Text style={{ color: xp.primary }}>Back</Text>
              </Pressable>
              <Text style={[type.label, { color: colors.mutedForeground, marginBottom: 8 }]}>
                {pb?.yourDetails ?? "Your details"}
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name *"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone"
                keyboardType="phone-pad"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              />
              {err ? <Text style={{ color: "#f87171", marginTop: 8 }}>{err}</Text> : null}
              <Pressable
                style={[
                  styles.primaryBtn,
                  { backgroundColor: xp.primary, borderRadius: xp.cardRadius },
                ]}
                onPress={() => {
                  setErr(null);
                  if (!firstName.trim()) {
                    setErr("First name is required.");
                    return;
                  }
                  if (!email.trim() && !phone.trim()) {
                    setErr("Add email or phone so we can reach you.");
                    return;
                  }
                  if (needsMedspaConsent) setStep("consent");
                  else void submit();
                }}
              >
                <Text style={styles.primaryBtnText}>
                  {needsMedspaConsent ? "Continue to consent" : confirmLabel}
                </Text>
              </Pressable>
              <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 12, textAlign: "center" }]}>
                {bookCta} · {b.name}
              </Text>
            </>
          ) : null}

          {step === "consent" && needsMedspaConsent && selectedService ? (
            <>
              <Pressable onPress={() => setStep("details")} style={styles.back}>
                <Feather name="chevron-left" size={18} color={xp.primary} />
                <Text style={{ color: xp.primary }}>Back</Text>
              </Pressable>
              <Text style={[type.label, { color: colors.foreground, fontSize: 17, marginBottom: 8 }]}>
                Treatment consent
              </Text>
              <Text style={[type.caption, { color: colors.mutedForeground, marginBottom: 12 }]}>
                Required for medspa bookings — review risks and sign below.
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {(b.medspaProcedures as MedspaProcedure[]).map((p) => (
                  <Pressable
                    key={p.code}
                    onPress={() => setMedspaProcedure(p.code)}
                    style={[
                      styles.chip,
                      { borderColor: colors.border },
                      medspaProcedure === p.code && {
                        borderColor: xp.primary,
                        backgroundColor: xp.primary + "18",
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{p.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              {medspaProcedure ? (
                <View style={[styles.careBox, { borderColor: colors.border, borderRadius: xp.cardRadius }]}>
                  <Text style={[type.body, { color: colors.foreground }]}>
                    {(b.medspaProcedures as MedspaProcedure[]).find((p) => p.code === medspaProcedure)
                      ?.summary ?? ""}
                  </Text>
                  {(
                    (b.medspaProcedures as MedspaProcedure[]).find((p) => p.code === medspaProcedure)
                      ?.risks ?? []
                  ).map((r) => (
                    <Text key={r} style={[type.caption, { color: colors.mutedForeground, marginTop: 6 }]}>
                      · {r}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View style={[styles.consentRow, { marginTop: 16 }]}>
                <Switch
                  value={consentAgreed}
                  onValueChange={setConsentAgreed}
                  trackColor={{ false: colors.border, true: xp.primary }}
                />
                <Text style={[type.caption, { color: colors.foreground, flex: 1, marginLeft: 10 }]}>
                  I have read the information and agree to proceed with this treatment.
                </Text>
              </View>
              <TextInput
                value={consentSignature}
                onChangeText={setConsentSignature}
                placeholder="Full legal name (signature)"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              />
              {err ? <Text style={{ color: "#f87171", marginTop: 8 }}>{err}</Text> : null}
              <Pressable
                style={[
                  styles.primaryBtn,
                  { backgroundColor: xp.primary, borderRadius: xp.cardRadius },
                  (createBooking.isPending ||
                    !medspaProcedure ||
                    !consentAgreed ||
                    !consentSignature.trim()) && { opacity: 0.5 },
                ]}
                onPress={() => void submit()}
                disabled={
                  createBooking.isPending ||
                  !medspaProcedure ||
                  !consentAgreed ||
                  !consentSignature.trim()
                }
              >
                <Text style={styles.primaryBtnText}>
                  {createBooking.isPending ? "Booking…" : confirmLabel}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  cover: { width: "100%", height: 160 },
  body: { padding: 16 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  serviceThumb: { width: 56, height: 56, borderRadius: 8 },
  back: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 16, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  slotBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: { color: "#0f172a", fontWeight: "600", fontSize: 16 },
  doneBox: { alignItems: "center", marginTop: 32, paddingHorizontal: 16 },
  careBox: { borderWidth: 1, padding: 12, marginTop: 12 },
  consentRow: { flexDirection: "row", alignItems: "center" },
  beautyBrand: { alignItems: "center", paddingTop: 8, paddingBottom: 8 },
  beautyLogo: { width: 56, height: 56, borderRadius: 28, marginBottom: 10 },
  beautyBrandName: { fontSize: 22, letterSpacing: 4, textAlign: "center" },
  beautyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
    justifyContent: "space-between",
  },
  beautyCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  beautyCardImage: { width: "100%", height: 88 },
  beautyCardBody: { padding: 10 },
  beautyDualCta: { flexDirection: "row", gap: 10, marginTop: 20 },
  beautyOutlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
