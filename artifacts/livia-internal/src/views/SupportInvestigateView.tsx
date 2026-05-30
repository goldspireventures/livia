import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SupportSurfaceNav } from "../components/SupportSurfaceNav";
import {
  getRequestTrace,
  listSupportPoints,
  type SupportPointRow,
} from "../lib/api";
import { buttonStyle, inputStyle } from "../styles/ops-ui";

export function SupportInvestigateView() {
  const [params] = useSearchParams();
  const [requestId, setRequestId] = useState(params.get("requestId") ?? "");
  const [surfaceId, setSurfaceId] = useState(params.get("surfaceId") ?? "");
  const [points, setPoints] = useState<SupportPointRow[]>([]);
  const [trace, setTrace] = useState<Awaited<ReturnType<typeof getRequestTrace>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listSupportPoints()
      .then((r) => setPoints(r.data))
      .catch(() => undefined);
  }, []);

  const selectedPoint = points.find((p) => p.surfaceId === surfaceId);

  async function runTrace() {
    const id = requestId.trim();
    if (!id) {
      setErr("Paste a requestId (UUID from API logs or support thread)");
      return;
    }
    setBusy(true);
    setErr(null);
    setTrace(null);
    try {
      const result = await getRequestTrace(id);
      setTrace(result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Trace lookup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SupportSurfaceNav />
      <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>Investigate</h1>
      <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, maxWidth: 560 }}>
        Paste a <code>requestId</code> from Support thread context or API logs. Pick a{" "}
        <code>surfaceId</code> from the registry for runbook hints.
      </p>

      <div style={{ display: "grid", gap: 10, maxWidth: 520, marginTop: 16 }}>
        <label style={{ fontSize: 12, color: "#94a3b8" }}>
          requestId
          <input
            style={{ ...inputStyle, width: "100%", marginTop: 4 }}
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </label>
        <label style={{ fontSize: 12, color: "#94a3b8" }}>
          surfaceId
          <select
            style={{ ...inputStyle, width: "100%", marginTop: 4 }}
            value={surfaceId}
            onChange={(e) => setSurfaceId(e.target.value)}
          >
            <option value="">— optional —</option>
            {points.map((p) => (
              <option key={p.surfaceId} value={p.surfaceId}>
                {p.surfaceId} — {p.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" style={buttonStyle} onClick={() => void runTrace()} disabled={busy}>
          {busy ? "Looking up…" : "Trace requestId"}
        </button>
      </div>

      {err ? <p style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{err}</p> : null}

      {selectedPoint ? (
        <section
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid rgba(148, 163, 184, 0.25)",
            borderRadius: 10,
            fontSize: 12,
            maxWidth: 640,
          }}
        >
          <h2 style={{ fontSize: 14, margin: "0 0 8px", color: "#e2e8f0" }}>{selectedPoint.label}</h2>
          <p style={{ color: "#94a3b8", margin: "0 0 8px" }}>
            Owner: {selectedPoint.owner} · Apps: {selectedPoint.apps.join(", ")}
          </p>
          {selectedPoint.suggestedReply ? (
            <p style={{ color: "#cbd5e1", margin: 0 }}>{selectedPoint.suggestedReply}</p>
          ) : null}
          {selectedPoint.runbook ? (
            <p style={{ margin: "8px 0 0", color: "#64748b" }}>Runbook: {selectedPoint.runbook}</p>
          ) : null}
        </section>
      ) : null}

      {trace ? (
        <section
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid rgba(148, 163, 184, 0.25)",
            borderRadius: 10,
            fontSize: 12,
            maxWidth: 720,
          }}
          data-testid="support-investigate-trace"
        >
          <h2 style={{ fontSize: 14, margin: "0 0 8px", color: "#e2e8f0" }}>Trace {trace.requestId}</h2>
          <p style={{ color: "#94a3b8" }}>{trace.hint}</p>
          {trace.sentrySearchUrl ? (
            <p style={{ marginTop: 8 }}>
              <a href={trace.sentrySearchUrl} target="_blank" rel="noreferrer" style={{ color: "#38bdf8" }}>
                Open in Sentry →
              </a>
            </p>
          ) : null}
          {trace.tenantEvents?.length ? (
            <>
              <h3 style={{ fontSize: 12, color: "#94a3b8", margin: "12px 0 6px" }}>Tenant events</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
                {trace.tenantEvents.map((ev, i) => (
                  <li key={`${ev.type}-${i}`}>
                    {ev.type} · {ev.entityType ?? "—"} · {new Date(ev.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {trace.openTickets?.length ? (
            <>
              <h3 style={{ fontSize: 12, color: "#94a3b8", margin: "12px 0 6px" }}>Open tickets</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
                {trace.openTickets.map((t) => (
                  <li key={t.id}>
                    {t.category} · {t.severity} · {new Date(t.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      <p style={{ fontSize: 12, marginTop: 16 }}>
        <Link to="/support" style={{ color: "#38bdf8" }}>
          ← Back to thread queue
        </Link>
      </p>
    </div>
  );
}
