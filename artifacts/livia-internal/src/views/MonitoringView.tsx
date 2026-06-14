import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  acknowledgeAlertFiring,
  backfillDemoLegal,
  createSavedLogSearch,
  ensureDemoReady,
  getMonitoringFlows,
  getMonitoringLogFields,
  getMonitoringLogs,
  getMonitoringLoki,
  getMonitoringActivation,
  getMonitoringOnboarding,
  getMonitoringOverview,
  getPlatformCascadeHealth,
  type PlatformCascadeHealth,
  type PlatformActivationRollup,
  getMonitoringReport,
  getMonitoringSeries,
  getDeliveryOutboxSummary,
  listDeliveryOutbox,
  replayDeliveryOutbox,
  type DeliveryOutboxRow,
  type DeliveryOutboxSummary,
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
import { buttonStyle, cardStyle, inputStyle } from "../styles/ops-ui";
import { InternalPage } from "../components/InternalPage";
import { InternalSubNav } from "../components/InternalSubNav";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { INTERNAL_PAGES } from "../lib/internal-page-meta";

type SubTab =
  | "overview"
  | "alerts"
  | "logs"
  | "flows"
  | "cascade"
  | "onboarding"
  | "tools";

const btn: CSSProperties = {
  ...buttonStyle,
  fontSize: 13,
  padding: "8px 12px",
};

const card: CSSProperties = {
  ...cardStyle,
  padding: 14,
};

const PRIMARY_TABS: Array<{ id: SubTab; label: string; hint: string }> = [
  { id: "overview", label: "Status", hint: "Health now" },
  { id: "alerts", label: "Alerts", hint: "What's firing" },
  { id: "logs", label: "Logs", hint: "Search errors" },
];

const ADVANCED_TABS: Array<{ id: SubTab; label: string; hint: string }> = [
  { id: "flows", label: "Data flows", hint: "Pipeline map" },
  { id: "cascade", label: "Cascade", hint: "Policy ↔ surfaces" },
  { id: "onboarding", label: "Ops checklist", hint: "New operator setup" },
  { id: "tools", label: "Repair tools", hint: "Demo & stress" },
];

async function loadSettled<T>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Request failed" };
  }
}

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
  const [activation, setActivation] = useState<PlatformActivationRollup | null>(null);
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
  const [cascade, setCascade] = useState<PlatformCascadeHealth | null>(null);
  const [logFields, setLogFields] = useState<LogFieldContract | null>(null);
  const [cascadeErr, setCascadeErr] = useState<string | null>(null);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [outboxSummary, setOutboxSummary] = useState<DeliveryOutboxSummary | null>(null);
  const [outboxRows, setOutboxRows] = useState<DeliveryOutboxRow[]>([]);
  const [outboxFilter, setOutboxFilter] = useState<"FAILED" | "PENDING">("FAILED");

  const loadDeliveryOutbox = useCallback(async () => {
    const [sumR, rowsR] = await Promise.all([
      loadSettled(() => getDeliveryOutboxSummary()),
      loadSettled(() => listDeliveryOutbox({ status: outboxFilter, limit: 30 })),
    ]);
    if (sumR.ok) setOutboxSummary(sumR.value);
    if (rowsR.ok) setOutboxRows(rowsR.value);
  }, [outboxFilter]);

  const loadCore = useCallback(async () => {
    setErr(null);
    const [ovR, serR, flR, obR, actR, rulesR, firingsR, savedR, fieldsR] = await Promise.all([
      loadSettled(() => getMonitoringOverview()),
      loadSettled(() => getMonitoringSeries(24)),
      loadSettled(() => getMonitoringFlows()),
      loadSettled(() => getMonitoringOnboarding()),
      loadSettled(() => getMonitoringActivation()),
      loadSettled(() => listAlertRules()),
      loadSettled(() => listAlertFirings(true)),
      loadSettled(() => listSavedLogSearches()),
      loadSettled(() => getMonitoringLogFields()),
    ]);

    if (!ovR.ok) {
      setErr(ovR.error);
      setOverview(null);
      return;
    }

    setOverview(ovR.value);
    const partial: string[] = [];

    if (serR.ok) setSeries(serR.value);
    else partial.push(serR.error);
    if (flR.ok) setFlows(flR.value.flows);
    else partial.push(flR.error);
    if (obR.ok) setOnboarding(obR.value);
    else partial.push(obR.error);
    if (actR.ok) setActivation(actR.value);
    else partial.push(actR.error);
    if (rulesR.ok) setRules(rulesR.value.data);
    else partial.push(rulesR.error);
    if (firingsR.ok) setFirings(firingsR.value.data);
    else partial.push(firingsR.error);
    if (savedR.ok) setSavedSearches(savedR.value.data);
    else partial.push(savedR.error);
    if (fieldsR.ok) setLogFields(fieldsR.value);
    else partial.push(fieldsR.error);

    setErr(partial.length > 0 ? `Some panels unavailable: ${partial.slice(0, 2).join(" · ")}` : null);
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
    if (sub === "tools") void loadDeliveryOutbox();
  }, [sub, outboxFilter, loadDeliveryOutbox]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => void loadCore(), 15_000);
    return () => window.clearInterval(id);
  }, [live, loadCore]);

  useEffect(() => {
    if (sub === "logs") void loadLogs();
  }, [sub, loadLogs]);

  useEffect(() => {
    if (sub !== "cascade") return;
    setCascadeErr(null);
    void getPlatformCascadeHealth()
      .then(setCascade)
      .catch((e) => {
        setCascade(null);
        setCascadeErr(e instanceof Error ? e.message : "Cascade health unavailable");
      });
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

  if (!overview || !obs) {
    return (
      <InternalPage title={INTERNAL_PAGES.monitoring.title} subtitle={INTERNAL_PAGES.monitoring.purpose}>
        {err ? (
          <p style={{ color: "#f87171", lineHeight: 1.5 }} role="alert">
            {err}
          </p>
        ) : (
          <p style={{ color: "#94a3b8" }}>Loading…</p>
        )}
      </InternalPage>
    );
  }

  const alertBadge = overview.alerts.openCount > 0 ? overview.alerts.openCount : undefined;
  const subPurpose =
    sub === "alerts"
      ? INTERNAL_PAGES.monitoringAlerts.purpose
      : sub === "logs"
        ? INTERNAL_PAGES.monitoringLogs.purpose
        : INTERNAL_PAGES.monitoring.purpose;

  return (
    <InternalPage
      wide
      title={INTERNAL_PAGES.monitoring.title}
      subtitle={subPurpose}
      actions={
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <Link to="/platform" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none" }}>
            ← Platform
          </Link>
          <button type="button" style={btn} onClick={() => void loadCore()} disabled={busy}>
            Refresh
          </button>
          <label style={{ fontSize: 12, color: "#94a3b8", display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
            Live (15s)
          </label>
          {onboarding ? (
            <span
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999,
                background: onboarding.ready ? "#064e3b" : "#422006",
                color: onboarding.ready ? "#6ee7b7" : "#fcd34d",
              }}
            >
              Ops readiness {onboarding.score}%
            </span>
          ) : null}
          {grafanaAvailable ? (
            <button
              type="button"
              style={{ ...btn, background: "#334155" }}
              onClick={() => {
                const url = overview.logBackends.grafanaLocalUrl;
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              Grafana ↗
            </button>
          ) : null}
        </div>
      }
    >
      <InternalSubNav
        items={PRIMARY_TABS.map((t) =>
          t.id === "alerts" ? { ...t, badge: alertBadge } : t,
        )}
        activeId={sub}
        onSelect={(id) => setSub(id as SubTab)}
        aria-label="Live status"
      />

      {!PRIMARY_TABS.some((t) => t.id === sub) && !ADVANCED_TABS.some((t) => t.id === sub) ? null : (
        ADVANCED_TABS.some((t) => t.id === sub) ? (
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
            Engineering view — most staff only need <strong>Status</strong>, <strong>Alerts</strong>, or <strong>Logs</strong> above.
          </p>
        ) : null
      )}

      <CollapsibleSection
        title="Engineering tools"
        summary="Data flows, cascade health, ops checklist, and demo repair — expand if you need them."
        defaultOpen={ADVANCED_TABS.some((t) => t.id === sub)}
      >
        <InternalSubNav
          items={ADVANCED_TABS}
          activeId={sub}
          onSelect={(id) => setSub(id as SubTab)}
          secondary
          aria-label="Engineering tools"
        />
      </CollapsibleSection>

      {err ? (
        <p style={{ color: "#fbbf24", margin: 0, fontSize: 13 }} role="status">
          {err}
        </p>
      ) : null}

      {sub === "overview" ? (
        <>
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
              [
                "Activated",
                activation
                  ? `${activation.activatedCount}/${activation.totalBusinesses} (${activation.activationRate}%)`
                  : "—",
                activation ? activation.activationRate >= 10 : true,
              ],
              [
                "Median TTFB",
                activation?.medianTimeToFirstBookingLabel ?? "—",
                true,
              ],
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
        </>
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

      {sub === "cascade" ? (
        cascadeErr ? (
          <p style={{ color: "#f87171", fontSize: 13 }} role="alert">
            {cascadeErr}
          </p>
        ) : cascade ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={card}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Payments automation</div>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
              Booking deposits (`guest_deposit`) confirm appointments across appointment verticals.
              Quote deposits (`guest_quote_deposit`) secure event-vendor dates — booked quote + enquiry +
              Liv prep + in-app notification.
            </p>
            <ul style={{ fontSize: 13, color: "#cbd5e1", margin: "10px 0 0", paddingLeft: 18 }}>
              <li>Guest quote deposits (24h): {cascade.payments.guestQuoteDeposits24h}</li>
              <li>Guest booking deposits (24h): {cascade.payments.guestBookingDeposits24h}</li>
              <li>Stripe: {cascade.payments.stripeConfigured ? "configured" : "not configured"}</li>
            </ul>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Consult-first (event-vendors)</div>
            <ul style={{ fontSize: 13, color: "#cbd5e1", margin: 0, paddingLeft: 18 }}>
              <li>Event-vendor tenants: {cascade.consultFirst.eventVendorTenants}</li>
              <li>Open enquiries: {cascade.consultFirst.openEnquiries}</li>
              <li>Quotes booked (24h): {cascade.consultFirst.bookedQuotes24h}</li>
              <li>Engagement notifications (24h): {cascade.consultFirst.engagementNotifications24h}</li>
            </ul>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Event Operator entitlements</div>
            <ul style={{ fontSize: 13, color: "#cbd5e1", margin: 0, paddingLeft: 18 }}>
              <li>With pack: {cascade.entitlements.eventVendorsWithPack}</li>
              <li>Without pack (upsell): {cascade.entitlements.eventVendorsWithoutPack}</li>
              <li>
                Stripe price configured:{" "}
                {cascade.entitlements.stripeEventOperatorPriceConfigured ? "yes" : "no"}
              </li>
              <li>
                List price: €{Math.round(cascade.entitlements.eventOperatorAddonEurCents / 100)}/mo
              </li>
            </ul>
          </div>
          <div style={card}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Presentation presets (all verticals)</div>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
              Each vertical ships Platform Default + 3 native skins with distinct layout morphs where
              required. Failures block preset handshake CI.
            </p>
            <div style={{ display: "grid", gap: 6 }}>
              {cascade.presentation.map((row) => (
                <div
                  key={row.vertical}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    fontSize: 13,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: row.ok ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.12)",
                    border: `1px solid ${row.ok ? "#065f46" : "#7f1d1d"}`,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{row.vertical}</span>
                  <span style={{ color: "#94a3b8", textAlign: "right" }}>
                    {row.ok ? row.morphs.join(", ") : row.errors.join(" · ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        ) : (
          <p style={{ color: "#94a3b8" }}>Loading cascade health…</p>
        )
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
            <button
              type="button"
              style={{ ...btn, background: "#1e3a5f", color: "#bae6fd" }}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await loadDeliveryOutbox();
                } finally {
                  setBusy(false);
                }
              }}
            >
              Refresh delivery outbox
            </button>
          </div>

          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>
              Message delivery outbox
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#94a3b8" }}>
              SMS, email, and Meta outbound rows from <code>notification_logs</code>. Replay stuck or failed sends without touching tenant bookings.
            </p>
            {outboxSummary ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 13, marginBottom: 12 }}>
                <span>
                  Pending: <strong style={{ color: "#fcd34d" }}>{outboxSummary.pending}</strong>
                </span>
                <span>
                  Failed: <strong style={{ color: "#f87171" }}>{outboxSummary.failed}</strong>
                </span>
                <span>
                  Sent 24h: <strong style={{ color: "#34d399" }}>{outboxSummary.sent24h}</strong>
                </span>
                <span style={{ color: "#64748b" }}>
                  Mode: {outboxSummary.sideEffectsMode}
                </span>
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {(["FAILED", "PENDING"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  style={{
                    ...btn,
                    background: outboxFilter === f ? "#334155" : "transparent",
                    border: "1px solid #334155",
                  }}
                  onClick={() => setOutboxFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            {outboxRows.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>No {outboxFilter.toLowerCase()} rows.</p>
            ) : (
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                    <th>When</th>
                    <th>Tenant</th>
                    <th>Ch</th>
                    <th>Preview</th>
                    <th>Err</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {outboxRows.map((row) => (
                    <tr key={row.id} style={{ borderTop: "1px solid #334155", verticalAlign: "top" }}>
                      <td style={{ paddingTop: 6, whiteSpace: "nowrap" }}>
                        {formatHour(row.createdAt)}
                      </td>
                      <td style={{ paddingTop: 6 }}>{row.businessName ?? row.businessId?.slice(0, 8)}</td>
                      <td style={{ paddingTop: 6 }}>{row.channel}</td>
                      <td style={{ paddingTop: 6, color: "#cbd5e1", maxWidth: 200 }}>
                        {row.preview || "—"}
                      </td>
                      <td style={{ paddingTop: 6, color: "#f87171", maxWidth: 140 }}>
                        {row.error?.slice(0, 60) ?? "—"}
                      </td>
                      <td style={{ paddingTop: 4 }}>
                        <button
                          type="button"
                          style={{ ...btn, fontSize: 11, padding: "4px 8px" }}
                          disabled={busy || row.status === "SENT"}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              const r = await replayDeliveryOutbox(row.id);
                              if (!r.ok) {
                                setErr(r.reason ?? "Replay failed");
                              } else {
                                await loadDeliveryOutbox();
                              }
                            } catch (e) {
                              setErr(e instanceof Error ? e.message : "Replay failed");
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Replay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
    </InternalPage>
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
