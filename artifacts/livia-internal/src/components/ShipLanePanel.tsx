import { useState, type CSSProperties } from "react";

type ShipStep = { id: string; label: string; done: boolean; hint?: string };

type ShipLane = {
  id: string;
  title: string;
  stepIds: string[];
};

const LANES: ShipLane[] = [
  { id: "product", title: "Product evidence", stepIds: ["ci", "smoke"] },
  { id: "commercial", title: "Commercial", stepIds: ["changelog"] },
  { id: "trust", title: "Trust & access", stepIds: ["sign-in"] },
];

function laneForStep(stepId: string): string {
  for (const lane of LANES) {
    if (lane.stepIds.includes(stepId)) return lane.id;
  }
  return "product";
}

export function ShipLanePanel({
  steps,
  betaSignupMode,
  demoEnabled,
}: {
  steps: ShipStep[];
  betaSignupMode: string;
  demoEnabled: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const byLane = new Map<string, ShipStep[]>();
  for (const lane of LANES) byLane.set(lane.id, []);
  for (const step of steps) {
    const laneId = laneForStep(step.id);
    byLane.get(laneId)?.push(step);
  }

  const toggle = (laneId: string) =>
    setExpanded((prev) => ({ ...prev, [laneId]: !prev[laneId] }));

  return (
    <section style={card}>
      <h2 style={h2}>Ship Lane</h2>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b" }}>
        Beta mode: <code>{betaSignupMode}</code>
        {demoEnabled ? " · demo ON" : " · demo OFF (prod)"}
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {LANES.map((lane) => {
          const laneSteps = byLane.get(lane.id) ?? [];
          const doneCount = laneSteps.filter((s) => s.done).length;
          const isOpen = expanded[lane.id] ?? false;
          return (
            <div
              key={lane.id}
              style={{
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 8,
                overflow: "hidden",
              }}
              data-testid={`ship-lane-${lane.id}`}
            >
              <button
                type="button"
                onClick={() => toggle(lane.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  background: "rgba(15, 23, 42, 0.5)",
                  border: "none",
                  color: "#e2e8f0",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{lane.title}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background:
                        doneCount === laneSteps.length && laneSteps.length > 0
                          ? "rgba(110, 231, 183, 0.15)"
                          : "rgba(251, 191, 36, 0.12)",
                      color:
                        doneCount === laneSteps.length && laneSteps.length > 0
                          ? "#6ee7b7"
                          : "#fbbf24",
                    }}
                  >
                    {doneCount}/{laneSteps.length}
                  </span>
                  <span aria-hidden>{isOpen ? "▾" : "▸"}</span>
                </span>
              </button>
              {isOpen ? (
                <ul
                  style={{
                    margin: 0,
                    padding: "8px 12px 12px 28px",
                    fontSize: 13,
                    color: "#cbd5e1",
                    background: "rgba(2, 6, 23, 0.35)",
                  }}
                >
                  {laneSteps.map((step) => (
                    <li key={step.id} style={{ marginBottom: 8 }}>
                      <span style={{ color: step.done ? "#6ee7b7" : "#94a3b8" }}>
                        {step.done ? "☑" : "☐"} {step.label}
                      </span>
                      {step.hint ? (
                        <span
                          style={{ display: "block", fontSize: 11, color: "#64748b", marginTop: 2 }}
                        >
                          {step.hint}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 11, color: "#64748b" }}>
        Full runbook: <code>docs/operations/FOUNDER-RELEASE-RUNBOOK.md</code>
      </p>
    </section>
  );
}

const card: CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.15)",
  borderRadius: 12,
  padding: 16,
};

const h2: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
  fontWeight: 600,
  color: "#f1f5f9",
};
