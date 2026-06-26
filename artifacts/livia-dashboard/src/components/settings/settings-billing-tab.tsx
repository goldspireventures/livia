import { useMemo } from "react";
import BillingControls from "@/components/billing-controls";
import { CommerceSignalsPanel } from "@/components/dashboard/commerce-signals-panel";
import IntegrationsControls from "@/components/integrations-controls";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { useBusiness } from "@/lib/business-context";
import { Skeleton } from "@/components/ui/skeleton";

/** Plan & payments — primary card always visible; depth behind disclosures. */
export function SettingsBillingTab() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const openCommerceSignals = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash.replace("#", "") === "commerce-fix";
  }, []);

  if (!bid) {
    return (
      <div className="space-y-4" data-testid="settings-billing-tab">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="settings-billing-tab">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Your plan</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          What you pay, optional add-ons, and usage. Commerce signals and imports live below when you
          need them.
        </p>
      </div>

      <BillingControls showRemediationStrip={false} />

      <SettingsDisclosure
        id="commerce-signals-disclosure"
        title="Commerce signals"
        description="Uncaptured demand, payment capture, and Liv remediation — open when money needs attention."
        defaultOpen={openCommerceSignals}
      >
        <CommerceSignalsPanel />
      </SettingsDisclosure>

      <SettingsDisclosure
        title="Imports & integrations"
        description="Booksy CSV import today · webhooks, API keys, and migration roadmap when you need them."
        defaultOpen={false}
      >
        <IntegrationsControls />
      </SettingsDisclosure>
    </div>
  );
}
