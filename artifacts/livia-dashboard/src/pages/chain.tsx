import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageFrame } from "@/components/ui/page-frame";
import { AlertTriangle, Download } from "lucide-react";
import { FounderChainLoading } from "@/components/chain/founder-chain-loading";
import { FounderChainBriefing } from "@/components/chain/founder-chain-briefing";
import { FounderShopCard } from "@/components/chain/founder-shop-card";
import type { ChainAlert, ChainPeriod, ChainRollup } from "@/components/chain/founder-chain-types";
import { cn } from "@/lib/utils";

function PulseBadge({ status }: { status: "watch" | "act" }) {
  return status === "act" ? (
    <Badge variant="destructive" className="text-[10px]">
      Act
    </Badge>
  ) : (
    <Badge variant="outline" className="text-amber-600 border-amber-600/40 text-[10px]">
      Watch
    </Badge>
  );
}

export default function ChainPage() {
  const { businesses, setBusinessById } = useBusiness();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [rollup, setRollup] = useState<ChainRollup | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ChainPeriod>("week");

  const verticalById = useMemo(
    () =>
      Object.fromEntries(
        businesses.map((b) => [b.id, (b as { vertical?: string }).vertical ?? null]),
      ),
    [businesses],
  );

  function openShop(businessId: string, name: string) {
    setBusinessById(businessId);
    toast({ title: `Switched to ${name}`, description: "Opening Today for this location." });
    navigate("/dashboard");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await customFetch<ChainRollup>("/api/me/chain-rollup");
        if (!cancelled) setRollup(data);
      } catch {
        if (!cancelled) setRollup(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (businesses.length < 2) {
    return (
      <PageFrame width="lg">
        <Card>
          <CardHeader>
            <CardTitle>Your businesses</CardTitle>
            <CardDescription>
              Add a second location under the same org to see multi-location KPIs and the HQ glance.
            </CardDescription>
          </CardHeader>
        </Card>
      </PageFrame>
    );
  }

  if (loading && !rollup) {
    return (
      <PageFrame width="lg">
        <FounderChainLoading />
      </PageFrame>
    );
  }

  return (
    <PageFrame width="lg" data-testid="founder-chain-page">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[28px] font-serif tracking-tight leading-tight"
            style={{ fontFamily: "var(--app-font-serif)" }}
          >
            Your businesses
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {rollup?.orgAdminBriefingLine ?? "Week-ahead signal across every location."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            {(["week", "today"] as const).map((p) => (
              <button
                key={p}
                type="button"
                data-testid={`chain-period-${p}`}
                onClick={() => setPeriod(p)}
                className={cn(
                  "text-xs px-3 py-1 rounded transition-colors capitalize",
                  period === p
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p === "week" ? "This week" : "Today"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
            <a href="/api/me/chain-rollup/export.csv" download data-testid="chain-export-csv">
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </header>

      <FounderChainBriefing
        line={rollup?.orgAdminBriefingLine}
        shopsNeedingAttention={rollup?.shopsNeedingAttention}
      />

      {(rollup?.alerts?.length ?? 0) > 0 ? (
        <Card className="border-destructive/40 bg-destructive/5" data-testid="chain-alerts">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Cross-shop alerts
            </CardTitle>
            <CardDescription>Tap a location to open Today and act.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {rollup!.alerts!.map((a: ChainAlert) => (
              <button
                key={`${a.businessId}-${a.code}`}
                type="button"
                className="w-full text-left rounded-lg border border-border/80 px-3 py-2 hover-elevate transition-colors"
                onClick={() => openShop(a.businessId, a.shopName)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{a.shopName}</span>
                  <PulseBadge status={a.severity} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/80 bg-card p-4">
          <p className="text-[13px] text-muted-foreground">Bookings (7d)</p>
          <p className="text-[28px] font-bold tabular-nums mt-1">{rollup?.bookingsThisWeek ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card p-4">
          <p className="text-[13px] text-muted-foreground">Completed (7d)</p>
          <p className="text-[28px] font-bold tabular-nums mt-1">{rollup?.completedThisWeek ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card p-4">
          <p className="text-[13px] text-muted-foreground">Need attention</p>
          <p className="text-[28px] font-bold tabular-nums mt-1 text-[hsl(var(--chart-4))]">
            {rollup?.shopsNeedingAttention ?? 0}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rollup?.shops.map((shop) => (
          <FounderShopCard
            key={shop.businessId}
            shop={shop}
            vertical={verticalById[shop.businessId]}
            period={period}
            onOpen={() => openShop(shop.businessId, shop.name)}
          />
        ))}
      </div>
    </PageFrame>
  );
}
