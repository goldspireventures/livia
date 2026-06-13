import { Link } from "react-router-dom";
import { InternalPage } from "../components/InternalPage";
import { INTERNAL_PAGES } from "../lib/internal-page-meta";
import { ghostButtonStyle, cardStyle } from "../styles/ops-ui";
import { OPS_MUTED, OPS_TEXT } from "../styles/platform-ops-tokens";

const TOOLS = [
  {
    to: "/monitoring",
    title: "Live status",
    when: "Daily health check — DB, bookings, traffic, alerts.",
    cta: "Open dashboard",
  },
  {
    to: "/flags",
    title: "Feature flags",
    when: "Enable or disable a feature for one tenant.",
    cta: "Manage flags",
  },
  {
    to: "/reports",
    title: "Weekly report",
    when: "Monday platform summary for leadership.",
    cta: "View report",
  },
  {
    to: "/continuity",
    title: "Booking continuity",
    when: "Bookings stuck waiting on customer follow-up.",
    cta: "View traces",
  },
  {
    to: "/platform/health",
    title: "Integrations",
    when: "Stripe, Clerk, API version — quick config snapshot.",
    cta: "Check integrations",
  },
  {
    to: "/voice",
    title: "Locales",
    when: "Which languages and voice packs are production-ready.",
    cta: "View locales",
  },
] as const;

export function PlatformHubPage() {
  const meta = INTERNAL_PAGES.platform;

  return (
    <InternalPage title={meta.title} subtitle={meta.purpose}>
      <p style={{ margin: 0, fontSize: 14, color: OPS_MUTED, maxWidth: 560, lineHeight: 1.55 }}>
        Most support work happens in <Link to="/support">Support</Link> and{" "}
        <Link to="/tenants">Tenants</Link>. Use these when engineering or ops needs deeper signals.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {TOOLS.map((tool) => (
          <section key={tool.to} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, color: OPS_TEXT }}>{tool.title}</h2>
            <p style={{ margin: 0, fontSize: 13, color: OPS_MUTED, lineHeight: 1.5, flex: 1 }}>{tool.when}</p>
            <Link to={tool.to} style={{ ...ghostButtonStyle, textDecoration: "none", alignSelf: "flex-start" }}>
              {tool.cta}
            </Link>
          </section>
        ))}
      </div>
    </InternalPage>
  );
}
