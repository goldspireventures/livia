import { useGetCustomer, customFetch, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BookingCard } from "@/components/BookingCard";
import { EmptyState } from "@/components/EmptyState";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useMembership } from "@/hooks/useMembership";
import { LivMemoryCard } from "@/components/LivMemoryCard";
import { OperationalScreen } from "@/components/OperationalScreen";
import { invalidateOperationalState } from "@/lib/operational-cache";

export default function CustomerDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentBusiness } = useBusiness();
  const { role } = useMembership();
  const canEdit = role === "OWNER" || role === "ADMIN";
  const bid = currentBusiness?.id ?? "";
  const [mergeIdentityId, setMergeIdentityId] = useState("");
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState("");
  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  const showCareSeries = vertical === "allied-health" || vertical === "wellness";
  const [careSeries, setCareSeries] = useState<
    Array<{
      id: string;
      name: string;
      sessionsTotal?: number;
      sessions?: Array<{ sessionNumber: number; status?: string }>;
    }>
  >([]);

  const loadCareSeries = useCallback(async () => {
    if (!bid || !id || !showCareSeries) return;
    try {
      const rows = await customFetch<
        Array<{
          id: string;
          name: string;
          sessionsTotal?: number;
          sessions?: Array<{ sessionNumber: number; status?: string }>;
        }>
      >(`/api/businesses/${bid}/care-series?customerId=${encodeURIComponent(id)}`);
      setCareSeries(rows);
    } catch {
      setCareSeries([]);
    }
  }, [bid, id, showCareSeries]);

  useEffect(() => {
    void loadCareSeries();
  }, [loadCareSeries]);

  const { data: customer, isLoading } = useGetCustomer(
    currentBusiness?.id ?? "",
    id ?? "",
    { query: { enabled: !!currentBusiness?.id && !!id } as any },
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState icon="user-x" title="Client not found" />
      </View>
    );
  }

  const detail = customer as unknown as {
    recentBookings?: Array<{ id: string; status: string; startAt: string; endAt: string }>;
  };
  const displayName = customer.displayName ?? customer.firstName ?? "Unknown";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <OperationalScreen
      title="Client"
      subtitle={displayName}
      contentStyle={styles.content}
      actions={
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
      }
    >
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }, elevation.resting]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "1f", borderColor: colors.primary + "55" }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
        </View>
        <Animated.Text
          entering={FadeInDown.duration(360).damping(18).stiffness(180)}
          nativeID={`customer-${customer.id}-name`}
          style={[styles.name, { color: colors.foreground }]}
        >
          {displayName}
        </Animated.Text>
        {customer.email && (
          <Text style={[styles.contact, { color: colors.mutedForeground }]}>{customer.email}</Text>
        )}
        {customer.phone && (
          <Text style={[styles.contact, { color: colors.mutedForeground }]}>{customer.phone}</Text>
        )}
        {customer.isBlocked && (
          <Text style={[styles.blocked, { color: colors.destructive }]}>⛔  Blocked</Text>
        )}
        {canEdit && (
          <Pressable
            onPress={() => router.push(`/customer/edit/${customer.id}`)}
            style={[styles.editBtn, { borderColor: colors.border }]}
            testID="button-edit-customer"
          >
            <Feather name="edit-2" size={16} color={colors.primary} />
            <Text style={[styles.editLabel, { color: colors.primary }]}>Edit client</Text>
          </Pressable>
        )}
        {canEdit && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/booking/new",
                params: { customerId: customer.id },
              })
            }
            style={[styles.bookBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.bookBtnText, { color: colors.primaryForeground }]}>Book appointment</Text>
          </Pressable>
        )}
      </View>

      {bid && id ? (
        <LivMemoryCard businessId={bid} customerId={id} canEdit={canEdit} />
      ) : null}

      {canEdit ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            Platform.OS !== "web" && elevation.resting,
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Merge duplicate channel</Text>
          <Text style={[styles.noteText, { color: colors.mutedForeground, fontSize: 13 }]}>
            Paste a channel identity id from a duplicate profile.
          </Text>
          <TextInput
            style={[
              styles.mergeInput,
              {
                backgroundColor: colors.input + "55",
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Channel identity id"
            placeholderTextColor={colors.mutedForeground}
            value={mergeIdentityId}
            onChangeText={setMergeIdentityId}
          />
          {mergeError ? (
            <Text style={{ color: colors.destructive, fontSize: 12 }}>{mergeError}</Text>
          ) : null}
          <Pressable
            onPress={async () => {
              if (!bid || !id || !mergeIdentityId.trim()) return;
              setMerging(true);
              setMergeError("");
              try {
                await customFetch(`/api/businesses/${bid}/customers/${id}/merge-identity`, {
                  method: "POST",
                  body: JSON.stringify({ identityId: mergeIdentityId.trim() }),
                });
                invalidateOperationalState(qc, bid);
                qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(bid, id) });
                setMergeIdentityId("");
              } catch {
                setMergeError("Merge failed — check the id.");
              } finally {
                setMerging(false);
              }
            }}
            style={[styles.editBtn, { borderColor: colors.primary, alignSelf: "flex-start" }]}
          >
            <Text style={[styles.editLabel, { color: colors.primary }]}>
              {merging ? "Merging…" : "Merge"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {showCareSeries && careSeries.length > 0 ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            Platform.OS !== "web" && elevation.resting,
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Care series</Text>
          {careSeries.map((s) => {
            const done = (s.sessions ?? []).filter((x) => x.status === "COMPLETED").length;
            const total = s.sessionsTotal ?? s.sessions?.length ?? 0;
            const left = total > 0 ? Math.max(0, total - done) : null;
            return (
              <View key={s.id} style={{ marginTop: 8, gap: 2 }}>
                <Text style={[styles.noteText, { color: colors.foreground, fontFamily: fonts.bodySemi }]}>
                  {s.name}
                </Text>
                <Text style={[styles.noteText, { color: colors.mutedForeground, fontSize: 12 }]}>
                  {left != null ? `${left} of ${total} session(s) remaining` : "Care series"}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {customer.notes ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            Platform.OS !== "web" && elevation.resting,
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Notes</Text>
          <Text style={[styles.noteText, { color: colors.foreground }]}>{customer.notes}</Text>
        </View>
      ) : null}

      {detail.recentBookings && detail.recentBookings.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent bookings
          </Text>
          {detail.recentBookings.map((b, i) => (
            <BookingCard
              key={b.id}
              booking={b}
              timeZone={currentBusiness?.timezone}
              showDate
              index={i}
              onPress={() => router.push(`/booking/${b.id}`)}
            />
          ))}
        </View>
      )}
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 14, paddingBottom: 60 },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 26,
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  initials: { ...type.numericSm, fontSize: 26 },
  name: { fontFamily: fonts.serifMedium, fontSize: 28, letterSpacing: -0.4 },
  contact: { ...type.body, fontSize: 14 },
  blocked: { ...type.label, fontSize: 13, marginTop: 4 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  editLabel: { ...type.label, fontSize: 14 },
  bookBtn: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  bookBtnText: { ...type.label, fontSize: 15 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  eyebrow: { ...type.eyebrow, fontSize: 10.5 },
  noteText: { ...type.body, lineHeight: 22 },
  section: { gap: 10 },
  sectionTitle: { fontFamily: fonts.serifMedium, fontSize: 22, letterSpacing: -0.3 },
  mergeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 8,
    fontFamily: fonts.body,
    fontSize: 14,
  },
});
