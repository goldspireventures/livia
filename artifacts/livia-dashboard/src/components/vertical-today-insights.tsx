import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness } from "@/lib/business-context";

type Insight = {
  id: string;
  title: string;
  body: string;
  tone: "info" | "warn" | "action";
  href?: string;
};

export function VerticalTodayInsights() {
  const { business } = useBusiness();
  const [, navigate] = useLocation();
  const bid = business?.id ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["today-vertical-insights", bid],
    queryFn: () =>
      customFetch<{ vertical: string; insights: Insight[] }>(
        `/api/businesses/${bid}/today-vertical-insights`,
      ),
    enabled: !!bid,
    staleTime: 90_000,
  });

  const insights = data?.insights ?? [];
  if (!isLoading && insights.length === 0) return null;

  return (
    <Card data-testid="vertical-today-insights">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          For your vertical
        </CardTitle>
        <CardDescription>
          {data?.vertical ? `${data.vertical} — ` : ""}
          tailored signals for today, not generic salon copy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? <Skeleton className="h-14 w-full" /> : null}
        {insights.map((row) => (
          <button
            key={row.id}
            type="button"
            disabled={!row.href}
            onClick={() => row.href && navigate(row.href)}
            className={`w-full text-left rounded-lg border p-3 transition-colors ${
              row.href ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{row.title}</p>
              <Badge
                variant={
                  row.tone === "warn" ? "destructive" : row.tone === "action" ? "default" : "secondary"
                }
              >
                {row.tone}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{row.body}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
