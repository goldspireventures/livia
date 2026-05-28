import { View, StyleSheet } from "react-native";
import { LiviaWordmark } from "@/components/brand/LiviaWordmark";
import { NotificationBell } from "@/components/NotificationBell";
import { useColors } from "@/hooks/useColors";

/** Consistent wordmark + notification bell for tab screens. */
export function ScreenTopBar() {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <LiviaWordmark size="sm" color={colors.foreground} />
      <NotificationBell />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
});
