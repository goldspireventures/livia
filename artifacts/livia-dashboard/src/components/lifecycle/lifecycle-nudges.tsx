import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/lib/business-context";
import { fetchBusinessLifecycle, fetchUserLifecycle, type GraduationSuggestion } from "@/lib/lifecycle-api";
import { useMembership } from "@/lib/membership-context";

export function LifecycleNudges({ compact = false }: { compact?: boolean }) {
  const { business } = useBusiness();
  const { role } = useMembership();
  const [suggestions, setSuggestions] = useState<GraduationSuggestion[]>([]);

  useEffect(() => {
    if (role !== "OWNER") return;
    const load = async () => {
      try {
        if (business?.id) {
          const biz = await fetchBusinessLifecycle(business.id);
          setSuggestions(biz.suggestions.slice(0, compact ? 2 : 4));
        } else {
          const me = await fetchUserLifecycle();
          setSuggestions(me.suggestions.slice(0, compact ? 2 : 4));
        }
      } catch {
        setSuggestions([]);
      }
    };
    void load();
  }, [business?.id, role, compact]);

  if (role !== "OWNER" || suggestions.length === 0) return null;

  if (compact) {
    const top = suggestions[0];
    return (
      <Link href={top.primaryCta.href}>
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3 hover:bg-primary/10 transition-colors">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary">{top.title}</p>
            <p className="text-xs text-muted-foreground truncate">{top.whyNow}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
        </div>
      </Link>
    );
  }

  return (
    <Card className="border-primary/15">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Growth & lifecycle
        </CardTitle>
        <CardDescription>
          Livia adapts when your business changes shape — hires, second location, succession.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((s) => (
          <div
            key={`${s.id}-${s.primaryCta.href}`}
            className="rounded-md border border-border/80 p-3 space-y-2"
          >
            <div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.summary}</p>
              <p className="text-xs text-muted-foreground/80 mt-1 italic">{s.whyNow}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={s.primaryCta.href}>
                <Button size="sm" variant="default" className="h-8">
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
        <Link href="/lifecycle">
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
            Full lifecycle map
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
