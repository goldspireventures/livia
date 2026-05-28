import { useQuery } from "@tanstack/react-query";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { customFetch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

type Caps = {
  profile: string;
  aiEnabled: boolean;
  tools: Array<{ name: string; description: string }>;
  catalogSize: number;
};

export function LivCapabilitiesCard({ businessId }: { businessId: string }) {
  const colors = useColors();

  const { data: staff } = useQuery({
    queryKey: ["liv-caps-staff", businessId],
    queryFn: () =>
      customFetch<Caps>(`/api/businesses/${businessId}/liv-capabilities?profile=tenant_staff`),
    enabled: !!businessId,
  });

  const { data: pub } = useQuery({
    queryKey: ["liv-caps-public", businessId],
    queryFn: () =>
      customFetch<Caps>(`/api/businesses/${businessId}/liv-capabilities?profile=tenant_public`),
    enabled: !!businessId,
  });

  if (!staff && !pub) return null;

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.head}>
        <Feather name="zap" size={16} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>Liv capabilities</Text>
      </View>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        AI {staff?.aiEnabled !== false ? "on" : "off"} · Registry {staff?.catalogSize ?? "—"} tools
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Staff/inbox: {staff?.tools.length ?? 0} active · Customers: {pub?.tools.length ?? 0} active
      </Text>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        Tune tools on web → Settings → Liv → Tool catalog.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  title: { fontFamily: fonts.bodyMed, fontSize: 15 },
  meta: { fontSize: 13 },
  sub: { fontSize: 12, marginTop: 4 },
  hint: { fontSize: 11, marginTop: 8, fontStyle: "italic" },
});
