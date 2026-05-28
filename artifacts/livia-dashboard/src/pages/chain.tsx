import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { MOTION } from "@/lib/motion";
import { Building2, ArrowRight, Users, AlertTriangle, Eye, Download } from "lucide-react";
import { LivCommandHub } from "@/components/liv/liv-command-hub";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChainPulseStatus = "ok" | "watch" | "act";

type ChainShopRollup = {
  businessId: string;
  name: string;
  slug: string;
  city: string | null;
  bookingsThisWeek: number;
  completedThisWeek: number;
  todayBookings: number;
  pendingBookings: number;
  openConversations: number;
  handedOffConversations: number;
  pendingTimeOff: number;
  pulseStatus: ChainPulseStatus;
  pulseReason: string | null;
};

type ChainAlert = {
  businessId: string;
  shopName: string;
  severity: "watch" | "act";
  code: string;
  message: string;
};

type ChainRollup = {
  shopCount: number;
  bookingsThisWeek: number;
  completedThisWeek: number;
  shopsNeedingAttention: number;
  orgAdminBriefingLine: string;
  alerts?: ChainAlert[];
  shops: ChainShopRollup[];
};

function PulseBadge({ status }: { status: ChainPulseStatus }) {
  if (status === "ok") {
    return (
      <Badge variant="outline" className="text-emerald-600 border-emerald-600/40">
        OK
      </Badge>
    );
  }
  if (status === "watch") {
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-600/40 gap-1">
        <Eye className="h-3 w-3" />
        Watch
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      Act
    </Badge>
  );
}

export default function ChainPage() {
  const { businesses, setBusinessById } = useBusiness();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [rollup, setRollup] = useState<ChainRollup | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [borrowStaffId, setBorrowStaffId] = useState("");
  const [borrowTargetId, setBorrowTargetId] = useState("");
  const [borrowFrom, setBorrowFrom] = useState("");
  const [borrowTo, setBorrowTo] = useState("");
  const hostShopId = businesses[0]?.id ?? "";

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
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Chain glance</CardTitle>
            <CardDescription>
              Add a second location under the same org to see multi-location KPIs and the HQ glance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading && !rollup) {
    return (
      <PageFrame width="lg">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </PageFrame>
    );
  }

  return (
    <PageFrame width="lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PersonaRitualHeader
          variant="home"
          title="Your shops at a glance"
          subtitle={rollup?.orgAdminBriefingLine ?? "Week-ahead signal across every location."}
        />
        <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
          <a href="/api/me/chain-rollup/export.csv" download data-testid="chain-export-csv">
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </div>

      <LivCommandHub compact />

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
            {rollup!.alerts!.map((a) => (
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

      {(rollup?.shopCount ?? 0) >= 2 ? (
        <Dialog open={borrowOpen} onOpenChange={setBorrowOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Request staff borrow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cross-shop coverage</DialogTitle>
              <DialogDescription>
                Log a borrow request — approval and calendar sync follow in workflow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Staff ID</Label>
                <Input value={borrowStaffId} onChange={(e) => setBorrowStaffId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cover at shop (business ID)</Label>
                <Input value={borrowTargetId} onChange={(e) => setBorrowTargetId(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>From (ISO)</Label>
                  <Input
                    type="datetime-local"
                    value={borrowFrom}
                    onChange={(e) => setBorrowFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To (ISO)</Label>
                  <Input type="datetime-local" value={borrowTo} onChange={(e) => setBorrowTo(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={async () => {
                  if (!hostShopId || !borrowStaffId || !borrowTargetId || !borrowFrom || !borrowTo) return;
                  try {
                    await customFetch("/api/me/staff-borrow-request", {
                      method: "POST",
                      body: JSON.stringify({
                        hostBusinessId: hostShopId,
                        staffId: borrowStaffId,
                        targetBusinessId: borrowTargetId,
                        from: new Date(borrowFrom).toISOString(),
                        to: new Date(borrowTo).toISOString(),
                      }),
                    });
                    toast({ title: "Borrow request queued" });
                    setBorrowOpen(false);
                  } catch {
                    toast({ title: "Request failed", variant: "destructive" });
                  }
                }}
              >
                Submit request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bookings (7d)</CardDescription>
            <CardTitle className="text-3xl">{rollup?.bookingsThisWeek ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed today</CardDescription>
            <CardTitle className="text-3xl">{rollup?.completedThisWeek ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Need attention</CardDescription>
            <CardTitle className="text-3xl">{rollup?.shopsNeedingAttention ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-3">
        {rollup?.shops.map((shop) => (
          <Card
            key={shop.businessId}
            className={`cursor-pointer transition-all hover-elevate ${MOTION.listItem} ${
              shop.pulseStatus === "act"
                ? "border-destructive/50 hover:border-destructive"
                : shop.pulseStatus === "watch"
                  ? "border-amber-500/40 hover:border-amber-500/60"
                  : "hover:border-primary/40"
            }`}
            onClick={() => openShop(shop.businessId, shop.name)}
          >
            <CardContent className="flex items-start justify-between py-4 gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{shop.name}</p>
                    <PulseBadge status={shop.pulseStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[shop.city, shop.slug].filter(Boolean).join(" · ")}
                  </p>
                  {shop.pulseReason ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{shop.pulseReason}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span>Today: {shop.todayBookings}</span>
                    <span>7d: {shop.bookingsThisWeek}</span>
                    {shop.pendingBookings > 0 ? (
                      <span>Pending: {shop.pendingBookings}</span>
                    ) : null}
                    {shop.openConversations > 0 ? (
                      <span>Inbox open: {shop.openConversations}</span>
                    ) : null}
                    {shop.handedOffConversations > 0 ? (
                      <span>Handed off: {shop.handedOffConversations}</span>
                    ) : null}
                  </div>
                  <a
                    href={`/b/${shop.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary mt-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Public page ↗
                  </a>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  openShop(shop.businessId, shop.name);
                }}
              >
                Open today
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageFrame>
  );
}
