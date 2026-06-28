import { useCreateService } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { OperationalScreen } from "@/components/OperationalScreen";
import { useBusiness } from "@/contexts/BusinessContext";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { dashboardSettingsUrl } from "@/lib/dashboard-url";
import {
  BEAUTY_SERVICE_CATEGORIES,
  businessVocabulary,
} from "@workspace/policy";

export default function NewServiceScreen() {
  const colors = useColors();
  const router = useRouter();
  const haptics = useHaptics();
  const qc = useQueryClient();
  const { currentBusiness } = useBusiness();
  const { mutateAsync: createService, isPending } = useCreateService();

  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const vocab = businessVocabulary(vertical, currentBusiness?.category);
  const serviceNoun = vocab.serviceNoun;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [aftercare, setAftercare] = useState("");
  const [depositPercent, setDepositPercent] = useState("");
  const [error, setError] = useState("");

  const currency = currentBusiness?.currency ?? "EUR";
  const bid = currentBusiness?.id ?? "";

  const categoryOptions = useMemo(() => {
    if (vertical === "beauty" || vertical === "hair" || vertical === "medspa") {
      return BEAUTY_SERVICE_CATEGORIES;
    }
    if (vertical === "wellness") {
      return ["Massage", "Facial", "Body treatment", "Couples", "Other"];
    }
    return [];
  }, [vertical]);

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input + "55", color: colors.foreground, borderColor: colors.border },
  ];

  const onSave = async () => {
    if (!bid || !name.trim()) {
      setError(`${serviceNoun.charAt(0).toUpperCase()}${serviceNoun.slice(1)} name is required.`);
      haptics.warning();
      return;
    }
    const durationMinutes = parseInt(duration, 10);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 5) {
      setError("Duration must be at least 5 minutes.");
      haptics.warning();
      return;
    }
    setError("");
    try {
      await createService({
        businessId: bid,
        data: {
          name: name.trim(),
          durationMinutes,
          description: description.trim() || undefined,
          aftercareInstructions: aftercare.trim() || undefined,
          category: category.trim() || undefined,
          priceMinor: price.trim() ? Math.round(parseFloat(price) * 100) : 0,
          currency,
          depositPercent:
            depositPercent.trim() === ""
              ? undefined
              : Math.min(100, Math.max(0, Number.parseInt(depositPercent, 10) || 0)),
        },
      });
      invalidateOperationalState(qc, bid);
      haptics.success();
      router.back();
    } catch {
      setError(`Could not create ${serviceNoun}.`);
      haptics.warning();
    }
  };

  return (
    <OperationalScreen
      scroll
      title={`New ${serviceNoun}`}
      subtitle={`Create the options Liv can offer in booking.`}
      actions={
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
      }
      contentStyle={{ paddingBottom: 40 }}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.form}>
          <TextInput
            style={inputStyle}
            placeholder={`${serviceNoun.charAt(0).toUpperCase()}${serviceNoun.slice(1)} name`}
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
          />
          {categoryOptions.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {categoryOptions.map((c) => {
                const active = category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(active ? "" : c)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + "18" : colors.card,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? colors.primary : colors.foreground, fontSize: 13 }}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <TextInput
              style={inputStyle}
              placeholder="Category (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={category}
              onChangeText={setCategory}
            />
          )}
          <TextInput
            style={inputStyle}
            placeholder="Duration (minutes)"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            value={duration}
            onChangeText={setDuration}
          />
          <TextInput
            style={inputStyle}
            placeholder={`Price (${currency})`}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            style={inputStyle}
            placeholder="Deposit % (optional)"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            value={depositPercent}
            onChangeText={setDepositPercent}
          />
          {depositPercent.trim() ? (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Overrides shop default deposit for this {serviceNoun} when set.
            </Text>
          ) : null}
          <TextInput
            style={[inputStyle, styles.multiline]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={[inputStyle, styles.multiline]}
            placeholder="Aftercare instructions (optional)"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={aftercare}
            onChangeText={setAftercare}
          />
          <Pressable
            onPress={() => void Linking.openURL(dashboardSettingsUrl("shop", bid))}
            style={[styles.webLink, { borderColor: colors.border }]}
          >
            <Feather name="image" size={14} color={colors.primary} />
            <Text style={[styles.webLinkText, { color: colors.primary }]}>
              Add photo on web — syncs to booking page
            </Text>
          </Pressable>
          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          <Pressable
            onPress={onSave}
            disabled={isPending}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9 },
            ]}
          >
            {isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
                Save {serviceNoun}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  form: { padding: 16, gap: 12, paddingBottom: 40 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hint: { ...type.caption, fontSize: 12, marginTop: -6 },
  webLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  webLinkText: { fontFamily: fonts.bodySemi, fontSize: 13, flex: 1 },
  error: { ...type.caption, fontSize: 13 },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { fontFamily: fonts.bodySemi, fontSize: 16 },
});
