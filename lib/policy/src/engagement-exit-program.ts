/**
 * Engagement exit — operator decline, client pull-out, and cancellation across verticals.
 * Real-life: clients ghost, decline quotes, or withdraw after deposit; operators close unfit leads.
 */
import type { BusinessVertical } from "./types";
import { formatStudioQuoteRef } from "./pii-display-program";

export type EngagementExitActor = "operator" | "client" | "system";

export type EngagementExitKind =
  | "operator_decline_enquiry"
  | "operator_mark_lost"
  | "client_declined_quote"
  | "client_withdrew"
  | "client_cancelled_booking"
  | "client_no_show";

export type ClientWithdrawReasonId =
  | "changed_plans"
  | "found_alternative"
  | "budget"
  | "date_changed"
  | "personal"
  | "unknown";

export const CLIENT_WITHDRAW_REASONS: Array<{
  id: ClientWithdrawReasonId;
  label: string;
}> = [
  { id: "changed_plans", label: "Plans changed" },
  { id: "found_alternative", label: "Went with someone else" },
  { id: "budget", label: "Budget / affordability" },
  { id: "date_changed", label: "Date no longer works" },
  { id: "personal", label: "Personal / family reasons" },
  { id: "unknown", label: "No reason given" },
];

/** Which exit kinds apply per vertical (hub registry). */
export const ENGAGEMENT_EXIT_VERTICALS: Partial<
  Record<BusinessVertical, EngagementExitKind[]>
> = {
  "event-vendors": [
    "operator_decline_enquiry",
    "operator_mark_lost",
    "client_declined_quote",
    "client_withdrew",
  ],
  hair: ["client_cancelled_booking", "client_no_show", "operator_mark_lost"],
  beauty: ["client_cancelled_booking", "client_no_show", "operator_mark_lost"],
  wellness: ["client_cancelled_booking", "client_no_show", "operator_mark_lost"],
  medspa: ["client_cancelled_booking", "client_no_show", "operator_mark_lost"],
  "pet-grooming": ["client_cancelled_booking", "client_no_show", "operator_mark_lost"],
  "body-art": ["operator_mark_lost", "client_cancelled_booking"],
  fitness: ["client_cancelled_booking", "client_no_show"],
};

export type QuoteExitActionId = "open_inbox" | "client_withdrew" | "mark_lost" | "remove_quote";

export type QuoteExitAction = {
  id: QuoteExitActionId;
  label: string;
  destructive?: boolean;
  hint?: string;
};

/** Operator actions on /quotes when a client may have pulled out. */
export function resolveQuoteExitActions(args: {
  quoteStatus: string;
  enquiryStatus?: string | null;
  depositPaidMinor: number;
  depositAmountMinor: number;
}): QuoteExitAction[] {
  const depositPaid =
    args.depositAmountMinor > 0 && args.depositPaidMinor >= args.depositAmountMinor;
  const partialDeposit = args.depositPaidMinor > 0 && !depositPaid;

  if (args.quoteStatus === "expired") {
    return [
      {
        id: "remove_quote",
        label: "Remove from list",
        destructive: true,
        hint: "Archive this expired quote — enquiry history stays intact.",
      },
    ];
  }

  if (args.quoteStatus === "declined" || args.enquiryStatus === "lost") {
    return [];
  }

  const actions: QuoteExitAction[] = [];

  if (["sent", "accepted", "booked"].includes(args.quoteStatus)) {
    actions.push({
      id: "client_withdrew",
      label: "Client withdrew",
      destructive: true,
      hint: partialDeposit
        ? "Deposit received — review your refund policy before closing."
        : depositPaid
          ? "Deposit paid — date was secured; confirm refund terms with the client."
          : "Close the quote and enquiry — Liv can send a polite acknowledgement.",
    });
  }

  if (args.quoteStatus === "sent" && !depositPaid) {
    actions.push({
      id: "mark_lost",
      label: "Mark lost",
      destructive: true,
      hint: "No response — archive without messaging the client.",
    });
  }

  return actions;
}

export function clientWithdrewNotificationCopy(args: {
  publicToken: string;
  depositPaidMinor: number;
  depositAmountMinor: number;
  initiatedBy: EngagementExitActor;
}): { title: string; body: string } {
  const ref = formatStudioQuoteRef(args.publicToken);
  const depositDue = Math.max(0, args.depositAmountMinor - args.depositPaidMinor);
  const hadDeposit = args.depositPaidMinor > 0;

  if (args.initiatedBy === "client") {
    return {
      title: `${ref} — client declined`,
      body: hadDeposit
        ? "They passed on the quote after paying — review refund policy."
        : "They declined the quote on the client link.",
    };
  }

  return {
    title: `${ref} — client withdrew`,
    body:
      depositDue <= 0 && hadDeposit
        ? "Marked withdrawn — deposit was paid; check refund policy."
        : hadDeposit
          ? "Marked withdrawn — partial deposit received; follow up on balance/refund."
          : "Quote and enquiry closed.",
  };
}

export function depositPaidNotificationCopy(args: {
  publicToken: string;
  amountMinor: number;
  currency: string;
  dateSecured: boolean;
}): { title: string; body: string } {
  const ref = formatStudioQuoteRef(args.publicToken);
  const amount = (args.amountMinor / 100).toLocaleString("en-IE", {
    style: "currency",
    currency: args.currency || "EUR",
    minimumFractionDigits: 0,
  });
  return {
    title: args.dateSecured ? `${ref} — deposit paid` : `${ref} — payment received`,
    body: args.dateSecured
      ? `${amount} received — date secured. Event prep is on your Quotes screen.`
      : `${amount} received toward the quote.`,
  };
}

export function quoteAcceptedNotificationCopy(publicToken: string): { title: string; body: string } {
  const ref = formatStudioQuoteRef(publicToken);
  return {
    title: `${ref} — accepted`,
    body: "Client accepted on the quote link. Liv sent the deposit request.",
  };
}
