import { useGetCustomer, useGetCustomerRelationship, customFetch } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
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
import { showOwnerLivMemoryPanel } from "@workspace/policy";
import { LivMemoryCard } from "@/components/LivMemoryCard";
import { CustomerPetsCard } from "@/components/CustomerPetsCard";
import { OperationalScreen } from "@/components/OperationalScreen";
import { OperatorSurfaceShell } from "@/components/shell/OperatorSurfaceShell";
import { CollapsibleSettingsSection } from "@/components/settings/CollapsibleSettingsSection";
import { useOperationalChrome } from "@/lib/operational-chrome";
export default function CustomerDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentBusiness } = useBusiness();
  const { role } = useMembership();
  const canEdit = role === "OWNER" || role === "ADMIN";
  const bid = currentBusiness?.id ?? "";
  const chrome = useOperationalChrome(bid);
  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical;
  type ClientSection = "relationship" | "memory" | "pets" | "care" | "notes" | "bookings" | "packages";
  const [openSection, setOpenSection] = useState<ClientSection | null>("bookings");
  const toggleSection = (id: ClientSection) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };
  const showCareSeries = vertical === "allied-health" || vertical === "wellness";
  const showPets = vertical === "pet-grooming";
  const [careSeries, setCareSeries] = useState<
    Array<{
      id: string;
      name: string;
      sessionsTotal?: number;
      sessions?: Array<{ sessionNumber: number; status?: string }>;
    }>
  >([]);
  const [packageCredits, setPackageCredits] = useState<
    Array<{ id: string; packageName: string; creditsRemaining: number; creditsTotal: number }>
  >([]);

  const loadPackageCredits = useCallback(async () => {
    if (!bid || !id) return;
    try {
      const rows = await customFetch<
        Array<{ id: string; packageName: string; creditsRemaining: number; creditsTotal: number }>
      >(`/api/businesses/${bid}/package-credits?customerId=${encodeURIComponent(id)}`);
      setPackageCredits(Array.isArray(rows) ? rows : []);
    } catch {
      setPackageCredits([]);
    }
  }, [bid, id]);

  useEffect(() => {
    void loadPackageCredits();
  }, [loadPackageCredits]);

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

  const { data: relationship } = useGetCustomerRelationship(
    bid,
    id ?? "",
    { query: { enabled: !!bid && !!id } as any },
  );

  if (isLoading) {
    return (
      <OperatorSurfaceShell style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </OperatorSurfaceShell>
    );
  }

  if (!customer) {
    return (
      <OperatorSurfaceShell>
        <EmptyState icon="user-x" title="Client not found" />
      </OperatorSurfaceShell>
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

  const recentBookings = (detail.recentBookings ?? []).slice(0, 5);

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

      {relationship ? (
        <CollapsibleSettingsSection
          id="relationship"
          icon="heart"
          title="Relationship"
          subtitle={(relationship as { stageLabel?: string }).stageLabel}
          expanded={openSection === "relationship"}
          onToggle={() => toggleSection("relationship")}
          chrome={chrome}
        >
          <Text style={[styles.relStage, { color: colors.primary }]}>
            {(relationship as { stageLabel?: string }).stageLabel}
          </Text>
          <Text style={[styles.relHeadline, { color: colors.mutedForeground }]}>
            {(relationship as { headline?: string }).headline}
          </Text>
        </CollapsibleSettingsSection>
      ) : null}

      {recentBookings.length > 0 ? (
        <CollapsibleSettingsSection
          id="bookings"
          icon="calendar"
          title="Recent bookings"
          subtitle={`Last ${recentBookings.length}`}
          expanded={openSection === "bookings"}
          onToggle={() => toggleSection("bookings")}
          chrome={chrome}
        >
          {recentBookings.map((b, i) => (
            <BookingCard
              key={b.id}
              booking={b}
              timeZone={currentBusiness?.timezone}
              showDate
              index={i}
              onPress={() => router.push(`/booking/${b.id}`)}
            />
          ))}
        </CollapsibleSettingsSection>
      ) : null}

      {bid && id && showOwnerLivMemoryPanel(vertical) ? (
        <CollapsibleSettingsSection
          id="memory"
          icon="cpu"
          title="Liv memory"
          subtitle="What Liv remembers between visits"
          expanded={openSection === "memory"}
          onToggle={() => toggleSection("memory")}
          chrome={chrome}
        >
          <LivMemoryCard
            businessId={bid}
            customerId={id}
            canEdit={canEdit}
            vertical={vertical}
            category={(currentBusiness as { category?: string } | undefined)?.category}
          />
        </CollapsibleSettingsSection>
      ) : null}

      {bid && id && showPets ? (
        <CollapsibleSettingsSection
          id="pets"
          icon="heart"
          title="Pets"
          subtitle="Grooming profiles"
          expanded={openSection === "pets"}
          onToggle={() => toggleSection("pets")}
          chrome={chrome}
        >
          <CustomerPetsCard businessId={bid} customerId={id} />
        </CollapsibleSettingsSection>
      ) : null}

      {showCareSeries && careSeries.length > 0 ? (
        <CollapsibleSettingsSection
          id="care"
          icon="activity"
          title="Care series"
          subtitle={`${careSeries.length} active`}
          expanded={openSection === "care"}
          onToggle={() => toggleSection("care")}
          chrome={chrome}
        >
          {careSeries.map((s) => {
            const done = (s.sessions ?? []).filter((x) => x.status === "COMPLETED").length;
            const total = s.sessionsTotal ?? s.sessions?.length ?? 0;
            const left = total > 0 ? Math.max(0, total - done) : null;
            return (
              <View key={s.id} style={{ gap: 2 }}>
                <Text style={[styles.noteText, { color: colors.foreground, fontFamily: fonts.bodySemi }]}>
                  {s.name}
                </Text>
                <Text style={[styles.noteText, { color: colors.mutedForeground, fontSize: 12 }]}>
                  {left != null ? `${left} of ${total} session(s) remaining` : "Care series"}
                </Text>
              </View>
            );
          })}
        </CollapsibleSettingsSection>
      ) : null}

      {packageCredits.length > 0 ? (
        <CollapsibleSettingsSection
          id="packages"
          icon="gift"
          title="Prepaid packs"
          subtitle={`${packageCredits.length} balance${packageCredits.length === 1 ? "" : "s"}`}
          expanded={openSection === "packages"}
          onToggle={() => toggleSection("packages")}
          chrome={chrome}
        >
          {packageCredits.map((p) => (
            <Text key={p.id} style={[styles.noteText, { color: colors.foreground }]}>
              {p.packageName} — {p.creditsRemaining}/{p.creditsTotal} left
            </Text>
          ))}
        </CollapsibleSettingsSection>
      ) : null}

      {customer.notes ? (
        <CollapsibleSettingsSection
          id="notes"
          icon="file-text"
          title="Notes"
          subtitle="Team-visible"
          expanded={openSection === "notes"}
          onToggle={() => toggleSection("notes")}
          chrome={chrome}
        >
          <Text style={[styles.noteText, { color: colors.foreground }]}>{customer.notes}</Text>
        </CollapsibleSettingsSection>
      ) : null}
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
  relCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  relTitle: { ...type.eyebrow, fontSize: 11 },
  relStage: { fontFamily: fonts.serifMedium, fontSize: 20 },
  relHeadline: { ...type.body, fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  eyebrow: { ...type.eyebrow, fontSize: 10.5 },
  noteText: { ...type.body, lineHeight: 22 },
  section: { gap: 10 },
  sectionTitle: { fontFamily: fonts.serifMedium, fontSize: 22, letterSpacing: -0.3 },
});
