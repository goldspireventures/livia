import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Lock } from "lucide-react";
import {
  getWedgeDemoStory,
  isMarketingDemoWedgeUnlocked,
  listWedgeDemoVerticalsForDisplay,
  type BusinessVertical,
} from "@workspace/policy";
import { cn } from "@/lib/utils";
import type { DemoBusinessTenant } from "@/lib/demo-portal";

const VERTICAL_LABELS: Record<string, string> = {
  hair: "Hair & barbering",
  beauty: "Beauty & nails",
  wellness: "Wellness & spa",
  "body-art": "Body art",
  "pet-grooming": "Pet grooming",
  medspa: "Medspa",
  "allied-health": "Allied health",
  fitness: "Fitness",
  "automotive-detailing": "Automotive detailing",
  general: "Multi-market",
};

function verticalGroupKey(vertical: string | null | undefined): string {
  const v = (vertical ?? "general").toLowerCase();
  return VERTICAL_LABELS[v] ? v : "general";
}

type Phase = "vertical" | "business" | "role";

type Props = {
  provisioned: boolean;
  devPassword?: string;
  tenants: DemoBusinessTenant[];
  busy: string | null;
  onProvision: () => void;
  onEnterAs: (email: string, busyKey: string) => void;
};

export function DemoGuidedExperience({
  provisioned,
  devPassword,
  tenants,
  busy,
  onProvision,
  onEnterAs,
}: Props) {
  const verticals = listWedgeDemoVerticalsForDisplay();
  const [vertical, setVertical] = useState<BusinessVertical | null>(null);
  const [tenant, setTenant] = useState<DemoBusinessTenant | null>(null);
  const [phase, setPhase] = useState<Phase>("vertical");

  const story = vertical ? getWedgeDemoStory(vertical) : null;

  const businessesForVertical = useMemo(() => {
    if (!vertical) return [];
    return tenants
      .filter((t) => verticalGroupKey(t.vertical) === vertical)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants, vertical]);

  const slideIndex = phase === "vertical" ? 0 : phase === "business" ? 1 : 2;
  const slideCount = 3;

  const reset = useCallback(() => {
    setVertical(null);
    setTenant(null);
    setPhase("vertical");
  }, []);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("vertical");
    if (!v) return;
    const s = getWedgeDemoStory(v as BusinessVertical);
    if (s) {
      setVertical(s.vertical);
      setTenant(null);
      setPhase("business");
    }
  }, []);

  function pickVertical(v: BusinessVertical) {
    setVertical(v);
    setTenant(null);
    setPhase("business");
  }

  function pickBusiness(t: DemoBusinessTenant) {
    setTenant(t);
    setPhase("role");
  }

  function back() {
    if (phase === "role") {
      setPhase("business");
      setTenant(null);
      return;
    }
    if (phase === "business") {
      reset();
    }
  }

  const roster = tenant?.roster ?? [];

  return (
    <section
      className="mb-8 rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-sm overflow-hidden"
      data-testid="demo-guided-experience"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#22d3ee]/80">
            Demo Livia
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            {phase === "vertical"
              ? "1 · Pick your trade"
              : phase === "business"
                ? `2 · Pick a business${story ? ` · ${story.label}` : ""}`
                : tenant
                  ? `3 · Sign in · ${tenant.name}`
                  : "3 · Sign in"}
          </p>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: slideCount }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === slideIndex ? "w-6 bg-[#22d3ee]" : "w-1.5 bg-white/20",
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden min-h-[min(380px,52vh)]">
        <div
          className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${slideIndex * 100}%)` }}
        >
          {/* 1 — Vertical */}
          <div className="w-full shrink-0 px-4 py-5 min-h-[min(380px,52vh)] flex flex-col">
            <h2
              className="text-lg font-medium text-white mb-1"
              style={{ fontFamily: "var(--app-font-serif)" }}
            >
              What trade are you demoing?
            </h2>
            <p className="text-sm text-white/55 mb-4 max-w-lg">
              Choose an industry — then a seeded studio — then the role you want to test as.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 content-start">
              {verticals.map((v) => {
                const s = getWedgeDemoStory(v);
                if (!s) return null;
                const count = tenants.filter((t) => verticalGroupKey(t.vertical) === v).length;
                const isUnlocked = isMarketingDemoWedgeUnlocked(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      if (!isUnlocked) return;
                      pickVertical(v);
                    }}
                    disabled={!isUnlocked || (!provisioned && count === 0)}
                    data-testid={`demo-guided-trade-${v}`}
                    className={cn(
                      "rounded-xl border bg-white/[0.03] p-3 text-left transition",
                      isUnlocked
                        ? "border-white/12 hover:border-[#22d3ee]/45 cursor-pointer"
                        : "border-white/10 opacity-55 cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white leading-snug">{s.label}</p>
                      {!isUnlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/70">
                          <Lock className="h-3 w-3" />
                          Coming soon
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[10px] font-mono text-white/40">
                      {!isUnlocked
                        ? "Locked until this vertical ships"
                        : provisioned
                          ? `${count} demo ${count === 1 ? "shop" : "shops"}`
                          : "Set up demo first"}
                    </p>
                  </button>
                );
              })}
            </div>
            {!provisioned ? (
              <button
                type="button"
                onClick={onProvision}
                disabled={!!busy}
                aria-label="Set up demo world"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400/90 text-black px-4 py-2 text-sm font-semibold hover:bg-amber-300 disabled:opacity-60 w-fit"
                data-testid="demo-guided-provision"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
                Set up demo world
              </button>
            ) : null}
          </div>

          {/* 2 — Business */}
          <div className="w-full shrink-0 px-4 py-5 min-h-[min(380px,52vh)] flex flex-col">
            <h2
              className="text-lg font-medium text-white mb-1"
              style={{ fontFamily: "var(--app-font-serif)" }}
            >
              Which business?
            </h2>
            <p className="text-sm text-white/55 mb-4">
              {story?.label ?? "Studio"} — pick the seeded location you want to walk through.
            </p>
            {!provisioned ? (
              <p className="text-sm text-amber-200/80">Run setup above first.</p>
            ) : businessesForVertical.length === 0 ? (
              <p className="text-sm text-white/50">No demo shops for this trade yet — try quick sync.</p>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[min(280px,40vh)] pr-1">
                {businessesForVertical.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => pickBusiness(t)}
                    data-testid={`demo-guided-business-${t.slug}`}
                    className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-left hover:border-[#06b6d4]/45 transition"
                  >
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-[10px] font-mono text-white/40 mt-0.5">{t.slug}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4">
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>
          </div>

          {/* 3 — Role */}
          <div className="w-full shrink-0 px-4 py-5 min-h-[min(380px,52vh)] flex flex-col">
            {tenant ? (
              <>
                <h2
                  className="text-lg font-medium text-white mb-1"
                  style={{ fontFamily: "var(--app-font-serif)" }}
                >
                  Enter as…
                </h2>
                <p className="text-sm text-white/55 mb-4">
                  {tenant.name}
                  {devPassword ? (
                    <>
                      {" "}
                      · password <code className="text-white/75">{devPassword}</code>
                    </>
                  ) : null}
                </p>
                {roster.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 flex-1 content-start">
                    {roster.map((entry) => {
                      const loading = busy === `guided:${tenant.slug}:${entry.email}`;
                      const roleLabel = entry.label.split(" · ").pop() ?? entry.label;
                      return (
                        <button
                          key={entry.email}
                          type="button"
                          disabled={!!busy || !provisioned}
                          onClick={() => onEnterAs(entry.email, `guided:${tenant.slug}:${entry.email}`)}
                          className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-left hover:border-[#06b6d4]/50 hover:bg-white/[0.06] disabled:opacity-60"
                          data-testid={`demo-guided-role-${entry.role}`}
                        >
                          <span className="text-sm font-medium text-white">
                            {loading ? "Signing in…" : roleLabel}
                          </span>
                          <span className="mt-1 block text-[9px] font-mono text-white/35 truncate">
                            {entry.email}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-amber-200/80">
                    No roster for this shop — run <strong>Sync logins</strong> in Advanced below.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-3 items-center">
                  <button
                    type="button"
                    onClick={back}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <Link href="/sign-in?beta=1" className="text-xs text-[#22d3ee] underline underline-offset-2">
                    Sign in with your own account
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
