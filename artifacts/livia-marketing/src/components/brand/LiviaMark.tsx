import { useId } from "react";

interface LiviaMarkProps {
  className?: string;
  /**
   * @deprecated Aurum mark always uses the champagne treatment for the v.
   * Kept for backwards compatibility with existing call sites.
   */
  gradient?: boolean;
  /** Override the colour of the L glyph and ring. Defaults to currentColor. */
  fill?: string;
}

const champagneStops = (
  <>
    <stop offset="0%" stopColor="#f6f3ec" />
    <stop offset="45%" stopColor="#d9c39a" />
    <stop offset="60%" stopColor="#8a7549" />
    <stop offset="78%" stopColor="#d9c39a" />
    <stop offset="100%" stopColor="#f6f3ec" />
  </>
);

export function LiviaMark({ className = "h-8 w-8", fill }: LiviaMarkProps) {
  const id = useId().replace(/:/g, "");
  const champagne = `livia-${id}-champagne`;
  const glow = `livia-${id}-glow`;
  const stroke = fill ?? "currentColor";
  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Livia"
    >
      <defs>
        <linearGradient
          id={champagne}
          x1="0"
          y1="0"
          x2="0"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          {champagneStops}
        </linearGradient>
        <radialGradient id={glow} cx="0.3" cy="0.3" r="0.7">
          <stop offset="0%" stopColor="#d9c39a" stopOpacity="0.18" />
          <stop offset="65%" stopColor="#d9c39a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="19"
        fill={`url(#${glow})`}
        stroke={stroke}
        strokeOpacity="0.32"
        strokeWidth="1"
      />
      <text
        x="11.5"
        y="26.5"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="20"
        fontWeight="400"
        fill={fill ?? "currentColor"}
        letterSpacing="-0.03em"
      >
        L
      </text>
      <text
        x="22"
        y="26.5"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="20"
        fontWeight="400"
        fontStyle="italic"
        fill={`url(#${champagne})`}
      >
        v
      </text>
    </svg>
  );
}

export function LiviaWordmark({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const markSize =
    size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const textSize =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LiviaMark className={markSize} />
      <span
        className={`font-serif ${textSize} font-normal tracking-tight leading-none`}
        style={{ letterSpacing: "0.01em" }}
      >
        Li
        <span
          style={{
            fontStyle: "italic",
            background:
              "linear-gradient(180deg, #f6f3ec 0%, #d9c39a 45%, #8a7549 60%, #d9c39a 78%, #f6f3ec 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          v
        </span>
        ia
      </span>
    </span>
  );
}

