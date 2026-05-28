import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  species: string | null;
  notes: string | null;
};

export function CustomerPetsPanel({
  businessId,
  customerId,
  vertical,
}: {
  businessId: string;
  customerId: string;
  vertical?: string | null;
}) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");

  const show = vertical === "pet-grooming";

  useEffect(() => {
    if (!show || !businessId || !customerId) return;
    apiFetch<{ pets: Pet[] }>(`/businesses/${businessId}/customers/${customerId}/pets`)
      .then((r) => setPets(r.pets ?? []))
      .catch(() => setPets([]));
  }, [show, businessId, customerId]);

  if (!show) return null;

  async function addPet() {
    if (!name.trim()) return;
    const row = await apiFetch<Pet>(`/businesses/${businessId}/customers/${customerId}/pets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), breed: breed.trim() || undefined, species: "dog" }),
    });
    setPets((p) => [...p, row]);
    setName("");
    setBreed("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pets on file yet.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {pets.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong>
                {p.breed ? ` · ${p.breed}` : ""}
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Breed</Label>
            <Input value={breed} onChange={(e) => setBreed(e.target.value)} />
          </div>
        </div>
        <Button size="sm" onClick={() => void addPet()}>
          Add pet
        </Button>
      </CardContent>
    </Card>
  );
}
