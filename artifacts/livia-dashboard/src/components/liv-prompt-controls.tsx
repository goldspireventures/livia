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
import { Sparkles } from "lucide-react";

const KEYS = [
  {
    id: "vertical.module",
    label: "How Liv talks about your business",
    hint: "Replaces the default tone for your vertical (beauty, fitness, etc.).",
  },
  {
    id: "system.core",
    label: "Extra rules for every reply",
    hint: "Added on top of Liv's standard safety and booking rules.",
  },
] as const;

export default function LivPromptControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [promptKey, setPromptKey] = useState<(typeof KEYS)[number]["id"]>("vertical.module");
  const [content, setContent] = useState("");
  const [packModule, setPackModule] = useState("");
  const [saving, setSaving] = useState(false);

  const activeKeyMeta = KEYS.find((k) => k.id === promptKey) ?? KEYS[0];

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
      toast({ title: "Liv instructions saved" });
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
          <Sparkles className="h-4 w-4" />
          Custom instructions for Liv
        </CardTitle>
        <CardDescription>
          Optional — only change this if you want Liv to sound more like your brand. Leave blank to
          use Livia&apos;s default for your business type.
        </CardDescription>
      </CardHeader>
      <CardContent className="livia-form-stack space-y-5">
        <div className="space-y-2">
          <Label>What to customise</Label>
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
          <p className="text-xs text-muted-foreground leading-relaxed">{activeKeyMeta.hint}</p>
        </div>
        {packModule ? (
          <p className="text-xs text-muted-foreground border rounded-md p-3 bg-muted/30 max-h-24 overflow-y-auto">
            <span className="font-medium text-foreground/80">Livia default: </span>
            {packModule}
          </p>
        ) : null}
        <div className="space-y-2 pt-1">
          <Label>Your wording</Label>
          <Textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Example: Warm and concise. Never upsell. Always confirm patch test policy for tinting."
          />
        </div>
        <Button onClick={() => void save()} disabled={saving || !content.trim()}>
          {saving ? "Saving…" : "Save instructions"}
        </Button>
      </CardContent>
    </Card>
  );
}
