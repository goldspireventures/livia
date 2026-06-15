import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BookOpen, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifecycleNudges } from "@/components/lifecycle/lifecycle-nudges";
import { ActivationFunnelPanel } from "@/components/lifecycle/activation-funnel-panel";
import { fetchUserLifecycle, type GraduationSuggestion } from "@/lib/lifecycle-api";
import { useMembership } from "@/lib/membership-context";
import { useBusiness } from "@/lib/business-context";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { PageFrame } from "@/components/ui/page-frame";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { shouldShowLifecycleProgramCard } from "@workspace/policy";

export default function LifecyclePage() {
  const { role } = useMembership();
  const { business, businesses } = useBusiness();
  const vocab = verticalPackUi(
    (business as { vertical?: string } | null)?.vertical,
    business?.category,
  );
  const [suggestions, setSuggestions] = useState<GraduationSuggestion[]>([]);
  const multiShop = businesses.length >= 2;

  useEffect(() => {
    if (role !== "OWNER") return;
    void fetchUserLifecycle()
      .then((d) => setSuggestions(d.suggestions))
      .catch(() => setSuggestions([]));
  }, [role]);

  const showChain = shouldShowLifecycleProgramCard({
    programId: "G3",
    suggestions,
    multiShop,
  });
  const showSuccession = shouldShowLifecycleProgramCard({
    programId: "G8",
    suggestions,
    multiShop,
  });

  return (
    <PageFrame width="md" className="space-y-4 pb-12">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-primary mb-1 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Lifecycle
        </p>
        <h1 className="font-serif text-2xl tracking-tight">Your growth on Livia</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-lg">
          Graduation steps appear when your shop is ready — not a catalogue of every stage.
        </p>
      </div>

      {role === "OWNER" ? <LifecycleNudges /> : null}

      {role === "OWNER" ? <ActivationFunnelPanel /> : null}

      {suggestions.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Suggested for you now</CardTitle>
            <CardDescription className="text-xs">
              Based on staff count, locations, and how you use Livia today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="rounded-md border border-primary/40 bg-primary/5 p-3"
              >
                <p className="text-sm font-medium">
                  {s.id} — {s.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{s.summary}</p>
                <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">{s.whyNow}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Link href={s.primaryCta.href}>
                    <Button size="sm" className="h-8">
                      {s.primaryCta.label}
                    </Button>
                  </Link>
                  {s.secondaryCta ? (
                    <Link href={s.secondaryCta.href}>
                      <Button size="sm" variant="outline" className="h-8">
                        {s.secondaryCta.label}
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground rounded-lg border border-border/70 px-4 py-6 text-center">
          No graduation steps right now — keep running your floor; we&apos;ll surface the next move when it matters.
        </p>
      )}

      {showChain || showSuccession ? (
        <SettingsDisclosure
          title="Growth programs"
          description="Multi-location and succession — only when relevant."
          defaultOpen={false}
        >
          <div className="space-y-3 pt-1">
            {showChain ? (
              <Card id="chain" className="border-border/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Multi-location</CardTitle>
                  <CardDescription className="text-xs">
                    {vocab.locationNoun} expansion and chain glance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Link
                    href={
                      businesses[0]?.id
                        ? `/onboarding?intent=second-shop&parentBusinessId=${businesses[0].id}`
                        : "/onboarding?intent=second-shop"
                    }
                  >
                    <Button size="sm" className="h-8">
                      Add location
                    </Button>
                  </Link>
                  <Link href="/chain">
                    <Button size="sm" variant="outline" className="h-8">
                      Chain glance
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}
            {showSuccession ? (
              <Card className="border-border/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Ownership succession
                  </CardTitle>
                  <CardDescription className="text-xs">Transfer keys with audit trail.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/settings?tab=legal#ownership-succession">
                    <Button size="sm" className="h-8">
                      Open ownership succession
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </SettingsDisclosure>
      ) : null}

      <Link href="/guides">
        <Button variant="ghost" size="sm" className="h-8">
          Demo playbook →
        </Button>
      </Link>
    </PageFrame>
  );
}
