import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { useQueryClient } from "@tanstack/react-query";
import { parseUserFacingError } from "@/lib/user-facing-errors";
import { useBillingState } from "@/hooks/use-billing-state";
import { subscriptionGrantsPaidAccess } from "@workspace/policy";
import { Loader2 } from "lucide-react";

type Props = {
  businessId: string;
  onPaid?: () => void;
};

export function OnboardingBillingPanel({ businessId, onPaid }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: billing, refetch } = useBillingState();
  const [promo, setPromo] = useState("");
  const [loading, setLoading] = useState<"solo" | "studio" | "redeem" | null>(null);

  const paid =
    !!billing &&
    (subscriptionGrantsPaidAccess(billing.stripeSubscriptionStatus, null) ||
      billing.designPartnerActive);

  if (paid || billing?.stripeSubscriptionStatus === "complimentary") {
    return (
      <div
        className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"
        data-testid="onboarding-billing-done"
      >
        <p className="font-medium text-foreground">Plan active</p>
        <p className="text-muted-foreground mt-1">
          {billing?.planName ?? "Your plan"} is live — continue setup below.
        </p>
      </div>
    );
  }

  async function startCheckout(planId: "solo" | "studio") {
    setLoading(planId);
    try {
      const res = await customFetch<{ url?: string; mode?: string; message?: string }>(
        `/api/businesses/${businessId}/billing/checkout-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, returnPath: "/onboarding" }),
        },
      );
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      toast({ title: "Plan updated", description: res.message });
      await refetch();
      invalidateOperationalState(qc, businessId);
      onPaid?.();
    } catch (err: unknown) {
      toast({
        title: "Checkout could not start",
        description: parseUserFacingError(err, "Try again or contact support."),
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  async function redeemPromo() {
    const code = promo.trim();
    if (!code) return;
    setLoading("redeem");
    try {
      const res = await customFetch<{ message?: string }>(
        `/api/businesses/${businessId}/billing/redeem-promo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        },
      );
      toast({ title: "Code applied", description: res.message });
      await refetch();
      invalidateOperationalState(qc, businessId);
      onPaid?.();
    } catch (err: unknown) {
      toast({
        title: "Code not applied",
        description: parseUserFacingError(err, "Check the code and try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4" data-testid="onboarding-billing-panel">
      <p className="text-sm text-muted-foreground">
        Choose Solo or Studio and pay securely with Stripe. Partner codes unlock the same plan at no
        charge.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!!loading}
          onClick={() => void startCheckout("solo")}
        >
          {loading === "solo" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Solo — €79/mo
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!!loading}
          onClick={() => void startCheckout("studio")}
        >
          {loading === "studio" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Studio — €149/mo
        </Button>
      </div>
      <div className="space-y-2 border-t pt-3">
        <Label htmlFor="onboarding-promo" className="text-xs">
          Partner / promo code
        </Label>
        <div className="flex gap-2">
          <Input
            id="onboarding-promo"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder="e.g. LIVIA-FRIEND"
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            disabled={!!loading || !promo.trim()}
            onClick={() => void redeemPromo()}
          >
            {loading === "redeem" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Livia partner codes apply here. Stripe discount codes can be entered on the checkout page.
        </p>
      </div>
    </div>
  );
}
