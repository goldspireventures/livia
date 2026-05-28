import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BookOpen, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifecycleNudges } from "@/components/lifecycle/lifecycle-nudges";
import { fetchUserLifecycle, type GraduationSuggestion } from "@/lib/lifecycle-api";
import { useMembership } from "@/lib/membership-context";
import { useBusiness } from "@/lib/business-context";
import { verticalPackUi } from "@/lib/vertical-pack-ui";

export default function LifecyclePage() {
  const { role } = useMembership();
  const { business, businesses } = useBusiness();
  const vocab = verticalPackUi(
    (business as { vertical?: string } | null)?.vertical,
    business?.category,
  );
  const [suggestions, setSuggestions] = useState<GraduationSuggestion[]>([]);
  const multiShop = businesses.length >= 2;
  const showChainChecklist = suggestions.some((s) => s.id === "G3") || multiShop;
  const showSuccession = suggestions.some((s) => s.id === "G8");

  useEffect(() => {
    if (role !== "OWNER") return;
    void fetchUserLifecycle()
      .then((d) => setSuggestions(d.suggestions))
      .catch(() => setSuggestions([]));
  }, [role]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Lifecycle
        </p>
        <h1 className="font-serif text-3xl tracking-tight mb-2">Your growth on Livia</h1>
        <p className="text-muted-foreground leading-relaxed text-sm">
          We only surface graduation steps when your shop is ready — not a catalogue of every stage.
        </p>
      </div>

      {role === "OWNER" ? <LifecycleNudges /> : null}

      {suggestions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested for you now</CardTitle>
            <CardDescription>Based on staff count, locations, and how you use Livia today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="rounded-md border border-primary/40 bg-primary/5 p-4"
              >
                <p className="text-sm font-medium">
                  {s.id} — {s.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{s.summary}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">{s.whyNow}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href={s.primaryCta.href}>
                    <Button size="sm">{s.primaryCta.label}</Button>
                  </Link>
                  {s.secondaryCta ? (
                    <Link href={s.secondaryCta.href}>
                      <Button size="sm" variant="outline">
                        {s.secondaryCta.label}
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {showChainChecklist ? (
        <Card id="chain">
          <CardHeader>
            <CardTitle className="text-base">Multi-location checklist</CardTitle>
            <CardDescription>
              Shown because you run more than one {vocab.locationNoun.toLowerCase()} or we detected G3 readiness.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Link
                href={
                  businesses[0]?.id
                    ? `/onboarding?intent=second-shop&parentBusinessId=${businesses[0].id}`
                    : "/onboarding?intent=second-shop"
                }
              >
                <Button size="sm">Add location</Button>
              </Link>
              <Link href="/chain">
                <Button size="sm" variant="outline">
                  Chain glance
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showSuccession ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Ownership succession
            </CardTitle>
            <CardDescription>Transfer keys with audit trail — only when this step is relevant.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings?tab=ownership">
              <Button size="sm">Open ownership transfer</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Link href="/guides">
        <Button variant="ghost" size="sm">
          Demo playbook →
        </Button>
      </Link>
    </div>
  );
}
