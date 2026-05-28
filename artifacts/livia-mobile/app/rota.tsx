import { customFetch } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBusiness } from "@/contexts/BusinessContext";
import { useColors } from "@/hooks/useColors";
import { fonts, type } from "@/constants/typography";

type Shift = {
  id: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  label?: string | null;
};

type StaffRow = { id: string; displayName: string };

export default function RotaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id ?? "";
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    try {
      const [shiftRows, staffRows] = await Promise.all([
        customFetch<Shift[]>(`/api/businesses/${bid}/staff-shifts`),
        customFetch<StaffRow[]>(`/api/businesses/${bid}/staff`),
      ]);
      setShifts(shiftRows);
      setStaff(staffRows);
    } catch {
      setShifts([]);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [bid]);

  useEffect(() => {
    void load();
  }, [load]);

  const staffName = (id: string) => staff.find((s) => s.id === id)?.displayName ?? id;

  async function addTomorrowShift() {
    if (!bid || !staffId) return;
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(17, 0, 0, 0);
    setSaving(true);
    try {
      await customFetch(`/api/businesses/${bid}/staff-shifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          label: "Floor",
        }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
    >
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={[type.caption, { color: colors.muted }]}>← Back</Text>
      </Pressable>
      <Text style={[type.title, { color: colors.foreground, fontFamily: fonts.serifMedium }]}>Who's working</Text>
      <Text style={[type.body, { color: colors.muted, marginTop: 8 }]}>
        Upcoming shifts for {currentBusiness?.name ?? "this shop"}. Add a floor shift from your phone — full
        calendar editing stays on web.
      </Text>

      {staff.length > 0 ? (
        <View style={[styles.addBox, { borderColor: colors.primary + "44", backgroundColor: colors.card }]}>
          <Text style={[type.label, { color: colors.foreground }]}>Quick add</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {staff.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setStaffId(s.id)}
                style={[
                  styles.chip,
                  {
                    borderColor: staffId === s.id ? colors.primary : colors.border,
                    backgroundColor: staffId === s.id ? colors.primary + "22" : "transparent",
                  },
                ]}
              >
                <Text style={[type.caption, { color: colors.foreground }]}>{s.displayName}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            onPress={() => void addTomorrowShift()}
            disabled={!staffId || saving}
            style={[styles.addBtn, { backgroundColor: colors.primary, opacity: staffId && !saving ? 1 : 0.5 }]}
          >
            <Text style={[type.label, { color: "#fff" }]}>
              {saving ? "Adding…" : "Add tomorrow 9:00–17:00"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      ) : shifts.length === 0 ? (
        <Text style={[type.body, { color: colors.muted, marginTop: 24 }]}>
          No shifts yet — pick a team member above and tap Add tomorrow.
        </Text>
      ) : (
        <View style={{ marginTop: 20, gap: 12 }}>
          {shifts
            .slice()
            .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
            .map((sh) => {
              const start = new Date(sh.startsAt);
              const end = new Date(sh.endsAt);
              const day = start.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const time = `${start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
              return (
                <View
                  key={sh.id}
                  style={[styles.card, { borderColor: colors.primary + "44", backgroundColor: colors.card }]}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {staffName(sh.staffId).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.label, { color: colors.foreground, fontSize: 16 }]}>
                        {staffName(sh.staffId)}
                      </Text>
                      <Text style={[type.caption, { color: colors.muted, marginTop: 2 }]}>{day}</Text>
                    </View>
                  </View>
                  <Text style={[styles.timeLine, { color: colors.foreground }]}>{time}</Text>
                  {sh.label ? (
                    <Text style={[type.caption, { color: colors.muted, marginTop: 6 }]}>{sh.label}</Text>
                  ) : null}
                </View>
              );
            })}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { marginBottom: 8 },
  addBox: { marginTop: 20, padding: 14, borderRadius: 14, borderWidth: 1 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  addBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.bodySemi, fontSize: 18 },
  timeLine: { fontFamily: fonts.bodySemi, fontSize: 15, letterSpacing: -0.2 },
});
