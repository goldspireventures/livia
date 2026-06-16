/**
 * Platform build hierarchy — parent flows and children for cascade-complete delivery.
 * Agents: before marking a node done, complete all descendants or explicitly defer with reason.
 */
import type { BusinessVertical } from "./types";

export type BuildHierarchyStatus = "shipped" | "in_progress" | "planned" | "deferred";

export type BuildHierarchyNode = {
  id: string;
  title: string;
  summary: string;
  status: BuildHierarchyStatus;
  /** Policy / API / dashboard / mobile / guest /my */
  surfaces?: string[];
  children?: BuildHierarchyNode[];
};

/** Root programs — L0. */
export const PLATFORM_BUILD_ROOTS: BuildHierarchyNode[] = [
  {
    id: "commitment-gate",
    title: "Commitment Gate",
    summary: "What must be true before a scarce human minute locks.",
    status: "shipped",
    surfaces: ["policy", "api", "guest /b", "guest /my", "dashboard"],
    children: [
      {
        id: "commitment-percent-deposit",
        title: "Percent deposit rail",
        summary: "Tenant % on service price → Stripe → auto-confirm.",
        status: "shipped",
        children: [
          {
            id: "commitment-vertical-defaults",
            title: "Vertical deposit defaults",
            summary: "Seed % per vertical from market norms.",
            status: "shipped",
          },
          {
            id: "commitment-consult-waive",
            title: "Free consult SKU waive",
            summary: "€0 consult / assessment — no deposit gate.",
            status: "shipped",
          },
          {
            id: "commitment-auto-confirm",
            title: "Auto-confirm on payment",
            summary: "Webhook → capture → confirmBookingAfterStripePayment.",
            status: "shipped",
          },
          {
            id: "commitment-combined-checkout",
            title: "Deposit + retail combined",
            summary: "One Stripe session for hold + bag.",
            status: "shipped",
          },
          {
            id: "commitment-guest-truth-line",
            title: "Guest deposit truth on /my",
            summary: "Accurate due/paid copy with vertical tone.",
            status: "shipped",
          },
          {
            id: "commitment-balance-at-visit",
            title: "Balance at visit",
            summary: "Chair/bay balance due — post-commitment settlement.",
            status: "shipped",
          },
          {
            id: "commitment-card-on-file",
            title: "Card on file",
            summary: "SetupIntent saved PM — off-session balance/rebook.",
            status: "planned",
          },
        ],
      },
      {
        id: "commitment-package-credit",
        title: "Package credit rail",
        summary: "Prepaid sessions satisfy gate — burn on book.",
        status: "shipped",
        children: [
          {
            id: "commitment-pack-burn-confirm",
            title: "Pack burn → instant confirm",
            summary: "Transactional credit burn; no double deposit.",
            status: "shipped",
          },
          {
            id: "commitment-pack-purchase",
            title: "Guest pack purchase on /b",
            summary: "Stripe buy pack → ledger → book with credit.",
            status: "shipped",
          },
        ],
      },
      {
        id: "commitment-milestone-quote",
        title: "Milestone quote rail",
        summary: "Event vendors — consult-first quote schedule.",
        status: "shipped",
        surfaces: ["api", "guest /e"],
      },
      {
        id: "commitment-proof-deposit",
        title: "Proof then deposit",
        summary: "Body art — design approved → pay link → lock.",
        status: "shipped",
      },
    ],
  },
  {
    id: "owner-operating-ritual",
    title: "Owner Operating Ritual",
    summary: "Today = what needs you, what guests must finish, what is handled.",
    status: "shipped",
    surfaces: ["policy", "dashboard", "mobile"],
    children: [
      {
        id: "ritual-operating-pulse",
        title: "Operating pulse",
        summary: "Handling · Needs you · Guest completing counts.",
        status: "shipped",
      },
      {
        id: "ritual-pending-split",
        title: "Pending queue split",
        summary: "Deposit-wait vs human-queue vs policy review.",
        status: "shipped",
      },
      {
        id: "ritual-inbox-lenses",
        title: "Inbox lenses",
        summary: "needs_you / liv_handling / taken_over parity.",
        status: "shipped",
      },
      {
        id: "ritual-persona-homes",
        title: "Persona ritual homes",
        summary: "Owner / manager / staff / reception morph.",
        status: "shipped",
      },
    ],
  },
  {
    id: "guest-continuity",
    title: "Guest Continuity",
    summary: "/b book → pay/commit → /my visit → thread → rebook.",
    status: "shipped",
    children: [
      {
        id: "continuity-book-pay",
        title: "Book and pay path",
        summary: "Pending → pay token → confirmed without staff.",
        status: "shipped",
      },
      {
        id: "continuity-my-vault",
        title: "/my vault modules",
        summary: "Visits, packs, proofs, pets, vehicle.",
        status: "shipped",
      },
      {
        id: "continuity-thread-read",
        title: "Visit thread read/write",
        summary: "Guest reads and sends messages on visit page.",
        status: "shipped",
      },
      {
        id: "continuity-vertical-memory",
        title: "Vertical memory on visit",
        summary: "Beauty prefs, patch test, wellness prep.",
        status: "shipped",
      },
      {
        id: "continuity-passwordless-hub",
        title: "Email-only guest hub",
        summary: "Passwordless /my without phone OTP.",
        status: "planned",
      },
    ],
  },
  {
    id: "emergent-trust",
    title: "Emergent Trust Programs",
    summary: "Trusted regulars proposed from data — owner accepts, never default-on.",
    status: "shipped",
    surfaces: ["policy", "twin", "dashboard"],
    children: [
      {
        id: "trust-signal-collection",
        title: "Signal collection",
        summary: "Show rate, rebook, strikes — quality registry on owner home.",
        status: "shipped",
      },
      {
        id: "trust-twin-proposal",
        title: "Twin proposal card",
        summary: "Accept on owner home; demo showcase surfaces proposal.",
        status: "shipped",
      },
      {
        id: "trust-policy-patch",
        title: "Accept → policy patch",
        summary: "Owner accepts; per-customer Trusted toggle unlocks.",
        status: "shipped",
      },
    ],
  },
  {
    id: "operating-twin",
    title: "Operating Twin",
    summary: "Business mirror — risks, opportunities, policy evolution.",
    status: "shipped",
    children: [
      {
        id: "twin-observations",
        title: "Observation drafts",
        summary: "Facts → meaningful interpretations.",
        status: "shipped",
      },
      {
        id: "twin-commerce-signals",
        title: "Commerce signals",
        summary: "Capture rate, deposit tuning nudges.",
        status: "shipped",
      },
      {
        id: "twin-policy-patch-ui",
        title: "Policy patch accept UI",
        summary: "One-tap accept from owner home card.",
        status: "shipped",
      },
      {
        id: "twin-mandate-preview",
        title: "Mandate preview before promote",
        summary: "Show autonomy impact before Liv promotion accept.",
        status: "planned",
      },
    ],
  },
  {
    id: "cross-surface-parity",
    title: "Cross-surface parity",
    summary: "Web ↔ mobile ↔ internal ops ↔ OpenAPI contract.",
    status: "in_progress",
    surfaces: ["mobile", "internal", "openapi"],
    children: [
      {
        id: "cross-openapi-contract",
        title: "OpenAPI + codegen",
        summary: "Public pay/balance, policy-evolution, dashboard pulse fields.",
        status: "shipped",
      },
      {
        id: "cross-mobile-deep-ops",
        title: "Mobile deep ops parity",
        summary: "Billing, quotes editor, rota — web-first until Era 2.",
        status: "planned",
      },
      {
        id: "cross-internal-ops",
        title: "Internal ops portal",
        summary: "Flags, impersonation, incidents vs spec.",
        status: "planned",
      },
    ],
  },
];

export function listBuildHierarchyNodes(
  nodes: BuildHierarchyNode[] = PLATFORM_BUILD_ROOTS,
): BuildHierarchyNode[] {
  const out: BuildHierarchyNode[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) out.push(...listBuildHierarchyNodes(n.children));
  }
  return out;
}

export function buildHierarchyNode(id: string): BuildHierarchyNode | undefined {
  return listBuildHierarchyNodes().find((n) => n.id === id);
}

/** Vertical packs inherit commitment profile — see booking-commitment-program.ts */
export function verticalBuildPriority(vertical: BusinessVertical): string[] {
  const common = ["commitment-gate", "guest-continuity", "owner-operating-ritual"];
  if (vertical === "event-vendors") {
    return ["commitment-milestone-quote", "owner-operating-ritual", "guest-continuity"];
  }
  if (vertical === "wellness" || vertical === "fitness") {
    return [...common, "commitment-package-credit"];
  }
  if (vertical === "body-art") {
    return [...common, "commitment-proof-deposit"];
  }
  return common;
}
