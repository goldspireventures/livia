import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  WELLNESS_CORPORATE_PORTAL,
  WELLNESS_CLASSPASS_ADJACENT,
  WELLNESS_HOTEL_FOLIO,
  WELLNESS_TRUST_COPY,
} from "@workspace/policy";
import { useBusiness } from "@/lib/business-context";
import { clientGuestBookAbsoluteUrl } from "@/lib/guest-book-url";
import { apiFetch } from "@/lib/api-fetch";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink } from "lucide-react";

/** Operator preview of the employer benefit portal employees would see. */
export default function WellnessCorporatePage() {
  const c = WELLNESS_CORPORATE_PORTAL;
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const slug = business?.slug ?? "";
  const [folio, setFolio] = useState<{ status: string; chargeCode: string | null } | null>(null);

  useEffect(() => {
    if (!bid) return;
    void apiFetch<{ status: string; chargeCode: string | null }>(
      `/api/businesses/${bid}/wellness/hotel-folio`,
    ).then(setFolio);
  }, [bid]);

  return (
    <OperationalPageShell
      title={c.title}
      subtitle={c.subtitle}
      width="lg"
      data-testid="wellness-corporate-portal"
      actions={
        slug ? (
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1">
            <a href={clientGuestBookAbsoluteUrl(slug)} target="_blank" rel="noreferrer">
              Employee book preview
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </Button>
        ) : null
      }
    >
      <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm flex gap-3 items-start">
        <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="font-medium text-foreground">What this page is</p>
          <p className="text-muted-foreground mt-1 leading-relaxed">
            A preview of the <strong className="font-medium text-foreground">employer-funded booking path</strong>{" "}
            — not your day-to-day floor ops. Employees redeem quarterly allowances; you configure eligible services
            in Settings → Brokers when Ring 2 ships.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{c.allowanceLabel}</CardTitle>
            <CardDescription>{c.pilotNote}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-muted-foreground">Demo allowance</span>
              <span className="text-2xl font-serif tabular-nums">4</span>
            </div>
            <p className="text-muted-foreground">
              {c.eligibleServicesLabel}: massage, holistic, couples (policy-driven catalogue).
            </p>
            <Badge variant="outline" className="font-normal">
              {c.cta}
            </Badge>
          </CardContent>
        </Card>

        <Card data-testid="wellness-hotel-folio">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{WELLNESS_HOTEL_FOLIO.partnerLabel}</CardTitle>
            <CardDescription>{WELLNESS_HOTEL_FOLIO.note}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Status:{" "}
              <span className="font-medium text-foreground">{folio?.status ?? "checking…"}</span>
            </p>
            {folio?.chargeCode ? (
              <p className="font-mono text-xs">Sample charge code: {folio.chargeCode}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="wellness-classpass-packs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{WELLNESS_CLASSPASS_ADJACENT.packName}</CardTitle>
          <CardDescription>{WELLNESS_CLASSPASS_ADJACENT.note}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
          <span>{WELLNESS_CLASSPASS_ADJACENT.sessionsIncluded} sessions</span>
          <span>{WELLNESS_CLASSPASS_ADJACENT.validityDays} days validity</span>
          <Link href="/day-packages" className="text-primary text-sm">
            Package ledger →
          </Link>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{WELLNESS_TRUST_COPY.brokerHonesty}</p>
    </OperationalPageShell>
  );
}
