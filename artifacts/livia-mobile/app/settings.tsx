import {
  useGetBusiness,
  useGetBusinessCommunications,
  useUpdateBusiness,
  type BusinessCommunications,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { OperationalScreen } from "@/components/OperationalScreen";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useMembership } from "@/hooks/useMembership";
import { usePersona, PERSONA_LABEL } from "@/hooks/usePersona";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { OperationalPolicyBlock } from "@/components/OperationalPolicyBlock";
import {
  canEditLiv,
  canEditShop,
  canViewBilling,
  canViewComms,
  canViewPolicy,
  canViewTeam,
} from "@/lib/settings-persona";
import { useBusinessTimezone } from "@/hooks/useBusinessTimezone";
import { asHref } from "@/lib/navigation";
import { CommsChannelsBlock } from "@/components/CommsChannelsBlock";
import { HelpSupportSheet } from "@/components/HelpSupportSheet";
import { getPublicBookingLabel } from "@/lib/public-booking-url";
import { LivCapabilitiesCard } from "@/components/LivCapabilitiesCard";
import { BillingSummaryCard } from "@/components/BillingSummaryCard";

const PRIVACY_URL = "https://livia.io/legal/privacy";
const TERMS_URL = "https://livia.io/legal/tos";
const DPA_URL = "https://livia.io/legal/dpa";

function aiEnabledFromBusiness(v: string | undefined): boolean {
  return v !== "false" && v !== "0";
}

const PERSONA_HINT: Record<string, string> = {
  org_admin: "Per-location Liv, comms, and billing — switch from Home.",
  owner: "Your business voice, plan, and public booking link.",
  manager: "Liv and comms — roster edits need the owner.",
  staff: "Shop details are view-only here.",
  receptionist: "Comms and booking link — calendar stays on the floor.",
};


function LegalBlock({ colors }: { colors: ReturnType<typeof useColors> }) {
  const links = [
    { label: "Privacy", url: PRIVACY_URL },
    { label: "Terms", url: TERMS_URL },
    { label: "DPA", url: DPA_URL },
  ];
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>Legal</Text>
      {links.map((l) => (
        <Pressable
          key={l.url}
          onPress={() => Linking.openURL(l.url)}
          style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.75 }]}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>{l.label}</Text>
          <Feather name="external-link" size={14} color={colors.primary} />
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const { kind: persona } = usePersona();
  const bid = currentBusiness?.id ?? "";
  const showLiv = canEditLiv(persona);
  const showComms = canViewComms(persona);
  const showTeam = canViewTeam(persona);
  const showBilling = canViewBilling(persona);
  const showPolicy = canViewPolicy(persona);
  const shopNote = !canEditShop(persona);

  const { data: business, isLoading, refetch } = useGetBusiness(bid, {
    query: { enabled: !!bid } as never,
  });

  const { data: comms, isLoading: commsLoading } = useGetBusinessCommunications(bid, {
    query: { enabled: !!bid && showComms } as never,
  });

  const { mutateAsync: patchBusiness, isPending } = useUpdateBusiness();
  const [aiOn, setAiOn] = useState<boolean | null>(null);

  const resolvedAi = useMemo(() => {
    if (aiOn !== null) return aiOn;
    return business ? aiEnabledFromBusiness(business.aiEnabled) : true;
  }, [aiOn, business]);

  const { timeZone: tzLabel } = useBusinessTimezone();
  const pack = verticalPackUi(
    (business as { vertical?: string } | undefined)?.vertical ??
      (currentBusiness as { vertical?: string } | undefined)?.vertical,
    (business as { category?: string } | undefined)?.category,
  );

  const toggleAi = async (next: boolean) => {
    if (!bid || !showLiv) return;
    const prev = resolvedAi;
    setAiOn(next);
    try {
      await patchBusiness({
        businessId: bid,
        data: { aiEnabled: next ? "true" : "false" },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refetch();
      setAiOn(null);
    } catch {
      setAiOn(prev);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
      <OperationalScreen
        title="Settings"
        subtitle={`${currentBusiness?.name ?? "Workspace"} · ${PERSONA_LABEL[persona]}`}
        contentStyle={{ paddingBottom: 48, gap: 14 }}
        actions={
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
        }
      >
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Sensitive changes (billing, ownership, full policy) open on web — mobile is for quick toggles
          and read-only checks on the floor.
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>{PERSONA_HINT[persona]}</Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>{pack.label} · {pack.hint}</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Shop</Text>
              {shopNote && (
                <Text style={[styles.rowMeta, { color: colors.mutedForeground, marginBottom: 6 }]}>
                  View-only — owner updates name, slug, and timezone on web.
                </Text>
              )}
              <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>Timezone</Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>{tzLabel}</Text>
              <Text style={[styles.rowMeta, { color: colors.mutedForeground, marginTop: 10 }]}>
                Public booking
              </Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>
                {currentBusiness?.slug ? getPublicBookingLabel(currentBusiness.slug) : "—"}
              </Text>
              {currentBusiness?.slug ? (
                <Pressable
                  onPress={() => router.push(`/public-book/${currentBusiness.slug}` as never)}
                  style={[styles.navBtn, { borderColor: colors.border, marginTop: 10 }]}
                >
                  <Text style={[styles.navBtnText, { color: colors.primary }]}>Preview customer page</Text>
                  <Feather name="external-link" size={18} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>

            {showTeam && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Team & services</Text>
                <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                  Roster, service assignments, and hours.
                </Text>
                <Pressable
                  onPress={() => router.push(asHref("/staff"))}
                  style={[styles.navBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.navBtnText, { color: colors.primary }]}>Open team</Text>
                  <Feather name="chevron-right" size={18} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => router.push(asHref("/services"))}
                  style={[styles.navBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.navBtnText, { color: colors.primary }]}>Manage services</Text>
                  <Feather name="chevron-right" size={18} color={colors.primary} />
                </Pressable>
              </View>
            )}

            {showComms &&
              <CommsChannelsBlock businessId={bid} comms={comms} loading={commsLoading} />}

            {showPolicy && bid ? (
              <OperationalPolicyBlock businessId={bid} canEditOnWeb={canEditShop(persona)} />
            ) : null}

            {showLiv ? (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  elevation.resting,
                ]}
              >
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>Liv</Text>
                    <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                      Master switch for AI booking and replies.
                    </Text>
                  </View>
                  <Switch
                    value={resolvedAi}
                    disabled={isPending}
                    onValueChange={(v) => void toggleAi(v)}
                    trackColor={{ false: colors.muted, true: colors.primary + "88" }}
                    thumbColor={resolvedAi ? colors.primary : colors.mutedForeground}
                  />
                </View>
                <Text style={[styles.rowMeta, { color: colors.mutedForeground, marginTop: 8 }]}>
                  Tone, greeting, and knowledge — edit on web Settings → Liv.
                </Text>
              </View>
            ) : null}
            {showLiv && bid ? <LivCapabilitiesCard businessId={bid} /> : null}
            {!showLiv ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Liv</Text>
                <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                  Your role cannot change Liv settings.
                </Text>
              </View>
            ) : null}

            {showBilling && bid ? <BillingSummaryCard businessId={bid} /> : null}

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Help</Text>
              <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                Submit a ticket (logs with consent) or email us.
              </Text>
              <HelpSupportSheet />
              <Pressable
                onPress={() => void Linking.openURL("mailto:support@livia.io?subject=Livia%20mobile%20help")}
                style={styles.linkRow}
              >
                <Feather name="mail" size={16} color={colors.primary} />
                <Text style={[styles.linkText, { color: colors.primary }]}>support@livia.io</Text>
              </Pressable>
            </View>

            <LegalBlock colors={colors} />
          </>
        )}
      </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { fontFamily: fonts.serifMedium, fontSize: 32, letterSpacing: -0.5 },
  sub: { ...type.body, fontSize: 14 },
  hint: { ...type.caption, fontSize: 13, marginBottom: 4 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 16, marginBottom: 4 },
  rowMeta: { ...type.caption, fontSize: 12 },
  rowValue: { ...type.body, fontSize: 14 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  linkText: { fontFamily: fonts.bodySemi, fontSize: 15 },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  navBtnText: { fontFamily: fonts.bodySemi, fontSize: 14 },
});
