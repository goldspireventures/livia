import type { EventLevel } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const BliqEventTypes = {
  BUSINESS_CREATED: "BUSINESS_CREATED",
  BUSINESS_UPDATED: "BUSINESS_UPDATED",
  BUSINESS_ACCESS_CHECKED: "BUSINESS_ACCESS_CHECKED",
  BUSINESS_ACCESS_DENIED: "BUSINESS_ACCESS_DENIED",
  MEMBERSHIP_CREATED: "MEMBERSHIP_CREATED",

  STAFF_CREATED: "STAFF_CREATED",
  STAFF_UPDATED: "STAFF_UPDATED",
  STAFF_DEACTIVATED: "STAFF_DEACTIVATED",

  SERVICE_CREATED: "SERVICE_CREATED",
  SERVICE_UPDATED: "SERVICE_UPDATED",
  SERVICE_DEACTIVATED: "SERVICE_DEACTIVATED",

  STAFF_SERVICE_ASSIGNED: "STAFF_SERVICE_ASSIGNED",
  STAFF_SERVICE_UNASSIGNED: "STAFF_SERVICE_UNASSIGNED",

  CUSTOMER_CREATED: "CUSTOMER_CREATED",
  CUSTOMER_UPDATED: "CUSTOMER_UPDATED",
  CUSTOMER_DELETED: "CUSTOMER_DELETED",

  CHANNEL_IDENTITY_CREATED: "CHANNEL_IDENTITY_CREATED",
  CHANNEL_IDENTITY_UPDATED: "CHANNEL_IDENTITY_UPDATED",
  CHANNEL_IDENTITY_DELETED: "CHANNEL_IDENTITY_DELETED",

  BOOKING_CREATED: "BOOKING_CREATED",
  BOOKING_UPDATED: "BOOKING_UPDATED",

  AVAILABILITY_RULE_CREATED: "AVAILABILITY_RULE_CREATED",
  AVAILABILITY_RULE_UPDATED: "AVAILABILITY_RULE_UPDATED",
  AVAILABILITY_RULE_DELETED: "AVAILABILITY_RULE_DELETED",

  TIME_OFF_CREATED: "TIME_OFF_CREATED",
  TIME_OFF_UPDATED: "TIME_OFF_UPDATED",
  TIME_OFF_DELETED: "TIME_OFF_DELETED",

  FEATURE_FLAG_CREATED: "FEATURE_FLAG_CREATED",
  FEATURE_FLAG_UPDATED: "FEATURE_FLAG_UPDATED",
  FEATURE_FLAG_DELETED: "FEATURE_FLAG_DELETED",

  PAYMENT_INTENT_CREATED: "PAYMENT_INTENT_CREATED",
  PAYMENT_INTENT_UPDATED: "PAYMENT_INTENT_UPDATED",
  STRIPE_WEBHOOK_UNKNOWN_INTENT: "STRIPE_WEBHOOK_UNKNOWN_INTENT",
} as const;

export type BliqEventType = (typeof BliqEventTypes)[keyof typeof BliqEventTypes];

// Back-compat for Phase 1 imports
export const Phase1EventTypes = BliqEventTypes;
export type Phase1EventType = BliqEventType;

type LogEventArgs = {
  type: BliqEventType;
  source: "web" | "mobile" | "api" | "system";
  level?: EventLevel;
  businessId?: string;
  actorUserId?: string;
  subjectType?: string;
  subjectId?: string;
  payload?: unknown;
};

function toJsonSafe(value: unknown) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { error: "payload_not_json_serializable" };
  }
}

export async function logEvent(args: LogEventArgs) {
  try {
    const {
      type,
      source,
      level = "INFO",
      businessId,
      actorUserId,
      subjectType,
      subjectId,
      payload,
    } = args;

    await prisma.event.create({
      data: {
        type,
        level,
        businessId: businessId ?? null,
        actorUserId: actorUserId ?? null,
        subjectType: subjectType ?? null,
        subjectId: subjectId ?? null,
        payload: { source, ...(payload ? { payload: toJsonSafe(payload) } : {}) },
      },
    });
  } catch (err) {
    // Logging must never crash the main flow.
    console.error("Event logging failed", err);
  }
}

