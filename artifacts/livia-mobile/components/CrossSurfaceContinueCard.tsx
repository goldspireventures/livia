import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { fonts, type } from "@/constants/typography";
import {
  CROSS_SURFACE_COPY,
  webOnboardingUrl,
  webOnboardingSettingsUrl,
  webSettingsAppearanceUrl,
} from "@/lib/cross-surface-handoff";

type Variant = "onboarding" | "settings" | "appearance";

type Props = {
  businessId?: string;
  variant?: Variant;
};

export function CrossSurfaceContinueCard({ businessId, variant = "onboarding" }: Props) {
  const colors = useColors();
  const haptics = useHaptics();

  const url =
    variant === "appearance"
      ? webSettingsAppearanceUrl(businessId)
      : variant === "settings"
        ? webOnboardingSettingsUrl("shop", businessId)
        : webOnboardingUrl(businessId);

  const title =
    variant === "appearance"
      ? "Logo, cover & live preview"
      : CROSS_SURFACE_COPY.mobileToWebTitle;
  const body =
    variant === "appearance"
      ? "Upload brand assets and preview your public booking page on a wide screen — preset changes sync to this app instantly."
      : CROSS_SURFACE_COPY.mobileToWebBody;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <Feather name="monitor" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      </View>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text>
      <Pressable
        onPress={() => {
          haptics.tap();
          void Linking.openURL(url);
        }}
        style={[styles.btn, { borderColor: colors.border }]}
      >
        <Text style={[styles.btnText, { color: colors.primary }]}>Open on web</Text>
        <Feather name="external-link" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginTop: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { ...type.label, fontSize: 15, fontFamily: fonts.bodySemi },
  body: { ...type.caption, lineHeight: 18 },
  btn: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  btnText: { ...type.body, fontFamily: fonts.bodyMed },
});
