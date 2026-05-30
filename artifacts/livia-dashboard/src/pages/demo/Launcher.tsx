import { useCallback, useEffect, useMemo, useState, useDeferredValue } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useSignIn, useClerk } from "@clerk/clerk-react";
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
  BookOpen,
  Building2,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { PERSONAS, ACCENT_CLASSES, type Persona } from "@/lib/demo/personas";
import {
  applyDemoSessionContext,
  fetchDemoCatalog,
  fetchDemoStatus,
  provisionDemoWorld,
  requestDemoSignIn,
  requestDemoSignInForBusiness,
  requestDemoSignInAsBusiness,
  type DemoBusinessTenant,
  type DemoCatalogPersona,
  type DemoPersonaId,
  type DemoSignInResult,
} from "@/lib/demo-portal";
import { useToast } from "@/hooks/use-toast";
import { listWedgeDemoVerticals, getWedgeDemoStory } from "@workspace/policy";

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
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const { setActive, signOut, session } = useClerk();
  const [catalog, setCatalog] = useState<DemoCatalogPersona[]>([]);
  const [tenants, setTenants] = useState<DemoBusinessTenant[]>([]);
  const [provisioned, setProvisioned] = useState(false);
  const [passwordHint, setPasswordHint] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [devPassword, setDevPassword] = useState<string | undefined>();
  const [tenantFilter, setTenantFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");

  const refresh = useCallback(async () => {
    const [cat, st] = await Promise.all([
      fetchDemoCatalog().catch(() => ({ personas: [], devPassword: undefined })),
      fetchDemoStatus().catch(
        (): Awaited<ReturnType<typeof fetchDemoStatus>> => ({
          provisioned: false,
          businesses: [],
          passwordHint: "",
          dashboardBase: "",
          internalBase: "",
          marketingBase: "",
          demoPasswordConfigured: false,
        }),
      ),
    ]);
    setCatalog(cat.personas);
    setDevPassword(cat.devPassword);
    setProvisioned(st.provisioned);
    setTenants(st.businesses ?? []);
    setPasswordHint(st.passwordHint ?? "");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleProvision() {
    setBusy("provision");
    try {
      await provisionDemoWorld();
      toast({
        title: "Demo world ready",
        description:
          "Every business now has its own owner login. Pick any row → Open as owner.",
      });
      await refresh();
    } catch (e: unknown) {
      toast({
        title: "Provision failed",
        description: e instanceof Error ? e.message : "Is the API running with CLERK_SECRET_KEY?",
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
    if (isSignedIn && session?.id) {
      await signOut({ sessionId: session.id });
    }
    const attempt = await signIn.create({
      strategy: "ticket",
      ticket: result.token!,
    });
    if (attempt.status === "complete" && attempt.createdSessionId) {
      await setActive({ session: attempt.createdSessionId });
      applyDemoSessionContext(result);
      navigate(result.landingPath);
    } else {
      toast({
        title: "Sign-in incomplete",
        description: "Try /sign-in → Demo account form with the same email + password.",
        variant: "destructive",
      });
    }
  }

  async function enterBusiness(slug: string) {
    if (!provisioned) {
      toast({
        title: "Provision demo world first",
        description: "Click “Set up full demo world” to seed businesses and owner logins.",
        variant: "destructive",
      });
      return;
    }
    setBusy(slug);
    try {
      const result = await requestDemoSignInAsBusiness(slug);
      await completeTicketSignIn(result);
    } catch (e: unknown) {
      toast({
        title: "Could not open business",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

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

  async function enterPersonaForBusiness(personaId: DemoPersonaId, businessSlug: string) {
    if (!provisioned && personaId !== "customer") {
      toast({
        title: "Provision demo world first",
        description: "Click “Set up full demo world” once.",
        variant: "destructive",
      });
      return;
    }
    setBusy(`${personaId}:${businessSlug}`);
    try {
      const result = await requestDemoSignInForBusiness(personaId, businessSlug);
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

  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-white relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#8b5cf6]/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#06b6d4]/12 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-[#10b981]/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <header className="mb-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[11px] font-mono tracking-wide text-[#22d3ee] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse" />
            Livia · live demo gateway
          </div>
          <h1
            className="text-4xl md:text-6xl tracking-tight leading-[1.05] mb-6"
            style={{ fontFamily: "var(--app-font-serif)" }}
          >
            Test every business
            <span className="block text-white/50 italic">on Livia, one owner at a time.</span>
          </h1>
          <p className="text-base md:text-lg text-white/60 max-w-2xl leading-relaxed">
            <strong className="text-white/80">18 businesses</strong> across hair, beauty, wellness,
            medspa, pets, body art, fitness, and EU markets — <strong className="text-white/80">open as
            owner</strong> for one tenant at a time (Liv, inbox, vertical home). Use{" "}
            <strong className="text-white/80">public booking</strong> for the customer view, or staff
            cards below for RBAC rehearsals.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-sm font-mono uppercase tracking-widest text-white/40 mb-4">
            Pick your world · G1-A wedge
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {listWedgeDemoVerticals().map((v) => {
              const story = getWedgeDemoStory(v);
              if (!story) return null;
              return (
                <Link
                  key={v}
                  href={`/demo/wedge/${v}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition hover:border-[#06b6d4]/40 hover:bg-white/[0.07]"
                >
                  <p className="text-sm font-medium text-white group-hover:text-[#22d3ee]">
                    {story.label}
                  </p>
                  <p className="mt-1 text-xs text-white/45 line-clamp-2">{story.beats[0]?.headline}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="mb-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleProvision()}
            disabled={!!busy}
            className="inline-flex items-center gap-2 rounded-full bg-[#06b6d4] text-black px-5 py-2.5 text-sm font-semibold hover:bg-[#22d3ee] disabled:opacity-60 transition-colors"
            data-testid="demo-provision-btn"
          >
            {busy === "provision" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {provisioned ? "Reset demo world" : "Set up full demo world"}
          </button>
          <Link href="/guides">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors">
              <BookOpen className="h-4 w-4" />
              E2E playbook
            </span>
          </Link>
          <Link href="/portal">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors">
              Portal hub
            </span>
          </Link>
          <Link href="/sign-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm text-emerald-200 hover:bg-emerald-500/15 transition-colors">
              Real signup test
            </span>
          </Link>
          {provisioned ? (
            <span className="text-[11px] font-mono text-emerald-400/90">
              ● {tenants.length} businesses ready
            </span>
          ) : (
            <span className="text-[11px] font-mono text-amber-400/90">○ Provision once, then open any business</span>
          )}
        </div>

        {passwordHint ? (
          <p className="mb-6 text-xs font-mono text-white/40 max-w-3xl">{passwordHint}</p>
        ) : null}

        <section className="mb-12" data-testid="demo-tenant-tour">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-mono uppercase tracking-wider text-white/50 mb-1">
                Businesses on Livia
              </h2>
              <p className="text-sm text-white/60 max-w-xl">
                Each row = one real tenant. Owner sees only that shop (not 17 locations).
              </p>
            </div>
            <div className="w-full sm:w-64 flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-white/40">
                Country
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                  aria-label="Filter demo businesses by country"
                >
                  {countries.map((c) => (
                    <option key={c} value={c} className="bg-[#09090b] text-white">
                      {c === "ALL" ? "All countries" : c}
                    </option>
                  ))}
                </select>
              </label>
              <input
                type="search"
                placeholder="Filter as you type — hair, medspa, london…"
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30"
                aria-label="Filter demo businesses"
              />
              {tenantFilter.trim() ? (
                <p className="text-[11px] text-white/40 text-right">
                  {filterPending
                    ? "Filtering…"
                    : `${filteredTenants.length} match${filteredTenants.length === 1 ? "" : "es"}`}
                </p>
              ) : null}
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
                        const loading = busy === t.slug;
                        const ownerPersona = t.ownerPersonaId;
                        const isChainOwner = ownerPersona === "org_admin";
                        const roleLoading = (id: string) => busy === id;
                        return (
                          <div
                            key={t.slug}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3"
                            data-testid={`demo-tenant-${t.slug}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{t.name}</p>
                              <p className="text-[10px] font-mono text-white/40 mt-0.5">
                                {t.slug} · {(t.country ?? "—").toUpperCase()} · {t.ownerEmail}
                                {isChainOwner ? (
                                  <span className="text-white/30">
                                    {" "}
                                    · Chain owner — pick the shop after sign-in
                                  </span>
                                ) : null}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void enterPersonaForBusiness("manager", t.slug)}
                                  disabled={!!busy}
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-[11px] text-white/85 hover:bg-white/5 disabled:opacity-60"
                                >
                                  {roleLoading(`manager:${t.slug}`) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : null}
                                  Open as manager
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void enterPersonaForBusiness("receptionist", t.slug)}
                                  disabled={!!busy}
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-[11px] text-white/85 hover:bg-white/5 disabled:opacity-60"
                                >
                                  {roleLoading(`receptionist:${t.slug}`) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : null}
                                  Open as reception
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void enterPersonaForBusiness("staff-senior", t.slug)}
                                  disabled={!!busy}
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-[11px] text-white/85 hover:bg-white/5 disabled:opacity-60"
                                >
                                  {roleLoading(`staff-senior:${t.slug}`) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : null}
                                  Open as staff (senior)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void enterPersonaForBusiness("staff-junior", t.slug)}
                                  disabled={!!busy}
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-[11px] text-white/85 hover:bg-white/5 disabled:opacity-60"
                                >
                                  {roleLoading(`staff-junior:${t.slug}`) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : null}
                                  Open as staff (junior)
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => void (ownerPersona ? enterPersona(ownerPersona) : enterBusiness(t.slug))}
                                disabled={!!busy}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#06b6d4] text-black px-3 py-1.5 text-xs font-semibold hover:bg-[#22d3ee] disabled:opacity-60"
                              >
                                {loading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    {ownerPersona ? "Open chain owner" : "Open as owner"}
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
        </section>

        <details className="mb-10 group">
          <summary className="cursor-pointer text-sm font-mono uppercase tracking-wider text-white/50 mb-4 list-none flex items-center gap-2">
            Staff & role rehearsals (optional)
            <span className="text-white/30 normal-case font-sans text-xs">— manager, front desk, chain org admin</span>
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
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => void enterPersona(p.id as DemoPersonaId)}
                disabled={!!busy}
                className={`group relative h-full rounded-2xl border ${a.border} bg-gradient-to-br ${a.gradFrom} ${a.gradTo} p-6 text-left transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden disabled:opacity-70`}
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
                </div>
              </button>
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

        <footer className="mt-16 pt-8 border-t border-white/5 text-[11px] font-mono text-white/40 max-w-3xl space-y-2">
          <p>
            Playbook:{" "}
            <Link href="/guides" className="text-[#22d3ee] underline">
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
      </div>
    </div>
  );
}
