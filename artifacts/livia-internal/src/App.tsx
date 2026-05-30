import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearOpsIdentity,
  getOpsSecret,
  getOpsOperator,
  getOpsRole,
  getRequestTrace,
  internalLivAssist,
  listSupportTickets,
  pingInternalApi,
  setOpsIdentity,
  INTERNAL_OPS_ROLES,
  type InternalOpsRole,
} from "./lib/api";
import { PlatformView } from "./views/PlatformView";
import { VoiceCastView } from "./views/VoiceCastView";
import { ContinuityTracesView } from "./views/ContinuityTracesView";
import { MonitoringView } from "./views/MonitoringView";
import { FeatureFlagsView } from "./views/FeatureFlagsView";
import { WeeklyReportView } from "./views/WeeklyReportView";
import { ImpersonationView } from "./views/ImpersonationView";
import { FounderCockpitView } from "./views/FounderCockpitView";
import { getExecHomePath } from "./lib/exec-path";
import { buttonStyle, inputStyle } from "./styles/ops-ui";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { InternalShell } from "./layout/InternalShell";
import { SupportPage } from "./pages/SupportPage";
import { SupportBoardView } from "./views/SupportBoardView";
import { SupportRadarView } from "./views/SupportRadarView";
import { SupportInvestigateView } from "./views/SupportInvestigateView";
import { KnowledgePage } from "./pages/KnowledgePage";
import { TenantsPage } from "./pages/TenantsPage";
import { OnboardingExperiencePickerView } from "./views/OnboardingExperiencePickerView";
import { WorkforceJoinView } from "./views/WorkforceJoinView";
import { PlatformSurfacesPickerView } from "./views/PlatformSurfacesPickerView";

const ONBOARDING_PICKER_PATH = "/experience/onboarding-picker";
const PLATFORM_SURFACES_PICKER_PATH = "/experience/platform-surfaces";

export function App() {
  const location = useLocation();
  const [secret, setSecretState] = useState(() => getOpsSecret());
  const [activeTicketCount, setActiveTicketCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [apiPing, setApiPing] = useState<{ ok: boolean; message: string } | null>(null);
  const navigate = useNavigate();
  const role = useMemo(() => getOpsRole(), [secret]);

  const isOnSupport = useMemo(() => location.pathname === "/" || location.pathname.startsWith("/support"), [location.pathname]);

  useEffect(() => {
    if (!secret) {
      setApiPing(null);
      return;
    }
    let cancelled = false;
    const run = () => {
      void pingInternalApi().then((r) => {
        if (!cancelled) setApiPing(r);
      });
    };
    run();
    const id = window.setInterval(run, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [secret]);

  const reloadTickets = useCallback(async () => {
    try {
      const r = await listSupportTickets({ status: "open,triaged" });
      setActiveTicketCount(r.total);
      return r.total;
    } catch {
      setActiveTicketCount(0);
      return 0;
    }
  }, []);

  useEffect(() => {
    if (!secret) return;
    void reloadTickets().then((n) => {
      if (n > 0 && !isOnSupport) navigate("/support");
    });
  }, [secret, reloadTickets, navigate, isOnSupport]);

  if (import.meta.env.DEV && location.pathname === ONBOARDING_PICKER_PATH) {
    return <OnboardingExperiencePickerView />;
  }

  if (import.meta.env.DEV && location.pathname === PLATFORM_SURFACES_PICKER_PATH) {
    return <PlatformSurfacesPickerView />;
  }

  if (!secret) {
    return (
      <InternalShell>
        <h2 style={{ fontSize: 18 }}>Sign in (service token)</h2>
        <p style={{ color: "#94a3b8", lineHeight: 1.5, maxWidth: 480 }}>
          Paste <code>INTERNAL_OPS_SECRET</code>. Also set your <strong>operator email</strong> and{" "}
          <strong>role</strong> — required for ticket updates (audited). Not tenant Clerk.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const v = String(fd.get("secret") ?? "").trim();
            const op = String(fd.get("operator") ?? "").trim();
            const role = String(fd.get("role") ?? "engineer") as InternalOpsRole;
            if (v && op) {
              setOpsIdentity(v, op, role);
              setSecretState(v);
            }
          }}
        >
          <input
            name="secret"
            type="password"
            placeholder="X-Internal-Ops-Secret"
            style={{ ...inputStyle, width: "100%", marginBottom: 8 }}
            autoComplete="off"
          />
          <input
            name="operator"
            type="email"
            placeholder="projectlazarus@livia-hq.com"
            defaultValue={getOpsOperator() || "projectlazarus@livia-hq.com"}
            style={{ ...inputStyle, width: "100%", marginBottom: 8 }}
            required
          />
          <select name="role" defaultValue={getOpsRole()} style={{ ...inputStyle, width: "100%", marginBottom: 12 }}>
            {INTERNAL_OPS_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" style={buttonStyle}>
            Continue
          </button>
        </form>
      </InternalShell>
    );
  }

  return (
    <InternalShell
      role={role}
      banner={
        <button
          type="button"
          onClick={() => {
            clearOpsIdentity();
            setSecretState("");
          }}
          style={{ ...buttonStyle, background: "#334155", color: "#e2e8f0" }}
        >
          Lock
        </button>
      }
    >
      {apiPing && !apiPing.ok ? (
        <div
          role="alert"
          data-testid="api-connection-error"
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            borderRadius: 8,
            background: "#7f1d1d",
            border: "1px solid #f87171",
            color: "#fecaca",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <strong>API not reachable.</strong> {apiPing.message}
        </div>
      ) : null}

      <Routes>
        <Route
          path="/"
          element={
            role === "exec" && getExecHomePath() === "/" ? (
              <FounderCockpitView />
            ) : (
              <Navigate to="/support" replace />
            )
          }
        />
        {getExecHomePath() !== "/" ? (
          <Route
            path={getExecHomePath()}
            element={role === "exec" ? <FounderCockpitView /> : <Navigate to="/support" replace />}
          />
        ) : null}
        <Route path="/cockpit" element={<Navigate to="/support" replace />} />

        <Route
          path="/support"
          element={
            <>
              <RequestTracePanel />
              <SupportPage />
            </>
          }
        />
        <Route
          path="/support/:ticketId"
          element={
            <>
              <RequestTracePanel />
              <SupportPage />
            </>
          }
        />

        <Route
          path="/support/queue"
          element={<Navigate to="/support" replace />}
        />
        <Route
          path="/support/tickets/:ticketId"
          element={
            <>
              <RequestTracePanel />
              <SupportPage />
            </>
          }
        />
        <Route
          path="/support/investigate"
          element={
            <>
              <RequestTracePanel />
              <SupportInvestigateView />
            </>
          }
        />

        <Route
          path="/support/board"
          element={
            <>
              <RequestTracePanel />
              <SupportBoardView />
            </>
          }
        />
        <Route
          path="/support/radar"
          element={
            <>
              <RequestTracePanel />
              <SupportRadarView />
            </>
          }
        />

        <Route path="/knowledge" element={<KnowledgePage />} />

        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/:businessId" element={<TenantsPage />} />

        <Route path="/monitoring" element={<MonitoringView />} />
        <Route path="/continuity" element={<ContinuityTracesView secret={secret} />} />
        <Route path="/platform" element={<PlatformView />} />
        <Route path="/voice" element={<VoiceCastView />} />
        <Route path="/flags" element={<FeatureFlagsView />} />
        <Route path="/reports" element={<WeeklyReportView />} />
        <Route path="/join" element={<WorkforceJoinView role={role} />} />
        <Route path="/access" element={<ImpersonationView />} />

        <Route
          path="*"
          element={
            <Navigate to={role === "exec" ? getExecHomePath() : "/support"} replace />
          }
        />
      </Routes>
    </InternalShell>
  );
}

function RequestTracePanel({ businessId }: { businessId?: string }) {
  const [requestId, setRequestId] = useState("");
  const [trace, setTrace] = useState<Awaited<ReturnType<typeof getRequestTrace>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 10,
        border: "1px solid #334155",
        background: "#0f172a",
      }}
    >
      <h3 style={{ fontSize: 13, color: "#fbbf24", margin: "0 0 8px" }}>Trace by request ID</h3>
      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.45 }}>
        Paste <code>requestId</code> from a tenant error toast or API JSON. Logs use the same field.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
          placeholder="550e8400-e29b-41d4-a716-446655440000"
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
        />
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            setErr(null);
            void getRequestTrace(requestId.trim(), businessId)
              .then(setTrace)
              .catch((e) => {
                setTrace(null);
                setErr(e instanceof Error ? e.message : "Trace failed");
              });
          }}
        >
          Lookup
        </button>
      </div>
      {err ? <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{err}</p> : null}
      {trace ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
          <p style={{ margin: "0 0 6px" }}>{trace.hint}</p>
          {trace.sentrySearchUrl ? (
            <p style={{ margin: "0 0 6px" }}>
              <a href={trace.sentrySearchUrl} target="_blank" rel="noreferrer">
                Open in Sentry
              </a>
            </p>
          ) : null}
          {trace.openTickets.length > 0 ? (
            <p style={{ margin: 0 }}>Open tickets: {trace.openTickets.length}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LivAssistPanel({ focusBusinessId }: { focusBusinessId: string }) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div
      style={{
        marginTop: 16,
        border: "1px solid #334155",
        borderRadius: 12,
        padding: 14,
        background: "#0f172a",
      }}
    >
      <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#fbbf24" }}>Liv assist (internal)</h3>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
        Read-only tenant tools: search directory, snapshot health. Does not modify tenant data.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {[
          `Health snapshot for ${focusBusinessId}`,
          "Why might bookings be low this week?",
          "Which tenants have AI disabled?",
        ].map((s) => (
          <button
            key={s}
            type="button"
            style={{
              ...buttonStyle,
              fontSize: 11,
              padding: "6px 10px",
              background: "#1e293b",
            }}
            onClick={() => setMessage(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = message.trim();
          if (!q) return;
          setBusy(true);
          setErr(null);
          void internalLivAssist({ message: q, focusBusinessId })
            .then((r) => {
              setReply(r.reply);
              if (r.suggestions?.length) setMessage(r.suggestions[0] ?? "");
            })
            .catch((ex) => setErr(ex instanceof Error ? ex.message : "Failed"))
            .finally(() => setBusy(false));
        }}
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Summarize billing and last booking for this tenant"
          rows={3}
          style={{ ...inputStyle, width: "100%", resize: "vertical", marginBottom: 8 }}
        />
        <button type="submit" style={buttonStyle} disabled={busy}>
          {busy ? "Thinking…" : "Ask Liv"}
        </button>
      </form>
      {err ? (
        <p style={{ color: "#f87171", fontSize: 12, marginTop: 10 }} role="alert">
          {err}
        </p>
      ) : null}
      {reply ? (
        <pre
          style={{
            marginTop: 12,
            fontSize: 12,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            color: "#e2e8f0",
            background: "#1e293b",
            padding: 10,
            borderRadius: 8,
            maxHeight: 240,
            overflow: "auto",
          }}
        >
          {reply}
        </pre>
      ) : null}
    </div>
  );
}
