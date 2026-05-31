import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getExecSnapshot,
  runExecAutomation,
  type FounderCockpitSnapshot,
} from "../lib/api";
import { getDashboardUrl } from "../lib/dashboard-url";
import { WorkforceAccessPanel } from "../components/WorkforceAccessPanel";
import { ShipLanePanel } from "../components/ShipLanePanel";

function internalRoute(href: string, base: string): string | null {
  const b = base.replace(/\/+$/, "");
  const h = href.replace(/\/+$/, "");
  if (h === b) return "/";
  if (h.startsWith(`${b}/`)) return h.slice(b.length);
  return null;
}

export function FounderCockpitView() {
  const [data, setData] = useState<FounderCockpitSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoBusy, setAutoBusy] = useState<string | null>(null);
  const [autoMsg, setAutoMsg] = useState<string | null>(null);
  const [execTab, setExecTab] = useState<"exceptions" | "ship-lane" | "hats">("exceptions");

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      setData(await getExecSnapshot());
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
  if (!data) return <p style={{ color: "#94a3b8" }}>Loading command center…</p>;

  const runAutomation = async (id: string, destructive?: boolean) => {
    if (destructive && !window.confirm("This sends real emails to stuck onboarding owners. Continue?")) {
      return;
    }
    setAutoBusy(id);
    setAutoMsg(null);
    try {
      const result = await runExecAutomation(id, { confirm: destructive });
      setAutoMsg(result.summary);
      if (id === "refresh-production-checks") await load();
    } catch (e) {
      setAutoMsg(e instanceof Error ? e.message : "Automation failed");
    } finally {
      setAutoBusy(null);
    }
  };

  const hatStatusColor = (s: "ok" | "watch" | "action") => {
    if (s === "ok") return "#6ee7b7";
    if (s === "watch") return "#fbbf24";
    return "#f87171";
  };

  const obs = data.observability;
  const ph = data.platformHealth;
  const support = data.support;
  const rollouts = data.rollouts;
  const internalBase = data.commandCenter.internalPortalBase;

  const founderGateOk =
    typeof data.gate.founderGate === "object" && data.gate.founderGate !== null
      ? (data.gate.founderGate as { ok?: boolean }).ok
      : null;

  const wargameSummary =
    typeof data.gate.wargameReport === "object" && data.gate.wargameReport !== null
      ? (data.gate.wargameReport as { summary?: { latency?: { p95?: number }; errorRate?: number } })
          .summary
      : null;

  const prodOk = data.production.allRequiredOk;

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 980 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" style={btn} onClick={() => void load()} disabled={busy}>
          {busy ? "Refreshing…" : "Refresh"}
        </button>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          Ops {new Date(obs.timestamp).toLocaleString()} · Prod checks{" "}
          {new Date(data.production.checkedAt).toLocaleString()}
        </span>
      </div>

      {err ? <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{err}</p> : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} data-testid="exec-cockpit-tabs">
        {(
          [
            ["exceptions", "Exceptions"],
            ["ship-lane", "Ship lane"],
            ["hats", "Hats"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            style={{
              ...btn,
              borderColor: execTab === id ? "rgba(56, 189, 248, 0.5)" : undefined,
              color: execTab === id ? "#38bdf8" : undefined,
            }}
            onClick={() => setExecTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {execTab === "exceptions" ? (
        <>
      <section style={{ ...card, borderColor: prodOk ? "rgba(52, 211, 153, 0.35)" : "rgba(251, 191, 36, 0.45)" }}>
        <h2 style={h2}>Production health</h2>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: prodOk ? "#6ee7b7" : "#fbbf24" }}>
          {prodOk ? "All required checks passed." : "Fix required checks before inviting customers."}
        </p>
        <Grid
          rows={data.production.checks.map((c) => [
            c.name + (c.required ? "" : " (info)"),
            `${c.ok ? "✓" : "✗"} ${c.detail}`,
          ])}
        />
        <p style={{ margin: "12px 0 0", fontSize: 11, color: "#64748b" }}>
          Same probes as <code>pnpm prod:smoke</code> — no need to open a terminal for routine deploys.
        </p>
      </section>

      <WorkforceAccessPanel
        goldspireDomain={data.workforceAccess.goldspireDomain}
        grants={data.workforceAccess.grants}
        onChanged={() => void load()}
      />

      <section style={card}>
        <h2 style={h2}>Automations</h2>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#94a3b8" }}>
          One-click ops — runs on the API with your existing secrets (solo-friendly).
        </p>
        {autoMsg ? (
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#a5f3fc" }}>{autoMsg}</p>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.automations.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(148, 163, 184, 0.15)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "#e2e8f0" }}>{a.label}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{a.description}</div>
              </div>
              <button
                type="button"
                style={{
                  ...btn,
                  opacity: autoBusy === a.id ? 0.6 : 1,
                  borderColor: a.destructive ? "rgba(248, 113, 113, 0.5)" : undefined,
                }}
                disabled={Boolean(autoBusy)}
                onClick={() => void runAutomation(a.id, a.destructive)}
              >
                {autoBusy === a.id ? "…" : a.destructive ? "Run (confirm)" : "Run"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>Surfaces & links</h2>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
          Customer apps and internal modules. Prefer in-app links; external consoles last.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {[
            { to: "/support", label: "Support" },
            { to: "/tenants", label: "Tenants" },
            { to: "/monitoring", label: "Monitoring" },
            { to: "/flags", label: "Flags" },
            { to: "/knowledge", label: "Atlas" },
          ].map((item) => (
            <Link key={item.to} to={item.to} style={chipLink}>
              {item.label}
            </Link>
          ))}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {data.commandCenter.links.map((link) => {
            const route = link.kind === "internal" ? internalRoute(link.href, internalBase) : null;
            const content = (
              <>
                <span style={{ color: "#e2e8f0", fontSize: 13 }}>{link.label}</span>
                {link.description ? (
                  <span style={{ display: "block", fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    {link.description}
                  </span>
                ) : null}
              </>
            );
            if (route) {
              return (
                <Link key={link.id} to={route} style={linkRow}>
                  {content}
                </Link>
              );
            }
            return (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={linkRow}
              >
                {content}
                <span style={{ fontSize: 11, color: "#38bdf8" }}>↗</span>
              </a>
            );
          })}
        </div>
      </section>

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
              Urgent tickets —{" "}
              <Link to="/support" style={{ color: "#38bdf8" }}>
                open queue
              </Link>
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
            <Link to="/flags" style={{ fontSize: 12, color: "#38bdf8" }}>
              Manage flags →
            </Link>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: "#94a3b8" }}>
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
            No global flags enabled.
          </p>
        )}
      </section>

      <section style={card}>
        <h2 style={h2}>Automation & local gates</h2>
        <Grid
          rows={[
            ["Inngest enabled", ph.inngestEnabled ? "yes" : "no"],
            [
              "Notifications 24h (sent / failed)",
              `${obs.traffic.messagesLast24h} / ${obs.traffic.messagesFailed24h}`,
            ],
            [
              "Release gate (local file)",
              founderGateOk === null ? "missing" : founderGateOk ? "passed" : "failed",
            ],
            [
              "Wargame (local file)",
              wargameSummary
                ? `p95=${wargameSummary.latency?.p95 ?? "?"}ms · errRate=${wargameSummary.errorRate ?? "?"}`
                : "missing",
            ],
          ]}
        />
        <p style={{ margin: 0, marginTop: 10, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
          Before a big ship locally: <code>pnpm founder:release-gate</code>
        </p>
      </section>

      <section style={card}>
        <h2 style={h2}>Staging prep (Option A — not live)</h2>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>
          {data.stagingPrep.note}
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#64748b" }}>
          {data.stagingPrep.checklist.map((item) => (
            <li key={item} style={{ marginBottom: 6 }}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section style={card}>
        <h2 style={h2}>Public booking demos</h2>
        {Array.isArray(data.verticalCoverage) && (data.verticalCoverage as unknown[]).length > 0 ? (
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
                          href={`${getDashboardUrl()}/b/${r.demoSlug}`}
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
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Run demo provision for showcase URLs.</p>
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
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#64748b" }}>
          Monday business OKRs: <code>docs/company/NORTH-STAR-DASHBOARD.md</code>
        </p>
      </section>
        </>
      ) : null}

      {execTab === "ship-lane" ? (
        <ShipLanePanel
          steps={data.release.steps}
          betaSignupMode={data.release.betaSignupMode}
          demoEnabled={data.release.demoEnabled}
          stagingRelaxations={data.release.stagingRelaxations}
        />
      ) : null}

      {execTab === "hats" ? (
        <section style={card} data-testid="exec-hats-river">
          <h2 style={h2}>Leadership hats</h2>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
            Six mandates — scan left to right for daily order.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {data.hats.map((hat) => (
              <div
                key={hat.id}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: 10,
                  padding: 12,
                  borderTop: `3px solid ${hatStatusColor(hat.status)}`,
                  minHeight: 200,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <strong style={{ color: "#e2e8f0", fontSize: 13 }}>{hat.role}</strong>
                  <span style={{ fontSize: 11, color: hatStatusColor(hat.status), textTransform: "uppercase" }}>
                    {hat.status}
                  </span>
                </div>
                <p style={{ margin: "4px 0 8px", fontSize: 11, color: "#64748b" }}>{hat.mandate}</p>
                <div style={{ display: "grid", gap: 4 }}>
                  {hat.metrics.map((m) => (
                    <div key={m.label} style={{ fontSize: 11 }}>
                      <span style={{ color: "#64748b" }}>{m.label}: </span>
                      <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{m.value}</span>
                    </div>
                  ))}
                </div>
                <p style={{ margin: "8px 0", fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>{hat.focus}</p>
                {hat.recentWork && hat.recentWork.length > 0 ? (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>
                      Recent work
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 4 }}>
                      {hat.recentWork.slice(0, 3).map((w) => (
                        <li key={w.id} style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.35 }}>
                          {w.summary}
                          <span style={{ color: "#64748b" }}>
                            {" "}
                            · {w.actorLabel ?? w.actor} · {new Date(w.createdAt).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {hat.actions.map((a) =>
                    a.internalPath ? (
                      <Link key={a.label} to={a.internalPath} style={{ fontSize: 11, color: "#38bdf8" }}>
                        {a.label} →
                      </Link>
                    ) : a.href ? (
                      <a
                        key={a.label}
                        href={a.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, color: "#38bdf8" }}
                      >
                        {a.label} ↗
                      </a>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
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

const chipLink: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid rgba(56, 189, 248, 0.35)",
  background: "rgba(56, 189, 248, 0.08)",
  color: "#7dd3fc",
  fontSize: 12,
  textDecoration: "none",
};

const linkRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(148, 163, 184, 0.15)",
  background: "rgba(15, 23, 42, 0.5)",
  textDecoration: "none",
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
