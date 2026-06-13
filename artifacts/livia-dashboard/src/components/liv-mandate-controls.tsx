import { useEffect, useMemo, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { customFetch } from "@workspace/api-client-react";
import { LIV_MANDATE_RUNG_LABELS, type LivMandateAction } from "@workspace/policy";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const MANDATE_RUNGS = ["R0", "R1", "R2", "R3", "R4"] as const;

const DENY_TOGGLES: Array<{ action: LivMandateAction; label: string }> = [
  { action: "process_refund", label: "Block auto refunds" },
  { action: "approve_design_proof", label: "Block design proof approval" },
  { action: "waive_deposit", label: "Block deposit waivers" },
  { action: "apply_no_show_fee", label: "Block no-show fees" },
  { action: "cancel_booking", label: "Block auto cancellations" },
];

type LivMandatePayload = {
  mandate: {
    rung: string;
    trustScore: number;
    maxAutoValueMinor: number;
    deniedActions?: LivMandateAction[];
    ownerNote?: string;
  };
  defaults: { rung: string };
  vertical: string;
  simulation: Array<{
    label: string;
    outcome: string;
    reason: string;
  }>;
};

export default function LivMandateControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<LivMandatePayload | null>(null);
  const [capEuros, setCapEuros] = useState("0");

  const deniedSet = useMemo(
    () => new Set(state?.mandate.deniedActions ?? []),
    [state?.mandate.deniedActions],
  );

  useEffect(() => {
    if (state?.mandate.maxAutoValueMinor != null) {
      setCapEuros(String(Math.round(state.mandate.maxAutoValueMinor / 100)));
    }
  }, [state?.mandate.maxAutoValueMinor]);

  async function load() {
    if (!bid) return;
    setLoading(true);
    try {
      const data = await customFetch<LivMandatePayload>(`/api/businesses/${bid}/liv-mandate`);
      setState(data);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  async function patchMandate(partial: Record<string, unknown>, toastTitle: string) {
    if (!bid) return;
    setSaving(true);
    try {
      const data = await customFetch<LivMandatePayload>(`/api/businesses/${bid}/liv-mandate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mandate: { ...partial, acknowledgedAt: new Date().toISOString() },
        }),
      });
      setState(data);
      toast({ title: toastTitle });
    } catch (e) {
      toast({
        title: "Could not save mandate",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function setRung(rung: string) {
    await patchMandate({ rung }, "Liv Mandate updated");
  }

  async function saveCap() {
    const euros = Number.parseInt(capEuros.replace(/\D/g, ""), 10);
    if (Number.isNaN(euros) || euros < 0) {
      toast({ title: "Enter a valid euro amount", variant: "destructive" });
      return;
    }
    await patchMandate({ maxAutoValueMinor: euros * 100 }, "Refund cap saved");
  }

  async function toggleDenied(action: LivMandateAction) {
    const next = new Set(deniedSet);
    if (next.has(action)) next.delete(action);
    else next.add(action);
    await patchMandate({ deniedActions: [...next] }, "Blocks updated");
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!state) return null;

  return (
    <Card data-testid="liv-mandate-card" className="border-violet-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-4 w-4 text-violet-500" />
          Liv Mandate
        </CardTitle>
        <CardDescription>
          How much Liv can do on her own inside your shop. Trust builds over time — start conservative.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Trust {state.mandate.trustScore}%</Badge>
          <Badge variant="outline">{state.vertical} default: {state.defaults.rung}</Badge>
        </div>
        <div className="flex flex-col gap-2" data-testid="liv-mandate-rungs">
          {MANDATE_RUNGS.map((r) => {
            const meta = LIV_MANDATE_RUNG_LABELS[r];
            const selected = state.mandate.rung === r;
            return (
              <Button
                key={r}
                type="button"
                variant={selected ? "default" : "outline"}
                disabled={saving}
                onClick={() => void setRung(r)}
                data-testid={`liv-mandate-rung-${r}`}
                className={cn(
                  "w-full min-w-0 h-auto py-3 px-3 text-left whitespace-normal",
                  "justify-start items-start gap-2",
                )}
              >
                <span className="font-mono text-xs shrink-0 pt-0.5">{r}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug">
                    {meta?.short ?? r}
                  </span>
                  <span className="block text-xs font-normal leading-relaxed opacity-90 mt-0.5">
                    {meta?.description ?? ""}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
        <div className="space-y-2">
          <Label>Refund auto-cap (€)</Label>
          <p className="text-xs text-muted-foreground">
            Liv auto-processes refunds up to this amount. Above the cap, you approve in the queue. 0 =
            always propose.
          </p>
          <div className="flex gap-2 max-w-xs">
            <Input
              value={capEuros}
              onChange={(e) => setCapEuros(e.target.value)}
              inputMode="numeric"
              data-testid="input-mandate-refund-cap"
            />
            <Button type="button" variant="secondary" disabled={saving} onClick={() => void saveCap()}>
              Save cap
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Hard blocks</Label>
          <p className="text-xs text-muted-foreground">
            Blocked actions always need you, even at high autonomy.
          </p>
          {DENY_TOGGLES.map((row) => (
            <div
              key={row.action}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="text-sm">{row.label}</span>
              <Switch
                checked={deniedSet.has(row.action)}
                onCheckedChange={() => void toggleDenied(row.action)}
                disabled={saving}
              />
            </div>
          ))}
        </div>
        <div>
          <Label className="text-muted-foreground text-xs uppercase tracking-wide">
            Simulator — what would happen today
          </Label>
          <ul className="mt-2 space-y-2 text-sm">
            {state.simulation.map((row) => (
              <li
                key={row.label}
                className="flex justify-between gap-4 rounded-md border px-3 py-2"
              >
                <span>{row.label}</span>
                <Badge
                  variant={
                    row.outcome === "auto"
                      ? "default"
                      : row.outcome === "refuse"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {row.outcome}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
