import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

const KEYS = [
  { id: "vertical.module", label: "Vertical module (replaces pack text)" },
  { id: "system.core", label: "Core instructions (prepended)" },
] as const;

export default function LivPromptControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [promptKey, setPromptKey] = useState<(typeof KEYS)[number]["id"]>("vertical.module");
  const [content, setContent] = useState("");
  const [packModule, setPackModule] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!bid) return;
    try {
      const [prompts, pack] = await Promise.all([
        customFetch<{ active: Record<string, string> }>(`/api/businesses/${bid}/liv-prompts`),
        customFetch<{ resolved: { promptModule: string } }>(`/api/businesses/${bid}/liv-pack`),
      ]);
      setPackModule(pack.resolved?.promptModule ?? "");
      setContent(prompts.active?.[promptKey] ?? "");
    } catch {
      setContent("");
    }
  }

  useEffect(() => {
    void load();
  }, [bid, promptKey]);

  async function save() {
    if (!bid || !content.trim()) return;
    setSaving(true);
    try {
      await customFetch(`/api/businesses/${bid}/liv-prompts`, {
        method: "PATCH",
        body: JSON.stringify({ promptKey, content: content.trim() }),
      });
      toast({ title: "Prompt version saved" });
      void load();
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!bid) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Versioned Liv prompts
        </CardTitle>
        <CardDescription>
          Overrides TS templates in the database. Default pack module shown for reference.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Prompt key</Label>
          <Select value={promptKey} onValueChange={(v) => setPromptKey(v as typeof promptKey)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KEYS.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {packModule ? (
          <p className="text-xs text-muted-foreground border rounded p-2 bg-muted/30 max-h-24 overflow-y-auto">
            Pack default: {packModule}
          </p>
        ) : null}
        <div className="space-y-2">
          <Label>Override content</Label>
          <Textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Leave empty to use pack/template only"
          />
        </div>
        <Button onClick={() => void save()} disabled={saving || !content.trim()}>
          {saving ? "Saving…" : "Save new version"}
        </Button>
      </CardContent>
    </Card>
  );
}
