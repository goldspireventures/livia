import {
  useGetService,
  useUpdateService,
  getListServicesQueryKey,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useMembership } from "@/hooks/useMembership";
import { fonts, type } from "@/constants/typography";
import { OperationalScreen } from "@/components/OperationalScreen";
import { invalidateOperationalState } from "@/lib/operational-cache";

export default function ServiceDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentBusiness } = useBusiness();
  const { role } = useMembership();
  const bid = currentBusiness?.id ?? "";
  const canEdit = role === "OWNER" || role === "ADMIN";
  const currency = currentBusiness?.currency ?? "EUR";

  const { data: service, isLoading } = useGetService(bid, id ?? "", {
    query: { enabled: !!bid && !!id } as never,
  });

  const { mutateAsync: updateService, isPending } = useUpdateService();

  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!service) return;
    setName(service.name ?? "");
    setDuration(String(service.durationMinutes ?? 60));
    setPrice(
      service.priceMinor != null && service.priceMinor > 0
        ? (service.priceMinor / 100).toFixed(2)
        : "",
    );
    setDescription(service.description ?? "");
    setActive(service.isActive !== false);
  }, [service]);

  useEffect(() => {
    if (!canEdit && !isLoading) router.back();
  }, [canEdit, isLoading, router]);

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input + "55", color: colors.foreground, borderColor: colors.border },
  ];

  const onSave = async () => {
    if (!bid || !id || !name.trim()) {
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
      await updateService({
        businessId: bid,
        serviceId: id,
        data: {
          name: name.trim(),
          durationMinutes,
          description: description.trim() || undefined,
          priceMinor: price.trim() ? Math.round(parseFloat(price) * 100) : 0,
          currency,
          isActive: active,
        },
      });
      invalidateOperationalState(qc, bid);
      qc.invalidateQueries({ queryKey: getListServicesQueryKey(bid) });
      haptics.success();
      router.back();
    } catch {
      setError("Could not save service.");
      haptics.warning();
    }
  };


  if (isLoading || !service) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <OperationalScreen
      scroll
      title="Edit service"
      subtitle="What clients see on booking and confirmations."
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
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Duration (min)</Text>
            <TextInput
              style={inputStyle}
              keyboardType="number-pad"
              value={duration}
              onChangeText={setDuration}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Price ({currency})</Text>
            <TextInput
              style={inputStyle}
              keyboardType="decimal-pad"
              placeholder="Optional"
              placeholderTextColor={colors.mutedForeground}
              value={price}
              onChangeText={setPrice}
            />
          </View>
        </View>
        <TextInput
          style={[inputStyle, styles.multiline]}
          placeholder="Description"
          placeholderTextColor={colors.mutedForeground}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <View style={[styles.switchRow, { borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>Active for booking</Text>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: colors.muted, true: colors.primary }}
          />
        </View>

        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }, isPending && { opacity: 0.6 }]}
          onPress={() => void onSave()}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Save service</Text>
          )}
        </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontFamily: fonts.serifMedium, fontSize: 24 },
  form: { padding: 16, gap: 12, paddingBottom: 40 },
  label: { ...type.caption, marginBottom: 4 },
  row2: { flexDirection: "row", gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  error: { ...type.caption, textAlign: "center" },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: fonts.bodySemi },
});
