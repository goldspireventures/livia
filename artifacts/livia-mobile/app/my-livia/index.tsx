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
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  GUEST_HUB_TOKEN_KEY,
  guestVisitMobilePath,
  openGuestBookUrl,
} from "@/lib/guest-hub";
import {
  DEMO_GUEST_CLIENT_COPY,
  GUEST_PREFERRED_MODALITY_LABELS,
  LIVIA_MOBILE_ENTRY_COPY,
  type GuestPreferredModality,
} from "@workspace/policy";
import { DEMO_GUEST_PHONE, requestGuestHubOtpMobile } from "@/lib/guest-hub-otp";
import { isProductionCustomerSurface } from "@/lib/production-surface";

const GUEST_MODALITIES = Object.keys(GUEST_PREFERRED_MODALITY_LABELS) as GuestPreferredModality[];

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
  phoneE164: string;
  preferredModality?: GuestPreferredModality;
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
  const colors = useColors();
  const router = useRouter();
  const api = getApiBaseUrl();
  const [hubToken, setHubToken] = useState<string | null>(null);
  const [view, setView] = useState<HubView | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [otpSession, setOtpSession] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [magicOtp, setMagicOtp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [channel, setChannel] = useState<GuestPreferredModality>("ANY");
  const [channelSaving, setChannelSaving] = useState(false);

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
        setChannel(v.preferredModality ?? "ANY");
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
      const j = await requestGuestHubOtpMobile(api, forPhone, "IE");
      setOtpSession(j.sessionToken);
      const shownCode = j.magicOtpCode ?? j.devOtp ?? null;
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
        setHubToken(j.hubToken);
        const v = await loadView(j.hubToken);
        setView(v);
        setChannel(v.preferredModality ?? "ANY");
        setOtpSession(null);
      } catch {
        setErr("Could not sign in — try Verify manually with code 000000");
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
      setHubToken(j.hubToken);
      const v = await loadView(j.hubToken);
      setView(v);
      setChannel(v.preferredModality ?? "ANY");
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

  async function saveChannel(next: GuestPreferredModality) {
    if (!hubToken) return;
    setChannelSaving(true);
    try {
      const r = await fetch(`${api}/api/public/guest-hub/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Hub-Token": hubToken,
        },
        body: JSON.stringify({ preferredModality: next }),
      });
      if (!r.ok) throw new Error("save");
      setChannel(next);
      setView((v) => (v ? { ...v, preferredModality: next } : v));
    } catch {
      setErr("Could not save channel preference");
    } finally {
      setChannelSaving(false);
    }
  }

  async function signOutGuest() {
    await AsyncStorage.removeItem(GUEST_HUB_TOKEN_KEY);
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
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!hubToken || !view) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.replace("/" as never)} style={styles.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <ScrollView contentContainerStyle={styles.pad}>
          <Text style={[type.title, { color: colors.foreground }]}>My Livia</Text>
          <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 8 }]}>
            Your bookings across every Livia shop — verify once with your mobile.
          </Text>
          <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 6 }]}>
            {isProductionCustomerSurface()
              ? "We will text you a one-time code."
              : DEMO_GUEST_CLIENT_COPY.phoneHint}
          </Text>
          {!isProductionCustomerSurface() && magicOtp ? (
            <Text style={[type.caption, { color: colors.primary, marginTop: 12 }]}>
              Staging code: {magicOtp}
            </Text>
          ) : null}
          {!otpSession ? (
            <>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. +353 87 100 0001"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                testID="guest-hub-phone-input"
              />
              {!isProductionCustomerSurface() ? (
                <>
                  <Pressable
                    onPress={() => void signInAsMaryDemo()}
                    style={[styles.demoFill, { borderColor: colors.primary, backgroundColor: colors.primary + "12" }]}
                    testID="guest-hub-demo-mary"
                    disabled={busy}
                  >
                    <Text style={[type.caption, { color: colors.primary, fontFamily: fonts.bodyMed }]}>
                      Sign in as Mary (demo)
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPhone(DEMO_GUEST_PHONE)}
                    style={[styles.demoFill, { borderColor: colors.border }]}
                    testID="guest-hub-demo-phone"
                  >
                    <Text style={[type.caption, { color: colors.primary }]}>Use demo number only</Text>
                  </Pressable>
                </>
              ) : null}
              <Pressable
                style={[styles.btn, { backgroundColor: colors.primary }, busy && { opacity: 0.7 }]}
                onPress={() => void requestOtp()}
                disabled={busy || !phone.trim()}
                testID="guest-hub-send-code"
              >
                {busy ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[type.body, { color: colors.primaryForeground, fontFamily: fonts.bodyMed }]}>
                    Send code
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="6-digit code"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />
              <Pressable
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={() => void verifyOtp()}
                disabled={busy}
              >
                <Text style={[type.body, { color: colors.primaryForeground, fontFamily: fonts.bodyMed }]}>
                  Verify
                </Text>
              </Pressable>
            </>
          )}
          {err ? <Text style={{ color: colors.destructive, marginTop: 8 }}>{err}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <Pressable onPress={() => router.replace("/" as never)} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={[type.title, { color: colors.foreground }]}>My Livia</Text>
        <Text style={[type.caption, { color: colors.mutedForeground }]}>{view.phoneE164}</Text>

        <View style={[styles.card, { borderColor: colors.border }]} testID="guest-channel-card">
          <Text style={[type.body, { fontFamily: fonts.bodyMed, color: colors.foreground }]}>
            How Liv reaches you
          </Text>
          <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 4 }]}>
            Aftercare and follow-ups use your preferred channel when possible.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {GUEST_MODALITIES.map((m) => (
              <Pressable
                key={m}
                disabled={channelSaving}
                onPress={() => void saveChannel(m)}
                style={[
                  styles.chip,
                  {
                    borderColor: channel === m ? colors.primary : colors.border,
                    backgroundColor: channel === m ? colors.primary + "18" : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    type.caption,
                    { color: channel === m ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {GUEST_PREFERRED_MODALITY_LABELS[m]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

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

        <Pressable onPress={() => void signOutGuest()} style={{ marginTop: 16, alignSelf: "center" }}>
          <Text style={[type.caption, { color: colors.mutedForeground }]}>Sign out of My Livia</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/sign-in" as never)} style={{ marginTop: 8, alignSelf: "center" }}>
          <Text style={[type.caption, { color: colors.primary }]}>
            {LIVIA_MOBILE_ENTRY_COPY.guestStaffLink}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { padding: 16 },
  pad: { padding: 16, paddingBottom: 40, gap: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  btn: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  demoFill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
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
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
