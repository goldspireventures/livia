import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { Layers, ArrowRight } from "lucide-react";

type BrandGroup = {
  brandShell: { id: string; name: string; slug: string };
  locations: Array<{ id: string; name: string; slug: string; city: string | null }>;
};

export default function BrandsPage() {
  const { setBusinessById } = useBusiness();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [groups, setGroups] = useState<BrandGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await customFetch<BrandGroup[]>("/api/me/brand-portfolio");
        if (!cancelled) setGroups(data);
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function openLocation(businessId: string, name: string) {
    setBusinessById(businessId);
    toast({ title: `Switched to ${name}` });
    navigate("/dashboard");
  }

  if (loading) return <Skeleton className="h-64 m-6" />;

  return (
    <div className="space-y-6 max-w-4xl">
      <PersonaRitualHeader
        variant="page"
        title="Brand portfolio"
        subtitle="Strict brand walls — each location is isolated; rollup is yours alone."
      />

      {groups.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No brand shells yet</CardTitle>
            <CardDescription>
              Mark a business as <code className="text-xs">brand_entity</code> or add locations with a
              parent brand when creating shops.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        groups.map((g) => (
          <Card key={g.brandShell.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5" />
                {g.brandShell.name}
              </CardTitle>
              <CardDescription>{g.locations.length} location(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {g.locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => openLocation(loc.id, loc.name)}
                  className="w-full flex items-center justify-between rounded-md border px-4 py-3 hover:bg-muted/40 text-left"
                >
                  <span>
                    <span className="font-medium">{loc.name}</span>
                    {loc.city ? (
                      <span className="text-sm text-muted-foreground ml-2">{loc.city}</span>
                    ) : null}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {g.locations.length === 0 ? (
                <Button
                  variant="outline"
                  onClick={() => openLocation(g.brandShell.id, g.brandShell.name)}
                >
                  Open brand shell
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
