import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearOpsIdentity,
  getOpsSecret,
  getOpsOperator,
  getOpsRole,
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
import { Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { InternalShell } from "./layout/InternalShell";
import { SupportWorkspace } from "./pages/SupportWorkspace";
import { SupportThreadPage } from "./pages/SupportThreadPage";
import { StaffHomePage } from "./pages/StaffHomePage";
import { PlatformHubPage } from "./pages/PlatformHubPage";
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
  const [dismissedTicketBanner, setDismissedTicketBanner] = useState(false);
  const [apiPing, setApiPing] = useState<{ ok: boolean; message: string } | null>(null);
  const role = useMemo(() => getOpsRole(), [secret]);

  const isOnSupport = useMemo(
    () => location.pathname === "/" || location.pathname.startsWith("/support"),
    [location.pathname],
  );

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
    void reloadTickets();
    const id = window.setInterval(() => void reloadTickets(), 60_000);
    return () => window.clearInterval(id);
  }, [secret, reloadTickets]);

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
          style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", width: "100%" }}
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
          <button type="submit" style={{ ...buttonStyle, alignSelf: "flex-start" }}>
            Continue
          </button>
        </form>
      </InternalShell>
    );
  }

  return (
    <InternalShell
      role={role}
      openTicketCount={activeTicketCount}
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

      {activeTicketCount > 0 && !isOnSupport && !dismissedTicketBanner ? (
        <div
          role="status"
          data-testid="open-tickets-banner"
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            borderRadius: 8,
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.45)",
            color: "#fde68a",
            fontSize: 14,
            lineHeight: 1.5,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span>
            <strong>{activeTicketCount}</strong> active support ticket{activeTicketCount === 1 ? "" : "s"} in the
            inbox.
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/support" style={{ ...buttonStyle, textDecoration: "none", fontSize: 13 }}>
              Open inbox
            </Link>
            <button
              type="button"
              style={{ ...buttonStyle, background: "#334155", color: "#e2e8f0", fontSize: 13 }}
              onClick={() => setDismissedTicketBanner(true)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <Routes>
        <Route
          path="/"
          element={
            role === "exec" ? (
              getExecHomePath() === "/" ? (
                <FounderCockpitView />
              ) : (
                <Navigate to={getExecHomePath()} replace />
              )
            ) : (
              <StaffHomePage openTicketCount={activeTicketCount} />
            )
          }
        />
        <Route path="/home" element={<StaffHomePage openTicketCount={activeTicketCount} />} />
        {getExecHomePath() !== "/" ? (
          <Route
            path={getExecHomePath()}
            element={role === "exec" ? <FounderCockpitView /> : <Navigate to="/support" replace />}
          />
        ) : null}
        <Route path="/cockpit" element={<Navigate to="/support" replace />} />

        <Route path="/support" element={<SupportWorkspace />}>
          <Route index element={<SupportThreadPage />} />
          <Route path="board" element={<SupportBoardView />} />
          <Route path="radar" element={<SupportRadarView />} />
          <Route path="investigate" element={<SupportInvestigateView />} />
          <Route path=":ticketId" element={<SupportThreadPage />} />
        </Route>
        <Route path="/support/queue" element={<Navigate to="/support" replace />} />
        <Route
          path="/support/tickets/:ticketId"
          element={<SupportTicketRedirect />}
        />

        <Route path="/knowledge" element={<KnowledgePage />} />

        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/:businessId" element={<TenantsPage />} />

        <Route path="/monitoring" element={<MonitoringView />} />
        <Route path="/continuity" element={<ContinuityTracesView secret={secret} />} />
        <Route path="/platform" element={<PlatformHubPage />} />
        <Route path="/platform/health" element={<PlatformView />} />
        <Route path="/voice" element={<VoiceCastView />} />
        <Route path="/flags" element={<FeatureFlagsView />} />
        <Route path="/reports" element={<WeeklyReportView />} />
        <Route path="/join" element={<WorkforceJoinView role={role} />} />
        <Route path="/access" element={<ImpersonationView />} />

        <Route
          path="*"
          element={
            <Navigate to={role === "exec" ? getExecHomePath() : "/"} replace />
          }
        />
      </Routes>
    </InternalShell>
  );
}

function SupportTicketRedirect() {
  const { ticketId } = useParams();
  return <Navigate to={`/support/${encodeURIComponent(ticketId ?? "")}`} replace />;
}
