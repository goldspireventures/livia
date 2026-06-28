import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
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
import { GatewayAuthShell } from "@/components/gateway/GatewayAuthShell";
import { useMobileSurface } from "@/hooks/useMobileSurface";
import { fonts, type } from "@/constants/typography";
import { useHaptics } from "@/hooks/useHaptics";
import {
  fetchDemoSignInTicket,
  isDemoLiviaEmail,
  normalizeDemoSignInIdentifier,
} from "@/lib/demo-sign-in";
import { clearDemoSession, persistDemoSession } from "@/lib/demo-session";
import { setDevPersonaOverride } from "@/hooks/usePersona";
import {
  GATEWAY_PASSWORD_HINT,
  GATEWAY_SIGN_IN_SUBTITLE,
  GATEWAY_SIGN_UP_SUBTITLE,
  humanizeGatewayAuthError,
  LIVIA_MOBILE_ENTRY_COPY,
  LIVIA_FORM_EXAMPLES,
} from "@workspace/policy";
import { isDemoMobileSurface } from "@/lib/production-surface";
import { rememberOperatorDoor } from "@/lib/mobile-entry-routing";

WebBrowser.maybeCompleteAuthSession();

type Mode = "sign-in" | "sign-up" | "verify";

export default function SignInScreen() {
  const { tokens: colors } = useMobileSurface("gateway-auth");
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const haptics = useHaptics();

  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: "oauth_google" });

  const [mode, setMode] = useState<Mode>(
    params.mode === "sign-up" ? "sign-up" : "sign-in",
  );
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

  useEffect(() => {
    if (params.mode === "sign-up") setMode("sign-up");
  }, [params.mode]);

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
      if (isDemoMobileSurface() && isDemoLiviaEmail(identifier)) {
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
        await rememberOperatorDoor();
        await setActiveSignIn({ session: result.createdSessionId });
        haptics.success();
      } else if (isDemoLiviaEmail(identifier)) {
        setError(
          "Demo sign-in needs the demo password from your invite. Make sure you are online and try again.",
        );
      } else {
        setError("Extra verification is required. Contact support@goldspireventures.com if you need help.");
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string; code?: string }> };
      const first = e?.errors?.[0];
      setError(
        err instanceof Error && !first
          ? err.message
          : humanizeGatewayAuthError(first?.code, first?.message),
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
      setError(humanizeGatewayAuthError(first?.code, first?.message));
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
        await rememberOperatorDoor();
        await setActiveSignUp({ session: result.createdSessionId });
        haptics.success();
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message: string; code?: string }> };
      const first = e?.errors?.[0];
      setError(humanizeGatewayAuthError(first?.code, first?.message));
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
        setError(humanizeGatewayAuthError(first?.code, raw || "Google sign-in failed."));
        haptics.warning();
      }
    } finally {
      setOauthLoading(false);
    }
  };

  const submit = mode === "verify" ? handleVerify : mode === "sign-in" ? handleSignIn : handleSignUp;
  const submitLabel = mode === "verify" ? "Verify email" : mode === "sign-in" ? "Sign in" : "Create account";
  const emailPlaceholder =
    mode === "sign-up" || !isDemoMobileSurface()
      ? LIVIA_FORM_EXAMPLES.ownerEmail
      : "Email or demo slug";
  const screenTitle =
    mode === "verify" ? "Verify email" : mode === "sign-up" ? "Create account" : "Sign in";
  const subtitle =
    mode === "verify"
      ? "We just sent a 6-digit code to your inbox."
      : mode === "sign-in"
        ? GATEWAY_SIGN_IN_SUBTITLE
        : GATEWAY_SIGN_UP_SUBTITLE;

  const formBody = (
    <>
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
                placeholder={emailPlaceholder}
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
                  placeholder={mode === "sign-up" ? "New password" : "Password"}
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
              {mode === "sign-up" ? (
                <Text style={[styles.passwordHint, { color: colors.mutedForeground }]}>
                  {GATEWAY_PASSWORD_HINT}
                </Text>
              ) : null}
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

    </>
  );

  return (
    <GatewayAuthShell
      title={screenTitle}
      subtitle={subtitle}
      testID="sign-in-form"
      keyboardAware
      headerAction={
        <Pressable onPress={() => router.replace("/" as never)} hitSlop={12} testID="sign-in-back">
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
      }
      footer={
        mode !== "verify" ? (
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
        ) : (
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
              <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi }}>← Back</Text>
            </Text>
          </TouchableOpacity>
        )
      }
      below={
        <>
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
          <Text style={[styles.legal, { color: colors.mutedForeground }]}>
            By continuing you agree to Livia&apos;s Terms & Privacy Policy.
          </Text>
        </>
      }
    >
      {formBody}
    </GatewayAuthShell>
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
const styles = StyleSheet.create({
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
  passwordHint: {
    fontSize: 12,
    fontFamily: fonts.body,
    lineHeight: 16,
    marginTop: 6,
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
