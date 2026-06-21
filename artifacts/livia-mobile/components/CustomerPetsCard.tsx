import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { customFetch } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { fonts } from "@/constants/typography";

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  species: string | null;
};

export function CustomerPetsCard({
  businessId,
  customerId,
}: {
  businessId: string;
  customerId: string;
}) {
  const colors = useColors();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void customFetch<{ pets: Pet[] }>(
      `/api/businesses/${businessId}/customers/${customerId}/pets`,
    )
      .then((r) => setPets(r.pets ?? []))
      .catch(() => setPets([]))
      .finally(() => setLoading(false));
  }, [businessId, customerId]);

  async function addPet() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const row = await customFetch<Pet>(
        `/api/businesses/${businessId}/customers/${customerId}/pets`,
        {
          method: "POST",
          body: JSON.stringify({ name: name.trim(), breed: breed.trim() || undefined, species: "dog" }),
        },
      );
      setPets((p) => [...p, row]);
      setName("");
      setBreed("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Pets</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : pets.length === 0 ? (
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>No pets on file yet.</Text>
      ) : (
        pets.map((p) => (
          <Text key={p.id} style={[styles.row, { color: colors.foreground }]}>
            {p.name}
            {p.breed ? ` · ${p.breed}` : ""}
          </Text>
        ))
      )}
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Pet name"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
      />
      <TextInput
        value={breed}
        onChangeText={setBreed}
        placeholder="Breed (optional)"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
      />
      <Pressable
        onPress={() => void addPet()}
        disabled={saving || !name.trim()}
        style={[styles.btn, { backgroundColor: colors.primary, opacity: saving || !name.trim() ? 0.5 : 1 }]}
      >
        <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
          {saving ? "Adding…" : "Add pet"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  title: { fontFamily: fonts.bodyMed, fontSize: 15, marginBottom: 8 },
  meta: { fontSize: 12, marginBottom: 8 },
  row: { fontSize: 14, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    marginTop: 8,
  },
  btn: { marginTop: 10, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  btnText: { fontFamily: fonts.bodyMed, fontSize: 14 },
});
