import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useMobileSkin } from "@/contexts/PresentationThemeContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import {
  usePresentationSettings,
  type PresentationPresetOption,
} from "@/hooks/usePresentationSettings";
import { fonts, type } from "@/constants/typography";
import { dashboardAppearanceUrl } from "@/lib/dashboard-url";
import { presentationPresetsUiEnabled } from "@/lib/presentation-presets-enabled";

type Props = {
  businessId: string;
  canEdit: boolean;
};

const PRESET_SWATCH: Record<string, string> = {
  "platform-default": "#2C2F3A",
  "noir-dusk": "#1A1520",
  "soft-studio": "#F5F0EB",
  "editorial": "#FAF8F5",
  "premium-dark": "#141218",
  "harbour-light": "#E8F4F8",
  "session-rail": "#0F1A1E",
  "evening-ledger": "#1C1814",
};

function PresetChip({
  preset,
  active,
  disabled,
  onPress,
}: {
  preset: PresentationPresetOption;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const swatch = PRESET_SWATCH[preset.cssPreset] ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primary + "18" : colors.card,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.chipSwatch, { backgroundColor: swatch }]} />
      <Text
        style={[
          styles.chipLabel,
          { color: active ? colors.foreground : colors.mutedForeground },
        ]}
        numberOfLines={2}
      >
        {preset.label}
      </Text>
    </Pressable>
  );
}

export function MobilePresentationCard({ businessId, canEdit }: Props) {
  const colors = useColors();
  const haptics = useHaptics();
  const skin = useMobileSkin();
  const { data, isLoading, patch } = usePresentationSettings(businessId);
  const [draftPresetId, setDraftPresetId] = useState("");
  const [draftAccent, setDraftAccent] = useState("");

  useEffect(() => {
    if (!data) return;
    setDraftPresetId(data.presetId);
    setDraftAccent(data.brandAccentHex ?? "");
  }, [data?.presetId, data?.brandAccentHex]);

  const presetsEnabled =
    (data?.presetsEnabled ?? false) && presentationPresetsUiEnabled();

  const dirty =
    !!data &&
    (draftPresetId !== data.presetId || draftAccent.trim() !== (data.brandAccentHex ?? ""));

  const save = useCallback(async () => {
    if (!canEdit || !dirty || patch.isPending) return;
    haptics.tap();
    try {
      await patch.mutateAsync({
        presentationPresetId: draftPresetId !== data?.presetId ? draftPresetId : undefined,
        brandAccentHex: draftAccent.trim() || null,
      });
      haptics.success();
    } catch {
      haptics.warning();
    }
  }, [canEdit, dirty, patch, draftPresetId, draftAccent, data?.presetId, haptics]);

  if (!presetsEnabled && !isLoading) return null;

  const webSettings = dashboardAppearanceUrl(businessId);
  const presetLabel = data?.preset.label ?? skin.effectiveCssPreset;
  const accent = data?.brandAccentHex ?? draftAccent;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Shop appearance</Text>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        One skin for your team app, this phone, and your public booking link. Native layout stays
        mobile-first — colours and preset inherit from the same settings as web.
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Preset</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {(data?.availablePresets ?? []).map((preset) => (
              <PresetChip
                key={preset.id}
                preset={preset}
                active={draftPresetId === preset.id}
                disabled={!canEdit || patch.isPending}
                onPress={() => {
                  haptics.tap();
                  setDraftPresetId(preset.id);
                }}
              />
            ))}
          </ScrollView>

          {canEdit ? (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                Brand accent
              </Text>
              <View style={styles.accentRow}>
                {/^#[0-9A-Fa-f]{6}$/.test(draftAccent.trim()) ? (
                  <View style={[styles.swatch, { backgroundColor: draftAccent.trim() }]} />
                ) : null}
                <TextInput
                  value={draftAccent}
                  onChangeText={setDraftAccent}
                  placeholder="#RRGGBB"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!patch.isPending}
                  style={[
                    styles.accentInput,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                />
              </View>
            </>
          ) : accent ? (
            <View style={[styles.accentRow, { marginTop: 8 }]}>
              <View style={[styles.swatch, { backgroundColor: accent }]} />
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{accent}</Text>
            </View>
          ) : null}

          {!canEdit ? (
            <Text style={[styles.meta, { color: colors.mutedForeground, marginTop: 8 }]}>
              Active:{" "}
              <Text style={{ color: colors.foreground, fontFamily: fonts.bodyMed }}>
                {presetLabel}
              </Text>
            </Text>
          ) : null}

          {canEdit && dirty ? (
            <Pressable
              onPress={() => void save()}
              disabled={patch.isPending}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              {patch.isPending ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
                  Apply on this shop
                </Text>
              )}
            </Pressable>
          ) : null}
        </>
      )}

      <Pressable
        onPress={() => void Linking.openURL(webSettings)}
        style={[styles.btn, { borderColor: colors.border }]}
      >
          <Text style={[styles.btnText, { color: colors.primary }]}>
            Edit look & live booking preview on web
          </Text>
        <Feather name="external-link" size={16} color={colors.primary} />
      </Pressable>
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
    lineHeight: 18,
  },
  sectionLabel: {
    ...type.caption,
    marginTop: 10,
    fontFamily: fonts.bodyMed,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 8,
    paddingRight: 4,
  },
  chip: {
    width: 108,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  chipSwatch: {
    width: "100%",
    height: 28,
    borderRadius: 6,
  },
  chipLabel: {
    ...type.caption,
    fontFamily: fonts.bodyMed,
    fontSize: 12,
    minHeight: 32,
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
  accentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.mono,
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: {
    ...type.body,
    fontFamily: fonts.bodySemi,
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
    flex: 1,
    paddingRight: 8,
  },
});
