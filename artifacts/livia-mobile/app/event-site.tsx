import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OperationalScreen } from "@/components/OperationalScreen";
import { FeatureUnlockGate } from "@/components/FeatureUnlockCard";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { customFetch } from "@workspace/api-client-react";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

type Site = {
  heroTitle?: string | null;
  defaultDepositPercent: number;
  quoteValidityDays: number;
};

export default function EventSiteScreen() {
  const colors = useColors();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const slug = currentBusiness?.slug ?? "";
  const [site, setSite] = useState<Site | null>(null);

  useEffect(() => {
    if (!bid) return;
    void customFetch<Site>(`/api/businesses/${bid}/event-vendor/site`)
      .then(setSite)
      .catch(() => setSite(null));
  }, [bid]);

  const publicUrl = slug ? `${getDashboardBaseUrl()}/e/${slug}` : "";

  return (
    <FeatureUnlockGate featureId="event_public_site" businessId={bid}>
      <OperationalScreen
        ritualPage
        title="Website & gallery"
        subtitle="Public site preview — full CMS on web for gallery and copy."
      >
        <View style={styles.wrap}>
          {site ? (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>{site.heroTitle ?? currentBusiness?.name}</Text>
              <Text style={{ color: colors.mutedForeground, marginBottom: 12 }}>
                Deposit {site.defaultDepositPercent}% · quotes valid {site.quoteValidityDays} days
              </Text>
            </>
          ) : null}
          <Pressable
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => void Linking.openURL(publicUrl)}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "600" }}>Open public website</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, { borderWidth: 1, borderColor: colors.border }]}
            onPress={() => void Linking.openURL(`${getDashboardBaseUrl()}/event-site`)}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>Edit website & templates (web)</Text>
          </Pressable>
        </View>
      </OperationalScreen>
    </FeatureUnlockGate>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: "600" },
  btn: { borderRadius: 10, paddingVertical: 14, alignItems: "center" },
});
