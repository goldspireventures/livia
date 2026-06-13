import { Link } from "react-router-dom";
import { InternalPage } from "../components/InternalPage";
import { INTERNAL_PAGES } from "../lib/internal-page-meta";
import { cardStyle, ghostButtonStyle } from "../styles/ops-ui";
import { OPS_MUTED, OPS_TEXT } from "../styles/platform-ops-tokens";

const START_HERE = [
  {
    to: "/support",
    title: "Support inbox",
    body: "Tenant tickets — triage, assign, and investigate.",
    cta: "Open inbox",
  },
  {
    to: "/tenants",
    title: "Find a tenant",
    body: "Search by name or slug — health card and dashboard links.",
    cta: "Search tenants",
  },
  {
    to: "/knowledge",
    title: "Docs & runbooks",
    body: "How we support customers and operate the platform.",
    cta: "Browse docs",
  },
] as const;

const ALSO = [
  { to: "/platform", label: "Platform tools" },
  { to: "/join", label: "Team onboarding" },
  { to: "/access", label: "Tenant access" },
] as const;

export function StaffHomePage({ openTicketCount = 0 }: { openTicketCount?: number }) {
  const meta = INTERNAL_PAGES.home;

  return (
    <InternalPage title={meta.title} subtitle={meta.purpose}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {START_HERE.map((card) => (
          <section key={card.to} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, color: OPS_TEXT }}>{card.title}</h2>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: OPS_MUTED, lineHeight: 1.5 }}>{card.body}</p>
            </div>
            <Link
              to={card.to}
              style={{
                ...ghostButtonStyle,
                textDecoration: "none",
                alignSelf: "flex-start",
              }}
            >
              {card.cta}
              {card.to === "/support" && openTicketCount > 0 ? ` (${openTicketCount})` : ""}
            </Link>
          </section>
        ))}
      </div>

      <p style={{ margin: "8px 0 0", fontSize: 13, color: OPS_MUTED }}>
        Also:{" "}
        {ALSO.map((link, i) => (
          <span key={link.to}>
            {i > 0 ? " · " : null}
            <Link to={link.to} style={{ color: "#38bdf8" }}>
              {link.label}
            </Link>
          </span>
        ))}
      </p>
    </InternalPage>
  );
}
