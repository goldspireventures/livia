import type { InternalOpsRole } from "./api";
import { getExecHomePath } from "./exec-path";

export type InternalNavItem = {
  to: string;
  label: string;
  /** Shown under the label in the sidebar — plain English. */
  hint?: string;
  badge?: number;
};

export type InternalNavSection = {
  id: string;
  label: string;
  items: InternalNavItem[];
};

export function buildInternalNav(
  role: InternalOpsRole | undefined,
  opts?: { openTicketCount?: number },
): InternalNavSection[] {
  const execHome = getExecHomePath();
  const tickets = opts?.openTicketCount ?? 0;

  const sections: InternalNavSection[] = [];

  if (role === "exec") {
    sections.push({
      id: "command",
      label: "Exec",
      items: [
        {
          to: execHome,
          label: "Overview",
          hint: "Production checks & ship lane",
        },
      ],
    });
  }

  sections.push({
    id: "work",
    label: "Daily work",
    items: [
      {
        to: role === "exec" ? "/home" : "/",
        label: "Home",
        hint: "Where to start",
      },
      {
        to: "/support",
        label: "Support",
        hint: "Tenant tickets",
        badge: tickets > 0 ? tickets : undefined,
      },
      {
        to: "/tenants",
        label: "Tenants",
        hint: "Find a business",
      },
      {
        to: "/knowledge",
        label: "Docs",
        hint: "Runbooks",
      },
    ],
  });

  sections.push({
    id: "platform",
    label: "When you need more",
    items: [
      {
        to: "/platform",
        label: "Platform",
        hint: "Status, flags, logs",
      },
      {
        to: "/join",
        label: "Team",
        hint: "Staff onboarding",
      },
      {
        to: "/access",
        label: "Tenant access",
        hint: "Audited deep links",
      },
    ],
  });

  return sections;
}
