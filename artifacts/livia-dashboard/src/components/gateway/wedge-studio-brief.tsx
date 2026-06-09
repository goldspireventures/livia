import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { BusinessVertical, WedgeDemoBeat } from "@workspace/policy";
import { g1TaglineForWorld, g1TitleForWorld, type G1WedgeWorld } from "@/lib/g1-wedge-worlds";
import {
  resolveWedgeBeatVisual,
  resolveWedgeLivIntro,
} from "@/lib/wedge-beat-visuals";
import { WEDGE_BEAT_CROP_META } from "@/components/gateway/gateway-demo-card-stage";
import { WedgeFeaturePreview } from "@/components/gateway/wedge-feature-preview";
import { cn } from "@/lib/utils";

type Props = {
  beats: WedgeDemoBeat[];
  tradeLabel: string;
  vertical: BusinessVertical;
  world?: G1WedgeWorld | null;
  disabled?: boolean;
  continueLabel?: string;
  backHref?: string;
  backLabel?: string;
  onContinue: () => void;
};

function BriefFeatureCell({
  beat,
  vertical,
  layout,
}: {
  beat: WedgeDemoBeat;
  vertical: BusinessVertical;
  layout: "hero" | "tile";
}) {
  const meta = WEDGE_BEAT_CROP_META[beat.cropHint] ?? WEDGE_BEAT_CROP_META.inbox;
  const visual = resolveWedgeBeatVisual(vertical, beat);
  const BeatIcon = meta.icon;

  return (
    <article
      className={cn(
        "wedge-brief-cell group overflow-hidden rounded-2xl border bg-[#0a0c12]/80",
        meta.ring,
        layout === "hero" ? "wedge-brief-cell--hero" : "wedge-brief-cell--tile",
      )}
      data-testid={`gateway-demo-beat-${beat.cropHint}`}
    >
      <div className={cn("wedge-brief-cell__media", layout === "hero" && "wedge-brief-cell__media--hero")}>
        {visual ? (
          <img
            src={visual.src}
            alt={visual.alt}
            className="wedge-brief-cell__img"
            style={visual.objectPosition ? { objectPosition: visual.objectPosition } : undefined}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="p-2 sm:p-3">
            <WedgeFeaturePreview beat={beat} />
          </div>
        )}
        <div className="wedge-brief-cell__badge">
          <BeatIcon className="h-3 w-3" aria-hidden />
          <span>{meta.label}</span>
        </div>
      </div>
      <div className="wedge-brief-cell__copy">
        <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base">{beat.headline}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{beat.detail}</p>
      </div>
    </article>
  );
}

/**
 * G2 studio brief — bento dossier of vertical capabilities (not a beat carousel).
 * Inherits DemoFlowShell ambient + gold frame language from G1 trade cards.
 */
export function WedgeStudioBrief({
  beats,
  tradeLabel,
  vertical,
  world,
  disabled,
  continueLabel = "Enter live demo",
  backHref = "/demo",
  backLabel = "← Worlds",
  onContinue,
}: Props) {
  const g1Title = g1TitleForWorld(world ?? null) ?? tradeLabel;
  const g1Tagline = g1TaglineForWorld(world ?? null);
  const [hero, ...tiles] = beats;
  const livIntro = resolveWedgeLivIntro(vertical);

  return (
    <div className="wedge-brief" data-testid="gateway-demo-beats-grid">
      <header className="wedge-brief__header">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#d9b97a]/35 bg-[#d9b97a]/10 px-3.5 text-sm text-[#e6d0a5] transition hover:border-[#d9b97a]/55 hover:bg-[#d9b97a]/15"
            data-testid="gateway-demo-back-worlds"
          >
            {backLabel}
          </Link>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d9b97a]/85">
            G2 · Studio brief
          </span>
        </div>

        <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.22em] text-[#d9b97a]/70">
          Worlds · {tradeLabel}
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-[#e6d0a5]/95 sm:text-4xl">
          {g1Title ?? tradeLabel}
        </h1>
        {g1Tagline ? (
          <p className="mt-2 max-w-xl text-base text-muted-foreground sm:text-lg">{g1Tagline}</p>
        ) : null}
      </header>

      <div className="wedge-brief__liv" data-testid="gateway-sign-in-liv-briefing">
        <span className="wedge-brief__liv-mark" aria-hidden>
          liv
        </span>
        <p className="text-sm leading-relaxed text-foreground/90">{livIntro}</p>
      </div>

      <article
        className="wedge-brief__frame rounded-3xl border-2 border-[#d9b97a]/45 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-1 shadow-[0_0_60px_-20px_rgba(217,185,122,0.28)]"
        data-testid="gateway-demo-card-stage"
      >
        <div className="rounded-[1.35rem] border border-primary/20 bg-[#070910]/90 p-3 sm:p-4">
          {hero ? <BriefFeatureCell beat={hero} vertical={vertical} layout="hero" /> : null}

          {tiles.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {tiles.map((beat) => (
                <BriefFeatureCell key={beat.cropHint} beat={beat} vertical={vertical} layout="tile" />
              ))}
            </div>
          ) : null}

          <button
            type="button"
            disabled={disabled}
            onClick={onContinue}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            data-testid="gateway-demo-continue"
          >
            {continueLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </article>
    </div>
  );
}
