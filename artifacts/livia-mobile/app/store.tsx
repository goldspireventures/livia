import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { customFetch } from "@workspace/api-client-react";
import { OperationalScreen } from "@/components/OperationalScreen";
import { FeatureUnlockGate } from "@/components/FeatureUnlockCard";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { useHaptics } from "@/hooks/useHaptics";
import { fonts } from "@/constants/typography";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import {
  resolveTenantRetailPack,
  verticalSupportsRetail,
  type TenantRetailStoreSettings,
} from "@workspace/policy";

type RetailProduct = {
  id: string;
  name: string;
  priceMinor: number;
  currency: string;
  isActive?: boolean;
};

export default function StoreScreen() {
  const colors = useColors();
  const haptics = useHaptics();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const vertical = (currentBusiness as { vertical?: string; subverticalProfileId?: string | null } | undefined)?.vertical;
  const subverticalProfileId = (currentBusiness as { subverticalProfileId?: string | null } | undefined)?.subverticalProfileId;
  const retailPack = resolveTenantRetailPack(vertical, subverticalProfileId);

  if (!verticalSupportsRetail(vertical)) {
    return (
      <OperationalScreen ritualPage title="Shop" subtitle="Retail is not available for this business type.">
        <Text style={{ color: colors.mutedForeground }}>Switch to a retail-enabled location to manage products.</Text>
      </OperationalScreen>
    );
  }

  return (
    <FeatureUnlockGate featureId="take_home_retail" businessId={bid}>
      <StoreScreenContent bid={bid} retailPack={retailPack} slug={currentBusiness?.slug ?? ""} />
    </FeatureUnlockGate>
  );
}

function StoreScreenContent({
  bid,
  retailPack,
  slug,
}: {
  bid: string;
  retailPack: ReturnType<typeof resolveTenantRetailPack>;
  slug: string;
}) {
  const colors = useColors();
  const haptics = useHaptics();
  const [settings, setSettings] = useState<TenantRetailStoreSettings | null>(null);
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!bid) return;
    const bundle = await customFetch<{ settings: TenantRetailStoreSettings; products: RetailProduct[] }>(
      `/api/businesses/${bid}/retail/store`,
    );
    setSettings(bundle.settings);
    setProducts(bundle.products ?? []);
  }, [bid]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function patchSettings(patch: Partial<TenantRetailStoreSettings>) {
    if (!bid || !settings) return;
    setBusy(true);
    haptics.selection();
    try {
      const next = await customFetch<TenantRetailStoreSettings>(
        `/api/businesses/${bid}/retail/settings`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) },
      );
      setSettings(next);
      haptics.success();
    } catch {
      haptics.warning();
    } finally {
      setBusy(false);
    }
  }

  const activeCount = products.filter((p) => p.isActive !== false).length;

  return (
    <OperationalScreen
      ritualPage
      title={retailPack?.ownerTitle ?? "Shop"}
      subtitle={retailPack?.ownerSubtitle ?? "Take-home products on your book page."}
    >
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.foreground }]}>Show on book page</Text>
          <Switch
            value={settings?.enabled ?? false}
            disabled={busy}
            onValueChange={(v) => void patchSettings({ enabled: v })}
          />
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          {settings?.enabled
            ? `${activeCount} active product${activeCount === 1 ? "" : "s"}`
            : "Off — guests will not see the retail section"}
        </Text>
      </View>

      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Products</Text>
        {products.length === 0 ? (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            No products yet — load templates in web for the full editor.
          </Text>
        ) : (
          products.slice(0, 8).map((p) => (
            <View key={p.id} style={styles.productRow}>
              <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: fonts.bodySemi }}>
                €{(p.priceMinor / 100).toFixed(0)}
              </Text>
            </View>
          ))
        )}
      </View>

      <Pressable
        style={[styles.cta, { backgroundColor: colors.primary }]}
        onPress={() => void Linking.openURL(`${getDashboardBaseUrl()}/store`)}
      >
        <Feather name="external-link" size={16} color={colors.primaryForeground} />
        <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Full catalogue editor (web)</Text>
      </Pressable>
      {slug ? (
        <Pressable onPress={() => void Linking.openURL(`${getDashboardBaseUrl()}/book/${slug}`)}>
          <Text style={[styles.link, { color: colors.primary }]}>Preview on book page</Text>
        </Pressable>
      ) : null}
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontFamily: fonts.bodySemi, fontSize: 15 },
  hint: { fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontFamily: fonts.bodySemi, fontSize: 15, marginBottom: 4 },
  productRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, gap: 8 },
  productName: { flex: 1, fontSize: 14 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 15 },
  link: { textAlign: "center", marginTop: 12, fontSize: 14 },
});
