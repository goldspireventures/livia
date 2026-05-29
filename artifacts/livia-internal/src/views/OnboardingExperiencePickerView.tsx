import React, { useEffect, useMemo, useState } from "react";
import { OnboardingExperienceMock } from "../components/onboarding-experience-mocks";
import { OnboardingExperienceWireframe } from "../components/OnboardingExperienceWireframe";
import {
  actHitsConcept,
  JOURNEY_ACTS,
  ONBOARDING_CONCEPTS,
  type ConceptId,
  type OnboardingConcept,
} from "../lib/onboarding-experience-concepts";
import { buttonStyle, inputStyle } from "../styles/ops-ui";

type ViewTab = "preview" | "journey" | "matrix" | "compare";
type VisualMode = "mock" | "sketch";

const STORAGE_KEY = "livia.onboarding-experience-picker.v1";

interface PickerState {
  tab: ViewTab;
  selected: ConceptId;
  compare: ConceptId[];
  visual: VisualMode;
}

const DEFAULT_STATE: PickerState = {
  tab: "preview",
  selected: "split-screen",
  compare: ["cold-open", "liv-rehearsal", "split-screen"],
  visual: "mock",
};

function loadState(): PickerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) } as PickerState;
  } catch {
    return DEFAULT_STATE;
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0f172a",
  color: "#e2e8f0",
  padding: "24px 32px 48px",
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.5,
};

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 16,
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  ...buttonStyle,
  background: active ? "#38bdf8" : "#334155",
  color: active ? "#0f172a" : "#e2e8f0",
});

const pill: React.CSSProperties = {
  display: "inline-block",
  fontSize: 11,
  padding: "4px 8px",
  borderRadius: 6,
  background: "#334155",
  color: "#cbd5e1",
  marginRight: 6,
  marginBottom: 6,
};

function ImpactMatrix() {
  const sorted = [...ONBOARDING_CONCEPTS].sort((a, b) => b.impact / b.effort - a.impact / a.effort);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {sorted.map((c) => (
        <div key={c.id}>
          <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>{c.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ width: 52, fontSize: 11, color: "#86efac" }}>Impact</span>
            <div style={{ flex: 1, height: 10, background: "#0f172a", borderRadius: 4 }}>
              <div style={{ width: `${c.impact * 10}%`, height: "100%", background: "#22c55e", borderRadius: 4 }} />
            </div>
            <span style={{ width: 24, fontSize: 11 }}>{c.impact}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 52, fontSize: 11, color: "#fcd34d" }}>Effort</span>
            <div style={{ flex: 1, height: 10, background: "#0f172a", borderRadius: 4 }}>
              <div style={{ width: `${c.effort * 10}%`, height: "100%", background: "#f59e0b", borderRadius: 4 }} />
            </div>
            <span style={{ width: 24, fontSize: 11 }}>{c.effort}</span>
          </div>
        </div>
      ))}
      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
        Scores for comparison only · higher impact ÷ effort sorts to top
      </p>
    </div>
  );
}

function ConceptVisual({
  concept,
  mode,
}: {
  concept: OnboardingConcept;
  mode: VisualMode;
}) {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        {concept.surfaces.map((s) => (
          <span key={s} style={pill}>
            {s}
          </span>
        ))}
        <span style={{ ...pill, background: "#0c4a6e", color: "#7dd3fc" }}>{concept.lift}</span>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16, fontSize: 14 }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 11 }}>Impact</div>
          <strong style={{ color: "#86efac" }}>{concept.impact}/10</strong>
        </div>
        <div>
          <div style={{ color: "#64748b", fontSize: 11 }}>Effort</div>
          <strong style={{ color: "#fcd34d" }}>{concept.effort}/10</strong>
        </div>
        <div>
          <div style={{ color: "#64748b", fontSize: 11 }}>Ratio</div>
          <strong style={{ color: "#7dd3fc" }}>{(concept.impact / concept.effort).toFixed(1)}</strong>
        </div>
      </div>
      {mode === "mock" ? (
        <div
          style={{
            background: "#f1f5f9",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #334155",
          }}
        >
          <OnboardingExperienceMock conceptId={concept.id} />
        </div>
      ) : (
        <>
          <p style={{ color: "#94a3b8", margin: "0 0 12px", fontSize: 13 }}>{concept.payoff}</p>
          <OnboardingExperienceWireframe conceptId={concept.id} width={560} height={220} />
        </>
      )}
    </div>
  );
}

function JourneyMap({ highlightId }: { highlightId: ConceptId }) {
  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 0 }}>
        A1–A12 spine — highlighted concept shows where it lands.
      </p>
      <div style={{ display: "flex", gap: 6, minWidth: 720 }}>
        {JOURNEY_ACTS.map((act) => {
          const attached = ONBOARDING_CONCEPTS.filter((c) => actHitsConcept(act, c));
          const hot = attached.some((c) => c.id === highlightId);
          return (
            <div key={act} style={{ flex: "0 0 58px", textAlign: "center" }}>
              <div
                style={{
                  height: hot ? 52 : 40,
                  borderRadius: 6,
                  border: `1px solid ${hot ? "#38bdf8" : "#475569"}`,
                  background: hot ? "rgba(56,189,248,0.2)" : "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {act}
              </div>
              <div style={{ marginTop: 6, fontSize: 9, color: "#64748b", lineHeight: 1.3 }}>
                {attached.slice(0, 2).map((c) => (
                  <div key={c.id}>{c.name.split(" ")[0]}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #0ea5e9",
          background: "rgba(14,165,233,0.1)",
          fontSize: 13,
        }}
      >
        <strong>Suggested sprint trio:</strong> Cold open + A6 rehearsal + A8 split-screen
      </div>
    </div>
  );
}

export function OnboardingExperiencePickerView() {
  const [state, setState] = useState<PickerState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const concept = useMemo(
    () => ONBOARDING_CONCEPTS.find((c) => c.id === state.selected) ?? ONBOARDING_CONCEPTS[0],
    [state.selected],
  );

  function toggleCompare(id: ConceptId) {
    setState((s) => {
      const has = s.compare.includes(id);
      if (has) return { ...s, compare: s.compare.filter((x) => x !== id) };
      if (s.compare.length >= 3) return { ...s, compare: [...s.compare.slice(1), id] };
      return { ...s, compare: [...s.compare, id] };
    });
  }

  const compareConcepts = ONBOARDING_CONCEPTS.filter((c) => state.compare.includes(c.id));

  return (
    <div style={page}>
      <header style={{ maxWidth: 1100, marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: "0 0 8px", fontWeight: 700 }}>Onboarding experience picker</h1>
        <p style={{ color: "#94a3b8", margin: 0, maxWidth: 720 }}>
          Hi-fi UI mocks (default) or wireframe sketches. Refresh if you changed tabs earlier.
        </p>
      </header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#64748b", marginRight: 4 }}>Visual:</span>
        {(
          [
            ["mock", "Hi-fi mock"],
            ["sketch", "Wireframe"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            style={tabBtn(state.visual === id)}
            onClick={() => setState((s) => ({ ...s, visual: id }))}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {(
          [
            ["preview", "Preview"],
            ["journey", "Journey map"],
            ["matrix", "Impact matrix"],
            ["compare", `Compare (${state.compare.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            style={tabBtn(state.tab === id)}
            onClick={() => setState((s) => ({ ...s, tab: id }))}
          >
            {label}
          </button>
        ))}
      </div>

      {state.tab === "preview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 280px) 1fr",
            gap: 20,
            maxWidth: 1200,
          }}
        >
          <div style={card}>
            <h2 style={{ fontSize: 14, margin: "0 0 12px", color: "#fbbf24" }}>Concepts</h2>
            {ONBOARDING_CONCEPTS.map((c) => {
              const on = state.selected === c.id;
              const inCompare = state.compare.includes(c.id);
              return (
                <div key={c.id} style={{ marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => setState((s) => ({ ...s, selected: c.id }))}
                    style={{
                      ...inputStyle,
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                      borderColor: on ? "#38bdf8" : "#334155",
                      background: on ? "#0c4a6e" : "#0f172a",
                    }}
                  >
                    <div style={{ fontWeight: on ? 600 : 400, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.tagline}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompare(c.id)}
                    style={{
                      marginTop: 4,
                      marginLeft: 4,
                      background: "none",
                      border: "none",
                      color: inCompare ? "#7dd3fc" : "#64748b",
                      fontSize: 12,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {inCompare ? "In compare" : "+ compare"}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={card}>
            <h2 style={{ fontSize: 20, margin: "0 0 4px" }}>{concept.name}</h2>
            <p style={{ color: "#94a3b8", margin: "0 0 16px" }}>{concept.tagline}</p>
            <ConceptVisual concept={concept} mode={state.visual} />
          </div>
        </div>
      )}

      {state.tab === "journey" && (
        <div style={{ ...card, maxWidth: 1200 }}>
          <JourneyMap highlightId={state.selected} />
        </div>
      )}

      {state.tab === "matrix" && (
        <div style={{ ...card, maxWidth: 640 }}>
          <ImpactMatrix />
        </div>
      )}

      {state.tab === "compare" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(compareConcepts.length, 1)}, minmax(280px, 1fr))`,
            gap: 16,
            maxWidth: 1200,
          }}
        >
          {compareConcepts.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>Pick up to 3 concepts in Preview (+ compare).</p>
          ) : (
            compareConcepts.map((c) => (
              <div key={c.id} style={card}>
                <h3 style={{ margin: "0 0 4px" }}>{c.name}</h3>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>{c.tagline}</p>
                <div
                  style={{
                    marginTop: 12,
                    background: state.visual === "mock" ? "#f1f5f9" : "transparent",
                    borderRadius: 8,
                    padding: state.visual === "mock" ? 12 : 0,
                  }}
                >
                  {state.visual === "mock" ? (
                    <OnboardingExperienceMock conceptId={c.id} />
                  ) : (
                    <OnboardingExperienceWireframe conceptId={c.id} width={300} height={160} />
                  )}
                </div>
                <p style={{ fontSize: 12, margin: "8px 0 0" }}>
                  Impact {c.impact} · Effort {c.effort}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
