import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetOwnerIntelligence } from "@workspace/api-client-react";
import { COMMERCE_BOOKING_POLICIES_HREF } from "@workspace/policy";
import { useBusiness } from "@/lib/business-context";
import { useBillingState } from "@/hooks/use-billing-state";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { navigateSettingsHref } from "@/lib/commerce-fix-navigation";
import { CommerceSettingsLink } from "@/components/billing/commerce-settings-link";
import { clientGuestBookAbsoluteUrl } from "@/lib/guest-book-url";
import { Check, ExternalLink } from "lucide-react";

type OperationalPolicySnapshot = {
  policy?: { depositRequired?: boolean; depositPercent?: number };
};

function StepRow({
  done,
  title,
  body,
  action,
}: {
  done: boolean;
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/80 p-3">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium flex items-center gap-2">
          {done ? <Check className="h-3.5 w-3.5 text-primary shrink-0" /> : null}
          {title}
          {done ? (
            <Badge variant="secondary" className="text-[10px] font-normal">
              done
            </Badge>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
      {!done ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Actionable steps behind the billing remediation "Fix" CTA. */
export function CommerceFixPanel() {
  const { business } = useBusiness();
  const [, navigate] = useLocation();
  const bid = business?.id ?? "";
  const slug = business?.slug ?? "";
  const { data: billing } = useBillingState();
  const { data: intel, dataUpdatedAt } = useGetOwnerIntelligence(bid, {
    query: { enabled: !!bid } as never,
  });
  const [depositRequired, setDepositRequired] = useState(false);

  useEffect(() => {
    if (!bid) return;
    void customFetch<OperationalPolicySnapshot>(`/api/businesses/${bid}/operational-policy`)
      .then((p) => setDepositRequired(Boolean(p.policy?.depositRequired)))
      .catch(() => setDepositRequired(false));
  }, [bid, dataUpdatedAt]);

  const paymentCount = intel?.commerce.snapshot.paymentCount30d ?? 0;
  const hasDepositsEntitlement = billing?.entitlements.includes("deposits") ?? false;
  const onTrial = billing?.planId === "trial";
  const paymentsLanding = paymentCount > 0;
  const depositsDone = depositRequired;
  const planDone = hasDepositsEntitlement && !onTrial;
  const allDone = depositsDone && planDone && paymentsLanding;

  if (allDone) return null;

  const publicBookUrl = slug ? clientGuestBookAbsoluteUrl(slug) : null;
  const topSignal = intel?.commerce.topSignal;

  return (
    <Card
      id="commerce-fix"
      className="scroll-mt-24 border-amber-500/20"
      data-testid="commerce-fix-panel"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Fix payment capture</CardTitle>
        <CardDescription>
          {topSignal?.title === "Complete a test deposit" || depositsDone
            ? "Deposits are on — capture one test payment on your public page to verify checkout."
            : topSignal?.title === "Turn on deposits"
              ? "You have bookings but nothing captured yet — work through these steps in order."
              : "Get deposits landing when guests book online."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {onTrial ? (
          <StepRow
            done={false}
            title="1. Upgrade from trial"
            body="Deposits and card capture need Solo or Studio on your shop."
            action={
              <CommerceSettingsLink
                href="/settings?tab=billing#plan-billing-card"
                label="View plans"
              />
            }
          />
        ) : null}

        <StepRow
          done={depositsDone}
          title={`${onTrial ? "2" : "1"}. Enable deposits`}
          body="Require a deposit % on online bookings — Legal & trust → Booking rules."
          action={
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => navigateSettingsHref(COMMERCE_BOOKING_POLICIES_HREF, navigate)}
            >
              Open booking rules
            </Button>
          }
        />

        <StepRow
          done={paymentsLanding}
          title={`${onTrial ? "3" : "2"}. Capture a test payment`}
          body={
            depositsDone
              ? "Book on your public page, then pay the deposit link from the confirmation — that clears this signal."
              : "After deposits are on, run one test booking and pay the deposit link guests receive."
          }
          action={
            publicBookUrl ? (
              <Button size="sm" variant="default" type="button" asChild>
                <a href={publicBookUrl} target="_blank" rel="noopener noreferrer">
                  Open booking page
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => navigateSettingsHref("/onboarding", navigate)}
              >
                Publish your booking link first
              </Button>
            )
          }
        />

        {!paymentsLanding && import.meta.env.DEV ? (
          <p className="text-xs text-muted-foreground rounded-md bg-muted/40 px-3 py-2">
            Local dev: deposit checkout simulates without live Stripe keys once deposits are enabled.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
