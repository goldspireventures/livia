import { Link, useLocation } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Inbox, LayoutGrid, Settings, ExternalLink, RefreshCw } from "lucide-react";
import { StuckContinuityCard } from "@/components/stuck-continuity-card";
import { DriftRecoveryCard } from "@/components/drift-recovery-card";
import { BeautyFillCycleCard } from "@/components/beauty/beauty-fill-cycle-card";
import { LivMomentsStrip } from "@/components/ritual/liv-moments-strip";
import { OwnerLivOpsPanel } from "@/components/liv/owner-liv-ops-panel";
import { OwnerIntelligenceStack } from "@/components/dashboard/owner-intelligence-stack";
import { ActivityFeedPanel } from "@/components/dashboard/activity-feed-panel";
import { clientGuestBookAbsoluteUrl } from "@/lib/guest-book-url";

/**
 * Liv as the visible centre of the owner/org-admin day — briefing, inbox, toolkit, public preview.
 */
export function LivCommandHub({
  compact,
  density = "full",
}: {
  compact?: boolean;
  /** focused = toolkit/home — actions only, no recovery strips */
  density?: "full" | "focused";
}) {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [location] = useLocation();
  const bid = business?.id ?? "";
  const slug = business?.slug ?? "";
  const onToolkitPage = location.startsWith("/toolkit");

  async function regenerateBriefing() {
    if (!bid) return;
    try {
      await apiFetch(`/businesses/${bid}/morning-briefing/generate`, { method: "POST" });
      toast({ title: "Liv refreshed your morning briefing" });
      window.dispatchEvent(new CustomEvent("livia:morning-briefing-refresh"));
    } catch {
      toast({ title: "Briefing refresh failed", variant: "destructive" });
    }
  }

  const publicUrl = slug ? clientGuestBookAbsoluteUrl(slug) : null;

  return (
    <Card
      className="border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-transparent overflow-hidden"
      data-testid="liv-command-hub"
    >
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Liv — runs the floor with you
        </CardTitle>
        <CardDescription>
          Liv works from your calendar, inbox, and shop settings — so replies and bookings stay accurate
          and on-brand.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="default" asChild>
            <Link href="/inbox">
              <Inbox className="h-3.5 w-3.5 mr-1.5" />
              Open inbox
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/settings?tab=liv">
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Tune Liv
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => void regenerateBriefing()} disabled={!bid}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh briefing
          </Button>
          {!onToolkitPage ? (
            <Button size="sm" variant="ghost" asChild>
              <Link href="/toolkit">
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                Advanced Liv
              </Link>
            </Button>
          ) : null}
          {publicUrl && density !== "focused" && !onToolkitPage ? (
            <Button size="sm" variant="ghost" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer" title="Opens your guest booking page in a new tab">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Preview booking page
              </a>
            </Button>
          ) : null}
        </div>
        {density === "full" && !compact ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            In inbox, use <strong className="text-foreground">Ask Liv</strong> on any open thread — she drafts with
            morning context, booking tools, and your tone pack.
          </p>
        ) : null}
        {density === "full" && !compact ? <StuckContinuityCard /> : null}
        {density === "full" && !compact ? <BeautyFillCycleCard /> : null}
        {density === "full" && !compact ? <DriftRecoveryCard /> : null}
        {density === "full" && !compact ? <LivMomentsStrip /> : null}
        {density === "focused" ? (
          <div className="space-y-3">
            <OwnerLivOpsPanel compact />
            <OwnerIntelligenceStack variant="embedded" />
          </div>
        ) : null}
        {density === "full" && !compact ? <ActivityFeedPanel limit={6} /> : null}
      </CardContent>
    </Card>
  );
}
