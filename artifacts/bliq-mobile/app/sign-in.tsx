import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { aurora } from "@/constants/colors";

WebBrowser.maybeCompleteAuthSession();

type Mode = "sign-in" | "sign-up" | "verify";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

  // Warm up the in-app browser to make OAuth feel instant on Android.
  useEffect(() => {
    if (Platform.OS !== "web") {
      WebBrowser.warmUpAsync();
      return () => {
        WebBrowser.coolDownAsync();
      };
    }
  }, []);

  const tap = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== "web") Haptics.impactAsync(style).catch(() => {});
  }, []);

  const handleSignIn = async () => {
    if (!signInLoaded || loading) return;
    tap();
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === "complete") {
        await setActiveSignIn({ session: result.createdSessionId });
      } else {
        setError("Almost there — extra verification needed. Try Google for now.");
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string; code?: string }> };
      const first = e?.errors?.[0];
      setError(humanizeAuthError(first?.code, first?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpLoaded || loading) return;
    tap();
    setLoading(true);
    setError("");
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setMode("verify");
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string; code?: string }> };
      const first = e?.errors?.[0];
      setError(humanizeAuthError(first?.code, first?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUpLoaded || loading) return;
    tap();
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId });
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string; code?: string }> };
      const first = e?.errors?.[0];
      setError(humanizeAuthError(first?.code, first?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (oauthLoading) return;
    tap(Haptics.ImpactFeedbackStyle.Medium);
    setOauthLoading(true);
    setError("");
    try {
      // Generate platform-aware redirect URI so this works in Expo Go,
      // dev clients, web preview, and standalone builds.
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "bliq-mobile",
        path: "oauth-callback",
      });

      const result = await startGoogleFlow({ redirectUrl });
      const { createdSessionId, setActive, signIn: oauthSignIn, signUp: oauthSignUp } = result;

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        return;
      }

      // OAuth returned without a complete session — figure out why so we can
      // give the user something actionable instead of a silent no-op.
      const transferable =
        (oauthSignIn as { firstFactorVerification?: { status?: string } } | undefined)
          ?.firstFactorVerification?.status === "transferable";

      if (transferable && signUp) {
        // Account exists at the OAuth provider but not in Clerk yet — transfer
        // creates the Clerk user from the verified OAuth identity.
        try {
          await signUp.create({ transfer: true });
          if (signUp.createdSessionId && setActiveSignUp) {
            await setActiveSignUp({ session: signUp.createdSessionId });
            return;
          }
        } catch {
          /* fall through */
        }
      }

      setError(
        "Google sign-in didn't complete. Please try again, or use email + password below."
      );
    } catch (err: unknown) {
      const e = err as {
        errors?: Array<{ message: string; code?: string }>;
        message?: string;
      };
      const first = e?.errors?.[0];
      const raw = first?.message ?? e?.message ?? "";
      // Common cancellation paths shouldn't read like a scary error.
      if (/cancel|dismiss|user_cancel/i.test(raw)) {
        setError("Sign-in cancelled. Tap Continue with Google to try again.");
      } else {
        setError(humanizeAuthError(first?.code, raw || "Google sign-in failed."));
      }
    } finally {
      setOauthLoading(false);
    }
  };

  const submit = mode === "verify" ? handleVerify : mode === "sign-in" ? handleSignIn : handleSignUp;
  const submitLabel = mode === "verify" ? "Verify email" : mode === "sign-in" ? "Sign in" : "Create account";
  const tagline =
    mode === "verify"
      ? "Check your email for a 6-digit code."
      : mode === "sign-in"
      ? "Welcome back to your command center."
      : "Start booking smarter in minutes.";

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Aurora ambient backdrop */}
      <AuroraBackdrop background={colors.background} />

      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.markWrap}>
            <LinearGradient
              colors={["#0a0a10", "#161620"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mark}
            >
              <Text style={styles.markLetter}>
                L<Text style={{ color: "#d9c39a", fontStyle: "italic" }}>v</Text>
              </Text>
            </LinearGradient>
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>Livia</Text>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Your day,{" "}
            <Text style={styles.headlineGradient}>already handled.</Text>
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>{tagline}</Text>
        </View>

        {/* Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {mode !== "verify" && (
            <>
              <TouchableOpacity
                style={[styles.googleBtn, { backgroundColor: "#ffffff" }]}
                activeOpacity={0.85}
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
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input + "33",
                    color: colors.foreground,
                    borderColor: focused === "email" ? colors.primary : colors.border,
                  },
                ]}
                placeholder="you@studio.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                testID="email-input"
              />

              <FieldLabel color={colors.mutedForeground}>Password</FieldLabel>
              <View style={{ position: "relative" }}>
                <TextInput
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
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  testID="password-input"
                />
                <Pressable
                  hitSlop={10}
                  style={styles.eyeBtn}
                  onPress={() => {
                    tap();
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
                onFocus={() => setFocused("code")}
                onBlur={() => setFocused(null)}
                testID="otp-input"
              />
            </>
          )}

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "1a", borderColor: colors.destructive + "55" }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={submit}
            disabled={loading || oauthLoading}
            testID="submit-button"
          >
            <LinearGradient
              colors={[aurora.violet, aurora.cyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitBtn, (loading || oauthLoading) && { opacity: 0.6 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>{submitLabel}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {mode !== "verify" && (
            <TouchableOpacity
              onPress={() => {
                tap();
                setError("");
                setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              }}
              style={styles.toggle}
              hitSlop={8}
            >
              <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>
                {mode === "sign-in" ? "New to Livia? " : "Already on Livia? "}
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                  {mode === "sign-in" ? "Create an account" : "Sign in"}
                </Text>
              </Text>
            </TouchableOpacity>
          )}

          {mode === "verify" && (
            <TouchableOpacity
              onPress={() => {
                tap();
                setMode("sign-up");
                setCode("");
                setError("");
              }}
              style={styles.toggle}
              hitSlop={8}
            >
              <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                  ← Back
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          By continuing you agree to Livia's Terms & Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return <Text style={[styles.label, { color }]}>{children}</Text>;
}

function AuroraBackdrop({ background }: { background: string }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: background }]} />
      <LinearGradient
        colors={[aurora.violet + "55", "transparent"]}
        style={[styles.orb, { top: -120, left: -80, width: 380, height: 380 }]}
      />
      <LinearGradient
        colors={[aurora.cyan + "44", "transparent"]}
        style={[styles.orb, { top: 220, right: -120, width: 360, height: 360 }]}
      />
      <LinearGradient
        colors={[aurora.mint + "33", "transparent"]}
        style={[styles.orb, { bottom: -100, left: -60, width: 320, height: 320 }]}
      />
    </View>
  );
}

function GoogleGlyph() {
  // Multi-color "G" approximation without external SVG dependencies.
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
  container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "center",
    gap: 8,
    paddingTop: 16,
  },
  markWrap: {
    marginBottom: 14,
    shadowColor: "#d9c39a",
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(217, 195, 154, 0.25)",
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  markLetter: {
    color: "#f6f3ec",
    fontSize: 32,
    fontFamily: "Inter_400Regular",
    marginTop: -2,
    letterSpacing: -0.5,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
    textAlign: "center",
    marginTop: 4,
  },
  headlineGradient: {
    color: aurora.cyan,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textAlign: "center",
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  codeInput: {
    fontSize: 22,
    letterSpacing: 6,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
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
    fontFamily: "Inter_500Medium",
    lineHeight: 17,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    minHeight: 50,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  toggle: {
    alignItems: "center",
    paddingVertical: 6,
    marginTop: 2,
  },
  toggleText: {
    fontSize: 13.5,
    fontFamily: "Inter_400Regular",
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
    fontFamily: "Inter_600SemiBold",
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
    fontFamily: "Inter_700Bold",
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
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.9,
  },
  legal: {
    textAlign: "center",
    fontSize: 11.5,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 12,
  },
});
