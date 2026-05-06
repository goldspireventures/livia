import {
  useCreateBooking,
  useListCustomers,
  useListServices,
  useListStaff,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

function defaultStartTime() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString().slice(0, 16);
}

export default function NewBookingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";

  const { data: staffList } = useListStaff(bid, {}, { query: { enabled: !!bid } as any });
  const { data: services } = useListServices(bid, {}, { query: { enabled: !!bid } as any });
  const { data: customerData } = useListCustomers(bid, { limit: 50 }, { query: { enabled: !!bid } as any });
  const customers = customerData?.data ?? [];

  const { mutateAsync: createBooking, isPending } = useCreateBooking();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(defaultStartTime());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!selectedCustomerId) { setError("Select a client."); return; }
    if (!selectedServiceId) { setError("Select a service."); return; }
    if (!selectedStaffId) { setError("Select a staff member."); return; }
    if (!startTime) { setError("Enter a start time."); return; }
    setError("");

    const start = new Date(startTime);

    try {
      await createBooking({
        businessId: bid,
        data: {
          staffId: selectedStaffId,
          serviceId: selectedServiceId,
          customerId: selectedCustomerId,
          startAt: start.toISOString(),
          notes: notes || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Could not create booking.");
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Client *</Text>
          {customers.length === 0 ? (
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              No clients yet — add a client first before booking.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {customers.slice(0, 20).map((c) => {
                  const label = c.displayName ?? c.firstName ?? "Unknown";
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.chip,
                        { borderColor: colors.border, backgroundColor: selectedCustomerId === c.id ? colors.primary + "22" : colors.input },
                      ]}
                      onPress={() => setSelectedCustomerId(c.id)}
                    >
                      <Text style={{ color: selectedCustomerId === c.id ? colors.primary : colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Service *</Text>
          <View style={styles.chips}>
            {(services ?? []).filter((s) => s.isActive !== false).map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: selectedServiceId === s.id ? colors.primary + "22" : colors.input },
                ]}
                onPress={() => setSelectedServiceId(s.id)}
              >
                <Text style={{ color: selectedServiceId === s.id ? colors.primary : colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Staff *</Text>
          <View style={styles.chips}>
            {(staffList ?? []).filter((s) => s.isActive !== false).map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: selectedStaffId === s.id ? colors.primary + "22" : colors.input },
                ]}
                onPress={() => setSelectedStaffId(s.id)}
              >
                <Text style={{ color: selectedStaffId === s.id ? colors.primary : colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                  {s.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Start time (YYYY-MM-DDTHH:MM)
          </Text>
          <TextInput
            style={inputStyle}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="2025-01-15T10:00"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Notes</Text>
          <TextInput
            style={[inputStyle, styles.textarea]}
            placeholder="Any special requests…"
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }, isPending && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={isPending}
          activeOpacity={0.85}
          testID="create-booking-submit"
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Create Booking</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  field: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textarea: { height: 80, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  error: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
