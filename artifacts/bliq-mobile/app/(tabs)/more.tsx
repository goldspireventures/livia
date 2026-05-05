import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: "users", label: "Staff", route: "/staff/" },
  { icon: "briefcase", label: "Services", route: "/services/" },
];

export default function MoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { businesses, currentBusiness, setCurrentBusiness } = useBusiness();
  const { signOut } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const otherBusinesses = businesses.filter((b) => b.id !== currentBusiness?.id);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12 }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>More</Text>

      {/* Current business card */}
      {currentBusiness && (
        <View style={[styles.businessCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.bizAvatar, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.bizInitial, { color: colors.primary }]}>
              {currentBusiness.name[0]?.toUpperCase() ?? "B"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>
              {currentBusiness.name}
            </Text>
            {currentBusiness.slug && (
              <Text style={[styles.bizSlug, { color: colors.mutedForeground }]}>
                bliq.app/b/{currentBusiness.slug}
              </Text>
            )}
          </View>
          {otherBusinesses.length > 0 && (
            <View style={[styles.activePill, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.activePillText, { color: colors.primary }]}>Active</Text>
            </View>
          )}
        </View>
      )}

      {/* Business switcher — only shown when user has multiple businesses */}
      {otherBusinesses.length > 0 && (
        <View>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Switch Business
          </Text>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {otherBusinesses.map((biz, index) => (
              <TouchableOpacity
                key={biz.id}
                style={[
                  styles.menuItem,
                  index < otherBusinesses.length - 1 && [
                    styles.menuItemBorder,
                    { borderBottomColor: colors.border },
                  ],
                ]}
                onPress={() => setCurrentBusiness(biz)}
                activeOpacity={0.7}
                testID={`switch-business-${biz.id}`}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.border }]}>
                  <Text style={[styles.switchInitial, { color: colors.foreground }]}>
                    {biz.name[0]?.toUpperCase() ?? "B"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]} numberOfLines={1}>
                    {biz.name}
                  </Text>
                  {biz.slug && (
                    <Text style={[styles.bizSlug, { color: colors.mutedForeground }]}>
                      /b/{biz.slug}
                    </Text>
                  )}
                </View>
                <Feather name="refresh-cw" size={15} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Main navigation items */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.menuItem,
              index < MENU_ITEMS.length - 1 && [styles.menuItemBorder, { borderBottomColor: colors.border }],
            ]}
            onPress={() => router.push(item.route as never)}
            activeOpacity={0.7}
            testID={`menu-${item.label.toLowerCase()}`}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name={item.icon} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => signOut()}
          activeOpacity={0.7}
          testID="sign-out-button"
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.destructive + "18" }]}>
            <Feather name="log-out" size={18} color={colors.destructive} />
          </View>
          <Text style={[styles.menuLabel, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        Bliq v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120, gap: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 4 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingLeft: 4,
    marginBottom: -4,
  },
  businessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  bizAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  bizInitial: { fontSize: 22, fontFamily: "Inter_700Bold" },
  switchInitial: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  bizName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  bizSlug: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  activePill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: { borderBottomWidth: 1 },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: { flex: 1, fontSize: 16, fontFamily: "Inter_500Medium" },
  version: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 8,
  },
});
