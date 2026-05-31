import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
import { getDashboardOrigin } from "@/lib/guest-surface-url";

const HUB_TOKEN_KEY = "livia_guest_hub_token";

type HubShop = {
  businessId: string;
  businessName: string;
  slug: string;
  bookUrl: string;
  isFavorite: boolean;
  lastServiceName: string | null;
};

type HubView = {
  phoneE164: string;
  shops: HubShop[];
  upcomingBookings: Array<{
    bookingId: string;
    businessName: string;
    serviceName: string;
    startAt: string;
    visitUrl: string;
  }>;
};

export default function MyLiviaScreen() {
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
      const stored = await AsyncStorage.getItem(HUB_TOKEN_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }
      setHubToken(stored);
      try {
        setView(await loadView(stored));
      } catch {
        await AsyncStorage.removeItem(HUB_TOKEN_KEY);
        setHubToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadView]);

  async function requestOtp() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`${api}/api/public/guest-hub/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!r.ok) throw new Error("Could not send code");
      const j = (await r.json()) as { sessionToken: string; devOtp?: string; magicOtpCode?: string };
      setOtpSession(j.sessionToken);
      setMagicOtp(j.magicOtpCode ?? j.devOtp ?? null);
      if (j.magicOtpCode ?? j.devOtp) setCode(j.magicOtpCode ?? j.devOtp ?? "");
    } catch {
      setErr("Could not send code");
    } finally {
      setBusy(false);
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
      await AsyncStorage.setItem(HUB_TOKEN_KEY, j.hubToken);
      setHubToken(j.hubToken);
      setView(await loadView(j.hubToken));
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

  function openBookUrl(path: string) {
    void Linking.openURL(`${getDashboardOrigin()}${path}`);
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
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <ScrollView contentContainerStyle={styles.pad}>
          <Text style={[type.title, { color: colors.foreground }]}>My Livia</Text>
          <Text style={[type.caption, { color: colors.mutedForeground, marginTop: 8 }]}>
            Your bookings across every Livia shop — verify once with your mobile.
          </Text>
          {magicOtp ? (
            <Text style={[type.caption, { color: colors.primary, marginTop: 12 }]}>
              Staging code: {magicOtp}
            </Text>
          ) : null}
          {!otpSession ? (
            <>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="Mobile number"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <Pressable
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={() => void requestOtp()}
                disabled={busy || !phone.trim()}
              >
                <Text style={[type.body, { color: colors.primaryForeground, fontFamily: fonts.bodyMed }]}>
                  Send code
                </Text>
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
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={[type.title, { color: colors.foreground }]}>My Livia</Text>
        <Text style={[type.caption, { color: colors.mutedForeground }]}>{view.phoneE164}</Text>

        {view.upcomingBookings.map((b) => (
          <Pressable
            key={b.bookingId}
            style={[styles.card, { borderColor: colors.border }]}
            onPress={() => openBookUrl(b.visitUrl)}
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
            <View style={styles.row}>
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
            <Pressable
              style={[styles.btnSm, { borderColor: colors.border }]}
              onPress={() => openBookUrl(shop.bookUrl)}
            >
              <Text style={[type.caption, { color: colors.foreground }]}>Book again</Text>
            </Pressable>
          </View>
        ))}
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
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
