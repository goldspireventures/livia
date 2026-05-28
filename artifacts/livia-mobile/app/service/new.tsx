import { useCreateService } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { fonts, type } from "@/constants/typography";
import { OperationalScreen } from "@/components/OperationalScreen";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";

export default function NewServiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const qc = useQueryClient();
  const { currentBusiness } = useBusiness();
  const { mutateAsync: createService, isPending } = useCreateService();

  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const currency = currentBusiness?.currency ?? "EUR";

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input + "55", color: colors.foreground, borderColor: colors.border },
  ];

  const onSave = async () => {
    if (!currentBusiness?.id || !name.trim()) {
      setError("Service name is required.");
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
        businessId: currentBusiness.id,
        data: {
          name: name.trim(),
          durationMinutes,
          description: description.trim() || undefined,
          priceMinor: price.trim() ? Math.round(parseFloat(price) * 100) : 0,
          currency,
        },
      });
      invalidateOperationalState(qc, currentBusiness.id);
      haptics.success();
      router.back();
    } catch {
      setError("Could not create service.");
      haptics.warning();
    }
  };

  return (
    <OperationalScreen
      scroll
      title="New service"
      subtitle="Create the options Liv can offer in booking."
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
          placeholder="Service name"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
        />
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
          style={[inputStyle, styles.multiline]}
          placeholder="Description (optional)"
          placeholderTextColor={colors.mutedForeground}
          multiline
          value={description}
          onChangeText={setDescription}
        />
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
            <Text style={[styles.saveText, { color: colors.primaryForeground }]}>Save service</Text>
          )}
        </Pressable>
        </View>
      </KeyboardAvoidingView>
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontFamily: fonts.serifMedium, fontSize: 24 },
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
  error: { ...type.caption, fontSize: 13 },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { fontFamily: fonts.bodySemi, fontSize: 16 },
});
