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
import { showBookingResourcesSettings } from "@workspace/policy";
import { resolveVerticalKey } from "@workspace/policy";

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

  const vertical = resolveVerticalKey(
    (business as { vertical?: string } | null)?.vertical,
    business?.category,
  );

  if (!business || !showBookingResourcesSettings(vertical)) return null;

  const copy =
    vertical === "medspa"
      ? {
          title: "Rooms & equipment",
          description:
            "Treatment rooms and devices with shared capacity — used when services need a specific suite or machine.",
        }
      : vertical === "allied-health"
        ? {
            title: "Rooms & capacity",
            description: "Consulting rooms and shared spaces — used when a service must book a room.",
          }
        : {
            title: "Rooms & capacity",
            description:
              "Spa rooms, thermal suites, and equipment — used when treatments share physical capacity.",
          };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
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
