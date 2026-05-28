import {
  useGetCustomer,
  getGetCustomerQueryKey,
  useUpdateCustomer,
  getListCustomersQueryKey,
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useMembership } from "@/hooks/useMembership";
import { fonts, type } from "@/constants/typography";
import { useQueryClient } from "@tanstack/react-query";

export default function EditCustomerScreen() {
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

  const { data: customer, isLoading } = useGetCustomer(bid, id ?? "", {
    query: { enabled: !!bid && !!id } as never,
  });

  const { mutateAsync: updateCustomer, isPending } = useUpdateCustomer();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customer) return;
    setFirstName(customer.firstName ?? "");
    setLastName(customer.lastName ?? "");
    setEmail(customer.email ?? "");
    setPhone(customer.phone ?? "");
    setNotes((customer as { notes?: string }).notes ?? "");
  }, [customer]);

  useEffect(() => {
    if (!canEdit && !isLoading) router.back();
  }, [canEdit, isLoading, router]);

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input + "55", color: colors.foreground, borderColor: colors.border },
  ];

  const onSave = async () => {
    if (!bid || !id || !firstName.trim()) {
      setError("First name is required.");
      haptics.warning();
      return;
    }
    setError("");
    try {
      await updateCustomer({
        businessId: bid,
        customerId: id,
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(bid, id) });
      qc.invalidateQueries({ queryKey: getListCustomersQueryKey(bid) });
      haptics.success();
      router.back();
    } catch {
      setError("Could not save — check the details and try again.");
      haptics.warning();
    }
  };

  if (isLoading || !customer) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Edit client</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <TextInput
          style={inputStyle}
          placeholder="First name *"
          placeholderTextColor={colors.mutedForeground}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={inputStyle}
          placeholder="Last name"
          placeholderTextColor={colors.mutedForeground}
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={inputStyle}
          placeholder="Email"
          placeholderTextColor={colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={inputStyle}
          placeholder="Phone"
          placeholderTextColor={colors.mutedForeground}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={[inputStyle, styles.textarea]}
          placeholder="Notes — preferences, formulas…"
          placeholderTextColor={colors.mutedForeground}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }, isPending && { opacity: 0.6 }]}
          onPress={() => void onSave()}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Save client</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  error: { ...type.caption, textAlign: "center" },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: fonts.bodySemi },
});
