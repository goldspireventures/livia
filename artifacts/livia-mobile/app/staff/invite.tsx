import { useCreateInvitation } from "@workspace/api-client-react";
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
import { ScreenPurpose } from "@/components/ScreenPurpose";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { useMembership } from "@/hooks/useMembership";
import { getStaffInviteRedirectUrl } from "@/lib/mobile-staff-invite";
import { fonts, type } from "@/constants/typography";
import {
  OWNERSHIP_SUCCESSION,
  STAFF_INVITE_JOBS,
  staffInviteJobToMembership,
  type StaffInviteJobKind,
} from "@workspace/policy";

export default function InviteStaffScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { currentBusiness } = useBusiness();
  const { role } = useMembership();
  const { mutateAsync: invite, isPending } = useCreateInvitation();

  const [email, setEmail] = useState("");
  const [job, setJob] = useState<StaffInviteJobKind>("floor");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const canInvite = role === "OWNER" || role === "ADMIN";

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input + "55", color: colors.foreground, borderColor: colors.border },
  ];

  const onSend = async () => {
    if (!canInvite) return;
    if (!currentBusiness?.id || !email.trim()) {
      setError("Email is required.");
      haptics.warning();
      return;
    }
    setError("");
    const api = staffInviteJobToMembership(job);
    try {
      await invite({
        businessId: currentBusiness.id,
        data: {
          email: email.trim().toLowerCase(),
          role: api.role,
          redirectUrl: getStaffInviteRedirectUrl(),
          ...(api.deskRole ? { deskRole: api.deskRole } : {}),
        } as { email: string; role: "STAFF" | "ADMIN"; deskRole?: "manager" | "reception"; redirectUrl: string },
      });
      haptics.success();
      setSent(true);
    } catch {
      setError("Could not send invitation.");
      haptics.warning();
    }
  };

  if (!canInvite) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Invite teammate</Text>
        <Text style={{ color: colors.mutedForeground, padding: 16 }}>
          Only owners and managers can invite staff.
        </Text>
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
        <Text style={[styles.title, { color: colors.foreground }]}>Invite teammate</Text>
      </View>

      <View style={styles.form}>
        {sent ? (
          <>
            <Feather name="mail" size={32} color={colors.primary} />
            <Text style={[styles.sentTitle, { color: colors.foreground }]}>Invitation sent</Text>
            <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
              {email} will receive an email to join {currentBusiness?.name}. When they accept, Livia
              opens with the access you chose below.
            </Text>
            <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
              <Text style={{ color: colors.primary, fontFamily: fonts.bodySemi }}>Done</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ScreenPurpose
              icon="mail"
              title="Why pick a role?"
              body={OWNERSHIP_SUCCESSION.teamInvite.rolePickerHint}
            />

            <TextInput
              style={inputStyle}
              placeholder="Email address"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.help, { color: colors.mutedForeground }]}>
              {OWNERSHIP_SUCCESSION.teamInvite.rolePickerLabel}
            </Text>
            {STAFF_INVITE_JOBS.map((j) => (
              <Pressable
                key={j.id}
                onPress={() => {
                  haptics.selection();
                  setJob(j.id);
                }}
                style={[
                  styles.jobCard,
                  {
                    borderColor: job === j.id ? colors.primary : colors.border,
                    backgroundColor: job === j.id ? colors.primary + "12" : colors.card,
                  },
                ]}
              >
                <Text style={[styles.jobTitle, { color: colors.foreground }]}>{j.title}</Text>
                <Text style={[styles.jobBody, { color: colors.mutedForeground }]}>{j.body}</Text>
              </Pressable>
            ))}

            {error ? <Text style={{ color: colors.destructive }}>{error}</Text> : null}
            <Pressable
              onPress={onSend}
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
                  Send invitation
                </Text>
              )}
            </Pressable>
          </>
        )}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontFamily: fonts.serifMedium, fontSize: 24 },
  form: { padding: 16, gap: 14, alignItems: "stretch" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  help: { fontFamily: fonts.bodySemi, fontSize: 14 },
  jobCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 6 },
  jobTitle: { fontFamily: fonts.bodySemi, fontSize: 15 },
  jobBody: { ...type.body, fontSize: 13, lineHeight: 18 },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  saveText: { fontFamily: fonts.bodySemi, fontSize: 16 },
  sentTitle: { fontFamily: fonts.serifMedium, fontSize: 22, marginTop: 8 },
});
