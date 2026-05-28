import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Resource = {
  id: string;
  name: string;
  resourceType: string;
  capacity: number;
  isActive: boolean;
};

export function BookingResourcesPanel() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [name, setName] = useState("");
  const [resourceType, setResourceType] = useState<"room" | "equipment" | "thermal">("room");
  const [capacity, setCapacity] = useState("1");

  async function reload() {
    if (!business?.id) return;
    try {
      const rows = await customFetch<Resource[]>(`/api/businesses/${business.id}/resources`);
      setResources(rows);
    } catch {
      setResources([]);
    }
  }

  useEffect(() => {
    void reload();
  }, [business?.id]);

  async function handleCreate() {
    if (!business?.id || !name.trim()) return;
    try {
      await customFetch(`/api/businesses/${business.id}/resources`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          resourceType,
          capacity: Number.parseInt(capacity, 10) || 1,
        }),
      });
      toast({ title: "Resource added" });
      setName("");
      void reload();
    } catch {
      toast({ title: "Failed to add resource", variant: "destructive" });
    }
  }

  if (!business) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rooms & capacity</CardTitle>
        <CardDescription>
          Treatment rooms, thermal suites, and equipment with shared capacity — required for spa and
          wellness scheduling.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          {resources.map((r) => (
            <li key={r.id} className="flex justify-between border rounded-md px-3 py-2">
              <span>
                {r.name}{" "}
                <span className="text-muted-foreground">
                  ({r.resourceType}, cap {r.capacity})
                </span>
              </span>
            </li>
          ))}
          {resources.length === 0 ? (
            <li className="text-muted-foreground">No resources yet.</li>
          ) : null}
        </ul>
        <div className="grid gap-3 sm:grid-cols-3 border-t pt-4">
          <div className="space-y-2 sm:col-span-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Suite 2" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={resourceType} onValueChange={(v) => setResourceType(v as typeof resourceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="thermal">Thermal / sauna</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} type="number" min={1} />
          </div>
        </div>
        <Button size="sm" onClick={() => void handleCreate()}>
          Add resource
        </Button>
      </CardContent>
    </Card>
  );
}
