import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fonts, type } from "@/constants/typography";
import { useMobileSurface } from "@/hooks/useMobileSurface";
import { ConstellationGlassCard } from "@/components/constellation/ConstellationGlassCard";
import {
  DEMO_GUEST_CLIENT_COPY,
  GUEST_HUB_COPY,
} from "@workspace/policy";
import { DEMO_GUEST_PHONE } from "@/lib/guest-hub-otp";
import { isDemoMobileSurface } from "@/lib/production-surface";

type Props = {
  authMethod: "phone" | "email";
  onAuthMethodChange: (m: "phone" | "email") => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  otpSession: string | null;
  code: string;
  onCodeChange: (v: string) => void;
  magicOtp: string | null;
  busy: boolean;
  err: string | null;
  onRequestOtp: () => void;
  onVerifyOtp: () => void;
  onSignInAsMaryDemo: () => void;
  onUseDemoNumber: () => void;
  onChangeIdentifier: () => void;
  /** When true, render form fields only (parent provides GatewayAuthShell card). */
  embedded?: boolean;
};

function StepIndicator({
  step,
  authMethod,
  primary,
  muted,
}: {
  step: 1 | 2;
  authMethod: "phone" | "email";
  primary: string;
  muted: string;
}) {
  const label = authMethod === "email" ? "Email" : "Phone";
  return (
    <View style={styles.steps} accessibilityRole="tablist">
      <View
        style={[
          styles.stepPill,
          step === 1 && { backgroundColor: primary + "26" },
        ]}
      >
        <Text style={[styles.stepText, { color: step === 1 ? primary : muted }]}>1 · {label}</Text>
      </View>
      <Feather name="arrow-right" size={12} color={muted} />
      <View
        style={[
          styles.stepPill,
          step === 2 && { backgroundColor: primary + "26" },
        ]}
      >
        <Text style={[styles.stepText, { color: step === 2 ? primary : muted }]}>2 · Code</Text>
      </View>
    </View>
  );
}

export function GuestHubSignInPanel({
  authMethod,
  onAuthMethodChange,
  phone,
  onPhoneChange,
  email,
  onEmailChange,
  otpSession,
  code,
  onCodeChange,
  magicOtp,
  busy,
  err,
  onRequestOtp,
  onVerifyOtp,
  onSignInAsMaryDemo,
  onUseDemoNumber,
  onChangeIdentifier,
  embedded = false,
}: Props) {
  const { tokens: colors } = useMobileSurface("guest-hub");
  const step = otpSession ? 2 : 1;
  const showDemo = isDemoMobileSurface();

  const form = (
    <>
        <StepIndicator
          step={step}
          authMethod={authMethod}
          primary={colors.primary}
          muted={colors.mutedForeground ?? "#888"}
        />

        {step === 1 ? (
          <>
            <View style={styles.methodRow}>
              {(["phone", "email"] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => onAuthMethodChange(m)}
                  style={[
                    styles.chip,
                    {
                      borderColor: authMethod === m ? colors.primary : colors.border,
                      backgroundColor: authMethod === m ? colors.primary + "18" : "transparent",
                    },
                  ]}
                  testID={m === "phone" ? "guest-hub-auth-phone" : "guest-hub-auth-email"}
                >
                  <Text
                    style={[
                      type.caption,
                      { color: authMethod === m ? colors.primary : colors.mutedForeground },
                    ]}
                  >
                    {m === "phone" ? GUEST_HUB_COPY.signInMethodPhone : GUEST_HUB_COPY.signInMethodEmail}
                  </Text>
                </Pressable>
              ))}
            </View>

            {authMethod === "email" ? (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={onEmailChange}
                testID="guest-hub-email-input"
              />
            ) : (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. +353 87 100 0001"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={onPhoneChange}
                testID="guest-hub-phone-input"
              />
            )}

            {showDemo && authMethod === "phone" ? (
              <View style={styles.demoRow}>
                <Pressable
                  onPress={onSignInAsMaryDemo}
                  style={[styles.demoBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "12" }]}
                  testID="guest-hub-demo-mary"
                  disabled={busy}
                >
                  <Text style={[type.caption, { color: colors.primary, fontFamily: fonts.bodyMed }]}>
                    Sign in as Mary (demo)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onUseDemoNumber}
                  style={[styles.demoBtn, { borderColor: colors.border }]}
                  testID="guest-hub-demo-phone"
                >
                  <Text style={[type.caption, { color: colors.mutedForeground }]}>Use demo number</Text>
                </Pressable>
              </View>
            ) : showDemo ? (
              <Text style={[type.caption, { color: colors.mutedForeground }]}>{DEMO_GUEST_CLIENT_COPY.phoneHint}</Text>
            ) : null}

            {showDemo && magicOtp ? (
              <Text style={[type.caption, { color: colors.primary }]}>Staging code: {magicOtp}</Text>
            ) : null}

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.primary }, busy && { opacity: 0.7 }]}
              onPress={onRequestOtp}
              disabled={busy || (authMethod === "email" ? !email.trim() : !phone.trim())}
              testID="guest-hub-send-code"
            >
              {busy ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[type.body, { color: colors.primaryForeground, fontFamily: fonts.bodyMed }]}>
                  Send code
                </Text>
              )}
            </Pressable>

            <Text style={[type.caption, styles.coldHint, { color: colors.mutedForeground }]}>
              {GUEST_HUB_COPY.signInBodyColdStart}
            </Text>
          </>
        ) : (
          <>
            <Text style={[type.caption, { color: colors.mutedForeground }]}>
              Code sent to {authMethod === "email" ? email.trim() : phone.trim() || DEMO_GUEST_PHONE}
            </Text>
            {showDemo && magicOtp ? (
              <Text style={[type.caption, { color: colors.primary }]}>Staging code: {magicOtp}</Text>
            ) : null}
            <TextInput
              style={[styles.input, styles.codeInput, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="6-digit code"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              value={code}
              onChangeText={onCodeChange}
              testID="guest-hub-otp-input"
            />
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.primary }, busy && { opacity: 0.7 }]}
              onPress={onVerifyOtp}
              disabled={busy || code.trim().length < 4}
            >
              {busy ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[type.body, { color: colors.primaryForeground, fontFamily: fonts.bodyMed }]}>
                  Verify
                </Text>
              )}
            </Pressable>
            <Pressable onPress={onChangeIdentifier} hitSlop={8}>
              <Text style={[type.caption, { color: colors.primary, textAlign: "center" }]}>
                ← Change {authMethod === "email" ? "email" : "number"}
              </Text>
            </Pressable>
          </>
        )}

        {err ? (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}>
            <Text style={[type.caption, { color: colors.destructive }]}>{err}</Text>
          </View>
        ) : null}
    </>
  );

  if (embedded) {
    return (
      <View style={styles.embedded} testID="guest-hub-sign-in-panel">
        {form}
      </View>
    );
  }

  return (
    <View style={styles.wrap} testID="guest-hub-sign-in-panel">
      <Text style={[type.caption, styles.tagline, { color: colors.mutedForeground }]}>
        {GUEST_HUB_COPY.tagline}
      </Text>
      <ConstellationGlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          {authMethod === "email" ? GUEST_HUB_COPY.signInTitleEmail : GUEST_HUB_COPY.signInTitle}
        </Text>
        <Text style={[type.caption, { color: colors.mutedForeground, lineHeight: 18 }]}>
          {authMethod === "email" ? GUEST_HUB_COPY.signInBodyEmail : GUEST_HUB_COPY.signInBody}
        </Text>
        {form}
      </ConstellationGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  embedded: {
    gap: 12,
  },
  tagline: {
    lineHeight: 18,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "transparent",
  },
  stepText: {
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  methodRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  codeInput: {
    fontSize: 22,
    letterSpacing: 4,
    textAlign: "center",
    fontFamily: fonts.bodySemi,
  },
  demoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  demoBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  coldHint: {
    lineHeight: 16,
    fontSize: 11,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
