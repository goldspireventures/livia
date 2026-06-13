import type React from "react";
import { NavLink } from "react-router-dom";
import { buildInternalNav } from "../lib/internal-nav";
import type { InternalOpsRole } from "../lib/api";
import { LAYOUT } from "../styles/ops-ui";
import {
  OPS_AMBER,
  OPS_AMBER_BORDER,
  OPS_AMBER_SOFT,
  OPS_BG,
  OPS_BORDER,
  OPS_MUTED,
  OPS_SURFACE,
  OPS_TEXT,
} from "../styles/platform-ops-tokens";

export function InternalShell({
  banner,
  role,
  openTicketCount = 0,
  children,
}: {
  banner?: React.ReactNode;
  role?: InternalOpsRole;
  openTicketCount?: number;
  children?: React.ReactNode;
}) {
  const sections = buildInternalNav(role, { openTicketCount });

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        background: OPS_BG,
        color: OPS_TEXT,
      }}
    >
      <header
        style={{
          borderBottom: `1px solid ${OPS_BORDER}`,
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          background: OPS_SURFACE,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: OPS_AMBER_SOFT,
              color: OPS_AMBER,
              fontSize: 10,
              letterSpacing: "0.1em",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            INTERNAL
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 650 }}>Livia ops</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: OPS_MUTED }}>
              Staff tools — support, tenants, platform
            </p>
          </div>
        </div>
        {banner}
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${LAYOUT.sidebarWidth}px 1fr`,
          minHeight: "calc(100vh - 57px)",
        }}
      >
        <aside
          style={{
            borderRight: `1px solid ${OPS_BORDER}`,
            padding: "16px 12px",
            background: OPS_BG,
            overflowY: "auto",
          }}
          aria-label="Internal navigation"
        >
          {sections.map((section, idx) => (
            <div key={section.id} style={{ marginBottom: idx < sections.length - 1 ? 20 : 0 }}>
              <p
                style={{
                  margin: "0 0 8px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#64748b",
                }}
              >
                {section.label}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/support" || item.to === "/" || item.to === "/home"}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "8px 10px",
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      borderRadius: 8,
                      background: isActive ? OPS_AMBER : "transparent",
                      color: isActive ? OPS_BG : OPS_TEXT,
                      border: `1px solid ${isActive ? OPS_AMBER : "transparent"}`,
                      textDecoration: "none",
                    })}
                  >
                    {({ isActive }) => (
                      <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span>{item.label}</span>
                          {item.badge != null && item.badge > 0 ? (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "1px 7px",
                                borderRadius: 99,
                                background: isActive ? OPS_BG : OPS_AMBER,
                                color: isActive ? OPS_AMBER : OPS_BG,
                                flexShrink: 0,
                              }}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </span>
                        {item.hint ? (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 400,
                              color: isActive ? "rgba(15, 23, 42, 0.75)" : "#64748b",
                              lineHeight: 1.3,
                            }}
                          >
                            {item.hint}
                          </span>
                        ) : null}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <main
          style={{
            padding: LAYOUT.pagePadding,
            overflowX: "auto",
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
