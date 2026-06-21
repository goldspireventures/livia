import { inngest } from "../lib/inngest";
import { recordStaffBorrowRequest } from "../services/staff-borrow.service";

/** Cross-shop staff borrow (C7 chains) — records shadow block + notifies operators. */
export const staffBorrowWorkflow = inngest.createFunction(
  { id: "staff-borrow", retries: 2 },
  { event: "livia/staff-borrow.requested" },
  async ({ event, step }) => {
    const data = event.data as {
      hostBusinessId: string;
      staffId: string;
      targetBusinessId: string;
      from: string;
      to: string;
    };
    await step.run("record-borrow", () => recordStaffBorrowRequest(data));
    return { ok: true };
  },
);
