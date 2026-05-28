import {
  useCreateBooking,
  useListCustomers,
  useListServices,
  useListStaff,
  useGetAvailableSlots,
  listCustomers,
  type Customer,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { staffListParams } from "@/lib/staff-params";
import { fonts, type } from "@/constants/typography";

const STEPS = ["Client", "Service", "Team", "Time", "Confirm"] as const;
type Step = (typeof STEPS)[number];
const PAGE_SIZE = 30;

function formatSlotTime(iso: string, timeZone: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}

export default function NewBookingScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    customerId?: string;
    serviceId?: string;
    staffId?: string;
    noteSeed?: string;
  }>();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const tz =
    currentBusiness?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [step, setStep] = useState<Step>("Client");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [customerOffset, setCustomerOffset] = useState(0);
  const [customerRows, setCustomerRows] = useState<Customer[]>([]);

  const debouncedSearch = useDebouncedValue(customerSearch, 300);

  useEffect(() => {
    if (params.customerId) setSelectedCustomerId(params.customerId);
    if (params.serviceId) setSelectedServiceId(params.serviceId);
    if (params.staffId) setSelectedStaffId(params.staffId || null);
    if (params.noteSeed) setNotes(params.noteSeed);
  }, [params.customerId, params.serviceId, params.staffId, params.noteSeed]);

  useEffect(() => {
    setCustomerOffset(0);
    setCustomerRows([]);
  }, [debouncedSearch, bid]);

  const { data: customerPage, isLoading: customersLoading } = useListCustomers(
    bid,
    { search: debouncedSearch || undefined, limit: PAGE_SIZE, offset: customerOffset },
    { query: { enabled: !!bid && step === "Client" } as never },
  );

  useEffect(() => {
    const rows = customerPage?.data ?? [];
    setCustomerRows((prev) => (customerOffset === 0 ? rows : [...prev, ...rows]));
  }, [customerPage, customerOffset]);

  const { data: services } = useListServices(bid, { isActive: true }, { query: { enabled: !!bid } as never });
  const { data: staffList, isLoading: staffLoading } = useListStaff(
    bid,
    staffListParams({ isActive: true, serviceId: selectedServiceId ?? undefined }),
    { query: { enabled: !!bid && !!selectedServiceId } as never },
  );

  const { data: slotsData, isLoading: slotsLoading } = useGetAvailableSlots(
    bid,
    {
      serviceId: selectedServiceId ?? "",
      date,
      staffId: selectedStaffId ?? undefined,
    },
    {
      query: {
        enabled: !!bid && !!selectedServiceId && !!date && step === "Time",
      } as never,
    },
  );

  const { mutateAsync: createBooking, isPending } = useCreateBooking();

  const availableSlots = useMemo(
    () =>
      ((slotsData as { slots?: { startAt: string; available: boolean }[] })?.slots ?? []).filter(
        (s) => s.available,
      ),
    [slotsData],
  );

  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    if (!selectedServiceId || !selectedStaffId) return;
    const ok = (staffList ?? []).some((s) => s.id === selectedStaffId);
    if (!ok) setSelectedStaffId(null);
  }, [selectedServiceId, staffList, selectedStaffId]);

  const goNext = () => {
    setError("");
    if (step === "Client" && !selectedCustomerId) {
      setError("Choose a client.");
      return;
    }
    if (step === "Service" && !selectedServiceId) {
      setError("Choose a service.");
      return;
    }
    if (step === "Time" && !selectedSlot) {
      setError("Pick an available time.");
      return;
    }
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    setError("");
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
    else router.back();
  };

  const handleCreate = async () => {
    if (!selectedCustomerId || !selectedServiceId || !selectedSlot) {
      setError("Missing required fields.");
      return;
    }
    setError("");
    try {
      await createBooking({
        businessId: bid,
        data: {
          staffId: selectedStaffId ?? undefined,
          serviceId: selectedServiceId,
          customerId: selectedCustomerId,
          startAt: selectedSlot,
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

  const staffHint =
    selectedServiceId && !staffLoading && (staffList ?? []).length === 0
      ? "No one is assigned to this service yet. Assign team members under Staff → Services."
      : null;

  const selectedClient = customerRows.find((c) => c.id === selectedCustomerId);
  const selectedService = (services ?? []).find((s) => s.id === selectedServiceId);
  const selectedStaff = (staffList ?? []).find((s) => s.id === selectedStaffId);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              { backgroundColor: i <= stepIndex ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
        Step {stepIndex + 1} of {STEPS.length} — {step}
      </Text>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === "Client" && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Search clients</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
              ]}
              placeholder="Name, email, phone…"
              placeholderTextColor={colors.mutedForeground}
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
            {customersLoading && customerRows.length === 0 ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
            ) : customerRows.length === 0 ? (
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                {customerSearch ? "No matches." : "No clients yet — add one first."}
              </Text>
            ) : (
              <View style={styles.chips}>
                {customerRows.map((c) => {
                  const label = c.displayName ?? c.firstName ?? "Unknown";
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.chip,
                        {
                          borderColor: colors.border,
                          backgroundColor:
                            selectedCustomerId === c.id ? colors.primary + "22" : colors.input,
                        },
                      ]}
                      onPress={() => setSelectedCustomerId(c.id)}
                    >
                      <Text
                        style={{
                          color: selectedCustomerId === c.id ? colors.primary : colors.foreground,
                          fontSize: 13,
                          fontFamily: fonts.bodySemi,
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {(customerPage?.total ?? 0) > customerRows.length && (
              <Pressable
                onPress={async () => {
                  const next = customerOffset + PAGE_SIZE;
                  const more = await listCustomers(bid, {
                    search: debouncedSearch || undefined,
                    limit: PAGE_SIZE,
                    offset: next,
                  });
                  setCustomerOffset(next);
                  const rows = more.data ?? [];
                  setCustomerRows((prev) => {
                    const ids = new Set(prev.map((x) => x.id));
                    return [...prev, ...rows.filter((x) => !ids.has(x.id))];
                  });
                }}
              >
                <Text style={[styles.link, { color: colors.primary }]}>Load more clients</Text>
              </Pressable>
            )}
          </View>
        )}

        {step === "Service" && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Service *</Text>
            <View style={styles.chips}>
              {(services ?? [])
                .filter((s) => s.isActive !== false)
                .map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.chip,
                      {
                        borderColor: colors.border,
                        backgroundColor:
                          selectedServiceId === s.id ? colors.primary + "22" : colors.input,
                      },
                    ]}
                    onPress={() => {
                      setSelectedServiceId(s.id);
                      setSelectedStaffId(null);
                      setSelectedSlot("");
                    }}
                  >
                    <Text
                      style={{
                        color: selectedServiceId === s.id ? colors.primary : colors.foreground,
                        fontSize: 13,
                        fontFamily: fonts.bodySemi,
                      }}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        {step === "Team" && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Who? *</Text>
            {staffHint ? (
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>{staffHint}</Text>
            ) : null}
            <View style={styles.chips}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    borderColor: colors.border,
                    backgroundColor: !selectedStaffId ? colors.primary + "22" : colors.input,
                  },
                ]}
                onPress={() => {
                  setSelectedStaffId(null);
                  setSelectedSlot("");
                }}
              >
                <Text
                  style={{
                    color: !selectedStaffId ? colors.primary : colors.foreground,
                    fontFamily: fonts.bodySemi,
                    fontSize: 13,
                  }}
                >
                  First available
                </Text>
              </TouchableOpacity>
              {(staffList ?? []).map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.chip,
                    {
                      borderColor: colors.border,
                      backgroundColor:
                        selectedStaffId === s.id ? colors.primary + "22" : colors.input,
                    },
                  ]}
                  onPress={() => {
                    setSelectedStaffId(s.id);
                    setSelectedSlot("");
                  }}
                >
                  <Text
                    style={{
                      color: selectedStaffId === s.id ? colors.primary : colors.foreground,
                      fontSize: 13,
                      fontFamily: fonts.bodySemi,
                    }}
                  >
                    {s.displayName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === "Time" && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Date</Text>
            {Platform.OS === "web" ? (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
                ]}
                value={date}
                onChangeText={(v) => {
                  setDate(v);
                  setSelectedSlot("");
                }}
                placeholder="YYYY-MM-DD"
              />
            ) : (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
                ]}
                value={date}
                onChangeText={(v) => {
                  setDate(v);
                  setSelectedSlot("");
                }}
                placeholder="YYYY-MM-DD"
              />
            )}
            <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 8 }]}>
              Available times ({tz})
            </Text>
            {slotsLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : availableSlots.length === 0 ? (
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                No slots this day — try another date or team member.
              </Text>
            ) : (
              <View style={styles.chips}>
                {availableSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.startAt}
                    style={[
                      styles.chip,
                      {
                        borderColor: colors.border,
                        backgroundColor:
                          selectedSlot === slot.startAt ? colors.primary + "22" : colors.input,
                      },
                    ]}
                    onPress={() => setSelectedSlot(slot.startAt)}
                  >
                    <Text
                      style={{
                        color: selectedSlot === slot.startAt ? colors.primary : colors.foreground,
                        fontFamily: fonts.bodySemi,
                        fontSize: 13,
                      }}
                    >
                      {formatSlotTime(slot.startAt, tz)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {step === "Confirm" && (
          <View style={styles.field}>
            <Text style={[styles.summary, { color: colors.foreground }]}>
              {selectedClient?.displayName ?? selectedClient?.firstName ?? "—"}
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              {selectedService?.name ?? "—"} · {selectedStaff?.displayName ?? "First available"}
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              {selectedSlot ? formatSlotTime(selectedSlot, tz) : "—"}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textarea,
                { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
              ]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        )}

        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.footerBtn}>
          <Text style={{ color: colors.foreground, fontFamily: fonts.bodySemi }}>Back</Text>
        </TouchableOpacity>
        {step !== "Confirm" ? (
          <TouchableOpacity
            onPress={goNext}
            style={[styles.cta, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.primary }, isPending && { opacity: 0.6 }]}
            onPress={() => void handleCreate()}
            disabled={isPending}
            testID="create-booking-submit"
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Create booking</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progress: { flexDirection: "row", gap: 4, paddingHorizontal: 16, paddingTop: 12 },
  progressDot: { flex: 1, height: 3, borderRadius: 2 },
  stepLabel: { ...type.caption, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  field: { gap: 8 },
  label: { fontSize: 13, fontFamily: fonts.bodySemi },
  hint: { fontSize: 13, fontFamily: fonts.body },
  link: { fontSize: 13, fontFamily: fonts.bodySemi, marginTop: 8 },
  summary: { fontSize: 18, fontFamily: fonts.bodySemi },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  error: { fontSize: 13, textAlign: "center" },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  footerBtn: { justifyContent: "center", paddingHorizontal: 8 },
  cta: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: fonts.bodySemi },
});
