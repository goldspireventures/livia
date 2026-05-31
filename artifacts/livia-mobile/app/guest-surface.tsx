/**
 * Opens a thick guest surface (visit, intake, pay, etc.) in the system browser.
 * Deep link: livia://guest-surface?kind=visit&slug=ink-anchor-galway&token=abc
 */
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";
import { getGuestSurfaceUrl, type GuestSurfaceKind } from "@/lib/guest-surface-url";

const KINDS: GuestSurfaceKind[] = ["visit", "intake", "waitlist", "pay", "proof"];

export default function GuestSurfaceScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string; slug?: string; token?: string }>();
  const [err, setErr] = useState<string | null>(null);

  const kind = (Array.isArray(params.kind) ? params.kind[0] : params.kind) as GuestSurfaceKind;
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  useEffect(() => {
    if (!kind || !slug || !token || !KINDS.includes(kind)) {
      setErr("Invalid guest link");
      return;
    }
    const url = getGuestSurfaceUrl(kind, slug, token);
    void WebBrowser.openBrowserAsync(url).finally(() => {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)");
    });
  }, [kind, slug, token, router]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>
      {err ? (
        <Text style={[type.body, { color: colors.destructive, textAlign: "center" }]}>{err}</Text>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[type.body, { color: colors.mutedForeground, marginTop: 12 }]}>
            Opening secure guest page…
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
