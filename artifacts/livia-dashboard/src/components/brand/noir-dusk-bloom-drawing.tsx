import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Vector recreation of the noir-dusk sidebar botanical (northstar reference).
 * Not a cropped mock — layered SVG for crisp deploy + theme control.
 */
export function NoirDuskBloomDrawing({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const stem = `bloom-stem-${id}`;
  const petalA = `bloom-petal-a-${id}`;
  const petalB = `bloom-petal-b-${id}`;
  const leaf = `bloom-leaf-${id}`;
  const core = `bloom-core-${id}`;

  return (
    <svg
      viewBox="0 0 200 260"
      className={cn("absolute inset-0 h-full w-full beauty-sidebar-bloom-svg", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={stem} x1="30%" y1="100%" x2="70%" y2="0%">
          <stop offset="0%" stopColor="hsl(330 22% 28% / 0.35)" />
          <stop offset="100%" stopColor="hsl(330 35% 48% / 0.7)" />
        </linearGradient>
        <linearGradient id={petalA} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(330 38% 52% / 0.92)" />
          <stop offset="55%" stopColor="hsl(330 32% 38% / 0.88)" />
          <stop offset="100%" stopColor="hsl(280 28% 22% / 0.75)" />
        </linearGradient>
        <linearGradient id={petalB} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(330 42% 58% / 0.85)" />
          <stop offset="100%" stopColor="hsl(330 28% 32% / 0.7)" />
        </linearGradient>
        <linearGradient id={leaf} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="hsl(330 30% 32% / 0.55)" />
          <stop offset="100%" stopColor="hsl(330 38% 44% / 0.75)" />
        </linearGradient>
        <radialGradient id={core} cx="50%" cy="45%" r="45%">
          <stop offset="0%" stopColor="hsl(330 45% 62% / 0.9)" />
          <stop offset="70%" stopColor="hsl(330 30% 38% / 0.5)" />
          <stop offset="100%" stopColor="hsl(330 25% 25% / 0)" />
        </radialGradient>
      </defs>

      {/* Stem */}
      <path
        d="M 58 248 C 52 210 48 175 62 140 C 72 115 82 95 92 78"
        stroke={`url(#${stem})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Leaves — lanceolate, alternating */}
      <path
        d="M 62 198 C 38 192 18 178 12 158 C 28 168 44 172 58 176 Z"
        fill={`url(#${leaf})`}
        opacity="0.85"
      />
      <path
        d="M 70 168 C 96 162 118 148 128 128 C 108 142 88 152 72 158 Z"
        fill={`url(#${leaf})`}
        opacity="0.8"
      />
      <path
        d="M 54 228 C 30 222 14 208 8 188 C 24 198 40 204 56 210 Z"
        fill={`url(#${leaf})`}
        opacity="0.75"
      />
      <path
        d="M 78 138 C 102 132 120 118 126 100 C 108 112 92 122 80 128 Z"
        fill={`url(#${leaf})`}
        opacity="0.7"
      />

      {/* Back petals */}
      <ellipse cx="98" cy="62" rx="32" ry="26" fill={`url(#${petalB})`} opacity="0.75" />
      <path
        d="M 98 34 C 78 38 62 52 56 68 C 52 84 58 100 72 112 C 64 98 62 82 66 66 C 72 48 84 36 98 34 Z"
        fill="hsl(330 30% 36% / 0.65)"
      />
      <path
        d="M 98 34 C 118 38 134 52 140 68 C 144 84 138 100 124 112 C 132 98 134 82 130 66 C 124 48 112 36 98 34 Z"
        fill="hsl(330 32% 34% / 0.6)"
      />

      {/* Front cup */}
      <ellipse cx="98" cy="58" rx="26" ry="22" fill={`url(#${petalA})`} />
      <path
        d="M 98 40 C 86 42 76 50 72 62 C 68 74 74 86 84 92 C 80 82 80 70 84 58 C 88 48 92 42 98 40 Z"
        fill="hsl(330 40% 50% / 0.55)"
      />
      <path
        d="M 98 40 C 110 42 120 50 124 62 C 128 74 122 86 112 92 C 116 82 116 70 112 58 C 108 48 104 42 98 40 Z"
        fill="hsl(330 38% 46% / 0.5)"
      />

      {/* Stamen cluster */}
      <circle cx="98" cy="56" r="11" fill={`url(#${core})`} />
      <circle cx="94" cy="52" r="2.2" fill="hsl(330 48% 70% / 0.45)" />
      <circle cx="102" cy="54" r="1.8" fill="hsl(330 48% 68% / 0.4)" />
      <circle cx="98" cy="60" r="1.6" fill="hsl(330 45% 65% / 0.35)" />
    </svg>
  );
}
