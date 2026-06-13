import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Template = {
  id: string;
  name: string;
  eventTypes?: string[];
  presetLines?: Array<{ serviceName: string; quantity?: number }>;
  isActive?: boolean;
};

export function QuoteTemplatesSection() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [eventTypes, setEventTypes] = useState("birthday, wedding");

  async function load() {
    if (!bid) return;
    try {
      setTemplates(await customFetch<Template[]>(`/api/businesses/${bid}/quote-templates`));
    } catch {
      setTemplates([]);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  async function createTemplate() {
    if (!bid || !name.trim()) return;
    try {
      await customFetch(`/api/businesses/${bid}/quote-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          eventTypes: eventTypes.split(",").map((s) => s.trim()).filter(Boolean),
          presetLines: [],
        }),
      });
      setName("");
      toast({ title: "Template created — add lines when generating quotes" });
      void load();
    } catch {
      toast({ title: "Could not create template", variant: "destructive" });
    }
  }

  return (
    <section className="rounded-xl border p-4 space-y-3" data-testid="quote-templates-section">
      <div>
        <h2 className="font-medium">Quote templates</h2>
      </div>
      <ul className="space-y-2">
        {templates.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">
                {(t.eventTypes ?? []).join(", ") || "No event types"}
                {" · "}
                {(t.presetLines ?? []).length} line(s)
              </p>
            </div>
            {t.isActive === false ? <Badge variant="secondary">Inactive</Badge> : null}
          </li>
        ))}
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates yet.</p>
        ) : null}
      </ul>
      <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t">
        <div className="space-y-1">
          <Label className="text-xs">Template name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Corporate reception" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Event types (comma-separated)</Label>
          <Input value={eventTypes} onChange={(e) => setEventTypes(e.target.value)} placeholder="corporate, launch" />
        </div>
      </div>
      <Button type="button" size="sm" onClick={() => void createTemplate()}>
        Add template
      </Button>
    </section>
  );
}
