import { db, timeOffTable } from "@workspace/db";
import { generateId } from "../lib/id";
import { logger } from "../lib/logger";
import { deliverInAppNotification } from "./in-app-notifications.service";

export async function recordStaffBorrowRequest(args: {
  hostBusinessId: string;
  staffId: string;
  targetBusinessId: string;
  from: string;
  to: string;
}): Promise<{ ok: true }> {
  await db.insert(timeOffTable).values({
    id: generateId(),
    businessId: args.targetBusinessId,
    staffId: args.staffId,
    startsAt: new Date(args.from),
    endsAt: new Date(args.to),
    reason: `[borrow] Covering from host shop ${args.hostBusinessId}`,
  });

  await deliverInAppNotification({
    kind: "time_off.pending",
    businessId: args.targetBusinessId,
    title: "Staff borrow requested",
    body: "A stylist is scheduled to cover from another location — review calendar.",
    priority: "watch",
    resourceKind: "time_off",
    resourceId: args.staffId,
    dedupeKey: `staff-borrow:${args.staffId}:${args.from}:${args.to}`,
    audience: "operators",
  }).catch(() => undefined);

  logger.info(args, "staff-borrow recorded");
  return { ok: true };
}
