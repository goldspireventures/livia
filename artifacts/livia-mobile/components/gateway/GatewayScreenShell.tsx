import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConstellationShellAtmosphere } from "@/components/constellation/ConstellationShellAtmosphere";
import { GatewayG1Ambient } from "@/components/gateway/GatewayG1Ambient";
import { LinearGradient } from "expo-linear-gradient";
import { useMobileSurface } from "@/hooks/useMobileSurface";
import type { MobilePreAuthSurfaceId } from "@workspace/policy";

type Props = {
  surfaceId: MobilePreAuthSurfaceId;
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

/** Policy-driven pre-auth shell — preset colours + atmosphere from `MOBILE_PRE_AUTH_SURFACES`. */
export function GatewayScreenShell({ surfaceId, children, style, testID }: Props) {
  const { atmosphere, tokens: colors } = useMobileSurface(surfaceId);
  const insets = useSafeAreaInsets();

  return (
    <View
      testID={testID}
      style={[styles.root, { backgroundColor: colors.background }, style]}
    >
      {atmosphere === "g1" ? <GatewayG1Ambient /> : null}
      {atmosphere === "constellation" || atmosphere === "guest" ? <ConstellationShellAtmosphere /> : null}
      {atmosphere === "guest" ? (
        <LinearGradient
          colors={["rgba(6, 182, 212, 0.12)", "transparent"]}
          style={styles.guestWash}
          pointerEvents="none"
        />
      ) : null}
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, zIndex: 1 },
  guestWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: 0,
  },
});
