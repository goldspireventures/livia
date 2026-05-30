import { Link, useLocation } from "react-router-dom";

const MODES = [
  { to: "/support", label: "Thread" },
  { to: "/support/board", label: "Board" },
  { to: "/support/radar", label: "Radar" },
] as const;

export function SupportSurfaceNav() {
  const { pathname } = useLocation();
  return (
    <nav
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
        flexWrap: "wrap",
      }}
      aria-label="Support layout"
      data-testid="support-surface-nav"
    >
      {MODES.map((mode) => {
        const active =
          mode.to === "/support"
            ? pathname === "/support" ||
              (/^\/support\/[^/]+$/.test(pathname) &&
                pathname !== "/support/board" &&
                pathname !== "/support/radar")
            : pathname.startsWith(mode.to);
        return (
          <Link
            key={mode.to}
            to={mode.to}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              color: active ? "#38bdf8" : "#94a3b8",
              background: active ? "rgba(56, 189, 248, 0.1)" : "transparent",
              border: `1px solid ${active ? "rgba(56, 189, 248, 0.35)" : "rgba(148, 163, 184, 0.2)"}`,
              textDecoration: "none",
            }}
          >
            {mode.label}
          </Link>
        );
      })}
    </nav>
  );
}
