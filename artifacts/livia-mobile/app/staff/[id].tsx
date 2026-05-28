import {
  useGetStaff,
  useGetStaffServices,
  useUpdateStaff,
  useListServices,
  useSetStaffServices,
  getGetStaffQueryKey,
  getGetStaffServicesQueryKey,
  getListStaffQueryKey,
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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useMembership } from "@/hooks/useMembership";
import { fonts, type } from "@/constants/typography";

export default function StaffDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentBusiness } = useBusiness();
  const { role } = useMembership();
  const bid = currentBusiness?.id ?? "";
  const canEdit = role === "OWNER" || role === "ADMIN";

  const { data: staff, isLoading } = useGetStaff(bid, id ?? "", {
    query: { enabled: !!bid && !!id } as never,
  });

  const { data: allServices } = useListServices(bid, { isActive: true }, {
    query: { enabled: !!bid && canEdit } as never,
  });

  const { data: assignedServices } = useGetStaffServices(bid, id ?? "", {
    query: { enabled: !!bid && !!id } as never,
  });

  const { mutateAsync: updateStaff, isPending: savingProfile } = useUpdateStaff();
  const { mutateAsync: setStaffServices, isPending: savingServices } = useSetStaffServices();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState("#22d3ee");
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!staff) return;
    setDisplayName(staff.displayName ?? "");
    setFirstName(staff.firstName ?? "");
    setLastName(staff.lastName ?? "");
    setEmail(staff.email ?? "");
    setColor(staff.color ?? "#22d3ee");
  }, [staff]);

  useEffect(() => {
    if (!assignedServices) return;
    setAssignedIds(new Set(assignedServices.map((s) => s.id)));
  }, [assignedServices]);

  const assignedCount = assignedIds.size;

  const toggleActive = async () => {
    if (!staff || !canEdit) return;
    try {
      await updateStaff({
        businessId: bid,
        staffId: staff.id,
        data: { isActive: !staff.isActive },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: getGetStaffQueryKey(bid, staff.id) });
      qc.invalidateQueries({ queryKey: getListStaffQueryKey(bid) });
    } catch {
      setError("Could not update status.");
    }
  };

  const saveProfile = async () => {
    if (!staff || !displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    setError("");
    try {
      await updateStaff({
        businessId: bid,
        staffId: staff.id,
        data: {
          displayName: displayName.trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          color,
        },
      });
      qc.invalidateQueries({ queryKey: getGetStaffQueryKey(bid, staff.id) });
      qc.invalidateQueries({ queryKey: getListStaffQueryKey(bid) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditing(false);
    } catch {
      setError("Could not save profile.");
    }
  };

  const toggleService = async (serviceId: string) => {
    if (!staff || !canEdit) return;
    const next = new Set(assignedIds);
    if (next.has(serviceId)) next.delete(serviceId);
    else next.add(serviceId);
    setAssignedIds(next);
    try {
      await setStaffServices({
        businessId: bid,
        staffId: staff.id,
        data: { serviceIds: [...next] },
      });
      qc.invalidateQueries({ queryKey: getGetStaffServicesQueryKey(bid, staff.id) });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setAssignedIds(assignedIds);
      setError("Could not update services.");
    }
  };

  const inputStyle = useMemo(
    () => [
      styles.input,
      { backgroundColor: colors.input + "55", color: colors.foreground, borderColor: colors.border },
    ],
    [colors],
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!staff) {
    return <EmptyState icon="user-x" title="Team member not found" />;
  }

  const initials = staff.displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: (staff.color ?? colors.primary) + "33" }]}>
            <Text style={[styles.initials, { color: staff.color ?? colors.primary }]}>{initials}</Text>
          </View>
          {!editing ? (
            <>
              <Text style={[styles.name, { color: colors.foreground }]}>{staff.displayName}</Text>
              <Text style={[styles.roleBadge, { color: colors.mutedForeground }]}>
                {staff.isActive === false ? "Inactive on roster" : "Active · books on calendar"}
              </Text>
              {staff.email && (
                <Text style={[styles.contact, { color: colors.mutedForeground }]}>{staff.email}</Text>
              )}
              {staff.phone ? (
                <Text style={[styles.contact, { color: colors.mutedForeground }]}>{staff.phone}</Text>
              ) : null}
              {canEdit && (
                <Pressable onPress={() => setEditing(true)} style={[styles.editBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit profile</Text>
                </Pressable>
              )}
            </>
          ) : (
            <View style={styles.editForm}>
              <TextInput
                style={inputStyle}
                placeholder="Display name *"
                placeholderTextColor={colors.mutedForeground}
                value={displayName}
                onChangeText={setDisplayName}
              />
              <TextInput
                style={inputStyle}
                placeholder="First name"
                placeholderTextColor={colors.mutedForeground}
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={inputStyle}
                placeholder="Email"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
              <View style={styles.editActions}>
                <Pressable onPress={() => setEditing(false)}>
                  <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
                </Pressable>
                <TouchableOpacity
                  onPress={() => void saveProfile()}
                  disabled={savingProfile}
                  style={[styles.saveChip, { backgroundColor: colors.primary }]}
                >
                  <Text style={{ color: colors.primaryForeground, fontFamily: fonts.bodySemi }}>
                    {savingProfile ? "Saving…" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {canEdit && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Active on roster</Text>
              <Switch
                value={staff.isActive !== false}
                onValueChange={() => void toggleActive()}
                disabled={savingProfile}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        )}

        {canEdit && (allServices?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Services ({assignedCount})
            </Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              Only assigned services appear when booking for this team member.
            </Text>
            {(allServices ?? []).map((s) => {
              const on = assignedIds.has(s.id);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => void toggleService(s.id)}
                  disabled={savingServices}
                  style={[
                    styles.serviceRow,
                    {
                      backgroundColor: on ? colors.primary + "12" : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.serviceName, { color: colors.foreground }]}>{s.name}</Text>
                    <Text style={[styles.serviceDur, { color: colors.mutedForeground }]}>
                      {s.durationMinutes} min
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.check,
                      {
                        borderColor: on ? colors.primary : colors.border,
                        backgroundColor: on ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    {on && <Text style={{ color: colors.primaryForeground, fontSize: 12 }}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {!canEdit && assignedServices && assignedServices.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Assigned services</Text>
            {assignedServices.map((s) => (
              <View
                key={s.id}
                style={[styles.serviceRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.serviceName, { color: colors.foreground }]}>{s.name}</Text>
              </View>
            ))}
          </View>
        )}

        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  initials: { fontSize: 26, fontFamily: fonts.bodySemi },
  name: { fontSize: 20, fontFamily: fonts.bodySemi },
  roleBadge: { fontSize: 12, fontFamily: fonts.body, marginTop: 2 },
  contact: { fontSize: 14, fontFamily: fonts.body },
  editBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  editBtnText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  editForm: { width: "100%", gap: 8, marginTop: 8 },
  editActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  saveChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontFamily: fonts.body, fontSize: 15 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontSize: 16, fontFamily: fonts.bodySemi },
  section: { gap: 8 },
  sectionTitle: { fontSize: 17, fontFamily: fonts.bodySemi },
  sectionHint: { fontSize: 13, fontFamily: fonts.body, marginBottom: 4 },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  serviceName: { fontSize: 15, fontFamily: fonts.bodySemi },
  serviceDur: { fontSize: 13, fontFamily: fonts.body, marginTop: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { textAlign: "center", fontFamily: fonts.body, fontSize: 13 },
});
