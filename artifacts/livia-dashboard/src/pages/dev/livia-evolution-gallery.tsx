import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EVOLUTION_SCREENS,
  EVOLUTION_TIERS,
  evolutionImagePath,
  type EvolutionTier,
} from "@/lib/livia-evolution-screens";

/**
 * Dev-only — http://localhost:5173/experience/livia-evolution
 * Compare northstar · now (R1) · v3 (R3) actual Livia screens.
 */
export default function LiviaEvolutionGalleryPage() {
  const [tier, setTier] = useState<EvolutionTier>("northstar");
  const [screenId, setScreenId] = useState(EVOLUTION_SCREENS[0]!.id);
  const [compareTier, setCompareTier] = useState<EvolutionTier | null>("now");

  const selected = useMemo(
    () => EVOLUTION_SCREENS.find((s) => s.id === screenId) ?? EVOLUTION_SCREENS[0]!,
    [screenId],
  );
  const tierMeta = EVOLUTION_TIERS.find((t) => t.id === tier)!;

  if (!import.meta.env.DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-muted-foreground">
        Evolution gallery is dev-only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/50 px-6 py-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-amber-500 mb-2">
          Livia platform evolution · dev only
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Actual Livia screens</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground leading-relaxed">
          Locked concepts applied across <strong>north star</strong>, <strong>now (R1 ~8–12w)</strong>, and{" "}
          <strong>v3 (R3 ~12–18mo)</strong>. Web + mobile where it matters. Assets:{" "}
          <code className="text-xs">docs/design/assets/livia-evolution/</code>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/experience/platform-surfaces">Surface catalog (locks)</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/experience/brand-logos">Logo concepts</Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6 p-6">
        <aside className="space-y-4 lg:sticky lg:top-6 h-fit">
          <div className="rounded-xl border border-border bg-card p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
              Release tier
            </p>
            {EVOLUTION_TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  tier === t.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted/50 hover:bg-muted",
                )}
                onClick={() => setTier(t.id)}
              >
                <span className="block">{t.label}</span>
                <span className="text-[9px] uppercase opacity-75">{t.horizon}</span>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-3 space-y-1 max-h-[50vh] overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
              Screens
            </p>
            {EVOLUTION_SCREENS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  screenId === s.id
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/60",
                )}
                onClick={() => setScreenId(s.id)}
              >
                <span className="block truncate">{s.name}</span>
                <span className="text-[9px] uppercase text-muted-foreground">{s.platform}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{selected.name}</h2>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                {tierMeta.label}
              </span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {selected.platform}
              </span>
              {selected.lockedRef ? (
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  {selected.lockedRef}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{selected.tagline}</p>
            <p className="text-xs text-muted-foreground mt-2">{tierMeta.description}</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Compare with:</span>
            {EVOLUTION_TIERS.filter((t) => t.id !== tier).map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={compareTier === t.id ? "default" : "outline"}
                onClick={() => setCompareTier(compareTier === t.id ? null : t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          <div className={cn("grid gap-4", compareTier ? "md:grid-cols-2" : "grid-cols-1")}>
            <ScreenPanel tier={tier} screen={selected} label={tierMeta.label} />
            {compareTier ? (
              <ScreenPanel
                tier={compareTier}
                screen={selected}
                label={EVOLUTION_TIERS.find((t) => t.id === compareTier)!.label}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenPanel({
  tier,
  screen,
  label,
}: {
  tier: EvolutionTier;
  screen: (typeof EVOLUTION_SCREENS)[number];
  label: string;
}) {
  const src = evolutionImagePath(tier, screen.imageFile);
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-2">
      <p className="text-xs font-medium px-2 py-1 text-muted-foreground">{label}</p>
      <img
        src={src}
        alt={`${screen.name} — ${label}`}
        className={cn(
          "w-full h-auto rounded-lg border border-border",
          screen.platform === "mobile" && "max-w-sm mx-auto",
        )}
        onError={(e) => {
          const el = e.target as HTMLImageElement;
          el.alt = "Generating…";
          el.classList.add("opacity-40");
        }}
      />
      <p className="text-[10px] text-muted-foreground px-2 py-1">
        <code>{tier}/{screen.imageFile}</code>
      </p>
    </div>
  );
}
