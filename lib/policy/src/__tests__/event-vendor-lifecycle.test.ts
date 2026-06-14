import assert from "node:assert/strict";
import {
  buildEventPrepPlan,
  depositDueReminderCopy,
  formatEventTypeLabel,
  quoteOperatorFlowSteps,
  quotePaymentReference,
  resolveDueLifecycleActions,
  upcomingPrepTasks,
  type LivEventLifecycle,
} from "../event-vendor-lifecycle-program";

const plan = buildEventPrepPlan({
  eventDate: "2026-09-15",
  eventType: "wedding",
  venue: "Dublin Castle",
  lineItems: [{ name: "Table centrepieces" }, { name: "Chair sashes" }],
});

assert.equal(plan.length, 4);
assert.equal(plan[0]!.phase, "venue_access");
assert.equal(plan[0]!.dueDate, "2026-09-01");
assert.equal(plan[1]!.phase, "load_list");
assert.equal(plan[1]!.detail?.length, 2);
assert.equal(plan[3]!.dueDate, "2026-09-16");

const empty = buildEventPrepPlan({ eventDate: null });
assert.equal(empty.length, 0);

const lifecycle: LivEventLifecycle = {
  prepTasks: [
    {
      id: "venue_access",
      phase: "venue_access",
      label: "Venue",
      dueDate: "2026-06-01",
    },
    {
      id: "post_event_review",
      phase: "post_event_review",
      label: "Review",
      dueDate: "2026-06-02",
    },
  ],
};

const due = resolveDueLifecycleActions(lifecycle, "2026-06-02");
assert.ok(due.some((d) => d.kind === "operator_prep_nudge"));
assert.ok(due.some((d) => d.kind === "client_review_request"));

const upcoming = upcomingPrepTasks(
  {
    prepTasks: [
      { id: "a", phase: "load_list", label: "Load", dueDate: "2026-06-10" },
      { id: "b", phase: "day_of_setup", label: "Day", dueDate: "2026-07-01" },
    ],
  },
  14,
  "2026-06-01",
);
assert.equal(upcoming.length, 1);

const copy = depositDueReminderCopy({
  contactName: "Sarah Murphy",
  businessName: "Atelier Decor",
  payUrl: "https://app.example/e/atelier-decor/q/abc123",
  depositAmountMinor: 45000,
});
assert.ok(copy.body.includes("Sarah"));
assert.ok(copy.whatsappText.includes("450"));

const sentSteps = quoteOperatorFlowSteps({
  status: "sent",
  depositPaidMinor: 0,
  depositAmountMinor: 30000,
});
assert.equal(sentSteps.find((s) => s.id === "accept")?.state, "current");

const paidSteps = quoteOperatorFlowSteps({
  status: "accepted",
  depositPaidMinor: 30000,
  depositAmountMinor: 30000,
});
assert.equal(paidSteps.find((s) => s.id === "booked")?.state, "current");

assert.equal(quotePaymentReference("abc123xyz"), "ABC123XY");

assert.equal(formatEventTypeLabel("birthday"), "Birthday");
assert.equal(formatEventTypeLabel("corporate_away_day"), "Corporate away day");
assert.equal(formatEventTypeLabel(null), "Event");

console.log("event-vendor-lifecycle.test.ts: ok");
