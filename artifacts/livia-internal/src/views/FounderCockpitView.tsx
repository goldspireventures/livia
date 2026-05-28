import { useCallback, useEffect, useState } from "react";
import { getOpsCockpit, type FounderCockpitSnapshot } from "../lib/api";

export function FounderCockpitView() {
  const [data, setData] = useState<FounderCockpitSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      setData(await getOpsCockpit());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err && !data) return <p style={{ color: "#f87171" }}>{err}</p>;
  if (!data) return <p style={{ color: "#94a3b8" }}>Loading ops cockpit…</p>;

  const obs = data.observability;
  const ph = data.platformHealth;
  const support = data.support;
  const rollouts = data.rollouts;

  const founderGateOk =
    typeof data.gate.founderGate === "object" && data.gate.founderGate !== null
      ? (data.gate.founderGate as any).ok
      : null;

  const wargameSummary =
    typeof data.gate.wargameReport === "object" && data.gate.wargameReport !== null
      ? (data.gate.wargameReport as any).summary
      : null;

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 980 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" style={btn} onClick={() => void load()} disabled={busy}>
          Refresh
        </button>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {new Date(obs.timestamp).toLocaleString()} · collected in {obs.collectedInMs}ms
        </span>
      </div>

      {err ? <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{err}</p> : null}

      <section style={card}>
        <h2 style={h2}>Today at a glance</h2>
        <Grid
          rows={[
            ["Bookings today", String(obs.traffic.bookingsToday)],
            ["Pending bookings", String(obs.traffic.bookingsPending)],
            ["Open conversations", String(obs.traffic.conversationsOpen)],
            [
              "Support (open / urgent / oldest)",
              `${support.openTotal} / ${support.urgentOpen} / ${
                support.oldestOpenHours === null ? "—" : `${support.oldestOpenHours}h`
              }`,
            ],
            ["Stuck continuity", String(obs.v3?.stuckContinuity ?? 0)],
          ]}
        />
        {support.urgent.length > 0 ? (
          <div style={{ marginTop: 12 }}>
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 12, color: "#fbbf24" }}>
              Urgent tickets (top {Math.min(12, support.urgent.length)})
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#94a3b8" }}>
              {support.urgent.slice(0, 12).map((t) => (
                <li key={t.id} style={{ marginBottom: 6 }}>
                  <code style={{ fontSize: 11 }}>{t.id}</code> · {t.businessName} · {t.category}
                  {t.assignedTo ? ` · ${t.assignedTo}` : " · unassigned"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section style={card}>
        <h2 style={h2}>Rollouts & flags</h2>
        <Grid
          rows={[
            ["Total flags (global scope)", String(rollouts.totalFlags)],
            ["Enabled globally", String(rollouts.globalEnabled.length)],
          ]}
        />
        {rollouts.globalEnabled.length > 0 ? (
          <div style={{ marginTop: 10 }}>
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: 12, color: "#fbbf24" }}>
              Enabled global flags
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#94a3b8" }}>
              {rollouts.globalEnabled.slice(0, 10).map((f) => (
                <li key={f.key} style={{ marginBottom: 6 }}>
                  <code style={{ fontSize: 11 }}>{f.key}</code>
                  {f.description ? ` — ${f.description}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p style={{ margin: 0, marginTop: 8, fontSize: 12, color: "#64748b" }}>
            No global flags currently enabled.
          </p>
        )}
      </section>

      <section style={card}>
        <h2 style={h2}>Automation health</h2>
        <Grid
          rows={[
            ["Inngest enabled", ph.inngestEnabled ? "yes" : "no"],
            ["Notifications 24h (sent / failed)", `${obs.traffic.messagesLast24h} / ${obs.traffic.messagesFailed24h}`],
            ["Release gate (local file)", founderGateOk === null ? "missing" : founderGateOk ? "passed" : "failed"],
            [
              "Wargame (local file)",
              wargameSummary
                ? `p95=${wargameSummary.latency?.p95 ?? "?"}ms · errRate=${wargameSummary.errorRate ?? "?"}`
                : "missing",
            ],
          ]}
        />
        <p style={{ margin: 0, marginTop: 10, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
          Tip: run <code>pnpm ops:release-gate</code> to refresh local gate files.
        </p>
      </section>

      <section style={card}>
        <h2 style={h2}>Direct-link booking (not a marketplace)</h2>
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "#94a3b8", lineHeight: 1.55 }}>
          Customers arrive via each tenant&apos;s <code>/b/slug</code> URL — same flow as demo gateway.
          See <code>docs/product/PUBLIC-BOOKING-INTAKE-E2E.md</code>.
        </p>
        {Array.isArray(data.verticalCoverage) && (data.verticalCoverage as any[]).length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "#64748b", textAlign: "left" }}>
                  <th style={{ padding: "6px 8px" }}>Vertical</th>
                  <th style={{ padding: "6px 8px" }}>Demo slug</th>
                </tr>
              </thead>
              <tbody>
                {(data.verticalCoverage as { vertical?: string; demoSlug?: string }[])
                  .filter((r) => r.demoSlug)
                  .slice(0, 12)
                  .map((r) => (
                    <tr key={`${r.vertical}-${r.demoSlug}`} style={{ borderTop: "1px solid #334155" }}>
                      <td style={{ padding: "6px 8px" }}>{r.vertical}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <a
                          href={`${process.env.DASHBOARD_PUBLIC_URL ?? "http://localhost:5173"}/b/${r.demoSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#38bdf8" }}
                        >
                          /b/{r.demoSlug}
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Run demo provision for vertical showcase URLs.</p>
        )}
      </section>

      <section style={card}>
        <h2 style={h2}>Platform baseline</h2>
        <Grid
          rows={[
            ["Env", ph.nodeEnv],
            ["API version", ph.version],
            ["Tenants", String(ph.tenantCount)],
            ["DB ping", obs.database.ok ? `OK (${obs.database.latencyMs}ms)` : "FAILED"],
            ["Stripe configured", ph.stripeConfigured ? "yes" : "no"],
            ["Clerk configured", ph.clerkConfigured ? "yes" : "no"],
          ]}
        />
      </section>
    </div>
  );
}

const card: React.CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.2)",
  background: "rgba(15, 23, 42, 0.35)",
  borderRadius: 12,
  padding: 14,
};

const h2: React.CSSProperties = { margin: 0, marginBottom: 10, fontSize: 14, color: "#e2e8f0" };

const btn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "#0f172a",
  color: "#e2e8f0",
  cursor: "pointer",
};

function Grid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 8, fontSize: 13 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <div style={{ color: "#94a3b8" }}>{k}</div>
          <div style={{ color: "#e2e8f0" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

