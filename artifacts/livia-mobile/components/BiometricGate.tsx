import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useBiometricGate } from "@/hooks/useBiometricGate";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { fonts, type } from "@/constants/typography";

export function BiometricGate({
  children,
  title = "Confirm it's you",
  subtitle = "Use Face ID, fingerprint, or your phone passcode — whatever you already use to unlock this device.",
  allowSkip = true,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** When true, user can skip lock for this device (stored in preferences). */
  allowSkip?: boolean;
}) {
  const colors = useColors();
  const haptics = useHaptics();
  const { unlocked, requireUnlock, skipForSession, hydrated } = useBiometricGate();

  useEffect(() => {
    if (hydrated && !unlocked) void requireUnlock();
  }, [hydrated, unlocked, requireUnlock]);

  if (!hydrated) {
    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Feather name="lock" size={40} color={colors.primary} />
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      <Pressable
        onPress={() => {
          haptics.tap();
          void requireUnlock();
        }}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: colors.primary },
          pressed && { opacity: 0.9 },
        ]}
      >
        <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Unlock</Text>
      </Pressable>
      {allowSkip ? (
        <Pressable
          onPress={() => {
            haptics.selection();
            void skipForSession();
          }}
          style={{ marginTop: 16 }}
        >
          <Text style={[styles.skip, { color: colors.mutedForeground }]}>
            Skip on this device
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  title: { fontFamily: fonts.serifMedium, fontSize: 26, textAlign: "center" },
  sub: { ...type.body, fontSize: 14, textAlign: "center", marginBottom: 8 },
  btn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999, marginTop: 8 },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 16 },
  skip: { fontFamily: fonts.bodyMed, fontSize: 14, textDecorationLine: "underline" },
});
