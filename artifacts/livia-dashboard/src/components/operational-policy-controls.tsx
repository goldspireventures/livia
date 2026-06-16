import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import { normalizeDepositPercent } from "@workspace/policy";
import { invalidateCommerceIntelligence } from "@/lib/commerce-intelligence-cache";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { Shield } from "lucide-react";

type OperationalPolicyPayload = {
  policy: {
    depositRequired: boolean;
    depositPercent: number;
    serviceBufferMinutes: number;
    cancelWindowHours?: number;
    lateGraceMinutes: number;
    autoConfirmWhenNoDeposit: boolean;
    bookingContinuityEnabled?: boolean;
    bookingContinuityMode?: string;
    emergentTrustProgram?: { enabled?: boolean; acceptedAt?: string | null };
  };
  resolved: Record<string, unknown> & {
    emergentTrustProgram?: { enabled?: boolean; acceptedAt?: string | null };
  };
  depositPolicySummary?: string;
  bookingTermsBlock?: string;
};

export default function OperationalPolicyControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bid = business?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<OperationalPolicyPayload | null>(null);

  async function load() {
    if (!bid) return;
    setLoading(true);
    try {
      const data = await customFetch<OperationalPolicyPayload>(
        `/api/businesses/${bid}/operational-policy`,
      );
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

  async function save() {
    if (!bid || !state) return;
    setSaving(true);
    try {
      const data = await customFetch<OperationalPolicyPayload>(
        `/api/businesses/${bid}/operational-policy`,
        {
          method: "PATCH",
          body: JSON.stringify({ policy: state.policy }),
        },
      );
      setState(data);
      invalidateCommerceIntelligence(qc, bid);
      invalidateOperationalState(qc, bid);
      toast({ title: "Policy saved" });
    } catch (e) {
      toast({
        title: "Could not save policy",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!bid) return null;
  if (loading && !state) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (!state) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load operational policy. Check you are signed in as admin.
      </p>
    );
  }

  const p = state.policy;

  return (
    <Card data-testid="operational-policy-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" />
          Operational policy
        </CardTitle>
        <CardDescription>
          Deposits, buffers, cancellation window, and no-show rules for online bookings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Require deposit for online bookings</Label>
            <p className="text-xs text-muted-foreground mt-1">
              When off, bookings can confirm automatically if other rules allow.
            </p>
          </div>
          <Switch
            checked={p.depositRequired}
            onCheckedChange={(v) =>
              setState({ ...state, policy: { ...p, depositRequired: v } })
            }
          />
        </div>

        {p.depositRequired ? (
          <div className="grid gap-2 max-w-xs">
            <Label htmlFor="depositPercent">Deposit %</Label>
            <Input
              id="depositPercent"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              value={String(p.depositPercent)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
                setState({
                  ...state,
                  policy: {
                    ...p,
                    depositPercent: raw === "" ? 0 : normalizeDepositPercent(raw),
                  },
                });
              }}
              onBlur={() =>
                setState({
                  ...state,
                  policy: { ...p, depositPercent: normalizeDepositPercent(p.depositPercent) },
                })
              }
            />
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Auto-confirm when no deposit required</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Deposits are the default confirmation gate. This only applies when deposits are off.
            </p>
          </div>
          <Switch
            checked={p.autoConfirmWhenNoDeposit}
            onCheckedChange={(v) =>
              setState({ ...state, policy: { ...p, autoConfirmWhenNoDeposit: v } })
            }
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="buffer">Service buffer (minutes)</Label>
            <Input
              id="buffer"
              type="number"
              min={0}
              max={120}
              value={p.serviceBufferMinutes}
              onChange={(e) =>
                setState({
                  ...state,
                  policy: {
                    ...p,
                    serviceBufferMinutes: parseInt(e.target.value, 10) || 0,
                  },
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="cancelHours">Cancel window (hours)</Label>
            <Input
              id="cancelHours"
              type="number"
              min={0}
              max={168}
              value={p.cancelWindowHours ?? ""}
              placeholder="Jurisdiction default"
              onChange={(e) => {
                const v = e.target.value;
                setState({
                  ...state,
                  policy: {
                    ...p,
                    cancelWindowHours: v === "" ? undefined : parseInt(v, 10) || 0,
                  },
                });
              }}
            />
          </div>
          <div>
            <Label htmlFor="grace">Late grace (minutes)</Label>
            <Input
              id="grace"
              type="number"
              min={0}
              max={60}
              value={p.lateGraceMinutes}
              onChange={(e) =>
                setState({
                  ...state,
                  policy: { ...p, lateGraceMinutes: parseInt(e.target.value, 10) || 0 },
                })
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t pt-4">
          <div>
            <Label>Post-booking continuity (SMS/thread)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              After web bookings, guests get a follow-up thread for photos and confirmation.
            </p>
          </div>
          <Switch
            checked={p.bookingContinuityEnabled !== false}
            onCheckedChange={(v) =>
              setState({ ...state, policy: { ...p, bookingContinuityEnabled: v } })
            }
          />
        </div>

        {state.resolved.emergentTrustProgram?.enabled ? (
          <p className="text-xs text-muted-foreground border-t pt-4" data-testid="emergent-trust-active">
            Trusted-client tier is active — mark regulars on their customer profile to skip deposits.
          </p>
        ) : null}

        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save policy"}
        </Button>
      </CardContent>
    </Card>
  );
}
