/** Plain-language labels for internal ops — one place for nav + page chrome. */

export type InternalPageMeta = {
  title: string;
  /** One sentence: what this page is for. */
  purpose: string;
};

export const INTERNAL_PAGES: Record<string, InternalPageMeta> = {
  home: {
    title: "Home",
    purpose: "Start here — pick the job you need to do.",
  },
  support: {
    title: "Support",
    purpose: "Handle tenant issues: read threads, triage, and investigate.",
  },
  supportInbox: {
    title: "Support",
    purpose: "Work the ticket queue — select a thread to reply and assign.",
  },
  supportBoard: {
    title: "Support",
    purpose: "See every ticket by status (open → closed) at a glance.",
  },
  supportRadar: {
    title: "Support",
    purpose: "Spot urgent tickets and tenants that need a proactive check-in.",
  },
  supportInvestigate: {
    title: "Support",
    purpose: "Look up a request ID from an error or log when debugging.",
  },
  tenants: {
    title: "Tenants",
    purpose: "Find a business and check health, billing, and links.",
  },
  docs: {
    title: "Docs",
    purpose: "Company runbooks and how-we-work guides.",
  },
  platform: {
    title: "Platform",
    purpose: "Engineering and ops tools — open only what you need.",
  },
  monitoring: {
    title: "Live status",
    purpose: "Is the product healthy right now? Bookings, DB, and alerts.",
  },
  monitoringAlerts: {
    title: "Live status",
    purpose: "Review firing alert rules and acknowledge incidents.",
  },
  monitoringLogs: {
    title: "Live status",
    purpose: "Search platform logs when something looks wrong.",
  },
  flags: {
    title: "Feature flags",
    purpose: "Turn a feature on or off for one tenant or globally.",
  },
  reports: {
    title: "Weekly report",
    purpose: "Auto-generated platform summary for leadership.",
  },
  continuity: {
    title: "Booking continuity",
    purpose: "Bookings waiting on follow-up messages to customers.",
  },
  health: {
    title: "Integrations",
    purpose: "Quick check: Stripe, Clerk, API version, tenant count.",
  },
  access: {
    title: "Tenant access",
    purpose: "Open a tenant app from a support ticket — audited, no password.",
  },
  workforce: {
    title: "Team onboarding",
    purpose: "How new Livia staff get Clerk, staging, and internal access.",
  },
  voice: {
    title: "Locales",
    purpose: "Reference for which locales and voice packs are live.",
  },
  overview: {
    title: "Overview",
    purpose: "Exec snapshot: production checks, ship lane, and today's signals.",
  },
};
