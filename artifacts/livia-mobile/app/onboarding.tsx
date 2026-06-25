import {
  useCreateBusiness,
  type BusinessVertical,
  type CreateBusinessBodyJurisdiction,
} from "@workspace/api-client-react";
import { ApiError } from "@workspace/api-client-react";
import { fetchMeProfile } from "@/lib/platform-legal";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextStyle,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LivPulse } from "@/components/brand/LivPulse";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { SPRING_QUICK } from "@/constants/motion";
import { fonts, type } from "@/constants/typography";
import { useAuth } from "@clerk/clerk-expo";
import { asHref } from "@/lib/navigation";
import { useBusiness } from "@/contexts/BusinessContext";
import { getApiBaseUrl } from "@/lib/api-base";
import { seedDevWorkspace } from "@/lib/seed-demo";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { isDemoLoginEnabled } from "@/hooks/usePersona";
import {
  fetchOnboardingCatalog,
  tierOptionsFromCatalog,
  type OnboardingCatalog,
} from "@/lib/onboarding-catalog";
import { fetchOnboardingPreview } from "@/lib/onboarding-preview";
import { getPublicBookingLabel } from "@/lib/public-booking-url";
import { verticalAccentHex } from "@/lib/vertical-theme";
import {
  getVerticalStarterPackOffer,
  getVerticalPlaybook,
  verticalStarterPackIncludesRetail,
  LIVIA_FORM_EXAMPLES,
} from "@workspace/policy";

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

const { width: SCREEN_W } = Dimensions.get("window");

interface SlideMeta {
  eyebrow: string;
  title: string;
  italic: string;
  body: string;
}

const SLIDES: SlideMeta[] = [
  {
    eyebrow: "MEET LIV",
    title: "Your day,",
    italic: "already handled.",
    body: "Liv answers, books, reschedules, follows up — so the chair stays full and your phone stays quiet.",
  },
  {
    eyebrow: "ONE CALM HOME",
    title: "Schedule, clients,",
    italic: "and the AI — together.",
    body: "Replace four apps with one operations partner that actually understands appointment-based work.",
  },
];

const FORM_PAGE = SLIDES.length;

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { getToken, isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { refetch, setCurrentBusiness, businesses, isLoading: bizLoading, isDemoAccount } =
    useBusiness();
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const isSecondShop = intent === "second-shop";

  // Demo / returning users already have tenants — never trap them on create-business.
  useEffect(() => {
    if (bizLoading || isSecondShop) return;
    if (businesses.length > 0) {
      router.replace("/(tabs)");
      return;
    }
    if (isDemoAccount) router.replace("/(tabs)");
  }, [bizLoading, businesses.length, isSecondShop, isDemoAccount, router]);

  useEffect(() => {
    if (bizLoading || isSecondShop || isDemoAccount) return;
    void fetchMeProfile().then((me) => {
      if (!me.platformLegalAccepted) router.replace("/legal-acceptance");
    });
  }, [bizLoading, isSecondShop, isDemoAccount, router]);

  const listRef = useRef<FlatList<SlideMeta>>(null);
  // New founders land on the setup form — business type, team size, country, etc.
  const [page, setPage] = useState(FORM_PAGE);
  const scrollX = useSharedValue(FORM_PAGE * SCREEN_W);
  const isFormPage = page >= FORM_PAGE;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== page) {
      setPage(next);
      haptics.selection(); // haptic tick per step
    }
  };

  const goNext = () => {
    haptics.selection();
    if (page < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: page + 1, animated: true });
      setPage(page + 1);
      return;
    }
    if (page === SLIDES.length - 1) {
      scrollX.value = withTiming(FORM_PAGE * SCREEN_W, { duration: 220 });
      setPage(FORM_PAGE);
    }
  };

  // Form state (used by the third slide)
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("Europe/Dublin");
  const [jurisdiction, setJurisdiction] = useState<CreateBusinessBodyJurisdiction>("IE");
  const [vertical, setVertical] = useState<BusinessVertical>("hair");
  const [starterPack, setStarterPack] = useState(false);
  const [businessAttested, setBusinessAttested] = useState(false);

  useEffect(() => {
    const tz: Record<string, string> = {
      IE: "Europe/Dublin",
      GB: "Europe/London",
      SE: "Europe/Stockholm",
      DK: "Europe/Copenhagen",
      NO: "Europe/Oslo",
      FI: "Europe/Helsinki",
    };
    if (tz[jurisdiction]) setTimezone(tz[jurisdiction]);
  }, [jurisdiction]);
  const [tier, setTier] = useState("solo");
  const [showTz, setShowTz] = useState(false);
  const [error, setError] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);
  const [catalog, setCatalog] = useState<OnboardingCatalog | null>(null);
  const { mutateAsync: createBusiness, isPending } = useCreateBusiness();

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) return;
    void fetchOnboardingCatalog(getToken).then(setCatalog);
  }, [clerkLoaded, isSignedIn, getToken]);

  const tierOptions = catalog ? tierOptionsFromCatalog(catalog.tiers) : tierOptionsFromCatalog(["solo", "studio", "chain"]);
  const verticalOptions =
    catalog?.verticals.map((v) => ({ value: v.vertical, label: v.label })) ?? [];
  const jurisdictionOptions =
    catalog?.jurisdictions.map((j) => ({ code: j.jurisdiction, label: j.label })) ?? [];

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
    if (!businessAttested) {
      setError("Confirm you operate a legitimate business before continuing.");
      haptics.warning();
      return;
    }
    setError("");
    haptics.tap();
    try {
      const created = await createBusiness({
        data: {
          name: name.trim(),
          slug: slug.trim(),
          phone,
          timezone,
          jurisdiction,
          vertical,
          category: vertical,
          tier: tier as "solo" | "studio" | "chain",
          seedDefaults: false,
          starterPack: starterPack ? true : undefined,
          tenantAttestation: {
            entityKind: "sole_trader",
            tradingName: name.trim(),
            attestedAt: new Date().toISOString(),
          },
        } as Parameters<typeof createBusiness>[0]["data"],
      });
      setCurrentBusiness(created);
      await refetch();
      haptics.success();
      router.replace(asHref("/onboarding-setup"));
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const payload = err.data as { code?: string; error?: string } | null;
        if (payload?.code === "PLATFORM_LEGAL_REQUIRED") {
          setError("Accept Terms and Privacy first — opening that screen…");
          haptics.warning();
          router.replace("/legal-acceptance");
          return;
        }
        if (payload?.code === "BETA_SIGNUP_INVITE_ONLY" || payload?.code === "BETA_SIGNUP_CLOSED") {
          setError(payload?.error ?? err.message);
          return;
        }
        setError(payload?.error ?? err.message);
      } else {
        const e = err as { message?: string };
        setError(e?.message ?? "Failed to create business.");
      }
      haptics.warning();
    }
  };

  const handleLoadDemo = async () => {
    setSeedLoading(true);
    setError("");
    haptics.impact();
    try {
      if (!clerkLoaded || !isSignedIn) {
        throw new Error("Sign in first, then try again.");
      }
      const token = await getToken();
      if (!token) {
        throw new Error("Session expired — sign out and sign in again.");
      }
      await seedDevWorkspace();
      const { data: businesses } = await refetch();
      const first = businesses?.[0];
      if (!first) {
        throw new Error("Demo shop did not load — try again in a moment.");
      }
      setCurrentBusiness(first);
      haptics.success();
      router.replace("/");
    } catch (err: unknown) {
      let message = "Could not load demo data.";
      if (err instanceof ApiError) {
        const payload = err.data as { error?: string } | null;
        message = payload?.error ?? err.message;
        if (err.status === 401) {
          message = "Session expired — sign out and sign in again.";
        }
      } else if (err instanceof Error) {
        message = err.message;
        if (message === "Network request failed" || message.includes("Failed to fetch")) {
          message = "Cannot reach Livia right now — check your connection and try again.";
        }
      }
      setError(message);
      haptics.warning();
    } finally {
      setSeedLoading(false);
    }
  };

  const isLoading = isPending || seedLoading;

  // Header opacity fades in fast, settles
  const headOpacity = useSharedValue(0);
  useEffect(() => {
    headOpacity.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
  }, []);
  const headStyle = useAnimatedStyle(() => ({ opacity: headOpacity.value }));

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input + "55", color: colors.foreground, borderColor: colors.border },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ADR 0004: single soft cyan halo */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <AuroraHalo tone="primary" size={480} intensity={0.85} style={{ top: -120, left: -80 }} />
      </View>

      <Animated.View style={[styles.headerStrip, { paddingTop: insets.top + 18 }, headStyle]}>
        <LiviaWordmark size="md" color={colors.foreground} />
        <View style={styles.dots}>
          {Array.from({ length: SLIDES.length + 1 }).map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} color={colors.foreground} />
          ))}
        </View>
      </Animated.View>

      {isFormPage ? (
        <FormSlide
          secondShop={isSecondShop}
          colors={colors}
          inputStyle={inputStyle}
          name={name}
          slug={slug}
          phone={phone}
          timezone={timezone}
          jurisdiction={jurisdiction}
          vertical={vertical}
          tier={tier}
          starterPack={starterPack}
          businessAttested={businessAttested}
          showTz={showTz}
          error={error}
          isLoading={isLoading}
          seedLoading={seedLoading}
          isPending={isPending}
          verticalOptions={verticalOptions}
          jurisdictionOptions={jurisdictionOptions}
          tierOptions={tierOptions}
          getToken={getToken}
          bottomInset={insets.bottom}
          handlers={{
            setName: handleSlugFromName,
            setSlug,
            setPhone,
            setTimezone,
            setJurisdiction,
            setVertical: (v) => {
              setVertical(v);
              setStarterPack(false);
            },
            setTier,
            setStarterPack,
            setBusinessAttested,
            setShowTz,
            handleCreate,
            handleLoadDemo,
            haptics,
          }}
        />
      ) : (
        <Animated.FlatList
          ref={listRef}
          style={styles.carousel}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumEnd}
          bounces={false}
          renderItem={({ item, index }) => (
            <Slide meta={item} index={index} scrollX={scrollX} colors={colors} />
          )}
        />
      )}

      {/* Bottom CTA — intro slides only */}
      {!isFormPage && (
        <View style={[styles.bottomCta, { paddingBottom: insets.bottom + 18 }]}>
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: colors.primary,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
              elevation.floating,
            ]}
          >
            <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
              {page === SLIDES.length - 1 ? "Set up workspace" : "Continue"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Slide({
  meta,
  index,
  scrollX,
  colors,
}: {
  meta: SlideMeta;
  index: number;
  scrollX: SharedValue<number>;
  colors: ReturnType<typeof useColors>;
}) {
  const inputRange = [(index - 1) * SCREEN_W, index * SCREEN_W, (index + 1) * SCREEN_W];

  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(scrollX.value, inputRange, [40, 0, -40], Extrapolation.CLAMP),
      },
      {
        scale: interpolate(scrollX.value, inputRange, [0.92, 1, 0.92], Extrapolation.CLAMP),
      },
    ],
    opacity: interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP),
  }));

  const textParallax = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(scrollX.value, inputRange, [60, 0, -60], Extrapolation.CLAMP),
      },
    ],
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <Animated.View style={[styles.slideHero, parallaxStyle]}>
        <View style={styles.heroPulse}>
          <View style={styles.pulseCenter}>
            <LivPulse size={32} state="active" />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.slideText, textParallax]}>
        <Text style={[styles.eyebrow, { color: aurora.cyan }]}>{meta.eyebrow}</Text>
        <Text style={[styles.slideTitle, { color: colors.foreground }]}>
          {meta.title}{"\n"}
          <Text style={[styles.slideItalic, { color: colors.mutedForeground }]}>
            {meta.italic}
          </Text>
        </Text>
        <Text style={[styles.slideBody, { color: colors.mutedForeground }]}>{meta.body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({
  index,
  scrollX,
  color,
}: {
  index: number;
  scrollX: SharedValue<number>;
  color: string;
}) {
  const inputRange = [(index - 1) * SCREEN_W, index * SCREEN_W, (index + 1) * SCREEN_W];
  const style = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, inputRange, [6, 22, 6], Extrapolation.CLAMP),
    opacity: interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

function FormSlide({
  secondShop,
  colors,
  inputStyle,
  name,
  slug,
  phone,
  timezone,
  jurisdiction,
  vertical,
  tier,
  starterPack,
  businessAttested,
  showTz,
  error,
  isLoading,
  seedLoading,
  isPending,
  verticalOptions,
  jurisdictionOptions,
  tierOptions,
  getToken,
  bottomInset,
  handlers,
}: {
  secondShop?: boolean;
  businessAttested: boolean;
  bottomInset: number;
  colors: ReturnType<typeof useColors>;
  inputStyle: StyleProp<TextStyle>;
  name: string;
  slug: string;
  phone: string;
  timezone: string;
  jurisdiction: CreateBusinessBodyJurisdiction;
  vertical: BusinessVertical;
  tier: string;
  starterPack: boolean;
  showTz: boolean;
  error: string;
  isLoading: boolean;
  seedLoading: boolean;
  isPending: boolean;
  verticalOptions: { value: string; label: string }[];
  jurisdictionOptions: { code: string; label: string }[];
  tierOptions: { value: string; label: string; hint: string }[];
  getToken: () => Promise<string | null>;
  handlers: {
    setName: (v: string) => void;
    setSlug: (v: string) => void;
    setPhone: (v: string) => void;
    setTimezone: (v: string) => void;
    setJurisdiction: (v: CreateBusinessBodyJurisdiction) => void;
    setVertical: (v: BusinessVertical) => void;
    setTier: (v: string) => void;
    setStarterPack: (v: boolean) => void;
    setBusinessAttested: (v: boolean) => void;
    setShowTz: (v: boolean) => void;
    handleCreate: () => void;
    handleLoadDemo: () => void;
    haptics: ReturnType<typeof useHaptics>;
  };
}) {
  const verticalAccent = verticalAccentHex(vertical);
  const playbook = getVerticalPlaybook(vertical);
  const starterOffer = getVerticalStarterPackOffer(vertical);
  const [preview, setPreview] = React.useState<{
    services: { name: string }[];
    aiGreeting: string;
    starterPackServices?: { name: string }[];
  } | null>(null);

  React.useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setPreview(null);
      return;
    }
    const t = setTimeout(() => {
      void fetchOnboardingPreview(getToken, {
        name: trimmed,
        vertical,
        jurisdiction,
        tier,
      }).then((p) =>
        setPreview(
          p
            ? {
                services: p.services,
                aiGreeting: p.aiGreeting,
                starterPackServices: p.starterPackServices,
              }
            : null,
        ),
      );
    }, 400);
    return () => clearTimeout(t);
  }, [name, vertical, jurisdiction, tier, getToken]);

  return (
    <View style={styles.formSlide}>
      <KeyboardAwareScrollViewCompat
        style={styles.formScrollView}
        contentContainerStyle={[styles.formScroll, { paddingBottom: bottomInset + 40 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        bottomOffset={bottomInset + 24}
        extraKeyboardSpace={20}
      >
        <View style={styles.formHeader}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>
            {secondShop ? "Add another" : "Set up your"}
            {"\n"}
            <Text style={[styles.slideItalic, { color: colors.mutedForeground }]}>
              {secondShop ? "location." : "command center."}
            </Text>
          </Text>
          <Text style={[styles.formSub, { color: colors.mutedForeground }]}>
            {secondShop
              ? "A new shop on your account — switch between locations from More (Glance appears when you have two+)."
              : "Name your studio, pick your business type and team size — then we’ll walk through the essentials."}
          </Text>
        </View>

        {isDemoLoginEnabled && !secondShop ? (
          <>
            <View
              style={[
                styles.demoBox,
                { backgroundColor: colors.card, borderColor: aurora.cyan + "40" },
                elevation.resting,
              ]}
            >
              <Text style={[styles.demoTitle, { color: colors.foreground }]}>Just exploring?</Text>
              <Text style={[styles.demoSub, { color: colors.mutedForeground }]}>
                Load demo businesses — hair, beauty, wellness, tattoo, fitness, and more.
              </Text>
              <Pressable
                style={[
                  styles.demoCta,
                  { backgroundColor: colors.primary + "1f", borderColor: colors.primary + "66" },
                  isLoading && { opacity: 0.6 },
                ]}
                onPress={handlers.handleLoadDemo}
                disabled={isLoading}
                testID="demo-cta"
              >
                {seedLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={[styles.demoCtaText, { color: colors.primary }]}>
                    Load demo workspace
                  </Text>
                )}
              </Pressable>
              {error ? (
                <Text style={[styles.demoError, { color: colors.destructive }]}>{error}</Text>
              ) : null}
            </View>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
                or set up your own
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
          </>
        ) : null}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Business name</Text>
            <TextInput
              style={inputStyle}
              placeholder={`e.g. ${LIVIA_FORM_EXAMPLES.businessName}`}
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={handlers.setName}
              testID="business-name-input"
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              URL slug{" "}
              <Text style={{ color: colors.primary, fontSize: 11, fontFamily: fonts.bodyMed }}>
                {getPublicBookingLabel(slug || "your-slug")}
              </Text>
            </Text>
            <TextInput
              style={inputStyle}
              placeholder={LIVIA_FORM_EXAMPLES.businessSlug}
              placeholderTextColor={colors.mutedForeground}
              value={slug}
              onChangeText={(v) =>
                handlers.setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40))
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
              onChangeText={handlers.setPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Country</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {jurisdictionOptions.map((j) => (
                <Pressable
                  key={j.code}
                  onPress={() => handlers.setJurisdiction(j.code as CreateBusinessBodyJurisdiction)}
                  style={[
                    styles.chip,
                    {
                      borderColor: jurisdiction === j.code ? verticalAccent : colors.border,
                      backgroundColor:
                        jurisdiction === j.code ? verticalAccent + "22" : "transparent",
                    },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>{j.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Team size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {tierOptions.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => handlers.setTier(t.value)}
                  style={[
                    styles.chip,
                    {
                      borderColor: tier === t.value ? verticalAccent : colors.border,
                      backgroundColor: tier === t.value ? verticalAccent + "22" : "transparent",
                    },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: fonts.bodySemi }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={[styles.demoSub, { color: colors.mutedForeground, marginTop: 4 }]}>
              {tierOptions.find((t) => t.value === tier)?.hint}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Business type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {verticalOptions.map((v) => (
                <Pressable
                  key={v.value}
                  onPress={() => handlers.setVertical(v.value as BusinessVertical)}
                  style={[
                    styles.chip,
                    {
                      borderColor: vertical === v.value ? verticalAccentHex(v.value) : colors.border,
                      backgroundColor:
                        vertical === v.value
                          ? verticalAccentHex(v.value) + "22"
                          : "transparent",
                    },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>{v.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={[styles.demoSub, { color: verticalAccent, marginTop: 6 }]}>{playbook.wedge}</Text>
            <Pressable
              onPress={() => {
                handlers.haptics.selection();
                handlers.setStarterPack(!starterPack);
              }}
              style={[
                styles.demoBox,
                {
                  borderColor: starterPack ? verticalAccent : colors.border,
                  backgroundColor: starterPack ? verticalAccent + "14" : "transparent",
                  marginTop: 8,
                },
              ]}
              testID="vertical-starter-pack-opt-in"
            >
              <Text style={{ color: colors.foreground, fontFamily: fonts.bodySemi, fontSize: 13 }}>
                {starterOffer.label}
              </Text>
              <Text style={[styles.demoSub, { color: colors.mutedForeground, marginTop: 4 }]}>
                {starterOffer.description}
              </Text>
            </Pressable>
            {preview && (preview.services.length > 0 || starterPack) ? (
              <View
                style={[
                  styles.demoBox,
                  { borderColor: verticalAccent + "44", backgroundColor: verticalAccent + "10" },
                ]}
              >
                <Text style={[styles.demoSub, { color: colors.mutedForeground }]}>
                  {starterPack && preview.starterPackServices?.length
                    ? `Template menu: ${preview.starterPackServices
                        .slice(0, 3)
                        .map((s) => s.name)
                        .join(" · ")}…`
                    : `Add your menu on the next setup step.`}
                </Text>
                {starterPack && verticalStarterPackIncludesRetail(vertical) && starterOffer.extraLine ? (
                  <Text style={[styles.demoSub, { color: colors.mutedForeground, marginTop: 4 }]}>
                    {starterOffer.extraLine}
                  </Text>
                ) : null}
                <Text
                  style={[styles.demoSub, { color: colors.mutedForeground, fontStyle: "italic" }]}
                  numberOfLines={2}
                >
                  Liv: {preview.aiGreeting}
                </Text>
              </View>
            ) : null}
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
                handlers.haptics.selection();
                handlers.setShowTz(!showTz);
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
                      handlers.haptics.selection();
                      handlers.setTimezone(tz);
                      handlers.setShowTz(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: fonts.body,
                        color: tz === timezone ? colors.primary : colors.foreground,
                      }}
                    >
                      {tz}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Pressable
            style={styles.attestRow}
            onPress={() => {
              handlers.haptics.selection();
              handlers.setBusinessAttested(!businessAttested);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: businessAttested }}
          >
            <View
              style={[
                styles.attestBox,
                {
                  borderColor: businessAttested ? verticalAccent : colors.border,
                  backgroundColor: businessAttested ? verticalAccent + "22" : "transparent",
                },
              ]}
            >
              {businessAttested ? (
                <Text style={{ color: verticalAccent, fontFamily: fonts.bodyBold }}>✓</Text>
              ) : null}
            </View>
            <Text style={[styles.demoSub, { color: colors.mutedForeground, flex: 1 }]}>
              I operate a legitimate business and am authorised to set up this location on Livia.
            </Text>
          </Pressable>

          {error ? (
            <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] },
              (isLoading || !businessAttested) && { opacity: 0.6 },
              elevation.floating,
            ]}
            onPress={handlers.handleCreate}
            disabled={isLoading || !businessAttested}
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
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  carousel: { flex: 1 },
  formSlide: { flex: 1, paddingHorizontal: 22 },
  headerStrip: {
    paddingHorizontal: 22,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: { height: 6, borderRadius: 3 },
  slide: {
    flex: 1,
    paddingHorizontal: 22,
  },
  slideHero: {
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  heroPulse: {
    width: 300,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseCenter: {
    position: "absolute",
  },
  slideText: { gap: 12, marginTop: 28 },
  eyebrow: { ...type.eyebrow, fontSize: 11 },
  slideTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.6,
  },
  slideItalic: {
    fontFamily: fonts.serifMediumItalic,
    fontStyle: "italic",
  },
  slideBody: { ...type.body, fontSize: 16, lineHeight: 23, marginTop: 4 },
  bottomCta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
  },
  cta: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { fontSize: 16, fontFamily: fonts.bodySemi, letterSpacing: 0.3 },

  // Form slide
  formScrollView: { flex: 1 },
  formScroll: { paddingTop: 8, gap: 22 },
  formHeader: { gap: 8 },
  formTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  formSub: { ...type.body, fontSize: 15 },
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
  demoError: { ...type.body, fontSize: 12.5, lineHeight: 17, marginTop: 10 },
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
  chipRow: { flexGrow: 0 },
  chip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  error: { ...type.body, fontSize: 13, textAlign: "center" },
  attestRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 4 },
  attestBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
});
