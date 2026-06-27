import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { CreditCard, Mic, TrendingUp } from "lucide-react";
import { BillingRemediationStrip } from "@/components/billing/billing-remediation-strip";
import { CommerceFixPanel } from "@/components/billing/commerce-fix-panel";
import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { customFetch } from "@workspace/api-client-react";
import { parseUserFacingError } from "@/lib/user-facing-errors";
import { useBillingState } from "@/hooks/use-billing-state";
import { hasEffectiveEntitlement, ADDON_CATALOGUE, formatAddonPriceEur, lookupAddon, type EntitlementKey } from "@workspace/entitlements";
import {
  buildBillingAddonCatalogForOwner,
  ownerBillingAddonLivPrompts,
  type CommerceAddonId,
} from "@workspace/policy";
import { Sparkles, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import PeerInsightsControls from "@/components/peer-insights-controls";

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

export default function BillingControls({ showRemediationStrip = true }: { showRemediationStrip?: boolean }) {
  const { business } = useBusiness();
  const { role } = useMembership();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bid = business?.id ?? "";
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const { data: billing, isLoading, isError, refetch } = useBillingState();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const addon = params.get("addon");
    const status = params.get("addon_status");
    if (status === "success" && addon) {
      const def = lookupAddon(addon);
      toast({
        title: `${def?.name ?? "Add-on"} unlocked`,
        description:
          addon === "event_operator_pack"
            ? "Consult-first inbox and quotes are live."
            : addon === "retail_pack"
              ? "Take-home retail is live on your book page."
              : addon === "peer_set_insights"
                ? "Peer insights is active — opt in below to see benchmarks."
                : "Your add-on is active.",
      });
      params.delete("addon");
      params.delete("addon_status");
      const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
      window.history.replaceState({}, "", next);
      void refetch();
    }
  }, [toast, refetch]);

  if (!bid) {
    return <Skeleton className="h-48 w-full rounded-xl" data-testid="billing-loading" />;
  }

  if (!["OWNER", "ADMIN"].includes(role ?? "")) {
    return (
      <Card data-testid="billing-role-blocked">
        <CardHeader>
          <CardTitle>Plan & billing</CardTitle>
          <CardDescription>Only the shop owner can view or change the plan.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" data-testid="billing-loading" />;
  }

  if (isError || !billing) {
    return (
      <Card data-testid="billing-load-error">
        <CardHeader>
          <CardTitle>Plan & billing</CardTitle>
          <CardDescription>
            We could not load your plan right now. Check that the API is running, then try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasVoice = billing.entitlements.includes("voice_receptionist");
  const hasWhatsApp = billing.entitlements.includes("whatsapp_inbound");
  const hasEventOperator = hasEffectiveEntitlement(
    billing.entitlements as EntitlementKey[],
    "event_operator_pack",
  );
  const hasRetailPack = hasEffectiveEntitlement(
    billing.entitlements as EntitlementKey[],
    "retail_pack",
  );
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const billingAddons = buildBillingAddonCatalogForOwner({
    vertical,
    activeEntitlements: billing.entitlements,
  });
  const addonLivPrompts = ownerBillingAddonLivPrompts(billingAddons);
  const hasPeerInsights = billing.entitlements.includes("peer_set_insights");

  function isAddonActive(addonId: CommerceAddonId): boolean {
    if (addonId === "event_operator_pack") return hasEventOperator;
    if (addonId === "retail_pack") return hasRetailPack;
    if (addonId === "peer_set_insights") return hasPeerInsights;
    return false;
  }
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
      await refetch();
      if (bid) invalidateOperationalState(qc, bid);
    } catch (err: unknown) {
      const data = (err as { data?: { code?: string; error?: string; priceEnv?: string } })?.data;
      const code = data?.code;
      const detail =
        (err as Error)?.message ||
        data?.error ||
        "Could not start checkout. Try again or contact support.";
      if (code === "ENTITLEMENT_REQUIRED") {
        toast({ title: "Upgrade required", description: detail, variant: "destructive" });
      } else if (code === "INSUFFICIENT_ROLE") {
        toast({
          title: "Owner access required",
          description: "Only the shop owner can change the subscription plan.",
          variant: "destructive",
        });
      } else if (code === "STRIPE_PRICE_NOT_CONFIGURED") {
        toast({
          title: "Billing not fully configured",
          description: data?.priceEnv
            ? "Card payments are not fully set up for this environment. Contact support if checkout fails."
            : detail,
          variant: "destructive",
        });
      } else if (code === "STRIPE_NOT_CONFIGURED") {
        toast({
          title: "Billing unavailable",
          description: "Card payments are not available yet. Contact support to enable billing.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Checkout failed", description: detail, variant: "destructive" });
      }
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function startAddonCheckout(addonId: string, returnPath = "/settings?tab=billing") {
    setCheckoutLoading(addonId);
    try {
      const res = await customFetch<{ url?: string; mode?: string; message?: string; active?: boolean }>(
        `/api/businesses/${bid}/billing/checkout-addon`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addonId, returnPath }),
        },
      );
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      toast({
        title: "Add-on active",
        description: res.message,
      });
      await refetch();
      if (bid) invalidateOperationalState(qc, bid);
    } catch (err: unknown) {
      const data = (err as { data?: { code?: string; error?: string } })?.data;
      toast({
        title: "Checkout failed",
        description: parseUserFacingError(err, "Checkout could not start"),
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function redeemPromo() {
    const code = promoCode.trim();
    if (!code) return;
    setPromoLoading(true);
    try {
      const res = await customFetch<{ message?: string }>(
        `/api/businesses/${bid}/billing/redeem-promo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        },
      );
      toast({ title: "Code applied", description: res.message });
      setPromoCode("");
      await refetch();
      if (bid) invalidateOperationalState(qc, bid);
    } catch (err: unknown) {
      toast({
        title: "Code not applied",
        description: parseUserFacingError(err, "Check the code and try again."),
        variant: "destructive",
      });
    } finally {
      setPromoLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {showRemediationStrip ? <BillingRemediationStrip /> : null}
      <CommerceFixPanel />
      <Card id="plan-billing-card" className="scroll-mt-24">
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
          <div className="flex flex-wrap gap-2 items-end border-b pb-4">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label htmlFor="billing-promo" className="text-xs font-medium text-muted-foreground">
                Partner / promo code
              </label>
              <input
                id="billing-promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="LIVIA-FRIEND"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm font-mono shadow-sm"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={promoLoading || !promoCode.trim()}
              onClick={() => void redeemPromo()}
            >
              {promoLoading ? "Applying…" : "Apply code"}
            </Button>
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

      <Card id="billing-addons" className="scroll-mt-24" data-testid="billing-addons-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Add-ons
          </CardTitle>
          <CardDescription>
            One place to unlock optional depth beyond your base plan — checkout here or ask Liv below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {billingAddons.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No optional add-ons for this business type — your base plan includes core ops.
            </p>
          ) : (
            billingAddons.map((entry) => {
              const catalogue = ADDON_CATALOGUE[entry.id];
              if (!catalogue) return null;
              const active = isAddonActive(entry.id);
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border px-3 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{catalogue.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                  </div>
                  {active ? (
                    <Badge variant="secondary">Active</Badge>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={!!checkoutLoading}
                      onClick={() => void startAddonCheckout(entry.id)}
                      data-testid={`billing-addon-${entry.id}`}
                    >
                      {checkoutLoading === entry.id
                        ? "…"
                        : `Unlock · ${formatAddonPriceEur(catalogue.eurCentsPerMonth)}/mo`}
                    </Button>
                  )}
                </div>
              );
            })
          )}
          {addonLivPrompts[0] ? (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              {addonLivPrompts.slice(0, 2).map((prompt) => (
                <Button key={prompt} size="sm" variant="outline" className="h-8 rounded-full gap-1" asChild>
                  <Link href={`/toolkit?q=${encodeURIComponent(prompt)}`}>
                    <MessageSquare className="h-3 w-3 opacity-60" />
                    {prompt.length > 52 ? `${prompt.slice(0, 50)}…` : prompt}
                  </Link>
                </Button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {hasPeerInsights ? (
        <div id="peer-insights-data">
          <PeerInsightsControls />
        </div>
      ) : null}

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
