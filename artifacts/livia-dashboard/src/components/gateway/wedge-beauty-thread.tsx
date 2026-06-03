import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { WedgeDemoBeat } from "@workspace/policy";
import { g1TaglineForVertical, g1TitleForVertical } from "@/lib/g1-wedge-worlds";
import {
  filterBeautyWedgeChapters,
  resolveWedgeBeatVisual,
  resolveWedgeLivIntro,
  resolveWedgeThreadBridge,
} from "@/lib/wedge-beat-visuals";
import { WEDGE_BEAT_CROP_META } from "@/components/gateway/gateway-demo-card-stage";
import { cn } from "@/lib/utils";

type Props = {
  beats: WedgeDemoBeat[];
  tradeLabel: string;
  disabled?: boolean;
  backHref?: string;
  backLabel?: string;
  onContinue: () => void;
};

const CHAPTER_LABEL: Record<string, string> = {
  inbox: "Inbox",
  "public-book": "/b",
  today: "Today",
};

function ThreadChapter({
  beat,
  index,
  isLast,
}: {
  beat: WedgeDemoBeat;
  index: number;
  isLast: boolean;
}) {
  const meta = WEDGE_BEAT_CROP_META[beat.cropHint] ?? WEDGE_BEAT_CROP_META.inbox;
  const visual = resolveWedgeBeatVisual("beauty", beat);
  const bridge = resolveWedgeThreadBridge("beauty", beat);
  const label = CHAPTER_LABEL[beat.cropHint] ?? meta.label;

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
            )}
          >
            <img
              src={visual.src}
              alt={visual.alt}
              className="wedge-thread__shot"
              style={visual.objectPosition ? { objectPosition: visual.objectPosition } : undefined}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
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
 * G2 beauty — vertical thread story (Inbox → /b → Today) with real product screenshots.
 * No card boxes; inherits DemoFlowShell nebula only.
 */
export function WedgeBeautyThread({
  beats,
  tradeLabel,
  disabled,
  backHref = "/demo",
  backLabel = "← Worlds",
  onContinue,
}: Props) {
  const chapters = filterBeautyWedgeChapters(beats);
  const g1Title = g1TitleForVertical("beauty");
  const g1Tagline = g1TaglineForVertical("beauty");
  const livIntro = resolveWedgeLivIntro("beauty");

  return (
    <div className="wedge-thread" data-testid="gateway-demo-beats-grid">
      <header className="wedge-thread__intro">
        <div className="wedge-thread__nav">
          <Link href={backHref} className="wedge-thread__back" data-testid="gateway-demo-back-worlds">
            {backLabel}
          </Link>
        </div>

        <p className="wedge-thread__world">
          {tradeLabel}
        </p>
        <h1 className="wedge-thread__title">{g1Title ?? tradeLabel}</h1>
        {g1Tagline ? <p className="wedge-thread__tagline">{g1Tagline}</p> : null}

        <p className="wedge-thread__arc">From DM to chair</p>

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
          Walk into the live demo
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </footer>
    </div>
  );
}
