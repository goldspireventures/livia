import type React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { buttonStyle } from "../styles/ops-ui";
import type { InternalOpsRole } from "../lib/api";
import { getExecHomePath } from "../lib/exec-path";

type NavItem = { to: string; label: string; kind?: "primary" | "meta" };

const navBase: NavItem[] = [
  { to: "/support", label: "Support", kind: "primary" },
  { to: "/knowledge", label: "Atlas (docs)", kind: "primary" },
  { to: "/tenants", label: "Tenants" },
  { to: "/monitoring", label: "Monitoring" },
  { to: "/continuity", label: "Continuity" },
  { to: "/platform", label: "Platform" },
  { to: "/voice", label: "Voice & locales" },
  { to: "/flags", label: "Flags" },
  { to: "/reports", label: "Reports" },
  { to: "/access", label: "Access" },
];

export function InternalShell({
  banner,
  role,
  children,
}: {
  banner?: React.ReactNode;
  role?: InternalOpsRole;
  children?: React.ReactNode;
}) {
  const execHome = getExecHomePath();
  const nav: NavItem[] =
    role === "exec"
      ? [{ to: execHome, label: "Overview", kind: "primary" }, ...navBase]
      : navBase;

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        fontFamily: "system-ui, sans-serif",
        background: "#0f172a",
        color: "#e2e8f0",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid #f59e0b55",
          padding: "18px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 6,
              background: "#f59e0b22",
              color: "#fbbf24",
              fontSize: 12,
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            INTERNAL — audited surface
          </div>
          <h1 style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 650 }}>Livia Internal</h1>
          <p style={{ margin: "6px 0 0", maxWidth: 720, lineHeight: 1.5, color: "#94a3b8", fontSize: 13 }}>
            Company control plane — support queue, tenants, monitoring, flags, and Atlas docs. Operator role on every
            mutation (audited).
          </p>
        </div>
        {banner}
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 18,
          padding: "18px 22px",
          alignItems: "start",
        }}
      >
        <aside
          style={{
            position: "sticky",
            top: 14,
            alignSelf: "start",
            border: "1px solid #334155",
            borderRadius: 12,
            background: "#0b1224",
            padding: 12,
          }}
          aria-label="Internal navigation"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }: { isActive: boolean }) => ({
                  ...buttonStyle,
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 12px",
                  fontSize: 13,
                  background: isActive ? "#f59e0b" : item.kind === "primary" ? "#1e293b" : "#0f172a",
                  color: isActive ? "#0f172a" : "#e2e8f0",
                  textDecoration: "none",
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.45 }}>
            Tip: share deep links like <code>/support/…</code> or <code>/knowledge?doc=…</code>.
          </p>
        </aside>

        <main style={{ maxWidth: 1280 }}>
          {children}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

