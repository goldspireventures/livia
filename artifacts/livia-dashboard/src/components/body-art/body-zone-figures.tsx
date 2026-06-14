import { useId } from "react";
import type { SkinPreviewBodyZone, SkinPreviewTone } from "@workspace/policy";
import { SKIN_PREVIEW_TONE_HEX } from "@workspace/policy";

/** Tattoo overlay box — percentages of stage container. */
export type ZoneTattooPlacement = {
  top: string;
  left: string;
  width: string;
  height: string;
  rotate: number;
};

export const ZONE_STAGE_ASPECT: Record<SkinPreviewBodyZone, string> = {
  forearm: "aspect-[5/14]",
  upper_arm: "aspect-[4/11]",
  back: "aspect-[5/12]",
  chest: "aspect-[5/12]",
};

export const ZONE_TATTOO_PLACEMENT: Record<SkinPreviewBodyZone, ZoneTattooPlacement> = {
  forearm: { top: "30%", left: "16%", width: "56%", height: "40%", rotate: -5 },
  upper_arm: { top: "26%", left: "20%", width: "52%", height: "44%", rotate: 3 },
  back: { top: "20%", left: "18%", width: "64%", height: "50%", rotate: 0 },
  chest: { top: "28%", left: "20%", width: "58%", height: "42%", rotate: 0 },
};

type FigureProps = { tone: SkinPreviewTone; className?: string };

function skinFill(tone: SkinPreviewTone) {
  return SKIN_PREVIEW_TONE_HEX[tone];
}

function skinShadow(tone: SkinPreviewTone) {
  const base = SKIN_PREVIEW_TONE_HEX[tone];
  return `color-mix(in srgb, ${base} 72%, #1a1008)`;
}

/** Full-length forearm — elbow toward top, wrist toward bottom. */
export function ForearmFigure({ tone, className }: FigureProps) {
  const uid = useId().replace(/:/g, "");
  const fill = skinFill(tone);
  const shadow = skinShadow(tone);
  return (
    <svg viewBox="0 0 100 280" className={className} aria-hidden>
      <defs>
        <linearGradient id={`forearm-shade-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={shadow} />
          <stop offset="45%" stopColor={fill} />
          <stop offset="100%" stopColor={shadow} />
        </linearGradient>
      </defs>
      <rect width="100" height="280" fill="hsl(var(--muted) / 0.15)" rx="8" />
      <ellipse cx="50" cy="42" rx="24" ry="15" fill={`url(#forearm-shade-${uid})`} />
      <path
        d="M32 48 C28 92 26 142 30 192 C32 222 36 250 40 264 C44 274 52 278 60 270 C66 252 70 212 72 162 C74 112 70 60 60 46 Z"
        fill={`url(#forearm-shade-${uid})`}
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="0.9"
      />
      <path
        d="M42 262 C46 272 54 276 58 268 L56 278 C52 282 44 280 40 272 Z"
        fill={shadow}
      />
      <ellipse cx="50" cy="268" rx="10" ry="6" fill={fill} opacity="0.9" />
    </svg>
  );
}

/** Upper arm + shoulder — full limb segment. */
export function UpperArmFigure({ tone, className }: FigureProps) {
  const uid = useId().replace(/:/g, "");
  const fill = skinFill(tone);
  const shadow = skinShadow(tone);
  return (
    <svg viewBox="0 0 140 320" className={className} aria-hidden>
      <defs>
        <linearGradient id={`upper-shade-${uid}`} x1="0%" y1="0%" x2="100%" y2="20%">
          <stop offset="0%" stopColor={shadow} />
          <stop offset="50%" stopColor={fill} />
          <stop offset="100%" stopColor={shadow} />
        </linearGradient>
      </defs>
      <rect width="140" height="320" fill="hsl(var(--muted) / 0.15)" rx="8" />
      {/* Shoulder / deltoid */}
      <path
        d="M20 28 C45 12 95 14 118 32 C128 42 132 58 124 72 C108 68 88 62 70 58 C48 54 32 48 20 38 Z"
        fill={`url(#upper-shade-${uid})`}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="0.8"
      />
      {/* Upper arm */}
      <path
        d="M48 72 C42 110 40 155 44 200 C48 240 54 275 60 295 C66 305 78 302 82 288 C86 260 88 210 86 160 C84 115 78 78 70 68 Z"
        fill={`url(#upper-shade-${uid})`}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="0.8"
      />
      {/* Elbow */}
      <ellipse cx="62" cy="296" rx="16" ry="10" fill={shadow} opacity="0.85" />
    </svg>
  );
}

/** Full back torso — shoulders to waist. */
export function BackFigure({ tone, className }: FigureProps) {
  const uid = useId().replace(/:/g, "");
  const fill = skinFill(tone);
  const shadow = skinShadow(tone);
  return (
    <svg viewBox="0 0 200 360" className={className} aria-hidden>
      <defs>
        <linearGradient id={`back-shade-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor={shadow} />
        </linearGradient>
      </defs>
      <rect width="200" height="360" fill="hsl(var(--muted) / 0.15)" rx="8" />
      {/* Neck */}
      <rect x="88" y="18" width="24" height="28" rx="8" fill={shadow} opacity="0.7" />
      {/* Shoulders */}
      <path
        d="M30 44 C55 32 145 32 170 44 C182 52 188 68 180 82 C160 76 40 76 20 82 C12 68 18 52 30 44 Z"
        fill={`url(#back-shade-${uid})`}
      />
      {/* Torso back */}
      <path
        d="M38 82 C34 140 36 220 44 290 C48 318 56 332 100 336 C144 332 152 318 156 290 C164 220 166 140 162 82 C150 78 50 78 38 82 Z"
        fill={`url(#back-shade-${uid})`}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />
      {/* Spine line subtle */}
      <path d="M100 90 L100 300" stroke="rgba(0,0,0,0.06)" strokeWidth="2" />
      {/* Waist */}
      <path d="M52 300 C70 320 130 320 148 300" stroke="rgba(0,0,0,0.05)" fill="none" />
    </svg>
  );
}

/** Full chest torso — front view. */
export function ChestFigure({ tone, className }: FigureProps) {
  const uid = useId().replace(/:/g, "");
  const fill = skinFill(tone);
  const shadow = skinShadow(tone);
  return (
    <svg viewBox="0 0 200 360" className={className} aria-hidden>
      <defs>
        <linearGradient id={`chest-shade-${uid}`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor={shadow} />
        </linearGradient>
      </defs>
      <rect width="200" height="360" fill="hsl(var(--muted) / 0.15)" rx="8" />
      <rect x="88" y="18" width="24" height="28" rx="8" fill={shadow} opacity="0.7" />
      <path
        d="M30 44 C55 32 145 32 170 44 C182 52 188 68 180 82 C160 76 40 76 20 82 C12 68 18 52 30 44 Z"
        fill={`url(#chest-shade-${uid})`}
      />
      <path
        d="M38 82 C34 140 36 220 44 290 C48 318 56 332 100 336 C144 332 152 318 156 290 C164 220 166 140 162 82 C150 78 50 78 38 82 Z"
        fill={`url(#chest-shade-${uid})`}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />
      {/* Collarbone hint */}
      <path d="M55 88 C100 98 145 88" stroke="rgba(0,0,0,0.07)" fill="none" strokeWidth="1.5" />
    </svg>
  );
}

export function BodyZoneFigure({
  zone,
  tone,
  className,
}: {
  zone: SkinPreviewBodyZone;
  tone: SkinPreviewTone;
  className?: string;
}) {
  switch (zone) {
    case "forearm":
      return <ForearmFigure tone={tone} className={className} />;
    case "upper_arm":
      return <UpperArmFigure tone={tone} className={className} />;
    case "back":
      return <BackFigure tone={tone} className={className} />;
    case "chest":
      return <ChestFigure tone={tone} className={className} />;
  }
}
