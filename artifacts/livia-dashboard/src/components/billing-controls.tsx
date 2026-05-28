import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { CreditCard, Mic, TrendingUp, Shield } from "lucide-react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import { PLANNED_ENTITLEMENTS } from "@workspace/policy";

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

  const entitlementLabels: Record<string, string> = {
    voice_receptionist: "Voice",
    whatsapp_inbound: "WhatsApp",
    whatsapp_outbound: "WA outbound",
    sms_outbound: "SMS",
    audit_log_owner_view: "Audit",
    audit_log_export: "Audit export",
    peer_set_insights: "Peer insights",
    cross_tenant_intelligence_opt_in: "Cross-tenant intel",
    deposits: "Deposits",
    stripe_connect_payouts: "Payouts",
    apple_wallet_passes: "Wallet",
    google_calendar_export: "Calendar",
    phorest_migration_broker: "Phorest",
    booksy_migration_broker: "Booksy",
    csv_importer: "CSV import",
    delegations_advanced: "Delegations",
    multi_brand: "Multi-brand",
    chair_rental: "Chair host",
    vertical_pack_beauty: "Beauty pack",
    vertical_pack_body_art: "Body art pack",
    vertical_pack_wellness: "Wellness pack",
    vertical_pack_fitness: "Fitness pack",
    vertical_pack_medspa: "Medspa pack",
    vertical_pack_allied_health: "Allied health",
    vertical_pack_pet_grooming: "Pet grooming",
    vertical_pack_automotive_detailing: "Detailing",
    class_booking: "Classes",
    tattoo_design_proof: "Design proofs",
    package_credits: "Packages",
    franchise_rollup: "Franchise",
    locale_pack_nordic: "Nordic locale",
    public_api_alpha: "Partner API",
    payroll_export: "Payroll",
    booking_continuity: "Continuity",
    enterprise_audit_export: "Enterprise audit",
    enterprise_sso: "Enterprise SSO",
  };

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
          <div className="flex flex-wrap gap-1.5 pt-1" data-testid="billing-entitlements">
            {billing.entitlements.slice(0, 12).map((key) => (
              <Badge
                key={key}
                variant={PLANNED_ENTITLEMENTS.has(key) ? "outline" : "secondary"}
                className="text-[10px] font-normal"
                title={
                  PLANNED_ENTITLEMENTS.has(key)
                    ? "Included on plan — product integration ships next"
                    : undefined
                }
              >
                {entitlementLabels[key] ?? key.replace(/_/g, " ")}
                {PLANNED_ENTITLEMENTS.has(key) ? " (planned)" : ""}
              </Badge>
            ))}
            {billing.entitlements.length > 12 ? (
              <Badge variant="outline" className="text-[10px]">
                +{billing.entitlements.length - 12} more
              </Badge>
            ) : null}
          </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Plan integrity
          </CardTitle>
          <CardDescription>
            Matches{" "}
            <a
              href="https://livia.io/pricing"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              livia.io/pricing
            </a>
            . API returns 403 with code <code className="text-xs">ENTITLEMENT_REQUIRED</code> when a
            feature is not on your plan.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add-ons</CardTitle>
          <CardDescription>Unlock when your segment has enough anonymized peers (k≥10).</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Peer insights</strong> — €49/mo · benchmarks vs similar shops
          </p>
          <p>
            <strong className="text-foreground">Concierge migration</strong> — Phorest / Booksy / CSV · quoted €500–€2,500
          </p>
          <p className="text-xs">
            Nordic locale pack, enterprise SSO, and audit export — on Chain and custom plans. See{" "}
            <a href="https://livia.io/pricing" className="text-primary hover:underline" target="_blank" rel="noreferrer">
              livia.io/pricing
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="h-4 w-4" />
            Voice outcome share
          </CardTitle>
          <CardDescription>
            {hasVoice
              ? `${(billing.voiceOutcomeShareRate * 100).toFixed(0)}% of recovered voice bookings (capped).`
              : "Upgrade to Solo or Studio to enable the voice receptionist."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {eur(billing.voiceOutcomeShareEurCents)}
            {billing.voiceOutcomeCapEurCents != null
              ? ` / ${eur(billing.voiceOutcomeCapEurCents)} cap`
              : null}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
