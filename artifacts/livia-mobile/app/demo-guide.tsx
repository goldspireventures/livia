import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PersonaScreenHeader } from "@/components/PersonaScreenHeader";
import { ScreenPurpose } from "@/components/ScreenPurpose";
import { elevation } from "@/constants/elevation";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

const DEMO_PASSWORD_HINT = "LIVIA_DEMO_PASSWORD in your .env (default LiviaDemo2026!)";

const ACCOUNTS = [
  {
    email: "org-admin@livia.io",
    role: "Org admin",
    shops: "Aurora Studio, Mews, Galway",
    mobile: "Glance tab → switch shops → Today per location",
    web: "/chain → premises → day packages (Harbour)",
  },
  {
    email: "owner-conorcuts@livia.io",
    role: "Owner",
    shops: "Conor's Cut Co.",
    mobile: "Today → Bookings → Clients",
    web: "/dashboard",
  },
  {
    email: "manager@livia.io",
    role: "Manager",
    shops: "Aurora Studio",
    mobile: "Queue tab → Floor → Messages",
    web: "/inbox",
  },
  {
    email: "staff-lara@livia.io",
    role: "Staff",
    shops: "Aurora Studio (Lara)",
    mobile: "My chair tab only",
    web: "/my-day",
  },
  {
    email: "desk@livia.io",
    role: "Reception",
    shops: "Aurora Studio",
    mobile: "Floor + Messages",
    web: "/bookings",
  },
] as const;

const SPOTLIGHT_SLUGS = [
  { slug: "aurora-studio", label: "Aurora Studio", note: "IE chain flagship · Liv moments + inbox" },
  { slug: "london-rose-spa", label: "Rose Spa London", note: "GB market · guest book" },
  { slug: "berlin-studio-neun", label: "Studio Neun Berlin", note: "DE market" },
  { slug: "paris-belle-vue", label: "Belle Vue Paris", note: "FR market" },
  { slug: "clarity-medspa-dublin", label: "Clarity Medspa", note: "Medspa consent on book" },
  { slug: "paws-parlour-dublin", label: "Paws Parlour", note: "Pet grooming + pet profile" },
  { slug: "harbour-wellness-cork", label: "Harbour Wellness", note: "Day packages (More)" },
] as const;

export default function DemoGuideScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { businesses, setCurrentBusiness } = useBusiness();
  const dash = getDashboardBaseUrl();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40, paddingHorizontal: 16 }}
    >
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>

      <PersonaScreenHeader
        eyebrow="Sales & design partners"
        title="Demo guide"
        subtitle="Sign in as each account below — do not rely on “Switch persona” alone. That only changes tabs, not your real permissions."
      />

      <ScreenPurpose
        icon="log-in"
        title="How to demo Livia for real"
        body="1) Home → Walk the demo → Set up demo world. 2) Pick a trade world (Beauty, Wellness, …). 3) Walk into live demo as owner/manager/staff — real Clerk sign-in, Constellation skin. 4) Or use demo emails below on Sign in. 5) Guest path: My Livia (+353 87 100 0001)."
      />

      <Text style={[styles.section, { color: colors.mutedForeground }]}>DEMO ACCOUNTS</Text>
      {ACCOUNTS.map((a) => (
        <View
          key={a.email}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, elevation.resting]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{a.role}</Text>
          <Text style={[styles.email, { color: colors.primary }]}>{a.email}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Password: {DEMO_PASSWORD_HINT}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Shops: {a.shops}</Text>
          <Text style={[styles.meta, { color: colors.foreground }]}>Mobile: {a.mobile}</Text>
          <Pressable onPress={() => void Linking.openURL(`${dash}${a.web}`)}>
            <Text style={[styles.link, { color: colors.primary }]}>Web: {a.web}</Text>
          </Pressable>
        </View>
      ))}

      <Text style={[styles.section, { color: colors.mutedForeground }]}>SPOTLIGHT BUSINESSES</Text>
      {SPOTLIGHT_SLUGS.map((s) => {
        const biz = businesses.find((b) => b.slug === s.slug);
        return (
          <Pressable
            key={s.slug}
            onPress={() => {
              if (biz) setCurrentBusiness(biz);
              router.replace("/");
            }}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{s.label}</Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{s.note}</Text>
            <Text style={[styles.link, { color: biz ? colors.primary : colors.mutedForeground }]}>
              {biz ? "Switch to this shop →" : "Provision demo world first"}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={() => void Linking.openURL(`${dash}/demo`)}
        style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Open web demo portal</Text>
        <Feather name="external-link" size={16} color={colors.primaryForeground} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: { ...type.eyebrow, fontSize: 11, marginTop: 20, marginBottom: 8 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 4 },
  cardTitle: { fontFamily: fonts.bodySemi, fontSize: 16 },
  email: { fontFamily: fonts.mono, fontSize: 13 },
  meta: { ...type.body, fontSize: 13, lineHeight: 18 },
  link: { fontFamily: fonts.bodySemi, fontSize: 13, marginTop: 4 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  primaryText: { fontFamily: fonts.bodySemi, fontSize: 15 },
});
