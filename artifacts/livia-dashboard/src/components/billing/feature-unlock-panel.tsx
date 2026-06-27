import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { parseUserFacingError } from "@/lib/user-facing-errors";
import { useBusiness } from "@/lib/business-context";
import { customFetch } from "@workspace/api-client-react";
import { invalidateOperationalState } from "@/lib/operational-cache";
import {
  featureUnlockCopy,
  type CommerceFeatureId,
} from "@workspace/policy";
import { hasEffectiveEntitlement, lookupAddon, type EntitlementKey } from "@workspace/entitlements";
import { useBillingState } from "@/hooks/use-billing-state";

const FEATURE_ENTITLEMENT: Record<CommerceFeatureId, EntitlementKey> = {
  consult_first_inbox: "consult_first_inbox",
  quote_generator: "quote_generator",
  milestone_deposits: "milestone_deposits",
  event_prep_lifecycle: "event_prep_lifecycle",
  event_public_site: "consult_first_inbox",
  take_home_retail: "retail_pack",
};

export function useFeatureEntitled(featureId: CommerceFeatureId): boolean {
  const { data: billing } = useBillingState();
  const key = FEATURE_ENTITLEMENT[featureId];
  if (!billing) return false;
  return hasEffectiveEntitlement(billing.entitlements as EntitlementKey[], key);
}

type Props = {
  featureId: CommerceFeatureId;
  children: React.ReactNode;
  compact?: boolean;
};

/** Tap lock → Stripe checkout → unlock. Hides children until entitled. */
export function FeatureUnlockGate({ featureId, children, compact }: Props) {
  const entitled = useFeatureEntitled(featureId);
  if (entitled) return <>{children}</>;
  return <FeatureUnlockPanel featureId={featureId} compact={compact} />;
}

export function FeatureUnlockPanel({
  featureId,
  compact,
}: {
  featureId: CommerceFeatureId;
  compact?: boolean;
}) {
  const copy = featureUnlockCopy(featureId);
  const addon = lookupAddon(copy.addonId);
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bid = business?.id ?? "";
  const [loading, setLoading] = useState(false);

  async function unlock() {
    if (!bid) {
      toast({
        title: "No shop selected",
        description: "Sign in to a business first, then unlock from Settings → Billing or Shop.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await customFetch<{ url?: string; mode?: string; message?: string; active?: boolean }>(
        `/api/businesses/${bid}/billing/checkout-addon`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addonId: copy.addonId,
            returnPath: copy.successReturnPath,
          }),
        },
      );
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      toast({
        title: `${addon?.name ?? "Add-on"} active`,
        description: res.message,
      });
      invalidateOperationalState(qc, bid);
      await qc.refetchQueries({ queryKey: ["billing-state", bid] });
    } catch (err: unknown) {
      const data = (err as { data?: { code?: string; error?: string; priceEnv?: string } })?.data;
      toast({
        title: "Could not start checkout",
        description: parseUserFacingError(err, "Unlock could not start"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void unlock()}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        data-testid={`feature-unlock-${featureId}`}
      >
        <Lock className="h-3.5 w-3.5" aria-hidden />
        {loading ? "…" : `Unlock · ${copy.priceLabel}`}
      </button>
    );
  }

  return (
    <Card
      className="mx-auto w-full max-w-md border-primary/25 bg-gradient-to-b from-primary/5 to-background text-[0.925rem]"
      data-testid={`feature-unlock-${featureId}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-primary" aria-hidden />
          {copy.title}
        </CardTitle>
        <CardDescription className="text-xs">{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="text-xs text-muted-foreground space-y-1">
          {copy.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" disabled={loading} onClick={() => void unlock()} data-testid="feature-unlock-cta">
            {loading ? "Opening checkout…" : `Unlock · ${copy.priceLabel}`}
          </Button>
          <span className="text-[10px] text-muted-foreground">
            {addon?.name ?? copy.addonId} add-on · works on Solo or Studio
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
