import { useCreateBusiness } from "@workspace/api-client-react";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LivPulse } from "@/components/brand/LivPulse";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { aurora } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { SPRING_QUICK } from "@/constants/motion";
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

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { refetch } = useBusiness();
  const { getToken } = useAuth();

  const listRef = useRef<FlatList<SlideMeta | null>>(null);
  const [page, setPage] = useState(0);
  const scrollX = useSharedValue(0);

  const items: (SlideMeta | null)[] = [...SLIDES, null]; // last item is the form

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
    if (page < items.length - 1) {
      haptics.selection();
      listRef.current?.scrollToIndex({ index: page + 1, animated: true });
      setPage(page + 1);
    }
  };

  // Form state (used by the third slide)
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
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Single ambient halo behind everything */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <AuroraHalo tone="ambient" size={520} style={{ top: -200, right: -120 }} intensity={0.7} />
      </View>

      <Animated.View style={[styles.headerStrip, { paddingTop: insets.top + 18 }, headStyle]}>
        <LiviaWordmark size="md" color={colors.foreground} />
        <View style={styles.dots}>
          {items.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} color={colors.foreground} />
          ))}
        </View>
      </Animated.View>

      <Animated.FlatList
        ref={listRef}
        data={items}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        bounces={false}
        renderItem={({ item, index }) => {
          if (item === null) {
            return (
              <FormSlide
                colors={colors}
                inputStyle={inputStyle}
                name={name}
                slug={slug}
                phone={phone}
                timezone={timezone}
                showTz={showTz}
                error={error}
                isLoading={isLoading}
                seedLoading={seedLoading}
                isPending={isPending}
                handlers={{
                  setName: handleSlugFromName,
                  setSlug,
                  setPhone,
                  setTimezone,
                  setShowTz,
                  handleCreate,
                  handleLoadDemo,
                  haptics,
                }}
              />
            );
          }
          return (
            <Slide
              meta={item}
              index={index}
              scrollX={scrollX}
              colors={colors}
            />
          );
        }}
      />

      {/* Bottom CTA — context-aware */}
      {page < items.length - 1 && (
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
              {page === items.length - 2 ? "Set up workspace" : "Continue"}
            </Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
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
          <AuroraHalo tone="primary" size={300} intensity={0.8} style={{ top: -100, left: -100 }} />
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
  colors,
  inputStyle,
  name,
  slug,
  phone,
  timezone,
  showTz,
  error,
  isLoading,
  seedLoading,
  isPending,
  handlers,
}: {
  colors: ReturnType<typeof useColors>;
  inputStyle: StyleProp<TextStyle>;
  name: string;
  slug: string;
  phone: string;
  timezone: string;
  showTz: boolean;
  error: string;
  isLoading: boolean;
  seedLoading: boolean;
  isPending: boolean;
  handlers: {
    setName: (v: string) => void;
    setSlug: (v: string) => void;
    setPhone: (v: string) => void;
    setTimezone: (v: string) => void;
    setShowTz: (v: boolean) => void;
    handleCreate: () => void;
    handleLoadDemo: () => void;
    haptics: ReturnType<typeof useHaptics>;
  };
}) {
  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <ScrollView
        contentContainerStyle={styles.formScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formHeader}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>
            Set up your{"\n"}
            <Text style={[styles.slideItalic, { color: colors.mutedForeground }]}>
              command center.
            </Text>
          </Text>
          <Text style={[styles.formSub, { color: colors.mutedForeground }]}>
            One business, two minutes — Liv handles the rest.
          </Text>
        </View>

        <View
          style={[
            styles.demoBox,
            { backgroundColor: colors.card, borderColor: aurora.cyan + "40" },
            elevation.resting,
          ]}
        >
          <Text style={[styles.demoTitle, { color: colors.foreground }]}>Just exploring?</Text>
          <Text style={[styles.demoSub, { color: colors.mutedForeground }]}>
            Load 3 demo businesses — a hair salon, a tattoo studio, a personal trainer.
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
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
            or set up your own
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Business name</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Studio Luxe"
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
                livia.io/b/{slug || "your-slug"}
              </Text>
            </Text>
            <TextInput
              style={inputStyle}
              placeholder="studio-luxe"
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
            onPress={handlers.handleCreate}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  formScroll: { paddingTop: 8, paddingBottom: 32, gap: 22 },
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
  error: { ...type.body, fontSize: 13, textAlign: "center" },
});
