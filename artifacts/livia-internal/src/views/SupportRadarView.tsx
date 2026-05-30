import { SupportSurfaceNav } from "../components/SupportSurfaceNav";

export function SupportRadarView() {
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
        data-testid="support-radar-stub"
      >
        <h2 style={{ margin: "0 0 8px", color: "#e2e8f0", fontSize: 16 }}>Radar view (R1 shell)</h2>
        <p style={{ margin: 0 }}>
          Proactive tenant health grid — stuck onboarding, SLA breaches, and Liv signals feed here in
          R2. Thread remains the daily default.
        </p>
      </div>
    </div>
  );
}
