import { useId, type ReactNode } from "react";
import { LiviaMark, LiviaWordmark } from "@/components/brand/LiviaMark";
import type { LogoConcept } from "@/lib/brand-logo-concepts";

export type LogoConceptId = LogoConcept["id"];

const CREAM = "#f6f3ec";
const CHAMPAGNE = "#d9c39a";
const CYAN = "#06b6d4";
const VIOLET = "#8b5cf6";
const INK = "#0e0e16";

const champagneStops = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stopColor="#f6f3ec" />
    <stop offset="45%" stopColor="#d9c39a" />
    <stop offset="60%" stopColor="#8a7549" />
    <stop offset="78%" stopColor="#d9c39a" />
    <stop offset="100%" stopColor="#f6f3ec" />
  </linearGradient>
);

export function CurrentAurumLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return <LiviaWordmark size={size} />;
}

/** Concept 1 — single thread stroke forming L with champagne knot */
export function ThreadLMark({ className = "h-10 w-10" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `thread-${uid}`;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor={CYAN} />
          <stop offset="100%" stopColor={VIOLET} />
        </linearGradient>
      </defs>
      <path
        d="M10 8 V32 H28"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 32 C34 28 34 14 22 10"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="22" cy="10" r="3.5" fill={CHAMPAGNE} />
    </svg>
  );
}

/** @deprecated superseded by icon variant picker — kept for reference */
export function ThreadLAppIcon({ className = "h-12 w-12" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `thread-icon-${uid}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="8" y1="8" x2="40" y2="40">
          <stop offset="0%" stopColor={CYAN} />
          <stop offset="100%" stopColor={VIOLET} />
        </linearGradient>
      </defs>
      <path
        d="M13 11 C13 9.9 13.9 9 15 9 H17 C18.1 9 19 9.9 19 11 V31 H33 C34.1 31 35 31.9 35 33 V35 C35 36.1 34.1 37 33 37 H15 C13.9 37 13 36.1 13 35 V11 Z"
        fill={CREAM}
      />
      <path
        d="M22 8 C34 8 39 18 35 27"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="22" cy="8" r="3.5" fill={CHAMPAGNE} />
    </svg>
  );
}

/** Spool wrap — thread ellipses around L corner */
export function ThreadSpoolWrapIcon({ className = "h-12 w-12" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `spool-${uid}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="10" y1="10" x2="38" y2="38">
          <stop offset="0%" stopColor={CYAN} />
          <stop offset="100%" stopColor={VIOLET} />
        </linearGradient>
      </defs>
      <path
        d="M14 10 H18 V32 H32 V36 H14 V10 Z"
        fill={CREAM}
        strokeLinejoin="round"
      />
      <ellipse
        cx="26"
        cy="14"
        rx="10"
        ry="6"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="3"
        transform="rotate(-20 26 14)"
      />
      <circle cx="34" cy="10" r="3" fill={CHAMPAGNE} />
    </svg>
  );
}

/** Needle loop — stem through thread eye */
export function ThreadNeedleLoopIcon({ className = "h-12 w-12" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `needle-${uid}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="12" y1="8" x2="36" y2="40">
          <stop offset="0%" stopColor={CYAN} />
          <stop offset="100%" stopColor={VIOLET} />
        </linearGradient>
      </defs>
      <ellipse
        cx="24"
        cy="14"
        rx="11"
        ry="7"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="3.5"
      />
      <rect x="20" y="10" width="8" height="30" rx="2" fill={CREAM} />
      <rect x="14" y="32" width="20" height="6" rx="2" fill={CREAM} />
      <circle cx="24" cy="14" r="2.5" fill={CHAMPAGNE} />
    </svg>
  );
}

/** Corner curl — single-stroke L with inner curl */
export function ThreadCornerCurlIcon({ className = "h-12 w-12" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `curl-${uid}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="8" y1="8" x2="40" y2="40">
          <stop offset="0%" stopColor={CYAN} />
          <stop offset="100%" stopColor={VIOLET} />
        </linearGradient>
      </defs>
      <path
        d="M14 10 V34 H34 M34 34 C38 28 36 16 26 12 C20 9 14 12 14 10"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="12" r="3" fill={CHAMPAGNE} />
    </svg>
  );
}

export function ThreadLWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const mark = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <span className="inline-flex items-center gap-2.5">
      <ThreadLMark className={mark} />
      <span className={`font-serif ${text} font-normal tracking-tight leading-none text-foreground`}>
        Li<span className="italic text-[#d9c39a]">v</span>ia
      </span>
    </span>
  );
}

/** Concept 2 — open arc connecting L to italic v */
export function OpenArcMark({ className = "h-10 w-10" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const champ = champagneStops(`arc-${uid}`);
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>{champ}</defs>
      <text
        x="8"
        y="28"
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontSize="22"
        fill={CREAM}
      >
        L
      </text>
      <path
        d="M18 26 Q28 8 34 26"
        fill="none"
        stroke={CYAN}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <text
        x="26"
        y="28"
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontSize="22"
        fontStyle="italic"
        fill={`url(#arc-${uid})`}
      >
        v
      </text>
    </svg>
  );
}

/** @deprecated superseded by icon variant picker */
export function OpenArcAppIcon({ className = "h-12 w-12" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `arc-icon-${uid}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="14" y1="10" x2="38" y2="38">
          <stop offset="0%" stopColor={CYAN} />
          <stop offset="100%" stopColor={VIOLET} />
        </linearGradient>
      </defs>
      <path
        d="M12 10 C12 8.9 12.9 8 14 8 H18 C19.1 8 20 8.9 20 10 V30 H30 C31.1 30 32 30.9 32 32 V36 C32 37.1 31.1 38 30 38 H14 C12.9 38 12 37.1 12 36 V10 Z"
        fill={CREAM}
      />
      <path
        d="M20 16 C30 8 40 12 40 32"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="40" cy="32" r="4" fill={CHAMPAGNE} />
    </svg>
  );
}

/** Horizon rise — L bar + open arc above */
export function ArcHorizonRiseIcon({ className = "h-12 w-12" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `horizon-${uid}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="8" y1="20" x2="40" y2="20">
          <stop offset="0%" stopColor={CYAN} />
          <stop offset="100%" stopColor={VIOLET} />
        </linearGradient>
      </defs>
      <path d="M14 22 V38 H30 V34 H18 V22 H14 Z" fill={CREAM} />
      <path
        d="M10 18 C18 10 30 10 38 18"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="38" cy="18" r="3" fill={CHAMPAGNE} />
    </svg>
  );
}

/** Swoosh tail — L block + outward motion arc */
export function ArcSwooshTailIcon({ className = "h-12 w-12" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `swoosh-${uid}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="16" y1="32" x2="42" y2="8">
          <stop offset="0%" stopColor={CYAN} />
          <stop offset="100%" stopColor={VIOLET} />
        </linearGradient>
      </defs>
      <path d="M12 12 H16 V34 H28 V38 H12 V12 Z" fill={CREAM} />
      <path
        d="M18 30 C26 28 34 18 42 8"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="42" cy="8" r="3.5" fill={CHAMPAGNE} />
    </svg>
  );
}

/** Touchpoint — dot on stem + arc approaching */
export function ArcTouchpointIcon({ className = "h-12 w-12" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = `touch-${uid}`;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={grad} x1="30" y1="34" x2="14" y2="18">
          <stop offset="0%" stopColor={VIOLET} />
          <stop offset="100%" stopColor={CYAN} />
        </linearGradient>
      </defs>
      <path d="M14 10 H18 V38 H28 V34 H18 V10 H14 Z" fill={CREAM} />
      <circle cx="18" cy="20" r="4" fill={CYAN} opacity="0.9" />
      <path
        d="M36 36 C28 32 22 26 18 20"
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="36" cy="36" r="3" fill={CHAMPAGNE} />
    </svg>
  );
}

export function OpenArcWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const mark = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <span className="inline-flex items-center gap-2.5">
      <OpenArcMark className={mark} />
      <span className={`font-serif ${text} font-normal tracking-tight leading-none`}>
        Li<span className="italic bg-gradient-to-b from-[#f6f3ec] via-[#d9c39a] to-[#8a7549] bg-clip-text text-transparent">v</span>ia
      </span>
    </span>
  );
}

/** Concept 3 — aurora dot + wordmark only */
export function SignalDotMark({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-full ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${CYAN}, ${VIOLET})`,
        boxShadow: `0 0 12px ${CYAN}88`,
      }}
      aria-hidden
    />
  );
}

export function SignalDotWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dot = size === "lg" ? "h-3.5 w-3.5" : size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <span className="inline-flex items-center gap-2.5">
      <SignalDotMark className={dot} />
      <span className={`font-serif ${text} font-normal tracking-tight leading-none`}>
        Li<span className="italic text-[#d9c39a]">v</span>ia
      </span>
    </span>
  );
}

/** Concept 4 — typographic L–v ligature lockup */
export function LvLigatureWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const uid = useId().replace(/:/g, "");
  const scale = size === "lg" ? 1.35 : size === "sm" ? 0.75 : 1;
  return (
    <svg
      viewBox="0 0 120 40"
      className="text-foreground"
      style={{ height: 28 * scale, width: "auto" }}
      aria-label="Livia"
    >
      <defs>{champagneStops(`lig-${uid}`)}</defs>
      <text
        x="0"
        y="30"
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontSize="32"
        fill={CREAM}
        letterSpacing="-0.02em"
      >
        Li
      </text>
      <text
        x="38"
        y="30"
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontSize="32"
        fontStyle="italic"
        fill={`url(#lig-${uid})`}
        letterSpacing="-0.06em"
      >
        v
      </text>
      <path d="M42 8 V32" stroke={CHAMPAGNE} strokeWidth="1" opacity="0.4" />
      <text
        x="52"
        y="30"
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontSize="32"
        fill={CREAM}
      >
        ia
      </text>
    </svg>
  );
}

export function LvLigatureMark({ className = "h-10 w-10" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>{champagneStops(`ligm-${uid}`)}</defs>
      <text x="6" y="28" fontFamily="Cormorant Garamond, serif" fontSize="24" fill={CREAM}>
        L
      </text>
      <text
        x="20"
        y="28"
        fontFamily="Cormorant Garamond, serif"
        fontSize="24"
        fontStyle="italic"
        fill={`url(#ligm-${uid})`}
      >
        v
      </text>
      <path d="M22 10 V30" stroke={CHAMPAGNE} strokeWidth="0.75" opacity="0.5" />
    </svg>
  );
}

/** Concept 5 — Livia + Liv whisper */
export function StewardWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl";
  const whisper = size === "lg" ? "text-sm" : size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <span className="inline-flex flex-col items-start leading-none">
      <span className={`font-serif ${text} font-medium tracking-tight`}>
        Livia
      </span>
      <span className={`font-serif ${whisper} italic text-[#d9c39a] -mt-0.5 ml-1 tracking-wide`}>
        Liv
      </span>
    </span>
  );
}

export function StewardMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x="4" y="4" width="32" height="32" rx="8" fill={INK} stroke={CHAMPAGNE} strokeOpacity="0.35" />
      <text x="8" y="26" fontFamily="Cormorant Garamond, serif" fontSize="16" fill={CREAM} fontWeight="500">
        Li
      </text>
      <text x="22" y="34" fontFamily="Cormorant Garamond, serif" fontSize="11" fill={CHAMPAGNE} fontStyle="italic">
        v
      </text>
    </svg>
  );
}

export function LogoConceptPreview({
  conceptId,
  size = "md",
}: {
  conceptId: LogoConceptId;
  size?: "sm" | "md" | "lg";
}) {
  switch (conceptId) {
    case "current-aurum":
      return <CurrentAurumLogo size={size} />;
    case "thread-l":
      return <ThreadLWordmark size={size} />;
    case "open-arc":
      return <OpenArcWordmark size={size} />;
    case "signal-dot":
      return <SignalDotWordmark size={size} />;
    case "lv-ligature":
      return <LvLigatureWordmark size={size} />;
    case "steward":
      return <StewardWordmark size={size} />;
    default:
      return <CurrentAurumLogo size={size} />;
  }
}

export function LogoConceptMarkOnly({
  conceptId,
  className = "h-10 w-10",
  variant = "nav",
  iconVariantId,
}: {
  conceptId: LogoConceptId;
  className?: string;
  /** Nav lockup uses fine marks; app icon / favicon use bold icon geometry */
  variant?: "nav" | "icon";
  /** Required for thread-l / open-arc app icons — see brand-logo-icon-variants.ts */
  iconVariantId?: string;
}) {
  if (variant === "icon") {
    if (iconVariantId) {
      switch (iconVariantId) {
        case "thread-spool-wrap":
          return <ThreadSpoolWrapIcon className={className} />;
        case "thread-needle-loop":
          return <ThreadNeedleLoopIcon className={className} />;
        case "thread-corner-curl":
          return <ThreadCornerCurlIcon className={className} />;
        case "arc-horizon-rise":
          return <ArcHorizonRiseIcon className={className} />;
        case "arc-swoosh-tail":
          return <ArcSwooshTailIcon className={className} />;
        case "arc-touchpoint":
          return <ArcTouchpointIcon className={className} />;
        default:
          break;
      }
    }
    switch (conceptId) {
      case "thread-l":
        return <ThreadSpoolWrapIcon className={className} />;
      case "open-arc":
        return <ArcHorizonRiseIcon className={className} />;
      default:
        break;
    }
  }
  switch (conceptId) {
    case "current-aurum":
      return <LiviaMark className={className} />;
    case "thread-l":
      return <ThreadLMark className={className} />;
    case "open-arc":
      return <OpenArcMark className={className} />;
    case "signal-dot":
      return <SignalDotMark className={className} />;
    case "lv-ligature":
      return <LvLigatureMark className={className} />;
    case "steward":
      return <StewardMark className={className} />;
    default:
      return <LiviaMark className={className} />;
  }
}
