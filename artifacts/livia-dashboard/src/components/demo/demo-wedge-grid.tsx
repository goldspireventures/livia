import { Link } from "wouter";
import { getWedgeDemoStory, listWedgeDemoVerticalsForDisplay, VERTICAL_COVERAGE_REGISTRY } from "@workspace/policy";
import { cn } from "@/lib/utils";

function tierBadge(vertical: string): string | null {
  const row = VERTICAL_COVERAGE_REGISTRY.find((e) => e.codeVertical === vertical);
  if (!row) return null;
  if (row.tier === "partner-only") return "Partner preview";
  if (row.tier === "beta-preview") return "Beta preview";
  return null;
}

/** G1-A — vertical-fair wedge grid (non-hair first). */
export function DemoWedgeGrid({ className }: { className?: string }) {
  const verticals = listWedgeDemoVerticalsForDisplay();

  return (
    <section
      className={cn("mb-10", className)}
      data-testid="demo-wedge-grid"
      aria-labelledby="demo-wedge-grid-title"
    >
      <h2
        id="demo-wedge-grid-title"
        className="text-xs font-mono uppercase tracking-widest text-white/40 mb-1"
      >
        1 · Pick your trade
      </h2>
      <p className="text-sm text-white/55 mb-4 max-w-xl">
        People-business OS for every appointment trade — short story, then enter the live demo.
        Start with body art, medspa, or wellness — not salon-only.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {verticals.map((v, i) => {
          const story = getWedgeDemoStory(v);
          if (!story) return null;
          const badge = tierBadge(v);
          const featured = i < 3;
          return (
            <Link
              key={v}
              href={`/demo/wedge/${v}`}
              data-testid={`demo-wedge-card-${v}`}
              className={cn(
                "group rounded-2xl border p-4 backdrop-blur-sm transition demo-wedge-card",
                featured
                  ? "border-[#06b6d4]/35 bg-white/[0.06] hover:border-[#22d3ee]/55"
                  : "border-white/10 bg-white/[0.04] hover:border-white/25",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white group-hover:text-[#22d3ee] leading-snug">
                  {story.label}
                </p>
                {badge ? (
                  <span className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-amber-200/90">
                    {badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-white/45 line-clamp-2">{story.beats[0]?.headline}</p>
              <p className="mt-3 text-[10px] font-mono text-[#22d3ee]/70 group-hover:text-[#22d3ee]">
                Story → enter demo →
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
