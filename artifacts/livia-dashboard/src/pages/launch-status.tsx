import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";

type Item = {
  id: string;
  track: string;
  label: string;
  status: "done" | "partial" | "blocked" | "ops";
  detail?: string;
};

type Readiness = {
  gate2Ready: boolean;
  gate3Ready: boolean;
  items: Item[];
};

const STATUS_STYLE: Record<Item["status"], string> = {
  done: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  partial: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  blocked: "bg-destructive/15 text-destructive border-destructive/30",
  ops: "bg-muted text-muted-foreground border-border",
};

export default function LaunchStatusPage() {
  const [data, setData] = useState<Readiness | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Readiness>("/launch/readiness")
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <div className="max-w-3xl space-y-8">
      <PersonaRitualHeader
        variant="page"
        title="Launch readiness"
        subtitle="Engineering snapshot for paths 1–6. Gate 2/3 still need org ops sign-off."
      />

      {err ? (
        <p className="text-destructive text-sm">{err}</p>
      ) : !data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="flex gap-3 flex-wrap">
            <Badge variant={data.gate2Ready ? "default" : "outline"}>
              Gate 2 {data.gate2Ready ? "engineering green" : "not ready"}
            </Badge>
            <Badge variant={data.gate3Ready ? "default" : "outline"}>
              Gate 3 {data.gate3Ready ? "engineering green" : "not ready"}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Checklist</CardTitle>
              <CardDescription>
                Full playbook: <code className="text-xs">docs/product/LAUNCH-PATH.md</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.detail ? (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                    ) : null}
                  </div>
                  <Badge variant="outline" className={STATUS_STYLE[item.status]}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Link href="/demo">
              <Button variant="default">Demo gateway</Button>
            </Link>
            <Link href="/guides">
              <Button variant="outline">E2E guides</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
