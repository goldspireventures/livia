import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fonts, type } from "@/constants/typography";
import { useMobileSurface } from "@/hooks/useMobileSurface";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  GUEST_HUB_TOKEN_KEY,
  guestVisitMobilePath,
  openGuestBookUrl,
} from "@/lib/guest-hub";
import { GuestHubSignInPanel } from "@/components/guest/GuestHubSignInPanel";
import { GatewayAuthShell } from "@/components/gateway/GatewayAuthShell";
import { GatewayScreenShell } from "@/components/gateway/GatewayScreenShell";
import { GUEST_HUB_COPY, LIVIA_MOBILE_ENTRY_COPY, guestHubContactLabel, type GuestPreferredModality } from "@workspace/policy";
import { DEMO_GUEST_PHONE, requestGuestHubOtpMobile } from "@/lib/guest-hub-otp";
import { rememberGuestDoor, setForceColdOpen } from "@/lib/mobile-entry-routing";
import { isDemoMobileSurface } from "@/lib/production-surface";
import { GuestHubLivChat } from "@/components/guest/GuestHubLivChat";
import { GuestHubWelcome } from "@/components/guest/GuestHubWelcome";
import { GuestHubRedeemPanel } from "@/components/guest/GuestHubRedeemPanel";

type HubShop = {
  businessId: string;
  businessName: string;
  slug: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  bookUrl: string;
  shopRelationshipUrl?: string;
  isFavorite: boolean;
  lastServiceName: string | null;
};

type HubView = {
  guestId: string;
  phoneE164: string;
  email?: string | null;
  displayName?: string | null;
  welcomeCompleted?: boolean;
  isColdStart?: boolean;
  preferredModality?: GuestPreferredModality;
  packageCredits?: Array<{
    ledgerId: string;
    businessName: string;
    slug: string;
    packageName: string;
    creditsRemaining: number;
    creditsTotal: number;
  }>;
  shops: HubShop[];
  upcomingBookings: Array<{
    bookingId: string;
    businessName: string;
    serviceName: string;
    startAt: string;
    visitUrl: string;
    slug?: string;
  }>;
};

export default function MyLiviaHubScreen() {
  const { tokens: guestColors } = useMobileSurface("guest-hub");
  const colors = guestColors;
  const router = useRouter();
  const api = getApiBaseUrl();
  const [hubToken, setHubToken] = useState<string | null>(null);
  const [view, setView] = useState<HubView | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [otpSession, setOtpSession] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [magicOtp, setMagicOtp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadView = useCallback(
    async (token: string) => {
      const r = await fetch(`${api}/api/public/guest-hub/me`, {
        headers: { "X-Guest-Hub-Token": token },
      });
      if (!r.ok) throw new Error("session");
      return r.json() as Promise<HubView>;
    },
    [api],
  );

  useEffect(() => {
    void (async () => {
      const stored = await AsyncStorage.getItem(GUEST_HUB_TOKEN_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }
      setHubToken(stored);
      try {
        const v = await loadView(stored);
        setView(v);
        setDisplayName(v.displayName ?? "");
      } catch {
        await AsyncStorage.removeItem(GUEST_HUB_TOKEN_KEY);
        setHubToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadView]);

  async function requestOtp(forPhone = phone) {
    setBusy(true);
    setErr(null);
    try {
      const j = await requestGuestHubOtpMobile(
        api,
        authMethod === "email" ? { email } : { phone: forPhone, country: "IE" },
      );
      setOtpSession(j.sessionToken);
      const shownCode = isDemoMobileSurface() ? (j.magicOtpCode ?? j.devOtp ?? null) : null;
      setMagicOtp(shownCode);
      if (shownCode) setCode(shownCode);
      return { sessionToken: j.sessionToken, code: shownCode };
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send code");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function signInAsMaryDemo() {
    setPhone(DEMO_GUEST_PHONE);
    setErr(null);
    const otp = await requestOtp(DEMO_GUEST_PHONE);
    if (!otp?.sessionToken) return;
    if (otp.code) {
      setCode(otp.code);
      setBusy(true);
      try {
        const r = await fetch(`${api}/api/public/guest-hub/otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: otp.sessionToken, code: otp.code }),
        });
        if (!r.ok) throw new Error("Incorrect code");
        const j = (await r.json()) as { hubToken: string };
        await AsyncStorage.setItem(GUEST_HUB_TOKEN_KEY, j.hubToken);
        await rememberGuestDoor();
        setHubToken(j.hubToken);
        const v = await loadView(j.hubToken);
        setView(v);
        setDisplayName(v.displayName ?? "");
        setOtpSession(null);
      } catch {
        setErr("Could not sign in — check the code and try again.");
      } finally {
        setBusy(false);
      }
    }
  }

  async function verifyOtp() {
    if (!otpSession) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`${api}/api/public/guest-hub/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: otpSession, code }),
      });
      if (!r.ok) throw new Error("Incorrect code");
      const j = (await r.json()) as { hubToken: string };
      await AsyncStorage.setItem(GUEST_HUB_TOKEN_KEY, j.hubToken);
      await rememberGuestDoor();
      setHubToken(j.hubToken);
      const v = await loadView(j.hubToken);
      setView(v);
      setDisplayName(v.displayName ?? "");
      setOtpSession(null);
    } catch {
      setErr("Incorrect code");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite(businessId: string, pinned: boolean) {
    if (!hubToken) return;
    const r = await fetch(`${api}/api/public/guest-hub/favorites/${businessId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Guest-Hub-Token": hubToken,
      },
      body: JSON.stringify({ pinned }),
    });
    if (r.ok) setView(await r.json());
  }

  async function saveProfile() {
    if (!hubToken) return;
    setProfileSaving(true);
    try {
      const r = await fetch(`${api}/api/public/guest-hub/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Hub-Token": hubToken,
        },
        body: JSON.stringify({ displayName }),
      });
      if (!r.ok) throw new Error("save");
      const v = (await r.json()) as HubView;
      setView((prev) => (prev ? { ...prev, displayName: v.displayName ?? displayName } : prev));
    } catch {
      setErr("Could not save profile");
    } finally {
      setProfileSaving(false);
    }
  }

  async function signOutGuest() {
    await AsyncStorage.removeItem(GUEST_HUB_TOKEN_KEY);
    await setForceColdOpen();
    setHubToken(null);
    setView(null);
    router.replace("/" as never);
  }

  function openVisit(visitUrl: string) {
    const native = guestVisitMobilePath(visitUrl);
    if (native) {
      router.push(native as never);
      return;
    }
    openGuestBookUrl(visitUrl);
  }

  if (loading) {
    return (
      <GatewayScreenShell surfaceId="guest-hub">
        <ActivityIndicator style={{ marginTop: 80, alignSelf: "center" }} color={colors.primary} />
      </GatewayScreenShell>
    );
  }

  if (!hubToken || !view) {
    return (
      <GatewayAuthShell
        surfaceId="guest-hub"
        keyboardAware
        title={authMethod === "email" ? GUEST_HUB_COPY.signInTitleEmail : GUEST_HUB_COPY.signInTitle}
        subtitle={GUEST_HUB_COPY.signInBody}
        testID="guest-hub-sign-in"
        headerAction={
          <Pressable onPress={() => router.replace("/" as never)} hitSlop={12} testID="guest-hub-back">
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        }
      >
        <GuestHubSignInPanel
          embedded
          authMethod={authMethod}
          onAuthMethodChange={setAuthMethod}
          phone={phone}
          onPhoneChange={setPhone}
          email={email}
          onEmailChange={setEmail}
          otpSession={otpSession}
          code={code}
          onCodeChange={setCode}
          magicOtp={magicOtp}
          busy={busy}
          err={err}
          onRequestOtp={() => void requestOtp()}
          onVerifyOtp={() => void verifyOtp()}
          onSignInAsMaryDemo={() => void signInAsMaryDemo()}
          onUseDemoNumber={() => setPhone(DEMO_GUEST_PHONE)}
          onChangeIdentifier={() => {
            setOtpSession(null);
            setCode("");
            setErr(null);
          }}
        />
      </GatewayAuthShell>
    );
  }

  return (
    <GatewayScreenShell surfaceId="guest-hub">
      <Pressable onPress={() => router.replace("/" as never)} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>
      <ScrollView contentContainerStyle={styles.pad} testID="guest-hub-home">
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[type.title, { color: colors.foreground }]}>{GUEST_HUB_COPY.productName}</Text>
            <Text style={[type.caption, { color: colors.mutedForeground }]}>
              {guestHubContactLabel({ phoneE164: view.phoneE164, email: view.email })}
            </Text>
          </View>
          <Pressable onPress={() => router.push("/my-livia/account" as never)} testID="guest-hub-account-link">
            <Text style={[type.caption, { color: colors.primary }]}>{GUEST_HUB_COPY.accountSettingsLink}</Text>
          </Pressable>
        </View>

        <GuestHubWelcome
          guestId={view.guestId}
          hubToken={hubToken}
          welcomeCompleted={view.welcomeCompleted}
          onCompleted={() => setView((v) => (v ? { ...v, welcomeCompleted: true } : v))}
        />

        <View style={[styles.card, { borderColor: colors.border }]} testID="guest-hub-profile-card">
          <Text style={[type.body, { fontFamily: fonts.bodyMed, color: colors.foreground }]}>
            {GUEST_HUB_COPY.profileSection}
          </Text>
          <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 4 }]}>
            {GUEST_HUB_COPY.signInBodyColdStart}
          </Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, marginTop: 10 }]}
            placeholder={GUEST_HUB_COPY.profileDisplayNamePlaceholder}
            placeholderTextColor={colors.mutedForeground}
            value={displayName}
            onChangeText={setDisplayName}
            testID="guest-hub-display-name"
          />
          <Pressable
            style={[styles.btnSm, { borderColor: colors.primary, marginTop: 8 }]}
            onPress={() => void saveProfile()}
            disabled={profileSaving}
          >
            <Text style={[type.caption, { color: colors.primary, fontFamily: fonts.bodyMed }]}>
              {profileSaving ? "Saving…" : GUEST_HUB_COPY.profileSaveCta}
            </Text>
          </Pressable>
        </View>

        {view.upcomingBookings.length === 0 ? (
          <View style={[styles.card, { borderColor: colors.border }]} testID="guest-hub-empty-upcoming">
            <Text style={[type.body, { fontFamily: fonts.bodyMed, color: colors.foreground }]}>
              {GUEST_HUB_COPY.emptyUpcomingTitle}
            </Text>
            <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 6 }]}>
              {GUEST_HUB_COPY.emptyUpcomingBody}
            </Text>
          </View>
        ) : null}

        {view.upcomingBookings.map((b) => (
          <Pressable
            key={b.bookingId}
            style={[styles.card, { borderColor: colors.border }]}
            onPress={() => openVisit(b.visitUrl)}
          >
            <Text style={[type.body, { fontFamily: fonts.bodyMed, color: colors.foreground }]}>
              {b.businessName}
            </Text>
            <Text style={[type.caption, { color: colors.mutedForeground }]}>{b.serviceName}</Text>
            <Text style={[type.caption, { color: colors.primary, marginTop: 4 }]}>Manage visit →</Text>
          </Pressable>
        ))}

        {view.shops.length === 0 ? (
          <View style={[styles.card, { borderColor: colors.border }]} testID="guest-hub-empty-shops">
            <Text style={[type.caption, { color: colors.mutedForeground }]}>{GUEST_HUB_COPY.emptyShops}</Text>
            <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 6 }]}>
              {GUEST_HUB_COPY.coldStartHint}
            </Text>
          </View>
        ) : null}

        {(view.packageCredits ?? []).map((p) => (
          <View key={p.ledgerId} style={[styles.card, { borderColor: colors.border }]}>
            <Text style={[type.body, { fontFamily: fonts.bodyMed, color: colors.foreground }]}>{p.businessName}</Text>
            <Text style={[type.caption, { color: colors.mutedForeground }]}>{p.packageName}</Text>
            <Text style={[type.caption, { color: colors.foreground, marginTop: 4 }]}>
              {p.creditsRemaining} of {p.creditsTotal} sessions left
            </Text>
          </View>
        ))}

        <View style={[styles.card, { borderColor: colors.border }]}>
          <GuestHubRedeemPanel hubToken={hubToken} onRedeemed={(v) => setView(v as HubView)} />
        </View>

        {view.shops.map((shop) => (
          <View key={shop.businessId} style={[styles.card, { borderColor: colors.border }]}>
            <Pressable onPress={() => router.push(`/my-livia/${shop.slug}` as never)}>
              <View style={styles.row}>
                {(shop.imageUrl ?? shop.logoUrl) ? (
                  <Image
                    source={{ uri: (shop.imageUrl ?? shop.logoUrl)! }}
                    style={[styles.shopAvatar, { borderColor: colors.border }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.shopAvatar,
                      styles.shopAvatarFallback,
                      { borderColor: colors.border, backgroundColor: colors.primary + "18" },
                    ]}
                  >
                    <Text style={[type.caption, { color: colors.primary, fontFamily: fonts.bodyMed }]}>
                      {(shop.businessName.trim().charAt(0) || "S").toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontFamily: fonts.bodyMed, color: colors.foreground }]}>
                    {shop.businessName}
                  </Text>
                  {shop.lastServiceName ? (
                    <Text style={[type.caption, { color: colors.mutedForeground }]}>
                      Last: {shop.lastServiceName}
                    </Text>
                  ) : null}
                </View>
                <Pressable onPress={() => void toggleFavorite(shop.businessId, !shop.isFavorite)}>
                  <Feather
                    name="heart"
                    size={20}
                    color={shop.isFavorite ? colors.primary : colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </Pressable>
            <Pressable
              style={[styles.btnSm, { borderColor: colors.border }]}
              onPress={() => openGuestBookUrl(shop.bookUrl)}
            >
              <Text style={[type.caption, { color: colors.foreground }]}>Book again</Text>
            </Pressable>
          </View>
        ))}

        <GuestHubLivChat hubToken={hubToken} />

        <Pressable onPress={() => void signOutGuest()} style={{ marginTop: 16, alignSelf: "center" }}>
          <Text style={[type.caption, { color: colors.mutedForeground }]}>{GUEST_HUB_COPY.signOutCta}</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/sign-in" as never)} style={{ marginTop: 8, alignSelf: "center" }}>
          <Text style={[type.caption, { color: colors.primary }]}>
            {LIVIA_MOBILE_ENTRY_COPY.guestStaffLink}
          </Text>
        </Pressable>
      </ScrollView>
    </GatewayScreenShell>
  );
}

const styles = StyleSheet.create({
  back: { padding: 16 },
  pad: { padding: 16, paddingBottom: 40, gap: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  btnSm: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    backgroundColor: "rgba(42, 45, 58, 0.45)",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowBetween: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  shopAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  shopAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
