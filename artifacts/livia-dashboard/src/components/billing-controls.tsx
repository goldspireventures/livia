import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { CreditCard, Mic, TrendingUp } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";

type BillingState = {
  planId: string;
  planName: string;
  baseEurCentsPerMonth: number;
  seatEurCentsPerMonth: number | null;
  activeStaffSeats: number;
  entitlements: string[];
  usage: Record<string, number>;
  voiceOutcomeShareEurCents: number;
  voiceOutcomeCapEurCents: number | null;
  voiceOutcomeShareRate: number;
  stripeSubscriptionStatus: string | null;
  designPartnerActive: boolean;
};

function eur(cents: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
}

export default function BillingControls() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bid = business?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  async function load() {
    if (!bid) return;
    setLoading(true);
    try {
      const data = await customFetch<BillingState>(`/api/businesses/${bid}/billing`);
      setBilling(data);
    } catch {
      setBilling(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  if (!bid) return null;

  if (loading && !billing) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!billing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Could not load billing for this shop.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasVoice = billing.entitlements.includes("voice_receptionist");
  const hasWhatsApp = billing.entitlements.includes("whatsapp_inbound");
  const bookingsDone = billing.usage.booking_completed ?? 0;
  const smsSent = billing.usage.sms_message_outbound ?? 0;
  const waSent = billing.usage.whatsapp_message_outbound ?? 0;
  const voiceOutcomes = billing.usage.voice_booking_outcome ?? 0;

  async function startCheckout(
    planId: "solo" | "studio" | "chain" | "chair-host",
    extra?: { shopCount?: number; renterCount?: number },
  ) {
    setCheckoutLoading(planId);
    try {
      const res = await customFetch<{ url?: string; mode?: string; message?: string }>(
        `/api/businesses/${bid}/billing/checkout-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, ...extra }),
        },
      );
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      toast({
        title: res.mode === "dev" ? "Plan updated (dev)" : "Checkout started",
        description: res.message,
      });
      await load();
      if (bid) invalidateOperationalState(qc, bid);
    } catch (err: unknown) {
      const code = (err as { data?: { code?: string } })?.data?.code;
      if (code === "ENTITLEMENT_REQUIRED") {
        toast({ title: "Upgrade required", variant: "destructive" });
      } else {
        toast({ title: "Checkout failed", variant: "destructive" });
      }
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Plan & billing
          </CardTitle>
          <CardDescription>
            {billing.designPartnerActive
              ? "Design partner pricing active."
              : billing.stripeSubscriptionStatus
                ? `Subscription: ${billing.stripeSubscriptionStatus}`
                : "Subscribe to unlock the full Livia platform."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-semibold">{billing.planName}</span>
            <span className="text-muted-foreground text-sm">({billing.planId})</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Base {eur(billing.baseEurCentsPerMonth)}/mo
            {billing.seatEurCentsPerMonth != null
              ? ` · ${billing.activeStaffSeats} staff seats × ${eur(billing.seatEurCentsPerMonth)}`
              : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {billing.planId !== "solo" && (
              <Button
                variant="outline"
                disabled={!!checkoutLoading}
                onClick={() => startCheckout("solo")}
              >
                {checkoutLoading === "solo" ? "…" : "Switch to Solo (€79)"}
              </Button>
            )}
            {billing.planId !== "studio" && (
              <Button
                disabled={!!checkoutLoading}
                onClick={() => startCheckout("studio")}
              >
                {checkoutLoading === "studio" ? "…" : "Upgrade to Studio (€149)"}
              </Button>
            )}
            {billing.planId !== "chain" && (
              <Button
                variant="outline"
                disabled={!!checkoutLoading}
                onClick={() => startCheckout("chain", { shopCount: 2 })}
              >
                {checkoutLoading === "chain" ? "…" : "Chain (from €249 + €15/shop)"}
              </Button>
            )}
            {billing.planId !== "chair-host" && (
              <Button
                variant="outline"
                disabled={!!checkoutLoading}
                onClick={() => startCheckout("chair-host", { renterCount: 1 })}
              >
                {checkoutLoading === "chair-host" ? "…" : "Host (€99 + €19/renter)"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Usage this period
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm" data-testid="billing-usage-meters">
          <div className="flex justify-between">
            <span>Completed bookings</span>
            <span className="font-medium">{bookingsDone}</span>
          </div>
          <div className="flex justify-between">
            <span>SMS sent</span>
            <span className="font-medium">{smsSent}</span>
          </div>
          <div className="flex justify-between">
            <span>WhatsApp sent</span>
            <span className="font-medium">
              {waSent}
              {!hasWhatsApp ? (
                <span className="text-muted-foreground text-xs ml-1">(upgrade)</span>
              ) : null}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Voice booking outcomes</span>
            <span className="font-medium">
              {voiceOutcomes}
              {!hasVoice ? (
                <span className="text-muted-foreground text-xs ml-1">(Solo+)</span>
              ) : null}
            </span>
          </div>
        </CardContent>
      </Card>

      {hasVoice || voiceOutcomes > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mic className="h-4 w-4" />
              Voice bookings
            </CardTitle>
            <CardDescription>
              {hasVoice
                ? `${(billing.voiceOutcomeShareRate * 100).toFixed(0)}% share on bookings Liv recovers by phone this period.`
                : "Voice receptionist is not on your plan."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {eur(billing.voiceOutcomeShareEurCents)}
              {billing.voiceOutcomeCapEurCents != null
                ? ` / ${eur(billing.voiceOutcomeCapEurCents)}/mo cap`
                : null}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
