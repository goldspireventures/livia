import { useAuth } from "@clerk/clerk-expo";
import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { aurum } from "@/constants/colors";
import { fonts, type } from "@/constants/typography";
import { useColors } from "@/hooks/useColors";

export default function NotFoundScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();

  return (
    <>
      <Stack.Screen options={{ title: "Not found", headerShown: false }} />
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <AuroraHalo tone="primary" size={400} intensity={0.75} style={{ top: -80, left: -40 }} />
        </View>

        <LiviaWordmark size="md" color={colors.foreground} />

        <View style={styles.main}>
          <Text style={[styles.code, { color: colors.mutedForeground }]}>404</Text>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: fonts.serif }]}>
            This screen{"\n"}
            <Text style={{ fontFamily: fonts.serifItalic, color: colors.mutedForeground }}>
              isn&apos;t here.
            </Text>
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            The route may have moved during the beta.
          </Text>
          <Pressable
            onPress={() => (isSignedIn ? router.replace("/(tabs)") : router.replace("/sign-in"))}
            style={styles.link}
          >
            <Text style={[styles.linkText, { color: aurum.champagne }]}>
              {isSignedIn ? "Back to Today →" : "Back to sign in →"}
            </Text>
          </Pressable>        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 48,
  },
  code: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  body: {
    ...type.body,
    marginBottom: 24,
    maxWidth: 280,
  },
  link: {
    minHeight: 44,
    justifyContent: "center",
  },
  linkText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
  },
});
