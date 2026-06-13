import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { GatewaySignInStory } from "@/components/gateway/GatewaySignInStory";
import { aurora, aurum } from "@/constants/colors";
import { elevation } from "@/constants/elevation";
import { SPRING_GENTLE } from "@/constants/motion";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import {
  fetchDemoSignInTicket,
  isDemoLiviaEmail,
  normalizeDemoSignInIdentifier,
} from "@/lib/demo-sign-in";
import { clearDemoSession, persistDemoSession } from "@/lib/demo-session";
import { isDemoLoginEnabled, setDevPersonaOverride } from "@/hooks/usePersona";
import { LIVIA_MOBILE_ENTRY_COPY } from "@workspace/policy";

WebBrowser.maybeCompleteAuthSession();

type Mode = "sign-in" | "sign-up" | "verify";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();

  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: "oauth_google" });

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"email" | "password" | "code" | null>(null);

  const emailRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);
  const codeRef = React.useRef<TextInput>(null);

  function normalizeIdentifier(raw: string): string {
    return normalizeDemoSignInIdentifier(raw);
  }

  const wordmarkY = useSharedValue(-12);
  const wordmarkOpacity = useSharedValue(0);
  const headlineOpacity = useSharedValue(0);
  const headlineY = useSharedValue(14);
  const taglineOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(20);

  useEffect(() => {
    wordmarkOpacity.value = withTiming(1, { duration: 540, easing: Easing.out(Easing.cubic) });
    wordmarkY.value = withSpring(0, SPRING_GENTLE);
    headlineOpacity.value = withDelay(180, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));
    headlineY.value = withDelay(180, withSpring(0, SPRING_GENTLE));
    taglineOpacity.value = withDelay(360, withTiming(1, { duration: 460 }));
    cardOpacity.value = withDelay(440, withTiming(1, { duration: 460 }));
    cardY.value = withDelay(440, withSpring(0, SPRING_GENTLE));
  }, []);

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  useEffect(() => {
    if (Platform.OS !== "web") {
      WebBrowser.warmUpAsync();
      return () => {
        WebBrowser.coolDownAsync();
      };
    }
  }, []);

  const handleSignIn = async () => {
    if (!signInLoaded || loading) return;
    haptics.tap();
    setLoading(true);
    setError("");
    const identifier = normalizeIdentifier(email);
    try {
      if (isDemoLiviaEmail(identifier)) {
        const ticket = await fetchDemoSignInTicket(identifier, password);
        await persistDemoSession(ticket);
        await setDevPersonaOverride(null);
        const attempt = await signIn!.create({
          strategy: "ticket",
          ticket: ticket.token,
        });
        if (attempt.status === "complete" && attempt.createdSessionId) {
          await setActiveSignIn({ session: attempt.createdSessionId });
          haptics.success();
          return;
        }
      }

      const result = await signIn.create({ identifier, password });
      if (result.status === "complete") {
        await clearDemoSession();
        await setActiveSignIn({ session: result.createdSessionId });
        haptics.success();
      } else if (isDemoLiviaEmail(identifier)) {
        setError(
          "Demo account needs a ticket sign-in. Use password LiviaDemo2026! (from LIVIA_DEMO_PASSWORD) and ensure the API is running with demo provisioned.",
        );
      } else {
        setError("Almost there — extra verification needed. Try Google for now.");
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string; code?: string }> };
      const first = e?.errors?.[0];
      setError(
        err instanceof Error && !first
          ? err.message
          : humanizeAuthError(first?.code, first?.message),
      );
      haptics.warning();
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpLoaded || loading) return;
    haptics.tap();
    setLoading(true);
    setError("");
    try {
      await clearDemoSession();
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setMode("verify");
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string; code?: string }> };
      const first = e?.errors?.[0];
      setError(humanizeAuthError(first?.code, first?.message));
      haptics.warning();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUpLoaded || loading) return;
    haptics.tap();
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === "complete") {
        await clearDemoSession();
        await setActiveSignUp({ session: result.createdSessionId });
        haptics.success();
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string; code?: string }> };
      const first = e?.errors?.[0];
      setError(humanizeAuthError(first?.code, first?.message));
      haptics.warning();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (oauthLoading) return;
    haptics.impact();
    setOauthLoading(true);
    setError("");
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "livia-mobile",
        path: "oauth-callback",
      });
      const result = await startGoogleFlow({ redirectUrl });
      const { createdSessionId, setActive, signIn: oauthSignIn, signUp: oauthSignUp } = result;
      if (createdSessionId && setActive) {
        await clearDemoSession();
        await setActive({ session: createdSessionId });
        haptics.success();
        return;
      }
      const transferable =
        (oauthSignIn as { firstFactorVerification?: { status?: string } } | undefined)
          ?.firstFactorVerification?.status === "transferable";
      if (transferable && signUp) {
        try {
          await signUp.create({ transfer: true });
          if (signUp.createdSessionId && setActiveSignUp) {
            await clearDemoSession();
            await setActiveSignUp({ session: signUp.createdSessionId });
            haptics.success();
            return;
          }
        } catch {
          /* fall through */
        }
      }
      setError("Google sign-in didn't complete. Please try again, or use email + password below.");
    } catch (err: unknown) {
      const e = err as {
        errors?: Array<{ message: string; code?: string }>;
        message?: string;
      };
      const first = e?.errors?.[0];
      const raw = first?.message ?? e?.message ?? "";
      if (/cancel|dismiss|user_cancel/i.test(raw)) {
        setError("Sign-in cancelled. Tap Continue with Google to try again.");
      } else {
        setError(humanizeAuthError(first?.code, raw || "Google sign-in failed."));
        haptics.warning();
      }
    } finally {
      setOauthLoading(false);
    }
  };

  const submit = mode === "verify" ? handleVerify : mode === "sign-in" ? handleSignIn : handleSignUp;
  const submitLabel = mode === "verify" ? "Verify email" : mode === "sign-in" ? "Sign in" : "Create account";
  const tagline =
    mode === "verify"
      ? "We just sent a 6-digit code to your inbox."
      : mode === "sign-in"
        ? "Welcome back. Your day is already in motion."
        : "Two minutes to set up. Hours back every week.";

  const formFocused = focused !== null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ADR 0004 / marketing bible: single soft cyan halo */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <AuroraHalo tone="primary" size={480} intensity={0.85} style={{ top: -100, left: -60 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        bottomOffset={insets.bottom + 20}
        extraKeyboardSpace={24}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + (formFocused ? 12 : 28),
            paddingBottom: insets.bottom + 32,
          },
        ]}
      >
        <View style={[styles.brand, formFocused && styles.brandCompact]}>
          <Animated.View style={wordmarkStyle}>
            <LiviaWordmark size={formFocused ? "md" : "lg"} color={colors.foreground} />
          </Animated.View>

          {!formFocused ? (
            <>
              <Animated.View style={headlineStyle}>
                <GatewaySignInStory />
              </Animated.View>

              <Animated.Text
                style={[styles.tagline, { color: colors.mutedForeground }, taglineStyle]}
              >
                {tagline}
              </Animated.Text>
            </>
          ) : (
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>{tagline}</Text>
          )}
        </View>

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card + "f0",
              borderColor: colors.border,
            },
            elevation.floating,
            cardStyle,
          ]}
        >
          {mode !== "verify" && (
            <>
              <TouchableOpacity
                style={[styles.googleBtn, { backgroundColor: "#ffffff" }]}
                activeOpacity={0.9}
                onPress={handleGoogle}
                disabled={oauthLoading || loading}
                testID="google-button"
              >
                {oauthLoading ? (
                  <ActivityIndicator color="#1f1f1f" />
                ) : (
                  <>
                    <GoogleGlyph />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>
            </>
          )}

          {mode !== "verify" ? (
            <>
              <FieldLabel color={colors.mutedForeground}>Email</FieldLabel>
              <TextInput
                ref={emailRef}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input + "33",
                    color: colors.foreground,
                    borderColor: focused === "email" ? colors.primary : colors.border,
                  },
                ]}
                placeholder="you@studio.com or demo slug (conors-cut-co)"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                testID="email-input"
              />

              <FieldLabel color={colors.mutedForeground}>Password</FieldLabel>
              <View style={{ position: "relative" }}>
                <TextInput
                  ref={passwordRef}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.input + "33",
                      color: colors.foreground,
                      borderColor: focused === "password" ? colors.primary : colors.border,
                      paddingRight: 44,
                    },
                  ]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  testID="password-input"
                />
                <Pressable
                  hitSlop={10}
                  style={styles.eyeBtn}
                  onPress={() => {
                    haptics.selection();
                    setShowPassword((v) => !v);
                  }}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <FieldLabel color={colors.mutedForeground}>Verification code</FieldLabel>
              <TextInput
                ref={codeRef}
                style={[
                  styles.input,
                  styles.codeInput,
                  {
                    backgroundColor: colors.input + "33",
                    color: colors.foreground,
                    borderColor: focused === "code" ? colors.primary : colors.border,
                  },
                ]}
                placeholder="123456"
                placeholderTextColor={colors.mutedForeground}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={submit}
                onFocus={() => setFocused("code")}
                onBlur={() => setFocused(null)}
                testID="otp-input"
              />
            </>
          )}

          {error ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: colors.destructive + "1a",
                  borderColor: colors.destructive + "55",
                },
              ]}
            >
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.92}
            onPress={submit}
            disabled={loading || oauthLoading}
            testID="submit-button"
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary },
              (loading || oauthLoading) && { opacity: 0.6 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                {submitLabel}
              </Text>
            )}
          </TouchableOpacity>

          {mode !== "verify" && (
            <TouchableOpacity
              onPress={() => {
                haptics.selection();
                setError("");
                setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              }}
              style={styles.toggle}
              hitSlop={8}
            >
              <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>
                {mode === "sign-in" ? "New to Livia? " : "Already on Livia? "}
                <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi }}>
                  {mode === "sign-in" ? "Create an account" : "Sign in"}
                </Text>
              </Text>
            </TouchableOpacity>
          )}

          {mode === "verify" && (
            <TouchableOpacity
              onPress={() => {
                haptics.selection();
                setMode("sign-up");
                setCode("");
                setError("");
              }}
              style={styles.toggle}
              hitSlop={8}
            >
              <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>
                <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi }}>
                  ← Back
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            haptics.selection();
            router.replace("/" as never);
          }}
          style={styles.guestEntry}
          testID="sign-in-back-to-gateway"
        >
          <Text style={[styles.guestEntryText, { color: colors.mutedForeground }]}>
            <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi }}>
              ← {LIVIA_MOBILE_ENTRY_COPY.staffBackLink}
            </Text>
          </Text>
        </TouchableOpacity>

        {isDemoLoginEnabled ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              haptics.selection();
              router.push("/demo" as never);
            }}
            style={styles.guestEntry}
            testID="sign-in-demo-gateway"
          >
            <Text style={[styles.guestEntryText, { color: colors.mutedForeground }]}>
              <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi }}>
                {LIVIA_MOBILE_ENTRY_COPY.demoCta} →
              </Text>
            </Text>
          </TouchableOpacity>
        ) : null}

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          By continuing you agree to Livia's Terms & Privacy Policy.
        </Text>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function FieldLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return <Text style={[styles.label, { color }]}>{children}</Text>;
}

function GoogleGlyph() {
  return (
    <View style={styles.googleGlyph}>
      <Text style={styles.googleGlyphText}>G</Text>
    </View>
  );
}

function humanizeAuthError(code: string | undefined, fallback: string | undefined): string {
  if (!code) return fallback || "Something went wrong.";
  switch (code) {
    case "form_identifier_not_found":
      return "We couldn't find an account for that email. Try Continue with Google, or create an account.";
    case "form_password_incorrect":
      return "That password doesn't match. If you signed up with Google, use the Google button instead.";
    case "form_password_pwned":
      return "That password appears in known breaches — please pick a stronger one.";
    case "form_password_length_too_short":
      return "Password must be at least 8 characters.";
    case "form_identifier_exists":
      return "An account already exists for that email. Try signing in instead.";
    case "form_code_incorrect":
      return "That verification code is incorrect or expired.";
    case "session_exists":
      return "You're already signed in.";
    default:
      return fallback || "Authentication failed. Please try again.";
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: 22,
    gap: 20,
  },
  brand: {
    alignItems: "center",
    gap: 16,
    paddingTop: 24,
  },
  brandCompact: {
    gap: 10,
    paddingTop: 4,
  },
  headline: {
    fontFamily: fonts.serifMedium,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.6,
    textAlign: "center",
    marginTop: 18,
  },
  headlineItalic: {
    fontFamily: fonts.serifMediumItalic,
    fontStyle: "italic",
  },
  livLine: {
    ...type.serifSm,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
    opacity: 0.9,
  },
  tagline: {
    ...type.body,
    textAlign: "center",
    maxWidth: 320,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  label: {
    ...type.label,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  codeInput: {
    fontSize: 22,
    letterSpacing: 6,
    textAlign: "center",
    fontFamily: fonts.bodySemi,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    bottom: 12,
    justifyContent: "center",
    alignItems: "center",
    width: 28,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 4,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: fonts.bodyMed,
    lineHeight: 17,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    minHeight: 50,
    shadowColor: aurora.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  submitText: {
    fontSize: 15,
    fontFamily: fonts.bodySemi,
    letterSpacing: 0.3,
  },
  toggle: {
    alignItems: "center",
    paddingVertical: 6,
    marginTop: 2,
  },
  toggleText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
  },
  googleBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 50,
  },
  googleBtnText: {
    color: "#1f1f1f",
    fontSize: 15,
    fontFamily: fonts.bodySemi,
  },
  googleGlyph: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#4285F4",
  },
  googleGlyphText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: "#4285F4",
    marginTop: -2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 6,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 11,
    fontFamily: fonts.bodyMed,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  guestEntry: {
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 4,
  },
  guestEntryText: {
    textAlign: "center",
    fontSize: 13.5,
    fontFamily: fonts.body,
  },
  guestEntryHint: {
    textAlign: "center",
    fontSize: 11.5,
    fontFamily: fonts.body,
    maxWidth: 300,
  },
  legal: {
    textAlign: "center",
    fontSize: 11.5,
    fontFamily: fonts.body,
    paddingHorizontal: 12,
  },
});
