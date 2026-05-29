import type { ConceptId } from "../lib/onboarding-experience-concepts";
import { JOURNEY_ACTS } from "../lib/onboarding-experience-concepts";

const C = {
  bg: "#1e293b",
  fill: "#334155",
  fillHi: "#475569",
  stroke: "#64748b",
  accent: "#38bdf8",
  muted: "#94a3b8",
  onAccent: "#0f172a",
};

export function OnboardingExperienceWireframe({
  conceptId,
  width,
  height,
}: {
  conceptId: ConceptId;
  width: number;
  height: number;
}) {
  const pad = 12;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", borderRadius: 8, maxWidth: "100%" }}
      aria-label={`Wireframe: ${conceptId}`}
    >
      <rect width={width} height={height} fill={C.bg} />
      <rect x={pad} y={pad} width={innerW} height={innerH} rx={8} fill={C.fill} stroke={C.stroke} />

      {conceptId === "cold-open" && (
        <>
          <rect x={pad + 24} y={pad + 20} width={innerW - 48} height={innerH - 80} rx={12} fill={C.fillHi} stroke={C.stroke} />
          <polygon
            points={`${width / 2 - 14},${height / 2 - 18} ${width / 2 + 22},${height / 2} ${width / 2 - 14},${height / 2 + 18}`}
            fill={C.accent}
          />
          <text x={width / 2} y={pad + innerH - 28} textAnchor="middle" fill={C.muted} fontSize={11}>
            15s — phone → Liv books → calendar
          </text>
        </>
      )}

      {conceptId === "chapter-spine" &&
        JOURNEY_ACTS.map((_, i) => {
          const chipW = (innerW - 44) / 12;
          const x = pad + 8 + i * (chipW + 4);
          const active = i === 5;
          const done = i < 5;
          return (
            <rect
              key={i}
              x={x}
              y={pad + 36}
              width={chipW}
              height={active ? 56 : done ? 32 : 24}
              rx={4}
              fill={active ? C.accent : done ? C.fillHi : C.fill}
              opacity={active ? 1 : done ? 0.85 : 0.5}
            />
          );
        })}

      {conceptId === "liv-rehearsal" && (
        <>
          <rect x={pad + 12} y={pad + 28} width={innerW * 0.48} height={innerH - 50} rx={6} fill={C.fillHi} stroke={C.stroke} />
          <rect x={pad + innerW * 0.55} y={pad + 28} width={innerW * 0.38} height={innerH - 50} rx={14} fill={C.fillHi} stroke={C.accent} strokeWidth={1.5} />
          <circle cx={pad + innerW * 0.74} cy={pad + 52} r={10} fill="none" stroke={C.accent} opacity={0.5} />
          <text x={pad + innerW * 0.62} y={pad + 94} fill={C.muted} fontSize={8}>
            Liv typing…
          </text>
        </>
      )}

      {conceptId === "split-screen" && (
        <>
          <line x1={width / 2} y1={pad + 16} x2={width / 2} y2={pad + innerH - 8} stroke={C.stroke} />
          <rect x={pad + 14} y={pad + 40} width={innerW * 0.42} height={22} rx={4} fill={C.fillHi} stroke={C.accent} />
          <rect x={width / 2 + 14} y={pad + 44} width={innerW * 0.42} height={innerH - 70} rx={6} fill={C.fillHi} stroke={C.stroke} />
          <text x={width / 2 + 22} y={pad + 68} fill={C.accent} fontSize={8}>
            live preview
          </text>
        </>
      )}

      {conceptId === "go-live-beat" && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={pad + 14} y={pad + 28 + i * 22} width={14} height={14} rx={3} fill={C.accent} />
          ))}
          <rect x={pad + 12} y={pad + 112} width={innerW - 24} height={innerH - 128} rx={6} fill={C.fillHi} stroke={C.accent} strokeDasharray="4 3" />
        </>
      )}

      {conceptId === "stuck-video" && (
        <>
          <rect x={pad + innerW * 0.32} y={pad + 20} width={innerW * 0.36} height={innerH - 40} rx={10} fill={C.fillHi} stroke={C.stroke} />
          <text x={width / 2} y={height / 2} textAnchor="middle" fill={C.accent} fontSize={9}>
            Finish A7 — WhatsApp
          </text>
        </>
      )}

      {conceptId === "liv-continuity" &&
        ["livia.io", "Sign-in", "A6", "Inbox"].map((label, i) => (
          <g key={label}>
            <circle cx={pad + 40 + i * ((innerW - 50) / 3.5)} cy={pad + 50} r={14} fill={C.accent} opacity={0.35 + i * 0.15} />
            <text x={pad + 40 + i * ((innerW - 50) / 3.5)} y={pad + 78} textAnchor="middle" fill={C.muted} fontSize={8}>
              {label}
            </text>
          </g>
        ))}

      {conceptId === "act-loops" &&
        [0, 1, 2].flatMap((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={pad + 12 + col * ((innerW - 24) / 3 + 4)}
              y={pad + 24 + row * 52}
              width={(innerW - 36) / 3}
              height={44}
              rx={4}
              fill={C.fillHi}
              stroke={C.stroke}
            />
          )),
        )}

      {conceptId === "timeline-fill" &&
        [0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={pad + 12}
            y={pad + 36 + i * 28}
            width={20 + i * 28}
            height={18}
            rx={3}
            fill={i < 3 ? C.accent : C.fill}
            opacity={i < 3 ? 0.25 + i * 0.2 : 0.4}
          />
        ))}
    </svg>
  );
}
