import { ArrowRight } from "lucide-react";
import { GatewayBackLink } from "@/components/gateway/gateway-back-link";
import type { BusinessVertical, WedgeDemoBeat } from "@workspace/policy";
import { g1TaglineForWorld, g1TitleForWorld, type G1WedgeWorld } from "@/lib/g1-wedge-worlds";
import {
  filterWedgeChapters,
  resolveWedgeBeatVisual,
  resolveWedgeLivIntro,
  resolveWedgeThreadBridge,
} from "@/lib/wedge-beat-visuals";
import { WedgeConsultFirstPreview } from "@/components/gateway/wedge-consult-first-preview";
import { cn } from "@/lib/utils";

type Props = {
  vertical: BusinessVertical;
  world?: G1WedgeWorld | null;
  beats: WedgeDemoBeat[];
  tradeLabel: string;
  disabled?: boolean;
  continueLabel?: string;
  backHref?: string;
  backLabel?: string;
  onContinue: () => void;
};

const CHAPTER_LABEL: Record<string, string> = {
  inbox: "Inbox",
  "quote-gen": "Quote generator",
  catalogue: "Catalogue",
  "milestone-pay": "Accept & pay",
};

/**
 * G2 consult-first — three equal strength cards (event vendors).
 * Inherits DemoFlowShell gold language; enter slide uses public enquire, not My Livia.
 */
export function WedgeConsultFirstThread({
  vertical,
  world,
  beats,
  tradeLabel,
  disabled,
  continueLabel = "Enter live demo",
  backHref = "/demo",
  backLabel = "← Worlds",
  onContinue,
}: Props) {
  const chapters = filterWedgeChapters(beats, vertical);
  const g1Title = g1TitleForWorld(world ?? null) ?? tradeLabel;
  const g1Tagline = g1TaglineForWorld(world ?? null);
  const livIntro = resolveWedgeLivIntro(vertical);

  return (
    <div className="wedge-consult" data-testid="gateway-demo-beats-grid">
      <header className="wedge-consult__header">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <GatewayBackLink
            href={backHref}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#d9b97a]/35 bg-[#d9b97a]/10 px-3.5 text-sm text-[#e6d0a5] transition hover:border-[#d9b97a]/55 hover:bg-[#d9b97a]/15"
            data-testid="gateway-demo-back-worlds"
          >
            {backLabel}
          </GatewayBackLink>
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
          <p className="mt-2 max-w-lg text-base text-muted-foreground sm:text-lg">{g1Tagline}</p>
        ) : null}

        <blockquote className="wedge-consult__liv" data-testid="gateway-sign-in-liv-briefing">
          <span className="wedge-consult__liv-mark" aria-hidden>
            liv
          </span>
          <p>{livIntro}</p>
        </blockquote>
      </header>

      <div className="wedge-consult__grid" data-testid="gateway-demo-card-stage">
        {chapters.map((beat, index) => {
          const bridge = resolveWedgeThreadBridge(vertical, beat);
          const label = CHAPTER_LABEL[beat.cropHint] ?? beat.cropHint;
          const visual = resolveWedgeBeatVisual(vertical, beat);
          return (
            <article
              key={beat.cropHint}
              className="wedge-consult__card"
              data-testid={`gateway-demo-beat-${beat.cropHint}`}
            >
              <div className="wedge-consult__card-top">
                <span className="wedge-consult__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="wedge-consult__eyebrow">{label}</span>
              </div>
              {visual ? (
                <figure
                  className={cn(
                    "wedge-consult__shot-wrap overflow-hidden rounded-xl border border-white/10",
                    visual.aspect === "phone" && "mx-auto max-w-[11rem]",
                  )}
                >
                  <img
                    src={visual.src}
                    alt={visual.alt}
                    className="block h-auto w-full object-cover"
                    style={visual.objectPosition ? { objectPosition: visual.objectPosition } : undefined}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </figure>
              ) : (
                <WedgeConsultFirstPreview beat={beat} />
              )}
              <div className="wedge-consult__copy">
                <h2 className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                  {beat.headline}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {beat.detail}
                </p>
                {bridge ? (
                  <p className="mt-2 text-[11px] italic leading-relaxed text-[#d9b97a]/75">
                    <span className="not-italic font-semibold lowercase text-[#d9b97a]/90">liv · </span>
                    {bridge}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <footer className="wedge-consult__footer">
        <button
          type="button"
          disabled={disabled}
          onClick={onContinue}
          className="wedge-consult__cta"
          data-testid="gateway-demo-continue"
        >
          {continueLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </footer>
    </div>
  );
}
