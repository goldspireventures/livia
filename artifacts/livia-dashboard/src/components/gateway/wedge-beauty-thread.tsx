import { ArrowRight } from "lucide-react";
import { GatewayBackLink } from "@/components/gateway/gateway-back-link";
import type { WedgeDemoBeat } from "@workspace/policy";
import { g1TaglineForWorld, g1TitleForWorld, type G1WedgeWorld } from "@/lib/g1-wedge-worlds";
import type { BusinessVertical } from "@workspace/policy";
import {
  filterWedgeChapters,
  resolveWedgeArc,
  resolveWedgeBeatVisual,
  resolveWedgeChapterLabel,
  resolveWedgeLivIntro,
  resolveWedgeThreadBridge,
} from "@/lib/wedge-beat-visuals";
import { WEDGE_BEAT_CROP_META } from "@/components/gateway/gateway-demo-card-stage";
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

function ThreadChapter({
  vertical,
  beat,
  index,
  isLast,
}: {
  vertical: BusinessVertical;
  beat: WedgeDemoBeat;
  index: number;
  isLast: boolean;
}) {
  const meta = WEDGE_BEAT_CROP_META[beat.cropHint] ?? WEDGE_BEAT_CROP_META.inbox;
  const visual = resolveWedgeBeatVisual(vertical, beat);
  const bridge = resolveWedgeThreadBridge(vertical, beat);
  const label = resolveWedgeChapterLabel(vertical, beat.cropHint) || meta.label;

  return (
    <section
      className={cn("wedge-thread__chapter", index % 2 === 1 && "wedge-thread__chapter--alt")}
      data-testid={`gateway-demo-beat-${beat.cropHint}`}
    >
      <div className="wedge-thread__rail" aria-hidden>
        <span className="wedge-thread__node">{String(index + 1).padStart(2, "0")}</span>
        {!isLast ? <span className="wedge-thread__stem" /> : null}
      </div>

      <div className="wedge-thread__body">
        <p className="wedge-thread__eyebrow">{label}</p>
        <h2 className="wedge-thread__headline">{beat.headline}</h2>
        <p className="wedge-thread__detail">{beat.detail}</p>

        {visual ? (
          <figure
            className={cn(
              "wedge-thread__figure",
              visual.aspect === "phone" && "wedge-thread__figure--phone",
              visual.aspect === "wide" && "wedge-thread__figure--wide",
            )}
          >
            <div className="wedge-thread__figure-inner">
              <img
                src={visual.src}
                alt={visual.alt}
                className="wedge-thread__shot"
                style={visual.objectPosition ? { objectPosition: visual.objectPosition } : undefined}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          </figure>
        ) : null}

        {bridge ? (
          <p className="wedge-thread__bridge">
            <span className="wedge-thread__bridge-mark" aria-hidden>
              liv
            </span>
            {bridge}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/**
 * G2 beauty — vertical thread story (Bookings → /b → Today) with Bloom product screenshots.
 * No card boxes; inherits DemoFlowShell nebula only.
 */
export function WedgeBeautyThread({
  vertical,
  world,
  beats,
  tradeLabel,
  disabled,
  continueLabel = "Walk into the live demo",
  backHref = "/demo",
  backLabel = "← Worlds",
  onContinue,
}: Props) {
  const chapters = filterWedgeChapters(beats, vertical);
  const g1Title = g1TitleForWorld(world ?? null) ?? tradeLabel;
  const g1Tagline = g1TaglineForWorld(world ?? null);
  const livIntro = resolveWedgeLivIntro(vertical);
  const arc = resolveWedgeArc(vertical);

  return (
    <div className="wedge-thread" data-testid="gateway-demo-beats-grid">
      <header className="wedge-thread__intro">
        <div className="wedge-thread__nav">
          <GatewayBackLink href={backHref} className="wedge-thread__back" data-testid="gateway-demo-back-worlds">
            {backLabel}
          </GatewayBackLink>
        </div>

        <p className="wedge-thread__world">
          {tradeLabel}
        </p>
        <h1 className="wedge-thread__title">{g1Title ?? tradeLabel}</h1>
        {g1Tagline ? <p className="wedge-thread__tagline">{g1Tagline}</p> : null}

        <p className="wedge-thread__arc">{arc}</p>

        <blockquote className="wedge-thread__liv" data-testid="gateway-sign-in-liv-briefing">
          <span className="wedge-thread__liv-mark" aria-hidden>
            liv
          </span>
          <p>{livIntro}</p>
        </blockquote>
      </header>

      <div className="wedge-thread__chapters" data-testid="gateway-demo-card-stage">
        {chapters.map((beat, i) => (
          <ThreadChapter
            key={beat.cropHint}
            vertical={vertical}
            beat={beat}
            index={i}
            isLast={i === chapters.length - 1}
          />
        ))}
      </div>

      <footer className="wedge-thread__footer">
        <button
          type="button"
          disabled={disabled}
          onClick={onContinue}
          className="wedge-thread__cta"
          data-testid="gateway-demo-continue"
        >
          {continueLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </footer>
    </div>
  );
}
