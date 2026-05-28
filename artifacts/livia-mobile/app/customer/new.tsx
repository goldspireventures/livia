import { useCreateCustomer } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

export default function NewCustomerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { currentBusiness } = useBusiness();
  const { mutateAsync: createCustomer, isPending } = useCreateCustomer();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input + "55", color: colors.foreground, borderColor: colors.border },
  ];

  const onSave = async () => {
    if (!currentBusiness?.id || !firstName.trim()) {
      setError("First name is required.");
      haptics.warning();
      return;
    }
    setError("");
    try {
      const created = await createCustomer({
        businessId: currentBusiness.id,
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        },
      });
      haptics.success();
      const id = (created as { id?: string })?.id;
      if (id) router.replace(`/customer/${id}`);
      else router.back();
    } catch {
      setError("Could not create client.");
      haptics.warning();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>New client</Text>
      </View>

      <View style={styles.form}>
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
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={inputStyle}
          placeholder="Phone"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <Pressable
          onPress={onSave}
          disabled={isPending}
          style={({ pressed }) => [
            styles.save,
            { backgroundColor: colors.primary, opacity: pressed || isPending ? 0.85 : 1 },
          ]}
        >
          {isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.saveText, { color: colors.primaryForeground }]}>Save client</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { ...type.title },
  form: { paddingHorizontal: 20, gap: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  error: { ...type.body, fontSize: 14 },
  save: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { fontFamily: fonts.bodyMed, fontSize: 16 },
});
