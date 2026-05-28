import { useEffect, useState } from "react";
import { getPlatformHealth, type PlatformHealth } from "../lib/api";

export function PlatformView() {
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void getPlatformHealth()
      .then(setHealth)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, []);

  if (err) return <p style={{ color: "#f87171" }}>{err}</p>;
  if (!health) return <p style={{ color: "#94a3b8" }}>Loading platform health…</p>;

  const v3 = health.v3;

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 640 }}>
      <h2 style={{ fontSize: 16, margin: 0, color: "#e2e8f0" }}>Platform health (v3)</h2>
      <dl style={dl}>
        <dt>Tenants</dt>
        <dd>{health.tenantCount}</dd>
        <dt>Deploy</dt>
        <dd>
          <code>{health.version}</code> · {health.nodeEnv}
        </dd>
        <dt>Inngest</dt>
        <dd>{health.inngestEnabled ? "enabled" : "off"}</dd>
        <dt>Stripe</dt>
        <dd>{health.stripeConfigured ? "configured" : "missing"}</dd>
        <dt>Clerk</dt>
        <dd>{health.clerkConfigured ? "configured" : "missing"}</dd>
        <dt>Checked</dt>
        <dd>{new Date(health.timestamp).toLocaleString()}</dd>
      </dl>

      {v3 ? (
        <>
          <h3 style={{ fontSize: 14, margin: "8px 0 0", color: "#94a3b8" }}>v3 signals</h3>
          <dl style={dl}>
            <dt>Stuck continuity</dt>
            <dd>{v3.stuckContinuity}</dd>
            <dt>Medspa tenants</dt>
            <dd>{v3.medspaTenants}</dd>
            <dt>Pending medspa consents</dt>
            <dd>{v3.pendingMedspaConsents}</dd>
            <dt>DE locale tenants</dt>
            <dd>{v3.deLocaleTenants}</dd>
            <dt>Active waitlist</dt>
            <dd>{v3.activeWaitlist}</dd>
            <dt>Pet grooming tenants</dt>
            <dd>{v3.petGroomTenants}</dd>
            <dt>Migrations</dt>
            <dd>
              <code style={{ fontSize: 11 }}>{v3.migrations.join(", ")}</code>
            </dd>
          </dl>
        </>
      ) : null}

      <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
        Livia Internal is the operator surface — separate from tenant dashboard (<code>:5173</code>)
        and mobile. Apply migrations 011–012 before trusting continuity/medspa/waitlist counts.
      </p>
    </div>
  );
}

const dl: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  gap: "8px 12px",
  fontSize: 13,
  margin: 0,
};
