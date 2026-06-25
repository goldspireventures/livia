import {
  useGetBusiness,
  useGetBusinessCommunications,
  useUpdateBusiness,
  customFetch,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { ShopLogoUploadField } from "@/components/ShopLogoUploadField";
import { CollapsibleSettingsSection } from "@/components/settings/CollapsibleSettingsSection";
import { OperationalScreen } from "@/components/OperationalScreen";
import { fonts, type } from "@/constants/typography";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
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
import {
  defaultMobileSettingsSection,
  mobileSettingsSections,
  type MobileSettingsSectionId,
} from "@/lib/mobile-settings-layout";
import { useBusinessTimezone } from "@/hooks/useBusinessTimezone";
import { asHref } from "@/lib/navigation";
import { CommsChannelsBlock } from "@/components/CommsChannelsBlock";
import { HelpSupportSheet } from "@/components/HelpSupportSheet";
import { getPublicBookingLabel } from "@/lib/public-booking-url";
import { LIVIA_FORM_EXAMPLES } from "@workspace/policy";
import { dpaUrl, privacyPolicyUrl, termsOfServiceUrl } from "@/lib/marketing-legal-urls";
import { LivCapabilitiesCard } from "@/components/LivCapabilitiesCard";
import { BillingSummaryCard } from "@/components/BillingSummaryCard";
import { CrossSurfaceContinueCard } from "@/components/CrossSurfaceContinueCard";
import { MobilePresentationCard } from "@/components/MobilePresentationCard";
import { dashboardSettingsUrl } from "@/lib/dashboard-url";
import { useOperationalChrome } from "@/lib/operational-chrome";

function aiEnabledFromBusiness(v: string | undefined): boolean {
  return v !== "false" && v !== "0";
}

function LegalLinks({ colors }: { colors: ReturnType<typeof useColors> }) {
  const links = [
    { label: "Privacy", url: privacyPolicyUrl() },
    { label: "Terms", url: termsOfServiceUrl() },
    { label: "DPA", url: dpaUrl() },
  ];
  return (
    <View style={styles.legal}>
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
  const chrome = useOperationalChrome(bid);
  const sections = useMemo(() => mobileSettingsSections(persona), [persona]);
  const [openSection, setOpenSection] = useState<MobileSettingsSectionId | null>(() =>
    defaultMobileSettingsSection(persona),
  );
  const [aboutOpen, setAboutOpen] = useState(false);

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
  const [customDomain, setCustomDomain] = useState<string | null>(null);
  const [domainVerifying, setDomainVerifying] = useState(false);
  const canEditShopFields = canEditShop(persona);

  const resolvedAi = useMemo(() => {
    if (aiOn !== null) return aiOn;
    return business ? aiEnabledFromBusiness(business.aiEnabled) : true;
  }, [aiOn, business]);

  const resolvedLogo = business?.logoUrl ?? "";
  const resolvedDomain =
    customDomain ?? (business as { customBookDomain?: string | null })?.customBookDomain ?? "";
  const { timeZone: tzLabel } = useBusinessTimezone();

  const pack = verticalPackUi(
    (business as { vertical?: string } | undefined)?.vertical ??
      (currentBusiness as { vertical?: string } | undefined)?.vertical,
    (business as { category?: string } | undefined)?.category,
  );

  const toggleSection = (id: MobileSettingsSectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const saveLogoUrl = async (next: string | null) => {
    if (!bid || !canEditShopFields) return;
    try {
      await patchBusiness({
        businessId: bid,
        data: { logoUrl: next?.trim() || undefined },
      });
      await refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const saveCustomDomain = async (next: string) => {
    if (!bid || !canEditShopFields) return;
    const trimmed = next.trim();
    try {
      await patchBusiness({
        businessId: bid,
        data: { customBookDomain: trimmed || null, customBookDomainVerified: false },
      });
      await refetch();
      setCustomDomain(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const verifyCustomDomain = async () => {
    if (!bid || !canEditShopFields || !resolvedDomain.trim()) return;
    setDomainVerifying(true);
    try {
      if (customDomain !== null) await saveCustomDomain(customDomain);
      const result = await customFetch<{ verified: boolean; message: string }>(
        `/api/businesses/${bid}/custom-book-domain/verify`,
        { method: "POST" },
      );
      await refetch();
      Haptics.notificationAsync(
        result.verified
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setDomainVerifying(false);
    }
  };

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
      ritualPage
      title="Settings"
      subtitle={`${currentBusiness?.name ?? "Workspace"} · ${PERSONA_LABEL[persona]}`}
      contentStyle={{ paddingBottom: 48, gap: 10 }}
      actions={
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
      }
    >
      {showLiv ? (
        <View
          style={[
            styles.quickStrip,
            chrome.native
              ? chrome.panel({ padding: 14 })
              : { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.quickStripRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: colors.foreground }]}>Liv</Text>
              <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>
                {resolvedAi ? "On — booking & inbox" : "Paused"}
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
          {currentBusiness?.slug ? (
            <Pressable
              onPress={() => router.push(`/public-book/${currentBusiness.slug}` as never)}
              style={[styles.quickLink, { borderColor: colors.border }]}
            >
              <Feather name="link" size={14} color={colors.primary} />
              <Text style={[styles.quickLinkText, { color: colors.primary }]} numberOfLines={1}>
                {getPublicBookingLabel(currentBusiness.slug)}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={() => setAboutOpen((v) => !v)}
        style={[styles.aboutToggle, { borderColor: colors.border }]}
      >
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.aboutToggleText, { color: colors.mutedForeground }]}>
          {aboutOpen ? "Hide" : "Why mobile settings are shorter"}
        </Text>
        <Feather name={aboutOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
      </Pressable>
      {aboutOpen ? (
        <Text style={[styles.aboutBody, { color: colors.mutedForeground }]}>
          Quick toggles stay here on the floor. Billing, full policy, and deep Liv tuning open on web.
          {"\n"}
          {pack.label} · {pack.hint}
        </Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.jumpRow}
      >
        {sections.map((s) => {
          const active = openSection === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => {
                Haptics.selectionAsync();
                setOpenSection(s.id);
              }}
              style={[
                styles.jumpChip,
                {
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary + "18" : colors.card,
                },
              ]}
            >
              <Text
                style={[
                  styles.jumpChipText,
                  { color: active ? colors.primary : colors.foreground },
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.sections}>
          <CollapsibleSettingsSection
            id="shop"
            icon="home"
            title="Shop"
            subtitle="Timezone, booking link, logo"
            expanded={openSection === "shop"}
            onToggle={() => toggleSection("shop")}
            chrome={chrome}
          >
            {shopNote ? (
              <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                View-only — owner updates name, slug, and timezone on web.
              </Text>
            ) : null}
            <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>Timezone</Text>
            <Text style={[styles.rowValue, { color: colors.foreground }]}>{tzLabel}</Text>
            <Text style={[styles.rowMeta, { color: colors.mutedForeground, marginTop: 8 }]}>
              Public booking
            </Text>
            <Text style={[styles.rowValue, { color: colors.foreground }]}>
              {currentBusiness?.slug ? getPublicBookingLabel(currentBusiness.slug) : "—"}
            </Text>
            {currentBusiness?.slug ? (
              <Pressable
                onPress={() => router.push(`/public-book/${currentBusiness.slug}` as never)}
                style={[styles.navBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.navBtnText, { color: colors.primary }]}>Preview customer page</Text>
                <Feather name="external-link" size={18} color={colors.primary} />
              </Pressable>
            ) : null}
            <Text style={[styles.rowMeta, { color: colors.mutedForeground, marginTop: 8 }]}>
              Custom book domain
            </Text>
            {canEditShopFields ? (
              <TextInput
                value={resolvedDomain}
                onChangeText={(v) => setCustomDomain(v)}
                onBlur={() => {
                  if (customDomain === null) return;
                  void saveCustomDomain(customDomain);
                }}
                placeholder={LIVIA_FORM_EXAMPLES.bookingDomain}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.logoInput,
                  { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
                ]}
              />
            ) : (
              <Text style={[styles.rowValue, { color: colors.foreground }]}>
                {resolvedDomain || "—"}
              </Text>
            )}
            {canEditShopFields && resolvedDomain.trim() ? (
              <Pressable
                onPress={() => void verifyCustomDomain()}
                disabled={domainVerifying}
                style={[styles.navBtn, { borderColor: colors.border, marginTop: 6 }]}
              >
                <Text style={[styles.navBtnText, { color: colors.primary }]}>
                  {domainVerifying ? "Checking DNS…" : "Verify DNS"}
                </Text>
              </Pressable>
            ) : null}
            {(business as { customBookDomainVerified?: boolean })?.customBookDomainVerified &&
            resolvedDomain ? (
              <Text style={[styles.rowMeta, { color: colors.primary }]}>Domain verified</Text>
            ) : null}
            <ShopLogoUploadField
              businessId={bid}
              logoUrl={resolvedLogo || null}
              canEdit={canEditShopFields}
              onUploaded={(url) => saveLogoUrl(url)}
            />
            {!canEditShopFields ? (
              <Pressable
                onPress={() => void Linking.openURL(dashboardSettingsUrl("shop", bid))}
                style={[styles.navBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.navBtnText, { color: colors.primary }]}>Edit branding on web</Text>
                <Feather name="external-link" size={18} color={colors.primary} />
              </Pressable>
            ) : null}
          </CollapsibleSettingsSection>

          {bid ? (
            <CollapsibleSettingsSection
              id="look"
              icon="droplet"
              title="Look & preset"
              subtitle="Guest-facing colours and layout"
              expanded={openSection === "look"}
              onToggle={() => toggleSection("look")}
              chrome={chrome}
            >
              <MobilePresentationCard businessId={bid} canEdit={canEditShopFields} />
              {canEditShopFields ? (
                <CrossSurfaceContinueCard businessId={bid} variant="appearance" />
              ) : null}
            </CollapsibleSettingsSection>
          ) : null}

          {showTeam ? (
            <CollapsibleSettingsSection
              id="team"
              icon="users"
              title="Team & services"
              subtitle="Roster and what Liv can book"
              expanded={openSection === "team"}
              onToggle={() => toggleSection("team")}
              chrome={chrome}
            >
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
            </CollapsibleSettingsSection>
          ) : null}

          {showComms ? (
            <CollapsibleSettingsSection
              id="channels"
              icon="message-circle"
              title="Channels"
              subtitle="SMS, WhatsApp, Instagram"
              expanded={openSection === "channels"}
              onToggle={() => toggleSection("channels")}
              chrome={chrome}
            >
              <CommsChannelsBlock businessId={bid} comms={comms} loading={commsLoading} />
              <Pressable
                onPress={() => void Linking.openURL(dashboardSettingsUrl("integrations", bid))}
                style={[styles.navBtn, { borderColor: colors.border, marginTop: 8 }]}
              >
                <Text style={[styles.navBtnText, { color: colors.primary }]}>
                  Calendar sync & migrations
                </Text>
                <Feather name="external-link" size={18} color={colors.primary} />
              </Pressable>
            </CollapsibleSettingsSection>
          ) : null}

          {showPolicy && bid ? (
            <CollapsibleSettingsSection
              id="policy"
              icon="shield"
              title="Booking rules"
              subtitle="Deposits and operational policy"
              expanded={openSection === "policy"}
              onToggle={() => toggleSection("policy")}
              chrome={chrome}
            >
              <OperationalPolicyBlock businessId={bid} canEditOnWeb={canEditShop(persona)} />
            </CollapsibleSettingsSection>
          ) : null}

          <CollapsibleSettingsSection
            id="liv"
            icon="zap"
            title="Liv depth"
            subtitle="Capabilities and web tuning"
            expanded={openSection === "liv"}
            onToggle={() => toggleSection("liv")}
            chrome={chrome}
            badge={showLiv ? (resolvedAi ? "On" : "Off") : undefined}
          >
            {showLiv ? (
              <>
                <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                  Tone, greeting, and knowledge — web Settings → Liv.
                </Text>
                {bid ? <LivCapabilitiesCard businessId={bid} /> : null}
              </>
            ) : (
              <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                Your role cannot change Liv settings.
              </Text>
            )}
          </CollapsibleSettingsSection>

          {showBilling && bid ? (
            <CollapsibleSettingsSection
              id="billing"
              icon="credit-card"
              title="Plan & billing"
              subtitle="Subscription summary"
              expanded={openSection === "billing"}
              onToggle={() => toggleSection("billing")}
              chrome={chrome}
            >
              <BillingSummaryCard businessId={bid} />
            </CollapsibleSettingsSection>
          ) : null}

          <CollapsibleSettingsSection
            id="support"
            icon="life-buoy"
            title="Help & legal"
            subtitle="Support tickets and platform terms"
            expanded={openSection === "support"}
            onToggle={() => toggleSection("support")}
            chrome={chrome}
          >
            <HelpSupportSheet />
            <Pressable
              onPress={() => void Linking.openURL("mailto:support@livia-hq.com?subject=Livia%20mobile%20help")}
              style={styles.linkRow}
            >
              <Feather name="mail" size={16} color={colors.primary} />
              <Text style={[styles.linkText, { color: colors.primary }]}>support@livia-hq.com</Text>
            </Pressable>
            <LegalLinks colors={colors} />
          </CollapsibleSettingsSection>
        </View>
      )}
    </OperationalScreen>
  );
}

const styles = StyleSheet.create({
  quickStrip: { borderRadius: 16, borderWidth: 1, gap: 10 },
  quickStripRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  quickTitle: { fontFamily: fonts.bodySemi, fontSize: 16 },
  quickSub: { ...type.caption, fontSize: 12, marginTop: 2 },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  quickLinkText: { fontFamily: fonts.bodySemi, fontSize: 13, flex: 1 },
  aboutToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  aboutToggleText: { ...type.caption, flex: 1, fontSize: 12 },
  aboutBody: { ...type.caption, fontSize: 12, lineHeight: 18, marginTop: -4 },
  jumpRow: { gap: 8, paddingVertical: 4 },
  jumpChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  jumpChipText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  sections: { gap: 8 },
  rowMeta: { ...type.caption, fontSize: 12 },
  rowValue: { ...type.body, fontSize: 14 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  linkText: { fontFamily: fonts.bodySemi, fontSize: 15 },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  navBtnText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  logoInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  legal: { gap: 2, marginTop: 4 },
});
