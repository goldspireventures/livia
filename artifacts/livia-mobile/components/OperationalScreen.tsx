import React from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraHalo } from "@/components/brand/AuroraHalo";
import { PersonaScreenHeader } from "@/components/PersonaScreenHeader";
import { ScreenTopBar } from "@/components/ScreenTopBar";
import { useColors } from "@/hooks/useColors";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Slot above scroll content (e.g. persona banner) */
  headerExtra?: React.ReactNode;
  /** Fingertip actions row — keep 1–3 items */
  actions?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  showHalo?: boolean;
  /** When false, children manage their own scroll (e.g. FlatList). */
  scroll?: boolean;
};

/**
 * Mobile layout contract: safe area + optional aurora + ritual header + scroll body.
 * Matches dashboard web OperationalPageShell intent.
 */
export function OperationalScreen({
  eyebrow,
  title,
  subtitle,
  children,
  headerExtra,
  actions,
  refreshing,
  onRefresh,
  contentStyle,
  showHalo = true,
  scroll = true,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const header = (
    <>
      <ScreenTopBar />
      <Animated.View entering={FadeInDown.duration(380).springify().damping(18)}>
        <PersonaScreenHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      </Animated.View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
      {headerExtra}
    </>
  );

  if (!scroll) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {showHalo ? (
          <AuroraHalo tone="primary" size={380} style={styles.halo} intensity={0.9} />
        ) : null}
        <View style={[styles.staticHeader, { paddingTop: topPad + 8, paddingHorizontal: 20 }]}>
          {header}
        </View>
        <View style={styles.staticBody}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {showHalo ? (
        <AuroraHalo tone="primary" size={380} style={styles.halo} intensity={0.9} />
      ) : null}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 8, paddingBottom: insets.bottom + 88 },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
      >
        {header}
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  halo: { position: "absolute", top: -120, left: -80, opacity: 0.85 },
  content: { paddingHorizontal: 20, gap: 14 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  staticHeader: { gap: 14, paddingBottom: 8 },
  staticBody: { flex: 1 },
});
