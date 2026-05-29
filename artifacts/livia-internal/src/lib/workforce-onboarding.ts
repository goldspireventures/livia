import type { InternalOpsRole } from "./api";
import type { WorkforceAccessTier } from "@workspace/policy";

export type WorkforceOnboardingItem = {
  id: string;
  label: string;
  detail: string;
  href?: string;
  doneHint?: string;
};

export type WorkforceOnboardingBundle = {
  title: string;
  summary: string;
  items: WorkforceOnboardingItem[];
};

const BASE_CLERK: WorkforceOnboardingItem = {
  id: "clerk",
  label: "Clerk account (company instance)",
  detail: "Invite-only email/password on the Livia Clerk app. Use your @livia-hq.com or @goldspireventures.com inbox.",
  doneHint: "You can sign in at app.livia-hq.com",
};

const BASE_INTERNAL: WorkforceOnboardingItem = {
  id: "internal-secret",
  label: "Internal ops secret",
  detail: "Paste INTERNAL_OPS_SECRET once per browser on the ops portal. Required for audited mutations.",
};

const BASE_STAGING: WorkforceOnboardingItem = {
  id: "staging",
  label: "Staging smoke",
  detail: "Verify app.staging.livia-hq.com and onboarding preview before prod changes.",
  href: "https://app.staging.livia-hq.com/onboarding-preview",
};

function bundleForRole(role: InternalOpsRole, tier: WorkforceAccessTier): WorkforceOnboardingBundle {
  const restricted = tier === "restricted";
  const common: WorkforceOnboardingItem[] = [BASE_CLERK, BASE_INTERNAL];

  if (role === "exec") {
    return {
      title: "Exec / founder cockpit",
      summary: restricted
        ? "Livia staff — restricted tier. Full prod cockpit after explicit exec grant."
        : "Goldspire — full tier (cockpit-granted). Prod app sign-in + internal surfaces per grant.",
      items: [
        ...common,
        {
          id: "exec-email",
          label: "Platform exec allowlist",
          detail: "Railway LIVIA_PLATFORM_EXEC_EMAILS must include your inbox for app → ops redirect.",
        },
        BASE_STAGING,
        {
          id: "github",
          label: "GitHub org access",
          detail: "goldspire-global/livia — branch protection, no direct main pushes for customer releases.",
          href: "https://github.com/goldspire-global/livia",
        },
      ],
    };
  }

  if (role === "support_l1" || role === "support_l2") {
    return {
      title: role === "support_l2" ? "Support L2" : "Support L1",
      summary: "Ticket queue first; tenant directory read-only unless escalated.",
      items: [
        ...common,
        {
          id: "support-queue",
          label: "Support queue",
          detail: "Start at /support — triage open tickets before tenant impersonation.",
        },
        BASE_STAGING,
      ],
    };
  }

  if (role === "finance_read") {
    return {
      title: "Finance read-only",
      summary: "Billing snapshots and reports — no tenant mutations.",
      items: [...common, { id: "reports", label: "Weekly reports", detail: "Open /reports for digest exports." }],
    };
  }

  return {
    title: "Engineering operator",
    summary: restricted
      ? "Default Livia staff path — staging-first, scoped prod until promoted."
      : "Goldspire (cockpit-granted) — staging + internal surfaces per grant tier.",
    items: [
      ...common,
      BASE_STAGING,
      {
        id: "vercel-railway",
        label: "Deploy consoles",
        detail: "Vercel (dashboard/marketing) and Railway (api-server). Staging deploys from main; prod promote manually.",
      },
      {
        id: "local-dev",
        label: "Local stack",
        detail: "pnpm install → repo-root .env → pnpm dev. Internal on :5175.",
      },
    ],
  };
}

export function workforceOnboardingBundle(
  role: InternalOpsRole,
  tier: WorkforceAccessTier,
): WorkforceOnboardingBundle {
  if (tier === "none") {
    return {
      title: "Not a company workforce account",
      summary: "Use a @livia-hq.com or @goldspireventures.com email as operator, or ask for an invite.",
      items: [
        {
          id: "domain",
          label: "Workforce email required",
          detail: "Customer Clerk accounts cannot unlock internal provisioning checklists.",
        },
      ],
    };
  }
  return bundleForRole(role, tier);
}

export function workforceTierLabel(tier: WorkforceAccessTier): string {
  switch (tier) {
    case "full":
      return "Full access (cockpit-granted Goldspire or explicit promotion)";
    case "restricted":
      return "Restricted (default @livia-hq.com, or cockpit-granted Goldspire)";
    default:
      return "None — @goldspireventures.com needs exec cockpit grant";
  }
}
