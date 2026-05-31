/**
 * Per-user in-app notification feed — persona-aware fan-out alongside push.
 */
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  bookingsTable,
  businessMembershipsTable,
  conversationsTable,
  db,
  staffTable,
  userNotificationsTable,
} from "@workspace/db";
import {
  buildNotificationDeepLinks,
  type InAppNotificationKind,
  type NotificationPersonaHint,
  parseNotificationPrefs,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { logger } from "../lib/logger";
import { getChainRollupForOwner } from "./chain-rollup.service";

const RECEPTION_HINT = /(reception|front[ -]?desk|concierge)/i;

function isPgUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const o = err as { code?: string; cause?: { code?: string }; message?: string };
  if (o.code === "23505" || o.cause?.code === "23505") return true;
  const msg = String(o.message ?? "");
  return /unique constraint|duplicate key/i.test(msg);
}

type MembershipRole = "OWNER" | "ADMIN" | "STAFF";

export type InAppDelivery = {
  kind: InAppNotificationKind;
  businessId: string;
  title: string;
  body: string;
  priority?: "info" | "watch" | "act";
  resourceKind?: string;
  resourceId?: string;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
  /** Limit STAFF recipients to this staff row (booking events). */
  assignedStaffId?: string | null;
  /** inbox_team | operators | staff_assigned */
  audience?: "inbox_team" | "operators" | "staff_assigned";
};

async function countBusinessesOwned(userId: string): Promise<number> {
  const rows = await db
    .select({ id: businessMembershipsTable.businessId })
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.userId, userId),
        eq(businessMembershipsTable.role, "OWNER"),
        eq(businessMembershipsTable.status, "ACTIVE"),
      ),
    );
  return rows.length;
}

async function isReceptionAdmin(userId: string, businessId: string): Promise<boolean> {
  const [staff] = await db
    .select({
      displayName: staffTable.displayName,
      firstName: staffTable.firstName,
      lastName: staffTable.lastName,
      bio: staffTable.bio,
    })
    .from(staffTable)
    .where(and(eq(staffTable.userId, userId), eq(staffTable.businessId, businessId)))
    .limit(1);
  if (!staff) return false;
  const hay = `${staff.displayName ?? ""} ${staff.firstName ?? ""} ${staff.lastName ?? ""} ${staff.bio ?? ""}`;
  return RECEPTION_HINT.test(hay);
}

function personaHintForMember(args: {
  role: MembershipRole;
  ownedCount: number;
  isReception: boolean;
}): NotificationPersonaHint {
  if (args.role === "OWNER") return "owner";
  if (args.role === "ADMIN" && args.isReception) return "receptionist";
  if (args.role === "ADMIN") return "manager";
  return "staff";
}

async function resolveRecipients(
  businessId: string,
  audience: InAppDelivery["audience"],
  assignedStaffId?: string | null,
): Promise<
  Array<{
    userId: string;
    role: MembershipRole;
    personaHint: NotificationPersonaHint;
    staffRowId: string | null;
  }>
> {
  const memberships = await db
    .select({
      userId: businessMembershipsTable.userId,
      role: businessMembershipsTable.role,
    })
    .from(businessMembershipsTable)
    .where(
      and(
        eq(businessMembershipsTable.businessId, businessId),
        eq(businessMembershipsTable.status, "ACTIVE"),
      ),
    );

  const out: Array<{
    userId: string;
    role: MembershipRole;
    personaHint: NotificationPersonaHint;
    staffRowId: string | null;
  }> = [];

  for (const m of memberships) {
    const role = m.role as MembershipRole;
    if (audience === "inbox_team" && role === "STAFF") continue;
    if (audience === "operators" && role === "STAFF" && !assignedStaffId) continue;

    const [staffRow] = await db
      .select({ id: staffTable.id })
      .from(staffTable)
      .where(and(eq(staffTable.userId, m.userId), eq(staffTable.businessId, businessId)))
      .limit(1);

    if (audience === "staff_assigned" || (role === "STAFF" && assignedStaffId)) {
      if (!assignedStaffId || staffRow?.id !== assignedStaffId) continue;
    }

    const ownedCount = role === "OWNER" ? await countBusinessesOwned(m.userId) : 0;
    const isReception = role === "ADMIN" ? await isReceptionAdmin(m.userId, businessId) : false;
    const personaHint = personaHintForMember({ role, ownedCount, isReception });

    if (audience === "inbox_team" && personaHint === "staff") continue;

    out.push({
      userId: m.userId,
      role,
      personaHint,
      staffRowId: staffRow?.id ?? null,
    });
  }

  return out;
}

export async function deliverInAppNotification(delivery: InAppDelivery): Promise<number> {
  const audience = delivery.audience ?? (delivery.assignedStaffId ? "staff_assigned" : "operators");
  const recipients = await resolveRecipients(
    delivery.businessId,
    audience,
    delivery.assignedStaffId,
  );

  const links = buildNotificationDeepLinks({
    kind: delivery.kind,
    businessId: delivery.businessId,
    bookingId:
      delivery.resourceKind === "booking" ? delivery.resourceId : undefined,
    conversationId:
      delivery.resourceKind === "conversation" ? delivery.resourceId : undefined,
  });

  let written = 0;
  for (const r of recipients) {
    const id = generateId();
    const dedupeKey = `${delivery.dedupeKey}:${r.userId}`;
    try {
      await db.insert(userNotificationsTable).values({
        id,
        userId: r.userId,
        businessId: delivery.businessId,
        kind: delivery.kind,
        priority: delivery.priority ?? "info",
        personaHint: r.personaHint,
        title: delivery.title,
        body: delivery.body,
        href: links.href,
        mobileHref: links.mobileHref,
        resourceKind: delivery.resourceKind ?? null,
        resourceId: delivery.resourceId ?? null,
        dedupeKey,
        metadata: delivery.metadata ?? null,
      });
      written += 1;
    } catch (err: unknown) {
      if (!isPgUniqueViolation(err)) {
        logger.warn({ err, dedupeKey }, "in-app notification insert failed");
      }
    }
  }
  return written;
}

/** Founder / multi-shop: materialise chain alerts as in-app rows (idempotent). */
export async function syncOrgAdminChainInAppNotifications(userId: string): Promise<void> {
  const owned = await countBusinessesOwned(userId);
  if (owned < 2) return;

  let rollup;
  try {
    rollup = await getChainRollupForOwner(userId);
  } catch {
    return;
  }

  for (const alert of rollup.alerts ?? []) {
    const links = buildNotificationDeepLinks({
      kind: "chain.alert",
      businessId: alert.businessId,
    });
    const priority = alert.severity === "act" ? "act" : "watch";
    const dedupeKey = `chain:${alert.businessId}:${alert.code}`;
    try {
      await db.insert(userNotificationsTable).values({
        id: generateId(),
        userId,
        businessId: alert.businessId,
        kind: "chain.alert",
        priority,
        personaHint: "org_admin",
        title: `${alert.shopName} · needs attention`,
        body: alert.message,
        href: links.href,
        mobileHref: links.mobileHref,
        resourceKind: "business",
        resourceId: alert.businessId,
        dedupeKey,
        metadata: { code: alert.code, severity: alert.severity },
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code !== "23505") {
        logger.warn({ err, dedupeKey }, "chain in-app notification failed");
      }
    }
  }
}

export async function listInAppNotificationsForUser(
  userId: string,
  opts: { businessId?: string; limit?: number; unreadOnly?: boolean },
) {
  await syncOrgAdminChainInAppNotifications(userId);

  const limit = Math.min(opts.limit ?? 40, 100);
  const conditions = [eq(userNotificationsTable.userId, userId)];
  if (opts.businessId) {
    conditions.push(eq(userNotificationsTable.businessId, opts.businessId));
  }
  if (opts.unreadOnly) {
    conditions.push(isNull(userNotificationsTable.readAt));
  }

  const rows = await db
    .select()
    .from(userNotificationsTable)
    .where(and(...conditions))
    .orderBy(desc(userNotificationsTable.createdAt))
    .limit(limit);

  return rows;
}

export async function getInAppUnreadCount(
  userId: string,
  businessId?: string,
): Promise<number> {
  await syncOrgAdminChainInAppNotifications(userId);

  const conditions = [
    eq(userNotificationsTable.userId, userId),
    isNull(userNotificationsTable.readAt),
  ];
  if (businessId) {
    conditions.push(eq(userNotificationsTable.businessId, businessId));
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userNotificationsTable)
    .where(and(...conditions));

  return row?.count ?? 0;
}

export async function markInAppNotificationRead(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const result = await db
    .update(userNotificationsTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(userNotificationsTable.id, notificationId),
        eq(userNotificationsTable.userId, userId),
      ),
    );
  return (result.rowCount ?? 0) > 0;
}

export async function markAllInAppNotificationsRead(
  userId: string,
  businessId?: string,
): Promise<number> {
  const conditions = [
    eq(userNotificationsTable.userId, userId),
    isNull(userNotificationsTable.readAt),
  ];
  if (businessId) {
    conditions.push(eq(userNotificationsTable.businessId, businessId));
  }

  const result = await db
    .update(userNotificationsTable)
    .set({ readAt: new Date() })
    .where(and(...conditions));

  return result.rowCount ?? 0;
}

export async function seedDemoInAppNotifications(
  userId: string,
  businessId: string,
  personaHint: NotificationPersonaHint,
): Promise<void> {
  const [pendingBooking] = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.businessId, businessId), eq(bookingsTable.status, "PENDING")))
    .limit(1);

  const [handoffConvo] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.businessId, businessId),
        eq(conversationsTable.status, "HANDED_OFF"),
      ),
    )
    .limit(1);

  const samples: Array<Omit<InAppDelivery, "businessId"> & { kind: InAppNotificationKind }> =
    personaHint === "staff"
        ? [
            {
              kind: "booking.created",
              title: "Your chair · 2:30pm",
              body: "Maria booked a cut & blow-dry with you today — Liv added it to your diary.",
              priority: "info",
              dedupeKey: `demo:staff-booking:${businessId}`,
              audience: "staff_assigned",
            },
          ]
        : [
            ...(pendingBooking
              ? [
                  {
                    kind: "booking.pending" as const,
                    title: "Booking needs your yes",
                    body: "Tap to open this booking — confirm or decline with the reason shown.",
                    priority: "act" as const,
                    dedupeKey: `demo:pending:${businessId}`,
                    resourceKind: "booking",
                    resourceId: pendingBooking.id,
                  },
                ]
              : []),
            ...(handoffConvo
              ? [
                  {
                    kind: "inbox.handoff" as const,
                    title: "Inbox handoff",
                    body: "A thread needs your decision — refund or reply is waiting.",
                    priority: "act" as const,
                    dedupeKey: `demo:handoff:${businessId}`,
                    resourceKind: "conversation",
                    resourceId: handoffConvo.id,
                  },
                ]
              : []),
          ];

  for (const s of samples) {
    await deliverInAppNotification({
      ...s,
      businessId,
      audience: s.audience ?? "operators",
    }).catch(() => undefined);
  }
}

/** Respect tenant push prefs for in-app as well. */
export function inAppAllowedForPrefs(
  kind: InAppNotificationKind,
  prefs: ReturnType<typeof parseNotificationPrefs>,
): boolean {
  switch (kind) {
    case "booking.created":
      return prefs.pushBookingCreated;
    case "booking.pending":
      return prefs.pushBookingPending;
    case "booking.cancelled":
      return prefs.pushBookingCancelled;
    case "inbox.inbound":
      return prefs.pushInboxInbound;
    case "inbox.handoff":
      return prefs.pushInboxHandoff;
    case "inbox.liv_booked":
      return prefs.pushLivBookingViaChannel;
    case "chain.alert":
    case "continuity.stuck":
    case "time_off.pending":
      return true;
    default:
      return true;
  }
}
