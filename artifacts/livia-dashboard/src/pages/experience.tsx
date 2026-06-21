import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Building2,
  Globe,
  LayoutDashboard,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-fetch";
import {
  persistExperienceContext,
  openExternal,
  openPublicBooking,
  type EnterExperienceInput,
} from "@/lib/experience";
import { provisionDemoWorld } from "@/lib/demo-portal";
import type { PersonaKind } from "@/lib/persona";

type ExperienceMap = {
  seeded: boolean;
  businessCount: number;
  businesses: Array<{
    id: string;
    name: string;
    slug: string;
    category: string | null;
    city: string | null;
    staff: Array<{ id: string; displayName: string }>;
  }>;
  urls: {
    dashboardBase: string;
    internalBase: string;
    marketingBase: string;
  };
};

function primaryBusiness(map: ExperienceMap | null) {
  return map?.businesses[0] ?? null;
}

export default function ExperiencePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [map, setMap] = useState<ExperienceMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMap(await apiFetch<ExperienceMap>("/experience/map"));
    } catch {
      setMap(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enter = (input: EnterExperienceInput) => {
    persistExperienceContext(input);
    qc.invalidateQueries();
    navigate(input.route);
  };

  async function resetAndSeed() {
    setBusy(true);
    try {
      await provisionDemoWorld();
      toast({
        title: "Full demo loaded",
        description: "Aurora world + six Clerk users — use /demo to sign in as each role.",
      });
      await load();
      qc.invalidateQueries();
    } catch (e: unknown) {
      toast({
        title: "Seed failed",
        description: e instanceof Error ? e.message : "Check API is running",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  const luxe = primaryBusiness(map);
  const multi = (map?.businessCount ?? 0) >= 2;
  const firstStaff = luxe?.staff[0];

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-24" data-testid="experience-page">
      <header className="space-y-2">
        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
          Livia in full
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Experience hub</h1>
        <p className="text-muted-foreground max-w-2xl">
          One place to enter every perspective we built for — customer on the street, owner in
          the cockpit, staff on the floor, org admin across locations, and Livia internal ops. Each door
          opens the <strong>real app</strong> with the right shop and view.
        </p>
      </header>

      {!map?.seeded ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle>Load the world first</CardTitle>
            <CardDescription>
              You need the 3-shop demo workspace (Luxe, Iron & Ink, Peak Performance) before the
              doors work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled={busy} onClick={() => resetAndSeed()}>
              {busy ? "Seeding…" : "Reset & load full demo (3 businesses)"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">
              {map.businessCount} business{map.businessCount === 1 ? "" : "es"} ready
            </span>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => resetAndSeed()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Re-seed
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Public */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Globe className="h-5 w-5 text-cyan-500" />
          Public — customer POV
        </h2>
        <p className="text-sm text-muted-foreground">
          Guest preview — booking page and Liv chat, no login required.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {map?.businesses.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{b.name}</CardTitle>
                <CardDescription>{b.city ?? "—"} · /book/{b.slug}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPublicBooking(map.urls.dashboardBase, b.slug)}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Open booking page
                </Button>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Storybook demo (mock UI)</CardTitle>
              <CardDescription>Seven persona rituals — visual only, no live data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" size="sm" onClick={() => navigate("/demo")}>
                Open /demo gallery
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Business users */}
      {luxe && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-500" />
            Shop team — real app (web)
          </h2>
          <p className="text-sm text-muted-foreground">
            Uses your Clerk account — same routes and RBAC as production.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ExperienceDoor
              title="Owner · single shop"
              description={`${luxe.name} — dashboard, billing, integrations`}
              onClick={() =>
                enter({
                  businessId: luxe.id,
                  route: "/dashboard",
                  persona: "owner",
                  viewAsStaffId: null,
                })
              }
            />
            {multi && (
              <ExperienceDoor
                title="Org admin · multi-location"
                description="Business switcher + Chain rollup (sidebar)"
                onClick={() =>
                  enter({
                    businessId: luxe.id,
                    route: "/chain",
                    persona: "org_admin",
                    viewAsStaffId: null,
                  })
                }
              />
            )}
            <ExperienceDoor
              title="Manager · inbox"
              description="Approvals, AI handoffs, team pulse"
              onClick={() =>
                enter({
                  businessId: luxe.id,
                  route: "/inbox",
                  persona: "manager",
                  viewAsStaffId: null,
                })
              }
            />
            {firstStaff && (
              <ExperienceDoor
                title={`Staff · ${firstStaff.displayName}`}
                description="My Day — view as staff (read-only preview)"
                onClick={() =>
                  enter({
                    businessId: luxe.id,
                    route: "/my-day",
                    persona: "staff",
                    viewAsStaffId: firstStaff.id,
                  })
                }
              />
            )}
            <ExperienceDoor
              title="Front desk · bookings"
              description="Calendar-first reception flow"
              onClick={() =>
                enter({
                  businessId: luxe.id,
                  route: "/bookings",
                  persona: "receptionist",
                  viewAsStaffId: null,
                })
              }
            />
            <ExperienceDoor
              title="Trust · audit log"
              description="Owner-only hash-chained activity"
              onClick={() =>
                enter({
                  businessId: luxe.id,
                  route: "/audit",
                  persona: "owner",
                  viewAsStaffId: null,
                })
              }
            />
            <ExperienceDoor
              title="Platform · settings"
              description="Billing, integrations, peer insights, AI"
              onClick={() =>
                enter({
                  businessId: luxe.id,
                  route: "/settings",
                  persona: "owner",
                  viewAsStaffId: null,
                })
              }
            />
          </div>
        </section>
      )}

      {/* Other businesses */}
      {map && map.businesses.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Other demo businesses
          </h2>
          <div className="grid gap-2">
            {map.businesses.slice(1).map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.category}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      enter({
                        businessId: b.id,
                        route: "/dashboard",
                        persona: "owner",
                      })
                    }
                  >
                    Enter as owner
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openPublicBooking(map.urls.dashboardBase, b.slug)}
                  >
                    Public page
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Livia Inc */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Livia Inc — internal POV
        </h2>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Tenant search and health — separate app. Paste{" "}
              <code className="text-xs">INTERNAL_OPS_SECRET</code> from root <code>.env</code>.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => openExternal(map?.urls.internalBase ?? "http://localhost:5175")}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Open internal ops (web)
              </Button>
              <Button variant="ghost" onClick={() => navigate("/chain")}>
                Chain rollup (if multi-shop)
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Mobile hint */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Mobile
        </h2>
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            <p>
              Run <code className="text-xs">pnpm dev:mobile:device</code>, sign in with the{" "}
              <strong>same Clerk account</strong>, then load demo from onboarding or More → switch
              business / persona.
            </p>
            <p>
              Mobile mirrors owner/staff flows (Today, Bookings, Clients, Inbox) — not every web-only
              screen (Audit, Integrations, Chain).
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ExperienceDoor({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="hover:border-primary/40 transition-colors cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <span className="text-sm font-medium text-primary">Enter →</span>
      </CardContent>
    </Card>
  );
}
