import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import {
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  Sun,
  Leaf,
  Headphones,
  Heart,
  ArrowRight,
  Loader2,
  RefreshCw,
  Building2,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { PERSONAS, ACCENT_CLASSES, type Persona } from "@/lib/demo/personas";
import {
  fetchDemoCatalog,
  fetchDemoStatus,
  provisionDemoWorld,
  repairDemoDatabase,
  syncDemoWorld,
  syncDemoLogins,
  requestDemoQuickSignIn,
  requestDemoSignIn,
  demoOpenPersonaUrl,
  type DemoBusinessTenant,
  type DemoCatalogPersona,
  type DemoPersonaId,
  type DemoScenarioSpotlight,
  type DemoSignInResult,
} from "@/lib/demo-portal";
import { useToast } from "@/hooks/use-toast";
import { completeDemoPortalSignIn } from "@/lib/demo/complete-demo-portal-sign-in";
import { DemoFlowStepper, type DemoFlowStep } from "@/components/demo/demo-flow-stepper";
import { DemoGuidedExperience } from "@/components/demo/demo-guided-experience";
import { DemoWedgeGrid } from "@/components/demo/demo-wedge-grid";
import { DemoGuestClientShortcut } from "@/components/demo/demo-guest-client-shortcut";
import { DemoWorldReadinessStrip } from "@/components/demo/demo-world-readiness-strip";
import { writeDemoWorldStatusCache } from "@/lib/demo/demo-world-status";
import {
  GatewayDemoLauncherShell,
  GatewayG1Hero,
  GatewayG1SignInHint,
} from "@/components/gateway/gateway-demo-launcher-shell";
import type { BusinessVertical } from "@workspace/policy";
import { isMarketingDemoWedgeUnlocked } from "@workspace/policy";
import { useGatewaySkinHandoffOptional } from "@/components/gateway/gateway-skin-handoff-provider";
import {
  captureMarketingDemoGateKeyFromLocation,
  getMarketingDemoConciergeUrl,
  hasMarketingDemoGateKey,
} from "@/lib/marketing-demo-gate";

const VERTICAL_LABELS: Record<string, string> = {
  hair: "Hair & barber",
  beauty: "Beauty",
  wellness: "Wellness",
  "body-art": "Body art",
  "pet-grooming": "Pet grooming",
  medspa: "Medspa",
  "allied-health": "Allied health",
  fitness: "Fitness",
  general: "Multi-market",
};

function verticalGroupKey(vertical: string | null | undefined): string {
  const v = (vertical ?? "general").toLowerCase();
  return VERTICAL_LABELS[v] ? v : "general";
}

const ICONS: Record<Persona["iconName"], LucideIcon> = {
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  Sun,
  Leaf,
  Headphones,
  Heart,
};

export default function DemoLauncher() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useLayoutEffect(() => {
    captureMarketingDemoGateKeyFromLocation();
    // Local dev: stay on dashboard G1 (founder smoke). Production invited guests round-trip to W1.
    if (import.meta.env.PROD && hasMarketingDemoGateKey()) {
      window.location.replace(getMarketingDemoConciergeUrl());
    }
  }, []);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("vertical")?.toLowerCase();
    if (v && isMarketingDemoWedgeUnlocked(v as BusinessVertical)) {
      navigate(`/demo/wedge/${v}`);
    }
  }, [navigate]);
  const queryClient = useQueryClient();
  const gatewayHandoff = useGatewaySkinHandoffOptional();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { setActive, signOut, session } = useClerk();
  const [catalog, setCatalog] = useState<DemoCatalogPersona[]>([]);
  const [scenarios, setScenarios] = useState<DemoScenarioSpotlight[]>([]);
  const [tenants, setTenants] = useState<DemoBusinessTenant[]>([]);
  const [provisioned, setProvisioned] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [devPassword, setDevPassword] = useState<string | undefined>();
  const [tenantFilter, setTenantFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [selectedScenario, setSelectedScenario] = useState<DemoScenarioSpotlight | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const roleSectionRef = useRef<HTMLElement | null>(null);

  const flowStep: DemoFlowStep = !provisioned
    ? "setup"
    : selectedScenario
      ? "role"
      : "scenario";

  const refresh = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    const [cat, st] = await Promise.all([
      fetchDemoCatalog().catch(() => ({
        personas: [],
        devPassword: undefined,
        sharedPassword: undefined,
        scenarios: [],
      })),
      fetchDemoStatus().catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Demo status unreachable";
        setStatusError(msg);
        return null;
      }),
    ]);
    setCatalog(cat.personas);
    setScenarios(cat.scenarios ?? []);
    // Only show a password if the API explicitly returns one.
    // Never fall back to a hardcoded shared password on the client.
    setDevPassword(cat.sharedPassword ?? cat.devPassword ?? undefined);
    if (st) {
      setProvisioned(st.provisioned);
      setTenants(st.businesses ?? []);
      writeDemoWorldStatusCache(st.provisioned, st.businesses ?? []);
    }
    setStatusLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (window.location.hash !== "#demo-setup") return;
    window.requestAnimationFrame(() => {
      document.getElementById("demo-setup")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [provisioned, statusLoading]);

  async function handleSync() {
    setBusy("provision");
    try {
      const result = await syncDemoWorld();
      writeDemoWorldStatusCache(result.provisioned, result.businesses as DemoBusinessTenant[]);
      toast({
        title: result.mode === "full" ? "Demo world created" : "Quick sync done",
        description:
          result.mode === "full"
            ? `${result.businesses.length} businesses seeded — pick a scenario next.`
            : `Branding ${result.brandingUpdated ?? 0} · images ${result.servicesUpdated ?? 0} · live ${result.liveDaysRefreshed ?? 0} shops`,
      });
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Is the API running with CLERK_SECRET_KEY?";
      const quota = /user limit|repair-db|CLERK_USER_QUOTA/i.test(msg);
      toast({
        title: "Setup failed",
        description: quota
          ? `${msg} Try “Repair demo (no new Clerk users)” below.`
          : msg,
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleRepairDb() {
    setBusy("repair");
    try {
      const result = await repairDemoDatabase();
      toast({
        title: "Demo repaired",
        description: `${result.businesses.length} businesses seeded — pick Beauty → Bloom owner.`,
      });
      await refresh();
    } catch (e: unknown) {
      toast({
        title: "Repair failed",
        description: e instanceof Error ? e.message : "Check API logs",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleSyncLogins() {
    setBusy("sync-logins");
    try {
      const slug = selectedScenario?.slug;
      const result = await syncDemoLogins(slug);
      toast({
        title: slug ? `Logins synced · ${slug}` : "Demo logins synced",
        description: `Clerk ${result.clerkSynced} · roster ${result.rosterAccounts}${slug ? "" : " — pick a scenario first to sync one tenant faster"}`,
      });
      await refresh();
    } catch (e: unknown) {
      toast({
        title: "Login sync failed",
        description: e instanceof Error ? e.message : "Is CLERK_SECRET_KEY set?",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleFullReset() {
    setBusy("reset");
    try {
      await provisionDemoWorld();
      toast({
        title: "Full reset complete",
        description: "All demo businesses wiped and re-seeded. Pick a scenario.",
      });
      setSelectedScenario(null);
      await refresh();
    } catch (e: unknown) {
      toast({
        title: "Reset failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  function selectScenario(scenario: DemoScenarioSpotlight) {
    setSelectedScenario(scenario);
    window.requestAnimationFrame(() => {
      roleSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function quickEnterEmail(email: string, busyKey: string) {
    if (!provisioned) {
      toast({
        title: "Provision demo world first",
        description: "Click “Set up demo world” once — seeds every business + role login.",
        variant: "destructive",
      });
      return;
    }
    setBusy(busyKey);
    try {
      const result = await requestDemoQuickSignIn(email);
      await completeTicketSignIn(result);
    } catch (e: unknown) {
      toast({
        title: "Could not sign in",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  async function completeTicketSignIn(result: DemoSignInResult) {
    if (!signInLoaded || !signIn) {
      toast({ title: "Clerk not ready", variant: "destructive" });
      return;
    }
    await completeDemoPortalSignIn({
      signIn,
      clerk: { signOut, setActive, sessionId: session?.id },
      result,
      password: devPassword,
      queryClient,
      navigate,
      gatewayHandoff,
      vertical: selectedTenant?.vertical ?? undefined,
    });
  }

  const selectedTenant = useMemo(
    () => (selectedScenario ? tenants.find((t) => t.slug === selectedScenario.slug) : null),
    [selectedScenario, tenants],
  );

  const locationOperatorTenant = useMemo(() => {
    const locSlug = selectedScenario?.locationOperatorSlug;
    if (!locSlug) return null;
    return tenants.find((t) => t.slug === locSlug) ?? null;
  }, [selectedScenario, tenants]);

  const structureScenarios = useMemo(
    () => scenarios.filter((s) => s.group !== "vertical"),
    [scenarios],
  );
  const verticalScenarios = useMemo(
    () => scenarios.filter((s) => s.group === "vertical"),
    [scenarios],
  );

  const deferredFilter = useDeferredValue(tenantFilter);

  const filteredTenants = useMemo(() => {
    const q = deferredFilter.trim().toLowerCase();
    const byCountry = countryFilter === "ALL"
      ? tenants
      : tenants.filter((t) => (t.country ?? "").toUpperCase() === countryFilter);
    if (!q) return byCountry;
    return byCountry.filter((t) => {
      const vLabel = VERTICAL_LABELS[verticalGroupKey(t.vertical)] ?? t.vertical ?? "";
      return (
        t.name.toLowerCase().includes(q) ||
        t.slug.includes(q) ||
        (t.vertical ?? "").toLowerCase().includes(q) ||
        vLabel.toLowerCase().includes(q) ||
        (t.country ?? "").toLowerCase().includes(q)
      );
    });
  }, [tenants, deferredFilter, countryFilter]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const t of tenants) {
      const c = (t.country ?? "").trim().toUpperCase();
      if (c) set.add(c);
    }
    return ["ALL", ...Array.from(set).sort()];
  }, [tenants]);

  const tenantsByVertical = useMemo(() => filteredTenants.reduce<Record<string, DemoBusinessTenant[]>>(
    (acc, t) => {
      const key = verticalGroupKey(t.vertical);
      (acc[key] ??= []).push(t);
      return acc;
    },
    {}),
  [filteredTenants]);

  const verticalSections = useMemo(
    () =>
      Object.keys(tenantsByVertical).sort((a, b) => {
        const order = Object.keys(VERTICAL_LABELS);
        return order.indexOf(a) - order.indexOf(b);
      }),
    [tenantsByVertical],
  );

  const filterPending = tenantFilter !== deferredFilter;

  async function enterPersona(personaId: DemoPersonaId) {
    if (!provisioned && personaId !== "customer") {
      toast({
        title: "Provision demo world first",
        description: "Click “Set up full demo world” once.",
        variant: "destructive",
      });
      return;
    }
    setBusy(personaId);
    try {
      const result = await requestDemoSignIn(personaId);
      if (result.signInStrategy === "public") {
        navigate(result.landingPath);
        return;
      }
      await completeTicketSignIn(result);
    } catch (e: unknown) {
      toast({
        title: "Could not enter persona",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  const advancedPanel = (
    <>
        <details className="group" open={!provisioned} data-testid="demo-advanced-paths">
          <summary className="cursor-pointer text-xs font-mono uppercase tracking-widest text-white/40 mb-4 list-none">
            Advanced · setup, guided enter & all tenants
          </summary>

        <DemoGuidedExperience
          provisioned={provisioned}
          devPassword={devPassword}
          tenants={tenants}
          busy={busy}
          onProvision={() => void handleSync()}
          onEnterAs={(email, busyKey) => void quickEnterEmail(email, busyKey)}
        />

        <DemoFlowStepper
          current={flowStep}
          provisioned={provisioned}
          scenarioSelected={!!selectedScenario}
        />

        <section
          id="demo-setup-advanced"
          className="mb-10 rounded-2xl border border-white/12 bg-white/[0.03] p-5"
          data-testid="demo-step-setup"
        >
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2">
            2 · Set up demo world
          </h2>
          <p className="text-sm text-white/55 mb-4 max-w-xl">
            First visit runs a full seed (~30–60s). After that, <strong className="text-white/80">Quick sync</strong>{" "}
            refreshes public branding + service images + today's bookings (~5s). Use <strong className="text-white/80">Sync logins</strong>{" "}
            after picking a scenario — syncs that tenant only (~5s). Full sync all tenants if no scenario selected.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={!!busy}
              className="inline-flex items-center gap-2 rounded-full bg-[#06b6d4] text-black px-4 py-2 text-sm font-semibold hover:bg-[#22d3ee] disabled:opacity-60"
              data-testid="demo-provision-btn"
            >
              {busy === "provision" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {provisioned ? "Quick sync" : "Set up demo world"}
            </button>
            {!provisioned ? (
              <button
                type="button"
                onClick={() => void handleRepairDb()}
                disabled={!!busy}
                className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm text-amber-100 hover:bg-amber-400/20 disabled:opacity-60"
                data-testid="demo-repair-db-btn"
              >
                {busy === "repair" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Repair demo (no new Clerk users)
              </button>
            ) : null}
            {provisioned ? (
              <button
                type="button"
                onClick={() => void handleSyncLogins()}
                disabled={!!busy}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-60"
                data-testid="demo-sync-logins-btn"
              >
                {busy === "sync-logins" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync logins
              </button>
            ) : null}
            {provisioned ? (
              <span className="text-[11px] font-mono text-emerald-400/90">
                {tenants.length} businesses ready
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-400/90">Required before testing</span>
            )}
            {provisioned ? (
              <button
                type="button"
                onClick={() => void handleFullReset()}
                disabled={!!busy}
                className="text-[11px] text-white/40 underline underline-offset-2 hover:text-white/70 disabled:opacity-50"
              >
                {busy === "reset" ? "Resetting…" : "Full reset (slow)"}
              </button>
            ) : null}
          </div>
        </section>

        {/* Step 3 — Scenario */}
        <section
          className={`mb-10 ${!provisioned ? "opacity-50 pointer-events-none" : ""}`}
          data-testid="demo-step-scenario"
        >
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-1">
            3 · Or pick a business shape
          </h2>
          <p className="text-xs text-white/40 mb-3">
            Advanced path — solo, team, multi-site, host, franchise. Prefer a trade story above when pitching a vertical.
          </p>
          {!provisioned ? (
            <p className="text-sm text-amber-200/80">Complete step 1 first.</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 mb-6">
                {structureScenarios.map((scenario) => {
                  const selected = selectedScenario?.id === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => selectScenario(scenario)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-[#06b6d4]/60 bg-[#06b6d4]/10"
                          : "border-white/12 bg-white/[0.04] hover:border-white/25"
                      }`}
                      data-testid={`demo-scenario-${scenario.id}`}
                    >
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#22d3ee]/80">
                        {scenario.structure.replace(/-/g, " ")}
                      </p>
                      <p className="text-sm font-medium text-white mt-1">{scenario.title}</p>
                      <p className="text-xs text-white/45 mt-1">{scenario.description}</p>
                      {selected ? (
                        <p className="mt-2 text-[10px] font-mono text-[#22d3ee]">Selected ↓ choose role</p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {verticalScenarios.length > 0 ? (
                <>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
                    Industry flows (vertical UAT)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {verticalScenarios.map((scenario) => {
                      const selected = selectedScenario?.id === scenario.id;
                      return (
                        <button
                          key={scenario.id}
                          type="button"
                          onClick={() => selectScenario(scenario)}
                          className={`rounded-xl border p-3 text-left transition ${
                            selected
                              ? "border-violet-500/50 bg-violet-500/10"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20"
                          }`}
                          data-testid={`demo-scenario-${scenario.id}`}
                        >
                          <p className="text-sm font-medium text-white">{scenario.title}</p>
                          <p className="text-xs text-white/45 mt-0.5">{scenario.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </>
          )}
        </section>

        {/* Step 4 — Role */}
        <section
          ref={roleSectionRef}
          className={`mb-10 ${!selectedScenario || !provisioned ? "opacity-50" : ""}`}
          data-testid="demo-step-role"
        >
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
            4 · Enter as a role
          </h2>
          {!selectedScenario ? (
            <p className="text-sm text-white/45">Pick a scenario above — then one-click login as owner, manager, desk, or staff.</p>
          ) : selectedTenant?.roster?.length ? (
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5">
              <p className="text-sm font-medium text-white">{selectedScenario.title}</p>
              <p className="text-xs text-white/45 mt-1 mb-4">
                {selectedTenant.name}
                {devPassword ? (
                  <>
                    {" "}
                    · password <code className="text-white/70">{devPassword}</code>
                  </>
                ) : null}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedTenant.roster.map((entry) => {
                  const loading = busy === `${selectedScenario.slug}:${entry.email}`;
                  const roleLabel =
                    selectedScenario.id === "chain-hq" && entry.role === "owner"
                      ? "Org admin"
                      : selectedScenario.id === "chair-host" && entry.role === "owner"
                        ? "Host owner"
                        : (entry.label.split(" · ").pop() ?? entry.label);
                  return (
                    <button
                      key={entry.email}
                      type="button"
                      disabled={!!busy || !provisioned}
                      onClick={() => void quickEnterEmail(entry.email, `${selectedScenario.slug}:${entry.email}`)}
                      className="flex flex-col items-start rounded-xl border border-white/15 bg-white/[0.03] px-3 py-3 text-left hover:border-[#06b6d4]/40 hover:bg-white/[0.06] disabled:opacity-60"
                      title={entry.email}
                    >
                      <span className="text-xs font-medium text-white">
                        {loading ? "Signing in…" : roleLabel}
                      </span>
                      <span className="mt-1 text-[9px] font-mono text-white/35 truncate w-full">{entry.email}</span>
                    </button>
                  );
                })}
              </div>
              {locationOperatorTenant?.roster?.length ? (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/50 mb-2">
                    Or run <strong className="text-white/70">{locationOperatorTenant.name}</strong> only — location
                    operator (no chain rollup)
                  </p>
                  <button
                    type="button"
                    disabled={!!busy || !provisioned}
                    onClick={() => {
                      const owner = locationOperatorTenant.roster!.find((e) => e.role === "owner");
                      if (owner) {
                        void quickEnterEmail(owner.email, `${locationOperatorTenant.slug}:loc-owner`);
                      }
                    }}
                    className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-left text-xs hover:border-[#06b6d4]/40 disabled:opacity-60"
                    data-testid="demo-location-operator-btn"
                  >
                    Location owner · {locationOperatorTenant.slug}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-amber-200/80">
              Run <strong>Sync logins</strong> on step 1 — roster accounts missing for this tenant.
            </p>
          )}
        </section>

        </details>

        <p className="mt-6 text-center text-[11px] text-white/35 font-mono" data-testid="demo-footer-honesty">
          Demo data — not production · reset anytime via quick sync
        </p>

        <section className="mb-10" data-testid="demo-tenant-tour">
          <details className="group">
            <summary className="cursor-pointer text-xs font-mono uppercase tracking-widest text-white/40 mb-3 list-none">
              Advanced · all {tenants.length} demo tenants
            </summary>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3 pt-2">
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white"
                  aria-label="Filter by country"
                >
                  {countries.map((c) => (
                    <option key={c} value={c} className="bg-[#09090b]">
                      {c === "ALL" ? "All countries" : c}
                    </option>
                  ))}
                </select>
                <input
                  type="search"
                  placeholder="Filter…"
                  value={tenantFilter}
                  onChange={(e) => setTenantFilter(e.target.value)}
                  className="flex-1 sm:w-48 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/30"
                  aria-label="Filter businesses"
                />
              </div>
            </div>
          {!provisioned ? (
            <p className="text-sm text-amber-200/80">Provision first — then every business gets an owner login.</p>
          ) : filteredTenants.length === 0 ? (
            <p className="text-sm text-white/50">No businesses match &quot;{tenantFilter.trim()}&quot;.</p>
          ) : (
            <div
              className={`space-y-6 max-h-[min(560px,65vh)] overflow-y-auto pr-1 transition-opacity ${filterPending ? "opacity-70" : "opacity-100"}`}
            >
              {verticalSections.map((vKey) => (
                <div key={vKey}>
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-[#22d3ee]/80 mb-2 sticky top-0 bg-[#09090b]/95 py-1 z-10">
                    {VERTICAL_LABELS[vKey] ?? vKey} · {tenantsByVertical[vKey]?.length ?? 0}
                  </h3>
                  <div className="space-y-2">
                    {(tenantsByVertical[vKey] ?? [])
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((t) => {
                        const ownerEmail =
                          t.roster?.find((r) => r.role === "owner")?.email ?? t.ownerEmail;
                        const loading = busy === `${t.slug}:${ownerEmail}`;
                        const ownerPersona = t.ownerPersonaId;
                        return (
                          <div
                            key={t.slug}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3"
                            data-testid={`demo-tenant-${t.slug}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{t.name}</p>
                              <p className="text-[10px] font-mono text-white/40 mt-0.5 truncate">
                                {t.slug}
                              </p>
                              {t.roster?.length ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {t.roster.map((entry) => {
                                    const roleBusy = busy === `${t.slug}:${entry.email}`;
                                    return (
                                      <button
                                        key={entry.email}
                                        type="button"
                                        disabled={!!busy}
                                        onClick={() => void quickEnterEmail(entry.email, `${t.slug}:${entry.email}`)}
                                        className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-white/80 hover:bg-white/5 disabled:opacity-60"
                                        title={entry.email}
                                      >
                                        {roleBusy ? "…" : entry.label.split(" · ").pop()}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const ownerEmail =
                                    t.roster?.find((r) => r.role === "owner")?.email ?? t.ownerEmail;
                                  void quickEnterEmail(ownerEmail, `${t.slug}:${ownerEmail}`);
                                }}
                                disabled={!!busy}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#06b6d4] text-black px-3 py-1.5 text-xs font-semibold hover:bg-[#22d3ee] disabled:opacity-60"
                              >
                                {loading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    {ownerPersona ? "Chain owner" : "Owner"}
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </>
                                )}
                              </button>
                              <a
                                href={t.publicBookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
                              >
                                Public booking
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
          </details>
        </section>

        <details className="mb-10 group">
          <summary className="cursor-pointer text-sm font-mono uppercase tracking-wider text-white/50 mb-4 list-none flex items-center gap-2">
            Staff & role rehearsals (optional)
            <span className="text-white/30 normal-case font-sans text-xs">— Ctrl+click opens a role in a new tab</span>
          </summary>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
          data-testid="demo-launcher-grid"
        >
          {PERSONAS.map((p) => {
            const Icon = ICONS[p.iconName];
            const a = ACCENT_CLASSES[p.accent];
            const live = catalog.find((c) => c.id === p.id);
            const loading = busy === p.id;
            const openHref = demoOpenPersonaUrl({ persona: p.id as DemoPersonaId });
            return (
              <a
                key={p.id}
                href={openHref}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  void enterPersona(p.id as DemoPersonaId);
                }}
                aria-disabled={!!busy}
                className={`group relative h-full rounded-2xl border ${a.border} bg-gradient-to-br ${a.gradFrom} ${a.gradTo} p-6 text-left transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden ${busy ? "opacity-70 pointer-events-none" : ""}`}
                data-testid={`demo-launcher-card-${p.id}`}
              >
                <div
                  className={`absolute -top-12 -right-12 h-40 w-40 rounded-full ${a.bg} blur-3xl opacity-60 group-hover:opacity-100 transition-opacity`}
                />
                <div className="relative">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${a.border} ${a.bg} mb-5`}
                  >
                    {loading ? (
                      <Loader2 className={`h-5 w-5 animate-spin ${a.text}`} />
                    ) : (
                      <Icon className={`h-5 w-5 ${a.text}`} />
                    )}
                  </div>
                  <h2
                    className="text-xl mb-1 tracking-tight text-white"
                    style={{ fontFamily: "var(--app-font-serif)" }}
                  >
                    {p.displayName}
                  </h2>
                  <p className="text-[11px] uppercase tracking-wider font-mono text-white/40 mb-2">
                    {p.roleLabel}
                  </p>
                  {live ? (
                    <p className="text-[10px] font-mono text-white/35 mb-3 truncate">{live.email}</p>
                  ) : null}
                  <p className="text-sm text-white/70 leading-relaxed mb-6">{p.tease}</p>
                  <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${a.text}`}>
                    Sign in as {p.displayName.split(" ")[0]}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mt-2 text-[10px] text-white/35 font-mono">Ctrl+click · new tab</p>
                </div>
              </a>
            );
          })}

          <button
            type="button"
            onClick={() => {
              window.open("http://localhost:5175", "_blank", "noopener,noreferrer");
              toast({
                title: "Internal Livia console",
                description:
                  "Paste INTERNAL_OPS_SECRET from repo root .env into the unlock field (not a Clerk login).",
              });
            }}
            className="group relative h-full rounded-2xl border border-slate-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950 p-6 text-left transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
            data-testid="demo-launcher-card-internal"
          >
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-slate-500/10 blur-3xl opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-500/30 bg-slate-500/10 mb-5">
                <Building2 className="h-5 w-5 text-slate-300" />
              </div>
              <h2
                className="text-xl mb-1 tracking-tight text-white"
                style={{ fontFamily: "var(--app-font-serif)" }}
              >
                Livia internal
              </h2>
              <p className="text-[11px] uppercase tracking-wider font-mono text-white/40 mb-2">
                Company ops · not a shop login
              </p>
              <p className="text-sm text-white/70 leading-relaxed mb-6">
                Tenant search, health, support context — for Livia staff (Support / Success / Eng). Uses ops
                secret, not org-admin@livia.io.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                Open :5175
                <ExternalLink className="h-3.5 w-3.5" />
              </div>
            </div>
          </button>
        </div>
        </details>

        <footer className="mt-8 text-[11px] font-mono text-white/40 space-y-2">
          <p>
            Playbook:{" "}
            <Link href="/guides" className="text-primary underline">
              guides
            </Link>
            {" · "}
            <span className="text-white/50">docs/testing/TEST-EVERY-BUSINESS.md</span>
            {" · mock UI only: "}
            <Link href="/demo/org-admin" className="text-white/50 underline">
              /demo/org-admin
            </Link>
          </p>
        </footer>
    </>
  );

  return (
    <GatewayDemoLauncherShell advanced={advancedPanel}>
      <GatewayG1Hero />
      <GatewayG1SignInHint devPassword={devPassword} />
      <DemoWorldReadinessStrip
        provisioned={provisioned}
        businessCount={tenants.length}
        loading={statusLoading}
        error={statusError}
        busy={busy}
        onSetup={() => void handleSync()}
        onRetry={() => void refresh()}
      />
      <DemoGuestClientShortcut
        busy={busy === "customer"}
        openHref={demoOpenPersonaUrl({ persona: "customer" })}
        onOpen={() => void enterPersona("customer")}
      />
      <DemoWedgeGrid />
    </GatewayDemoLauncherShell>
  );
}
