import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTenantExperience } from "@/hooks/useTenantExperience";
import { useColors } from "@/hooks/useColors";
import { fonts, type } from "@/constants/typography";
import { dashboardSettingsUrl } from "@/lib/dashboard-url";

type TenantExperienceApi = {
  presentation?: {
    label?: string;
    brandAccentHex?: string | null;
    presetsEnabled?: boolean;
  };
  publicAppearance?: {
    brandAccentHex?: string | null;
  };
};

type Props = {
  businessId: string;
  canEditOnWeb: boolean;
};

export function MobilePresentationCard({ businessId, canEditOnWeb }: Props) {
  const colors = useColors();
  const { data: raw } = useTenantExperience(businessId);
  const data = raw as TenantExperienceApi | null | undefined;

  const presetLabel = data?.presentation?.label ?? "Platform Default";
  const accent = data?.presentation?.brandAccentHex ?? data?.publicAppearance?.brandAccentHex;
  const presetsEnabled = data?.presentation?.presetsEnabled ?? false;

  if (!presetsEnabled) return null;

  const webSettings = dashboardSettingsUrl("shop", businessId);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Public appearance</Text>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        Preset: <Text style={{ color: colors.foreground, fontFamily: fonts.bodyMed }}>{presetLabel}</Text>
      </Text>
      {accent ? (
        <View style={styles.accentRow}>
          <View style={[styles.swatch, { backgroundColor: accent }]} />
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{accent}</Text>
        </View>
      ) : null}
      <Text style={[styles.meta, { color: colors.mutedForeground, marginTop: 6 }]}>
        Preset colours apply on this device; pick skins and live `/b` preview on web.
      </Text>
      {canEditOnWeb ? (
        <Pressable
          onPress={() => void Linking.openURL(webSettings)}
          style={[styles.btn, { borderColor: colors.border }]}
        >
          <Text style={[styles.btnText, { color: colors.primary }]}>Edit on web</Text>
          <Feather name="external-link" size={16} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  title: {
    ...type.label,
    fontSize: 16,
    fontFamily: fonts.bodySemi,
  },
  meta: {
    ...type.caption,
  },
  accentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  btn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  btnText: {
    ...type.body,
    fontFamily: fonts.bodyMed,
  },
});
