import { SupportSurfaceNav } from "../components/SupportSurfaceNav";

export function SupportBoardView() {
  return (
    <div>
      <SupportSurfaceNav />
      <div
        style={{
          border: "1px dashed rgba(148, 163, 184, 0.35)",
          borderRadius: 12,
          padding: 24,
          color: "#94a3b8",
          fontSize: 13,
          lineHeight: 1.6,
        }}
        data-testid="support-board-stub"
      >
        <h2 style={{ margin: "0 0 8px", color: "#e2e8f0", fontSize: 16 }}>Board view (R1 shell)</h2>
        <p style={{ margin: 0 }}>
          Kanban lanes for support triage — populated in R2. Use <strong>Thread</strong> for live
          queue + ticket detail today.
        </p>
      </div>
    </div>
  );
}
