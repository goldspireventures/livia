import { useId } from "react";
import { LiviaMark } from "@/components/brand/LiviaMark";

const VIEW_PAD = 56;
const DRAW = 560;
const SIZE = DRAW + VIEW_PAD * 2;
const CX = SIZE / 2;
const CY = SIZE / 2;
const ORBIT_R = 198;
/** Label radius beyond orbit — pulled in 35% from prior outer placement. */
const LABEL_RADIAL = Math.round((224 - ORBIT_R + 18) * 0.65 + ORBIT_R);

export type ConstellationVertical = { label: string };

function polar(angle: number, radius: number) {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

/** Push labels outward so 3/9 o'clock text does not sit on the orbit ring. */
function orbitLabelLayout(angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const p = polar(angle, LABEL_RADIAL);

  let textAnchor: "start" | "middle" | "end" = "middle";
  if (cos > 0.35) textAnchor = "start";
  else if (cos < -0.35) textAnchor = "end";

  let dominantBaseline: "middle" | "hanging" | "auto" = "middle";
  if (sin > 0.45) dominantBaseline = "hanging";
  else if (sin < -0.45) dominantBaseline = "auto";

  return {
    x: p.x,
    y: p.y,
    textAnchor,
    dominantBaseline,
  };
}

function starPath(cx: number, cy: number, outer: number, inner: number) {
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    points.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return `M ${points.join(" L ")} Z`;
}

/** Arc between two outer nodes along the orbit circle. */
function orbitArc(i: number, n: number, sweep: 0 | 1) {
  const a1 = (i / n) * Math.PI * 2 - Math.PI / 2;
  const a2 = (((i + 1) % n) / n) * Math.PI * 2 - Math.PI / 2;
  const p1 = polar(a1, ORBIT_R);
  const p2 = polar(a2, ORBIT_R);
  return `M ${p1.x} ${p1.y} A ${ORBIT_R} ${ORBIT_R} 0 0 ${sweep} ${p2.x} ${p2.y}`;
}

type ConstellationSacredMapProps = {
  verticals: ConstellationVertical[];
};

export function ConstellationSacredMap({ verticals }: ConstellationSacredMapProps) {
  const uid = useId().replace(/:/g, "");
  const n = verticals.length;

  const gold = `cst-gold-${uid}`;
  const goldGlow = `cst-gold-glow-${uid}`;
  const nebula = `cst-nebula-${uid}`;
  const violetGlow = `cst-violet-${uid}`;

  return (
    <div className="constellation-map" aria-hidden>
      <div className="constellation-map__halo" />
      <svg className="constellation-map__svg" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          <radialGradient id={nebula} cx="52%" cy="48%" r="48%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#6366f1" stopOpacity="0.28" />
            <stop offset="58%" stopColor="#06b6d4" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#0a0a10" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f6f3ec" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#d9c39a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#8a7549" stopOpacity="0.55" />
          </linearGradient>
          <filter id={goldGlow} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={violetGlow} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="18" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Nebula bloom */}
        <circle cx={CX} cy={CY} r={ORBIT_R + 48} fill={`url(#${nebula})`} filter={`url(#${violetGlow})`} opacity="0.9" />

        {/* Seed-of-life ring cluster */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const a = (deg * Math.PI) / 180;
          const petalR = 72;
          const pcx = CX + petalR * Math.cos(a);
          const pcy = CY + petalR * Math.sin(a);
          return (
            <circle
              key={deg}
              cx={pcx}
              cy={pcy}
              r={petalR}
              fill="none"
              stroke={`url(#${gold})`}
              strokeWidth="0.65"
              opacity="0.22"
            />
          );
        })}

        {/* Concentric rings */}
        {[ORBIT_R, ORBIT_R * 0.72, ORBIT_R * 0.44, 52].map((r) => (
          <circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke={`url(#${gold})`}
            strokeWidth={r > 100 ? 0.85 : 0.55}
            opacity={r > 100 ? 0.42 : 0.28}
            filter={`url(#${goldGlow})`}
          />
        ))}

        {/* Vesica arcs (horizontal + vertical) */}
        <ellipse
          cx={CX}
          cy={CY}
          rx={ORBIT_R * 0.62}
          ry={ORBIT_R * 0.28}
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="0.55"
          opacity="0.35"
        />
        <ellipse
          cx={CX}
          cy={CY}
          rx={ORBIT_R * 0.28}
          ry={ORBIT_R * 0.62}
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="0.55"
          opacity="0.35"
        />

        {/* Spokes + outer arc segments */}
        {verticals.map((_, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const p = polar(a, ORBIT_R);
          return (
            <line
              key={`spoke-${verticals[i]!.label}`}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke={`url(#${gold})`}
              strokeWidth="0.55"
              opacity="0.28"
            />
          );
        })}
        {verticals.map((_, i) => (
          <path
            key={`arc-${verticals[i]!.label}`}
            d={orbitArc(i, n, 1)}
            fill="none"
            stroke={`url(#${gold})`}
            strokeWidth="0.7"
            opacity="0.38"
            filter={`url(#${goldGlow})`}
          />
        ))}

        {/* Star nodes */}
        {verticals.map((v, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const p = polar(a, ORBIT_R);
          return (
            <g key={v.label}>
              <circle cx={p.x} cy={p.y} r="11" fill="rgba(217,195,154,0.08)" />
              <path
                d={starPath(p.x, p.y, 7, 2.8)}
                fill={`url(#${gold})`}
                filter={`url(#${goldGlow})`}
                opacity="0.95"
              />
            </g>
          );
        })}

        {/* Labels in SVG for crisp caps */}
        {verticals.map((v, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const layout = orbitLabelLayout(a);
          return (
            <text
              key={`lbl-${v.label}`}
              x={layout.x}
              y={layout.y}
              textAnchor={layout.textAnchor}
              dominantBaseline={layout.dominantBaseline}
              fill="#d9c39a"
              fontSize="11"
              fontWeight="600"
              letterSpacing="0.12em"
              opacity="0.92"
              style={{ fontFamily: "var(--app-font-sans)" }}
            >
              {v.label.toUpperCase()}
            </text>
          );
        })}
      </svg>

      <div className="constellation-map__core">
        <div className="constellation-map__core-ring" aria-hidden />
        <div className="constellation-map__mark-wrap">
          <LiviaMark className="constellation-map__mark" />
        </div>
      </div>
    </div>
  );
}
