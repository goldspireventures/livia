import { useMemo } from "react";
import { useGetBusiness, useGetTenantCapabilities } from "@workspace/api-client-react";
import { buildSettingsEnhancementRows, onboardingStateSchema } from "@workspace/policy";
import { useBusiness } from "@/lib/business-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { CommerceSettingsLink } from "@/components/billing/commerce-settings-link";
import { Link } from "wouter";

function EnhancementOpenLink({ href, className }: { href: string; className?: string }) {
  if (href.includes("/settings")) {
    return <CommerceSettingsLink href={href} label="Set up" className={className} />;
  }
  return (
    <Button size="sm" variant="ghost" className={className} asChild>
      <Link href={href}>Set up</Link>
    </Button>
  );
}

type SettingsEnhancementSectionProps = {
  canViewComms?: boolean;
  canViewBilling?: boolean;
};

export function SettingsEnhancementSection({
  canViewComms = true,
  canViewBilling = true,
}: SettingsEnhancementSectionProps) {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const vertical = (business as { vertical?: string } | null)?.vertical;

  const { data: biz, isLoading: bizLoading } = useGetBusiness(bid, {
    query: { enabled: !!bid } as never,
  });
  const { data: caps, isLoading: capsLoading } = useGetTenantCapabilities(bid, {
    query: { enabled: !!bid, staleTime: 30_000 } as never,
  });

  const rows = useMemo(() => {
    const parsed = onboardingStateSchema.safeParse((biz as { onboardingState?: unknown })?.onboardingState);
    const checklist = parsed.success ? parsed.data.checklist : undefined;
    const facts = caps?.readinessFacts;
    const staffCount =
      typeof facts?.staffCount === "number" ? facts.staffCount : 1;
    const tier = (business as { tier?: string } | null)?.tier;

    return buildSettingsEnhancementRows({
      vertical,
      checklist,
      messagingConfigured: facts?.messagingConfigured === true,
      paymentsConnected: facts?.paymentsConnected === true,
      operatorSignals: { tier, activeStaffCount: staffCount },
      canViewComms,
      canViewBilling,
    });
  }, [biz, business, caps?.readinessFacts, canViewBilling, canViewComms, vertical]);

  if (!bid) return null;
  if (bizLoading || capsLoading) {
    return <Skeleton className="h-16 w-full rounded-lg" data-testid="settings-enhancement-skeleton" />;
  }
  if (rows.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-border/70 bg-muted/30 p-4 space-y-3"
      data-testid="settings-enhancement-section"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>Enhance when ready — optional, not required to go live</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-col justify-between gap-2 rounded-md border border-border/50 bg-background/80 px-3 py-2.5 text-sm"
          >
            <div className="space-y-0.5">
              <p className="font-medium">{row.title}</p>
              <p className="text-xs text-muted-foreground leading-snug">{row.body}</p>
            </div>
            <EnhancementOpenLink href={row.href} className="self-start" />
          </div>
        ))}
      </div>
    </div>
  );
}
