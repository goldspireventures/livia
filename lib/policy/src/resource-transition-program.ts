/**
 * Platform resource transitions — one hub for operator notifications + deep links.
 * Services emit status changes here; policy resolves copy, kind, audience, and routes.
 * Add a row to the registry when a new resource gains workflow states (any vertical).
 */
import type { InAppNotificationKind, PlatformResourceKind } from "./notification-policy";
import {
  clientWithdrewNotificationCopy,
  depositPaidNotificationCopy,
  quoteAcceptedNotificationCopy,
} from "./engagement-exit-program";
import {
  stripDesignProofGuestFeedback,
} from "./body-art-design-proof-program";

function proofDisplayTitle(note?: string | null): string {
  const raw = stripDesignProofGuestFeedback(note) || "Studio design";
  const idx = raw.indexOf(" — ");
  return idx > 0 ? raw.slice(0, idx).trim() : raw.trim();
}

export type { PlatformResourceKind } from "./notification-policy";

export type TransitionActor = "studio" | "guest" | "system" | "liv" | "operator" | "client";

export type ResourceTransitionContext = {
  resourceId: string;
  businessId: string;
  /** Human label — proof title, quote ref, service name, etc. */
  displayLabel?: string | null;
  guestFeedback?: string | null;
  version?: number;
  /** Quote / guest-link flows */
  publicToken?: string | null;
  amountMinor?: number;
  currency?: string;
  dateSecured?: boolean;
  depositPaidMinor?: number;
  depositAmountMinor?: number;
  initiatedBy?: "operator" | "client" | "system";
};

export type PlatformNotificationPlan = {
  kind: InAppNotificationKind;
  businessId: string;
  resourceKind: PlatformResourceKind;
  resourceId: string;
  title: string;
  body: string;
  priority: "info" | "watch" | "act";
  audience: "operators" | "inbox_team" | "staff_assigned";
  dedupeKey: string;
  sendPush?: boolean;
  workflowEvent?: string;
};

type StatusTransitionRule = {
  resourceKind: PlatformResourceKind;
  fromStatus: string | "*";
  toStatus: string;
  actor: TransitionActor;
  build: (ctx: ResourceTransitionContext) => PlatformNotificationPlan;
};

/** Global registry — add a row when any vertical gains a new workflow transition. */
export const RESOURCE_STATUS_TRANSITION_RULES: StatusTransitionRule[] = [
  {
    resourceKind: "design_proof",
    fromStatus: "*",
    toStatus: "pending_review",
    actor: "studio",
    build: (ctx) => {
      const label = proofDisplayTitle(ctx.displayLabel);
      const version = ctx.version ?? 1;
      return {
        kind: "design-proof.awaiting_client",
        businessId: ctx.businessId,
        resourceKind: "design_proof",
        resourceId: ctx.resourceId,
        title: "Design proof sent to client",
        body: `${label} — waiting for client review on their link.`,
        priority: "watch",
        audience: "operators",
        dedupeKey: `design-proof:${ctx.resourceId}:awaiting_client:v${version}`,
        workflowEvent: "livia/design-proof.submitted",
      };
    },
  },
  {
    resourceKind: "design_proof",
    fromStatus: "pending_review",
    toStatus: "rejected",
    actor: "guest",
    build: (ctx) => {
      const label = proofDisplayTitle(ctx.displayLabel);
      const version = ctx.version ?? 1;
      return {
        kind: "design-proof.changes_requested",
        businessId: ctx.businessId,
        resourceKind: "design_proof",
        resourceId: ctx.resourceId,
        title: "Client requested design changes",
        body: ctx.guestFeedback ?? `${label} — check the proof desk for client notes.`,
        priority: "act",
        audience: "operators",
        dedupeKey: `design-proof:${ctx.resourceId}:changes_requested:v${version}`,
        sendPush: true,
        workflowEvent: "livia/design-proof.rejected",
      };
    },
  },
  {
    resourceKind: "design_proof",
    fromStatus: "pending_review",
    toStatus: "rejected",
    actor: "studio",
    build: (ctx) => {
      const label = proofDisplayTitle(ctx.displayLabel);
      const version = ctx.version ?? 1;
      return {
        kind: "design-proof.changes_requested",
        businessId: ctx.businessId,
        resourceKind: "design_proof",
        resourceId: ctx.resourceId,
        title: "Design proof needs revision",
        body: `${label} — revise artwork and resend when ready.`,
        priority: "watch",
        audience: "operators",
        dedupeKey: `design-proof:${ctx.resourceId}:studio_revision:v${version}`,
        workflowEvent: "livia/design-proof.rejected",
      };
    },
  },
  {
    resourceKind: "design_proof",
    fromStatus: "pending_review",
    toStatus: "approved",
    actor: "guest",
    build: (ctx) => {
      const label = proofDisplayTitle(ctx.displayLabel);
      const version = ctx.version ?? 1;
      return {
        kind: "design-proof.approved",
        businessId: ctx.businessId,
        resourceKind: "design_proof",
        resourceId: ctx.resourceId,
        title: "Client approved design",
        body: `${label} — client signed off on their link.`,
        priority: "watch",
        audience: "operators",
        dedupeKey: `design-proof:${ctx.resourceId}:approved:v${version}`,
        workflowEvent: "livia/design-proof.approved",
      };
    },
  },
  {
    resourceKind: "design_proof",
    fromStatus: "*",
    toStatus: "approved",
    actor: "studio",
    build: (ctx) => {
      const label = proofDisplayTitle(ctx.displayLabel);
      const version = ctx.version ?? 1;
      return {
        kind: "design-proof.approved",
        businessId: ctx.businessId,
        resourceKind: "design_proof",
        resourceId: ctx.resourceId,
        title: "Design proof signed off",
        body: `${label} — marked approved in studio.`,
        priority: "info",
        audience: "operators",
        dedupeKey: `design-proof:${ctx.resourceId}:studio_approved:v${version}`,
        workflowEvent: "livia/design-proof.approved",
      };
    },
  },
];

/**
 * Resolve operator notification for a resource status change.
 * Returns null when the transition is silent (no operator alert).
 */
export function resolveResourceStatusTransition(args: {
  resourceKind: PlatformResourceKind;
  fromStatus: string;
  toStatus: string;
  actor: TransitionActor;
  context: ResourceTransitionContext;
}): PlatformNotificationPlan | null {
  const { resourceKind, fromStatus, toStatus, actor, context } = args;
  if (fromStatus === toStatus) return null;

  for (const rule of RESOURCE_STATUS_TRANSITION_RULES) {
    if (rule.resourceKind !== resourceKind) continue;
    if (rule.toStatus !== toStatus) continue;
    if (rule.actor !== actor) continue;
    if (rule.fromStatus !== "*" && rule.fromStatus !== fromStatus) continue;
    return rule.build(context);
  }

  return null;
}

/** Event-style notifications (not status enums) — quotes, deposits, withdrawals. */
export function resolveResourceEngagementEvent(args: {
  event:
    | "quote.accepted"
    | "quote.deposit_paid"
    | "quote.client_withdrew";
  context: ResourceTransitionContext;
}): PlatformNotificationPlan | null {
  const { event, context } = args;
  const id = context.resourceId;
  const biz = context.businessId;
  const token = context.publicToken ?? "";

  switch (event) {
    case "quote.accepted": {
      const copy = quoteAcceptedNotificationCopy(token);
      return {
        kind: "quote.accepted",
        businessId: biz,
        resourceKind: "quote",
        resourceId: id,
        title: copy.title,
        body: copy.body,
        priority: "act",
        audience: "operators",
        dedupeKey: `quote.accepted:${id}`,
        sendPush: true,
      };
    }
    case "quote.deposit_paid": {
      const copy = depositPaidNotificationCopy({
        publicToken: token,
        amountMinor: context.amountMinor ?? 0,
        currency: context.currency ?? "EUR",
        dateSecured: context.dateSecured ?? false,
      });
      return {
        kind: "quote.deposit_paid",
        businessId: biz,
        resourceKind: "quote",
        resourceId: id,
        title: copy.title,
        body: copy.body,
        priority: "act",
        audience: "operators",
        dedupeKey: `quote.deposit_paid:${id}:${context.amountMinor ?? 0}`,
        sendPush: true,
      };
    }
    case "quote.client_withdrew": {
      const copy = clientWithdrewNotificationCopy({
        publicToken: token,
        depositPaidMinor: context.depositPaidMinor ?? 0,
        depositAmountMinor: context.depositAmountMinor ?? 0,
        initiatedBy: context.initiatedBy ?? "client",
      });
      return {
        kind: "quote.client_withdrew",
        businessId: biz,
        resourceKind: "quote",
        resourceId: id,
        title: copy.title,
        body: copy.body,
        priority: "watch",
        audience: "operators",
        dedupeKey: `quote.client_withdrew:${id}`,
      };
    }
    default:
      return null;
  }
}

/** Follow-up nudge copy — reused by cron adapters (any resource). */
export function buildFollowUpNudgeCopy(args: {
  kind: InAppNotificationKind;
  displayLabel: string;
  days: number;
  guestLink?: string | null;
  guestFeedback?: string | null;
}): { title: string; body: string } {
  switch (args.kind) {
    case "design-proof.awaiting_client":
      return {
        title: "Client proof review overdue",
        body: args.guestLink
          ? `${args.displayLabel} — still awaiting client (${args.days}+ days). Link: ${args.guestLink}`
          : `${args.displayLabel} — still awaiting client (${args.days}+ days).`,
      };
    case "design-proof.changes_requested":
      return {
        title: "Revision still pending",
        body:
          args.guestFeedback ??
          `${args.displayLabel} — client requested changes ${args.days}+ days ago.`,
      };
    default:
      return {
        title: "Follow-up needed",
        body: `${args.displayLabel} — no activity for ${args.days}+ days.`,
      };
  }
}
