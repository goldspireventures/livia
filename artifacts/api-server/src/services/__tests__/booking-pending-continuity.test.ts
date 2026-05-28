import { derivePendingReason, PENDING_REASONS } from "../../lib/booking-pending";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const base = {
  aiCanBookDirectly: true,
  depositRequired: false,
  depositPaidEurCents: 0,
  autoConfirmWhenNoDeposit: true,
};

assert(
  derivePendingReason({
    ...base,
    source: "web",
    bookingContinuityEnabled: true,
    customerHasPhone: true,
  }) === PENDING_REASONS.AWAITING_CONTINUITY,
  "web + phone + continuity → awaiting_continuity",
);

assert(
  derivePendingReason({
    ...base,
    source: "web",
    bookingContinuityEnabled: false,
    customerHasPhone: true,
  }) === PENDING_REASONS.CREATED_BY_LIV,
  "continuity off → created_by_liv",
);

console.log("booking-pending-continuity.test.ts: ok");
