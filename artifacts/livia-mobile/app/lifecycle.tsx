import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PersonaScreenHeader } from "@/components/PersonaScreenHeader";
import { ScreenPurpose } from "@/components/ScreenPurpose";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { dashboardSettingsUrl } from "@/lib/dashboard-url";
import { asHref } from "@/lib/navigation";

const GROWTH_STEPS = [
  "Invite your first clinician or stylist (Team → Invite — not a job board).",
  "Promote someone to manager so they can run the floor and approve leave.",
  "Add a second location when you open another site.",
  "Hand the business to a new owner with a recorded transfer (never share logins).",
] as const;

export default function LifecycleScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useBusiness();
  const pack = verticalPackUi(
    (currentBusiness as { vertical?: string } | undefined)?.vertical,
    currentBusiness?.category,
  );
  const bid = currentBusiness?.id;

  const openWeb = (url: string) => void Linking.openURL(url);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 16,
        gap: 14,
      }}
    >
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>

      <PersonaScreenHeader
        eyebrow="For you, the business owner"
        title="Grow & hand over"
        subtitle={`Not for your clients — your ${pack.label.toLowerCase()} playbook: growing the team, opening another location, or selling the business.`}
      />

      <ScreenPurpose
        icon="trending-up"
        title="What this page is for"
        body="A checklist as your salon or clinic grows. Heavy steps (ownership transfer, billing) stay on web where there is more room — mobile keeps the story clear."
      />

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Typical growth path</Text>
        {GROWTH_STEPS.map((step, i) => (
          <Text key={step} style={[styles.bullet, { color: colors.mutedForeground }]}>
            {i + 1}. {step}
          </Text>
        ))}
        <Pressable
          onPress={() =>
            router.push({ pathname: "/onboarding", params: { intent: "second-shop" } } as never)
          }
          style={[styles.btn, { borderColor: colors.primary }]}
        >
          <Text style={[styles.btnText, { color: colors.primary }]}>Add another location</Text>
        </Pressable>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Opens setup for a new shop — you will switch between locations from More or Glance (multi-shop
          only).
        </Text>
        <Pressable
          onPress={() => router.push(asHref("/staff/invite"))}
          style={[styles.btn, { borderColor: colors.border }]}
        >
          <Text style={[styles.btnText, { color: colors.foreground }]}>Invite teammate</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sell or transfer the business</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          The new owner must already be on your team. Livia records the handover in your audit log and
          moves billing when Stripe is connected.
        </Text>
        <Pressable
          onPress={() => openWeb(dashboardSettingsUrl("ownership", bid))}
          style={[styles.btn, { borderColor: colors.primary }]}
        >
          <Text style={[styles.btnText, { color: colors.primary }]}>Start transfer on web</Text>
          <Feather name="external-link" size={14} color={colors.primary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 16 },
  body: { ...type.body, fontSize: 14, lineHeight: 20 },
  bullet: { ...type.body, fontSize: 14, marginLeft: 2 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 8,
  },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  hint: { ...type.caption, fontSize: 12, lineHeight: 17, marginTop: 4 },
});
