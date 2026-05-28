import { Fragment, useCallback, useEffect, useState } from "react";
import {
  getObservability,
  runStressProbes,
  backfillDemoLegal,
  ensureDemoReady,
  type PlatformObservability,
  type StressProbeResult,
} from "../lib/api";

export function ObservabilityView() {
  const [obs, setObs] = useState<PlatformObservability | null>(null);
  const [stress, setStress] = useState<StressProbeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async (opts?: { tryEnsureDemo?: boolean }) => {
    setErr(null);
    try {
      let data = await getObservability();
      if (opts?.tryEnsureDemo && !data.demo.ready && data.demo.tenantsProvisioned > 0) {
        await ensureDemoReady();
        data = await getObservability();
      }
      setObs(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [autoRefresh, load]);

  async function handleStress() {
    setBusy(true);
    setErr(null);
    try {
      setStress(await runStressProbes());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Stress probes failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleBackfill() {
    setBusy(true);
    setErr(null);
    try {
      const r = await backfillDemoLegal();
      await load();
      alert(
        `Demo identities: ${r.accounts} accounts · ${r.clerkCreated} new Clerk · ${r.updated} legal updates`,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Backfill failed");
    } finally {
      setBusy(false);
    }
  }

  if (err && !obs) return <p style={{ color: "#f87171" }}>{err}</p>;
  if (!obs) return <p style={{ color: "#94a3b8" }}>Loading observability…</p>;

  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 900 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button type="button" style={btn} onClick={() => void load()} disabled={busy}>
          Refresh
        </button>
        <button type="button" style={btn} onClick={() => void handleStress()} disabled={busy}>
          Run stress probes
        </button>
        <button type="button" style={{ ...btn, background: "#334155", color: "#e2e8f0" }} onClick={() => void handleBackfill()} disabled={busy}>
          Sync demo identities
        </button>
        <button
          type="button"
          style={{ ...btn, background: "#0d9488", color: "#ecfdf5" }}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await ensureDemoReady();
              await load();
              alert(r.actions.join("\n"));
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Ensure failed");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
        >
          Ensure demo ops data
        </button>
        <label style={{ fontSize: 12, color: "#94a3b8", display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto-refresh 30s
        </label>
        <span style={{ fontSize: 11, color: "#64748b" }}>
          Collected in {obs.collectedInMs}ms · {new Date(obs.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {err ? <p style={{ color: "#f87171", fontSize: 13 }}>{err}</p> : null}

      {obs.alerts.length > 0 ? (
        <section style={card}>
          <h2 style={h2}>Alerts</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {obs.alerts.map((a) => (
              <li key={a.message} style={{ color: a.level === "critical" ? "#f87171" : "#fbbf24" }}>
                {a.message}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p style={{ color: "#34d399", fontSize: 13 }}>No active platform alerts.</p>
      )}

      <section style={card}>
        <h2 style={h2}>Data plane</h2>
        <Grid
          rows={[
            ["DB ping", obs.database.ok ? `OK (${obs.database.latencyMs}ms)` : "FAILED"],
            ["Tenants", String(obs.tenantCount)],
            ["Demo shops", `${obs.demo.tenantsProvisioned} / ${obs.demo.worldSlugs}${obs.demo.ready ? " · ready" : " · thin — click Ensure demo ops data"}`],
            ["Open support tickets", String(obs.support.ticketsOpen)],
            ["Bookings (total / pending / today)", `${obs.traffic.bookingsTotal} / ${obs.traffic.bookingsPending} / ${obs.traffic.bookingsToday}`],
            ["Notifications 24h (sent / failed)", `${obs.traffic.messagesLast24h} / ${obs.traffic.messagesFailed24h}`],
            ["Open conversations", String(obs.traffic.conversationsOpen)],
            ["Stuck continuity", String(obs.v3?.stuckContinuity ?? 0)],
            ["Users missing platform legal", String(obs.compliance.usersMissingPlatformLegal)],
          ]}
        />
      </section>

      <section style={card}>
        <h2 style={h2}>Middleware & failsafes</h2>
        <Grid
          rows={[
            ["Request ID + structured logs", obs.middleware.requestId ? "on" : "off"],
            ["Gzip compression", obs.middleware.compression ? "on" : "off"],
            ["Clerk auth", obs.middleware.clerkAuth ? "on" : "off"],
            ["Sentry", obs.middleware.sentry ? "on" : "off"],
            ["Trust proxy", obs.middleware.trustProxy ? "on" : "off"],
            ["Legal gate skipped (dev)", obs.failsafes.legalGateSkipped ? "yes" : "no"],
            ["Beta signup mode", String(obs.failsafes.betaSignupMode)],
            ["API errors include requestId", obs.failsafes.unhandledErrorReturnsRequestId ? "yes" : "no"],
          ]}
        />
      </section>

      <section style={card}>
        <h2 style={h2}>Integrations</h2>
        <Grid
          rows={Object.entries(obs.integrations).map(([k, v]) => [
            k,
            v ? "configured" : "missing",
          ] as [string, string])}
        />
      </section>

      {obs.recentFailedMessages.length > 0 ? (
        <section style={card}>
          <h2 style={h2}>Recent failed notifications (24h)</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#94a3b8" }}>
            {obs.recentFailedMessages.map((m) => (
              <li key={m.id}>
                {m.channel} · {m.at}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stress ? (
        <section style={card}>
          <h2 style={h2}>
            Stress probes — {stress.passed}/{stress.probes.length} passed
          </h2>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#64748b", textAlign: "left" }}>
                <th style={th}>Probe</th>
                <th style={th}>OK</th>
                <th style={th}>Status</th>
                <th style={th}>ms</th>
              </tr>
            </thead>
            <tbody>
              {stress.probes.map((p) => (
                <tr key={p.name}>
                  <td style={td}>{p.name}</td>
                  <td style={td}>{p.ok ? "✓" : "✗"}</td>
                  <td style={td}>{p.status ?? "—"}</td>
                  <td style={td}>{p.durationMs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
        CLI: <code>pnpm smoke:platform</code> · <code>pnpm smoke:uat</code> ·{" "}
        <code>pnpm stress:flood</code> from repo root. Tenant errors: paste <code>requestId</code> in Support tab.
      </p>
    </div>
  );
}

function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: "6px 12px",
        margin: 0,
        fontSize: 13,
      }}
    >
      {rows.map(([k, v]) => (
        <Fragment key={k}>
          <dt style={{ color: "#94a3b8", margin: 0 }}>{k}</dt>
          <dd style={{ margin: 0, color: "#e2e8f0" }}>{v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 16,
  background: "#1e293b",
};

const h2: React.CSSProperties = { fontSize: 15, margin: "0 0 12px", color: "#fbbf24" };
const btn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "#f59e0b",
  color: "#0f172a",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 13,
};
const th: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid #334155" };
const td: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid #1e293b" };
