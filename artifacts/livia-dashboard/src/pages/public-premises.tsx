import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerticalBadge } from "@/components/ui/vertical-badge";
import { verticalToneClass, MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MapPin, ChevronRight } from "lucide-react";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";

type PremisesTenant = {
  businessId: string;
  publicLabel: string;
  slug: string;
  name: string;
  vertical: string;
  logoUrl: string | null;
};

type PremisesDetail = {
  displayName: string;
  city: string | null;
  addressLine1: string | null;
  tenants: PremisesTenant[];
};

export default function PublicPremisesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [detail, setDetail] = useState<PremisesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await customFetch<PremisesDetail>(`/api/public/p/${slug}`);
        if (!cancelled) {
          setDetail(data);
          if (data.tenants.length === 1) {
            navigate(`/book/${data.tenants[0].slug}`);
          }
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  if (loading) {
    return <PublicSurfaceLoading />;
  }

  if (error || !detail) {
    return (
      <PublicSurfaceNotFound
        title="Location not found"
        detail="This address page doesn't exist, or the link may be outdated."
      />
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", MOTION.enterPage)}>
      <div className="max-w-lg mx-auto px-4 py-10 sm:py-14 space-y-8">
        <header className="space-y-3 text-center">
          <h1
            className="font-serif text-2xl sm:text-3xl tracking-tight"
            style={{ fontFamily: "var(--app-font-serif)" }}
          >
            {detail.displayName}
          </h1>
          {(detail.addressLine1 || detail.city) && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {[detail.addressLine1, detail.city].filter(Boolean).join(", ")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">Choose who you&apos;d like to book with</p>
        </header>

        <div className="space-y-3">
          {detail.tenants.map((t, i) => (
            <Card
              key={t.businessId}
              className={cn(
                "cursor-pointer hover-elevate transition-all active:scale-[0.99]",
                verticalToneClass(t.vertical),
                MOTION.listItem,
              )}
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => navigate(`/book/${t.slug}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/book/${t.slug}`);
                }
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <CardTitle className="text-lg">{t.publicLabel}</CardTitle>
                  <VerticalBadge vertical={t.vertical} />
                </div>
                <CardDescription>{t.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end pt-0">
                <Button variant="ghost" size="sm" className="gap-1 pointer-events-none">
                  Book
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
          Each business at this address runs independently. Your data stays with who you book.
        </p>

        <PublicSurfaceFooter />
      </div>
    </div>
  );
}
