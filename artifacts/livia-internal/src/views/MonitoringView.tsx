import { Fragment, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  acknowledgeAlertFiring,
  backfillDemoLegal,
  createSavedLogSearch,
  ensureDemoReady,
  getMonitoringFlows,
  getMonitoringLogFields,
  getMonitoringLogs,
  getMonitoringLoki,
  getMonitoringOnboarding,
  getMonitoringOverview,
  getMonitoringReport,
  getMonitoringSeries,
  listAlertFirings,
  listAlertRules,
  listSavedLogSearches,
  patchAlertRule,
  resolveAlertFiring,
  runStressProbes,
  type AlertFiringRow,
  type AlertRuleRow,
  type DataFlowNode,
  type LogFieldContract,
  type MonitoringOverview,
  type MonitoringReport,
  type MonitoringTimeSeries,
  type OpsOnboardingChecklist,
  type PlatformLogEntry,
  type SavedLogSearchRow,
  type StressProbeResult,
} from "../lib/api";
import { buttonStyle, inputStyle } from "../styles/ops-ui";

type SubTab =
  | "overview"
  | "alerts"
  | "logs"
  | "flows"
  | "reports"
  | "onboarding"
  | "tools";

const btn: CSSProperties = {
  ...buttonStyle,
  fontSize: 13,
  padding: "8px 12px",
};

const card: CSSProperties = {
  padding: 14,
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#0f172a",
};

function BarChart({
  title,
  points,
  color = "#38bdf8",
}: {
  title: string;
  points: Array<{ label: string; value: number }>;
  color?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 72 }}>
        {points.length === 0 ? (
          <span style={{ fontSize: 12, color: "#64748b" }}>No data in window</span>
        ) : (
          points.map((p) => (
            <div
              key={p.label}
              title={`${p.label}: ${p.value}`}
              style={{
                flex: 1,
                minWidth: 6,
                height: `${Math.max(4, (p.value / max) * 100)}%`,
                background: color,
                borderRadius: 3,
                opacity: p.value > 0 ? 1 : 0.25,
              }}
            />
          ))
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "#64748b" }}>
        <span>{points[0]?.label?.slice(11, 16) ?? ""}</span>
        <span>{points[points.length - 1]?.label?.slice(11, 16) ?? ""}</span>
      </div>
    </div>
  );
}

function formatHour(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IE", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

function flowColor(status: DataFlowNode["status"]): string {
  if (status === "healthy") return "#34d399";
  if (status === "degraded") return "#fbbf24";
  if (status === "down") return "#f87171";
  return "#94a3b8";
}

export function MonitoringView() {
  const [sub, setSub] = useState<SubTab>("overview");
  const [overview, setOverview] = useState<MonitoringOverview | null>(null);
  const [series, setSeries] = useState<MonitoringTimeSeries | null>(null);
  const [flows, setFlows] = useState<DataFlowNode[]>([]);
  const [onboarding, setOnboarding] = useState<OpsOnboardingChecklist | null>(null);
  const [logs, setLogs] = useState<PlatformLogEntry[]>([]);
  const [lokiLines, setLokiLines] = useState<Array<{ timestamp: string; line: string }>>([]);
  const [lokiMeta, setLokiMeta] = useState<{ configured: boolean; error?: string; hint?: string }>({
    configured: false,
  });
  const [stress, setStress] = useState<StressProbeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(true);

  const [logQ, setLogQ] = useState("");
  const [logLevel, setLogLevel] = useState("");
  const [logSource, setLogSource] = useState("");
  const [logHours, setLogHours] = useState("24");
  const [logBackend, setLogBackend] = useState<"platform" | "loki">("platform");
  const [tenantFilter, setTenantFilter] = useState("");
  const [requestIdFilter, setRequestIdFilter] = useState("");
  const [rules, setRules] = useState<AlertRuleRow[]>([]);
  const [firings, setFirings] = useState<AlertFiringRow[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedLogSearchRow[]>([]);
  const [report, setReport] = useState<MonitoringReport | null>(null);
  const [logFields, setLogFields] = useState<LogFieldContract | null>(null);
  const [saveSearchName, setSaveSearchName] = useState("");

  const loadCore = useCallback(async () => {
    setErr(null);
    try {
      const [ov, ser, fl, ob, rulesRes, firingsRes, saved, fields] = await Promise.all([
        getMonitoringOverview(),
        getMonitoringSeries(24),
        getMonitoringFlows(),
        getMonitoringOnboarding(),
        listAlertRules(),
        listAlertFirings(true),
        listSavedLogSearches(),
        getMonitoringLogFields(),
      ]);
      setOverview(ov);
      setSeries(ser);
      setFlows(fl.flows);
      setOnboarding(ob);
      setRules(rulesRes.data);
      setFirings(firingsRes.data);
      setSavedSearches(saved.data);
      setLogFields(fields);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Monitoring load failed");
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setErr(null);
    try {
      if (logBackend === "loki") {
        const ext = await getMonitoringLoki({
          q: logQ || undefined,
          tenantId: tenantFilter || undefined,
          requestId: requestIdFilter || undefined,
          level: logLevel || undefined,
          hours: Number.parseInt(logHours, 10) || 6,
        });
        setLokiMeta({
          configured: ext.configured,
          error: ext.error,
          hint: ext.queryHint,
        });
        setLokiLines(ext.lines.map((l) => ({ timestamp: l.timestamp, line: l.line })));
        setLogs([]);
      } else {
        const res = await getMonitoringLogs({
          q: logQ || undefined,
          level: logLevel || undefined,
          source: logSource || undefined,
          businessId: tenantFilter || undefined,
          requestId: requestIdFilter || undefined,
          hours: Number.parseInt(logHours, 10) || 24,
        });
        setLogs(res.entries);
        setLokiLines([]);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Log search failed");
    }
  }, [logBackend, logHours, logLevel, logQ, logSource, requestIdFilter, tenantFilter]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => void loadCore(), 15_000);
    return () => window.clearInterval(id);
  }, [live, loadCore]);

  useEffect(() => {
    if (sub === "logs") void loadLogs();
  }, [sub, loadLogs]);

  useEffect(() => {
    if (sub !== "reports") return;
    void getMonitoringReport().then(setReport).catch(() => setReport(null));
  }, [sub]);

  const bookingChart = useMemo(() => {
    const pts = series?.bookings ?? [];
    return pts.slice(-24).map((p) => ({
      label: p.hour,
      value: p.count,
    }));
  }, [series]);

  const errorChart = useMemo(() => {
    const pts = series?.eventsByLevel ?? [];
    return pts.slice(-24).map((p) => ({
      label: p.hour,
      value: p.ERROR + p.WARN,
    }));
  }, [series]);

  const obs = overview?.observability;
  const grafanaAvailable = Boolean(overview?.logBackends?.grafanaLocalUrl);

  async function handleEnsureDemo() {
    setBusy(true);
    try {
      const r = await ensureDemoReady();
      await loadCore();
      alert(r.actions.join("\n"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Repair failed");
    } finally {
      setBusy(false);
    }
  }

  if (err && !overview) return <p style={{ color: "#f87171" }}>{err}</p>;
  if (!overview || !obs) return <p style={{ color: "#94a3b8" }}>Loading monitoring…</p>;

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1100 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {(
          [
            ["overview", "Overview"],
            ["alerts", `Alerts${overview.alerts.openCount ? ` (${overview.alerts.openCount})` : ""}`],
            ["logs", "Log explorer"],
            ["flows", "Data flows"],
            ["reports", "Reports"],
            ["onboarding", "Onboarding"],
            ["tools", "Tools"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            style={{
              ...btn,
              background: sub === id ? "#0ea5e9" : "#334155",
              color: sub === id ? "#0f172a" : "#e2e8f0",
            }}
            onClick={() => setSub(id)}
          >
            {label}
          </button>
        ))}
        {grafanaAvailable ? (
          <button
            key="grafana-optional"
            type="button"
            style={{
              ...btn,
              background: "#334155",
              color: "#e2e8f0",
            }}
            onClick={() => {
              const url = overview.logBackends.grafanaLocalUrl;
              if (url) window.open(url, "_blank", "noopener,noreferrer");
            }}
            title="Optional: open Grafana in a new tab"
          >
            Grafana (optional)
          </button>
        ) : null}
        <button type="button" style={btn} onClick={() => void loadCore()} disabled={busy}>
          Refresh
        </button>
        <label style={{ fontSize: 12, color: "#94a3b8", display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
          Live (15s)
        </label>
        {onboarding && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              background: onboarding.ready ? "#064e3b" : "#422006",
              color: onboarding.ready ? "#6ee7b7" : "#fcd34d",
            }}
          >
            Ops readiness {onboarding.score}%
          </span>
        )}
      </div>

      {err ? (
        <p style={{ color: "#f87171", margin: 0 }} role="alert">
          {err}
        </p>
      ) : null}

      {sub === "overview" ? (
        <Fragment>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {[
              ["DB", obs.database.ok ? `${obs.database.latencyMs}ms` : "DOWN", obs.database.ok],
              ["Bookings today", String(obs.traffic.bookingsToday), true],
              ["Open convos", String(obs.traffic.conversationsOpen), true],
              ["Msgs 24h", String(obs.traffic.messagesLast24h), true],
              ["Failed msgs", String(obs.traffic.messagesFailed24h), obs.traffic.messagesFailed24h < 5],
              ["Events 15m", String(overview.live.eventsLast15m), true],
              ["Tenants", String(obs.tenantCount), true],
              ["Tickets open", String(obs.support.ticketsOpen), obs.support.ticketsOpen < 50],
            ].map(([k, v, ok], i) => (
              <div key={`metric-${i}`} style={{ ...card, borderColor: ok ? "#334155" : "#7f1d1d" }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>{k}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: ok ? "#e2e8f0" : "#fca5a5" }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <BarChart title="Bookings per hour (24h)" points={bookingChart} color="#38bdf8" />
            <BarChart title="Warnings + errors per hour" points={errorChart} color="#f87171" />
          </div>

          {overview.alerts.openFirings.length > 0 ? (
            <div style={{ ...card, borderColor: "#7f1d1d" }}>
              <div style={{ fontSize: 12, color: "#fca5a5", marginBottom: 8 }}>
                Persisted alert rules firing ({overview.alerts.openCount} open)
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {overview.alerts.openFirings.map((f) => (
                  <li key={f.id} style={{ color: "#e2e8f0", marginBottom: 4 }}>
                    <strong style={{ color: f.severity === "critical" ? "#fca5a5" : "#fcd34d" }}>
                      {f.ruleName}
                    </strong>
                    : {f.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {obs.alerts.length > 0 ? (
            <div style={card}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Proactive alerts</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#e2e8f0" }}>
                {obs.alerts.map((a, i) => (
                  <li key={i} style={{ color: a.level === "critical" ? "#fca5a5" : "#fcd34d" }}>
                    {a.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: 13 }}>No active alerts — keep live refresh on.</p>
          )}

          <div style={{ ...card, fontSize: 12, color: "#94a3b8" }}>
            <strong style={{ color: "#e2e8f0" }}>Log backends:</strong>{" "}
            Loki push {overview.logBackends.lokiPush ? "✓" : "—"} · query{" "}
            {overview.logBackends.lokiQuery ? "✓" : "—"} · OpenObserve{" "}
            {overview.logBackends.openObserve ? "✓" : "—"}
            {overview.logBackends.grafanaLocalUrl ? (
              <>
                {" "}
                ·{" "}
                <a
                  href={overview.logBackends.grafanaLocalUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#38bdf8" }}
                  title="Grafana is optional — built-in tabs are the source of truth."
                >
                  Grafana (optional)
                </a>
              </>
            ) : null}
          </div>
        </Fragment>
      ) : null}

      {sub === "logs" ? (
        <div style={{ display: "grid", gap: 12 }}>
          {savedSearches.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Saved:</span>
              {savedSearches.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  style={{
                    ...btn,
                    background: "#1e293b",
                    color: "#38bdf8",
                    padding: "4px 10px",
                    fontSize: 12,
                  }}
                  onClick={() => {
                    const q = s.queryJson as Record<string, string>;
                    setLogBackend(s.backend === "loki" ? "loki" : "platform");
                    setLogQ(String(q.q ?? ""));
                    setLogLevel(String(q.level ?? ""));
                    setLogSource(String(q.source ?? ""));
                    setTenantFilter(String(q.businessId ?? ""));
                    setRequestIdFilter(String(q.requestId ?? ""));
                    if (q.hours) setLogHours(String(q.hours));
                    void loadLogs();
                  }}
                >
                  {s.name}
                </button>
              ))}
              <input
                style={{ ...inputStyle, width: 140, padding: "4px 8px", fontSize: 12 }}
                placeholder="Save as…"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
              />
              <button
                type="button"
                style={{ ...btn, fontSize: 12, padding: "4px 10px" }}
                disabled={!saveSearchName.trim()}
                onClick={async () => {
                  await createSavedLogSearch({
                    name: saveSearchName.trim(),
                    backend: logBackend === "loki" ? "loki" : "platform",
                    queryJson: {
                      q: logQ,
                      level: logLevel,
                      source: logSource,
                      businessId: tenantFilter,
                      requestId: requestIdFilter,
                      hours: Number.parseInt(logHours, 10),
                    },
                    pinned: true,
                  });
                  setSaveSearchName("");
                  const saved = await listSavedLogSearches();
                  setSavedSearches(saved.data);
                }}
              >
                Pin search
              </button>
            </div>
          ) : null}
          {logFields ? (
            <details style={card}>
              <summary style={{ cursor: "pointer", color: "#94a3b8", fontSize: 13 }}>
                Log field contract (Loki / OpenObserve / ES)
              </summary>
              <p style={{ fontSize: 12, color: "#64748b", margin: "8px 0" }}>
                Stream: <code>{logFields.stream}</code> · Fields:{" "}
                {logFields.recommendedIndexFields.join(", ")}
              </p>
              <pre style={{ fontSize: 11, color: "#94a3b8", overflow: "auto" }}>
                {logFields.logqlExamples.join("\n")}
              </pre>
            </details>
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <input
              style={{ ...inputStyle, minWidth: 200, flex: 1 }}
              placeholder="Search text, type, request_id…"
              value={logQ}
              onChange={(e) => setLogQ(e.target.value)}
            />
            <input
              style={{ ...inputStyle, width: 280 }}
              placeholder="Tenant businessId (optional)"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
            />
            <input
              style={{ ...inputStyle, width: 280 }}
              placeholder="request_id UUID (optional)"
              value={requestIdFilter}
              onChange={(e) => setRequestIdFilter(e.target.value)}
            />
            <select
              style={inputStyle}
              value={logBackend}
              onChange={(e) => setLogBackend(e.target.value as "platform" | "loki")}
            >
              <option value="platform">Platform DB (events + notifications + SMS)</option>
              <option value="loki">Loki / OpenObserve (JSON logs)</option>
            </select>
            <select style={inputStyle} value={logLevel} onChange={(e) => setLogLevel(e.target.value)}>
              <option value="">All levels</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
            <select style={inputStyle} value={logSource} onChange={(e) => setLogSource(e.target.value)} disabled={logBackend !== "platform"}>
              <option value="">All sources</option>
              <option value="api">api</option>
              <option value="workflow">workflow</option>
            </select>
            <select style={inputStyle} value={logHours} onChange={(e) => setLogHours(e.target.value)}>
              <option value="6">6h</option>
              <option value="24">24h</option>
              <option value="72">72h</option>
            </select>
            <button type="button" style={btn} onClick={() => void loadLogs()} disabled={busy}>
              Search
            </button>
          </div>

          {logBackend === "loki" && !lokiMeta.configured ? (
            <p style={{ color: "#fcd34d", fontSize: 13 }}>
              Loki not configured. Run <code>pnpm observability:up</code> and set{" "}
              <code>LOKI_PUSH_URL</code> + restart API. LogQL hint:{" "}
              <code>{lokiMeta.hint ?? '{service="api-server"} | json'}</code>
            </p>
          ) : null}
          {lokiMeta.error ? <p style={{ color: "#f87171" }}>{lokiMeta.error}</p> : null}

          <div
            style={{
              ...card,
              maxHeight: 480,
              overflow: "auto",
              fontFamily: "ui-monospace, monospace",
              fontSize: 12,
            }}
          >
            {logBackend === "platform"
              ? logs.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid #1e293b",
                      color: row.level === "ERROR" ? "#fca5a5" : "#cbd5e1",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>{row.timestamp.slice(0, 19)}</span>{" "}
                    <span style={{ color: "#38bdf8" }}>[{row.source}]</span>{" "}
                    <span style={{ color: "#a78bfa" }}>{row.level}</span> {row.summary}
                    {row.businessId ? (
                      <span style={{ color: "#64748b" }}> · tenant {row.businessId.slice(0, 8)}…</span>
                    ) : null}
                    {row.context ? (
                      <pre style={{ margin: "4px 0 0", color: "#64748b", whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(row.context, null, 2).slice(0, 400)}
                      </pre>
                    ) : null}
                  </div>
                ))
              : lokiLines.map((row, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
                    <span style={{ color: "#64748b" }}>{row.timestamp.slice(0, 19)}</span> {row.line}
                  </div>
                ))}
            {logBackend === "platform" && logs.length === 0 ? (
              <span style={{ color: "#64748b" }}>No platform log rows — widen window or clear filters.</span>
            ) : null}
            {logBackend === "loki" && lokiLines.length === 0 && lokiMeta.configured ? (
              <span style={{ color: "#64748b" }}>No Loki lines — is API pushing logs?</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {sub === "alerts" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
            Persisted rules evaluate on every overview refresh. Acknowledge or resolve firings to
            clear the queue.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <section>
              <h3 style={{ fontSize: 14, color: "#94a3b8" }}>Rules ({rules.length})</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {rules.map((r) => (
                  <li key={r.id} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{r.name}</strong>
                      <span style={{ fontSize: 11, color: r.enabled ? "#34d399" : "#64748b" }}>
                        {r.enabled ? "on" : "off"}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0" }}>
                      {r.metricKey} {r.operator} {r.threshold} · {r.severity}
                    </p>
                    <button
                      type="button"
                      style={{ ...btn, fontSize: 11, padding: "4px 8px" }}
                      onClick={async () => {
                        await patchAlertRule(r.id, { enabled: !r.enabled });
                        const res = await listAlertRules();
                        setRules(res.data);
                      }}
                    >
                      Toggle
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 style={{ fontSize: 14, color: "#94a3b8" }}>Open firings</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {firings.length === 0 ? (
                  <li style={{ color: "#64748b", fontSize: 13 }}>No open firings</li>
                ) : (
                  firings.map((f) => (
                    <li key={f.id} style={{ ...card, borderColor: "#7f1d1d" }}>
                      <div style={{ fontWeight: 600, color: "#fca5a5" }}>{f.ruleName}</div>
                      <p style={{ fontSize: 12, margin: "4px 0" }}>{f.message}</p>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          style={{ ...btn, fontSize: 11 }}
                          onClick={async () => {
                            await acknowledgeAlertFiring(f.id);
                            await loadCore();
                          }}
                        >
                          Ack
                        </button>
                        <button
                          type="button"
                          style={{ ...btn, background: "#334155", color: "#e2e8f0", fontSize: 11 }}
                          onClick={async () => {
                            await resolveAlertFiring(f.id);
                            await loadCore();
                          }}
                        >
                          Resolve
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </div>
      ) : null}

      {/* Grafana intentionally treated as optional and opened externally (no iframes here). */}

      {sub === "reports" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <button
            type="button"
            style={btn}
            onClick={() => void getMonitoringReport().then(setReport)}
          >
            Generate report
          </button>
          {report ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {(["api", "database", "logSink"] as const).map((k) => (
                  <div key={k} style={card}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{k}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, textTransform: "capitalize" }}>
                      {report.uptime[k].replace("_", " ")}
                    </div>
                  </div>
                ))}
              </div>
              <div style={card}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Live metrics</div>
                <pre style={{ margin: 0, fontSize: 12, color: "#cbd5e1" }}>
                  {JSON.stringify(report.metrics, null, 2)}
                </pre>
              </div>
              {report.topErrorTypes.length > 0 ? (
                <div style={card}>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Top ERROR event types (24h)</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {report.topErrorTypes.map((e) => (
                      <li key={e.type}>
                        {e.type}: {e.count}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p style={{ fontSize: 11, color: "#64748b" }}>Generated {report.generatedAt}</p>
            </>
          ) : (
            <p style={{ color: "#64748b" }}>Click generate for ops snapshot.</p>
          )}
        </div>
      ) : null}

      {sub === "flows" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {flows.map((f) => (
            <div
              key={f.id}
              style={{
                ...card,
                display: "grid",
                gridTemplateColumns: "8px 1fr auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 48,
                  borderRadius: 4,
                  background: flowColor(f.status),
                }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{f.detail}</div>
                {f.lastActivityAt ? (
                  <div style={{ fontSize: 11, color: "#64748b" }}>Last: {formatHour(f.lastActivityAt)}</div>
                ) : null}
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
                {f.count24h} / 24h
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {sub === "onboarding" ? (
        <div style={{ display: "grid", gap: 12 }}>
          {onboarding ? (
            <>
              <p style={{ color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Complete this checklist before handing the internal portal to a new operator. Score{" "}
                <strong style={{ color: "#e2e8f0" }}>{onboarding.score}%</strong>
                {onboarding.ready ? " — ready for daily ops." : " — finish required items first."}
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {onboarding.checks.map((c) => (
                  <li key={c.id} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{c.label}</span>
                      <StatusPill status={c.status} />
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>{c.detail}</p>
                    {c.action ? (
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#38bdf8" }}>{c.action}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <button type="button" style={btn} disabled={busy} onClick={() => void handleEnsureDemo()}>
                Repair demo ops data (dev)
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {sub === "tools" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              style={btn}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  setStress(await runStressProbes());
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Probes failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Run stress probes
            </button>
            <button
              type="button"
              style={{ ...btn, background: "#334155", color: "#e2e8f0" }}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await backfillDemoLegal();
                  await loadCore();
                  alert(
                    `Identities: ${r.accounts} accounts · ${r.clerkCreated} Clerk · ${r.updated} legal`,
                  );
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Backfill failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sync demo identities
            </button>
          </div>
          {stress ? (
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                  <th>Probe</th>
                  <th>OK</th>
                  <th>ms</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {stress.probes.map((p) => (
                  <tr key={p.name} style={{ borderTop: "1px solid #334155" }}>
                    <td>{p.name}</td>
                    <td style={{ color: p.ok ? "#34d399" : "#f87171" }}>{p.ok ? "yes" : "no"}</td>
                    <td>{p.durationMs}</td>
                    <td style={{ color: "#94a3b8" }}>{p.detail ?? p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: OpsOnboardingChecklist["checks"][0]["status"] }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    pass: { bg: "#064e3b", fg: "#6ee7b7" },
    warn: { bg: "#422006", fg: "#fcd34d" },
    fail: { bg: "#450a0a", fg: "#fca5a5" },
    manual: { bg: "#1e3a5f", fg: "#7dd3fc" },
  };
  const c = colors[status] ?? colors.manual;
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: c.bg, color: c.fg }}>
      {status}
    </span>
  );
}
