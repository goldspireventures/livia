/**
 * Bridges flat `events` table types (analytics) to EVENT_CATALOG (Volume H).
 * @see docs/engineering/EVENT-TAXONOMY.md
 */
import {
  EVENT_CATALOG,
  getEventCatalogEntryByAnalyticsType,
  type EventCatalogEntry,
} from "./event-catalog";

/** Internal/ops analytics types — catalogued but not business-reality events. */
export const ANALYTICS_OPS_ALLOWLIST = new Set([
  "AI_OBSERVATION_CREATED",
  "FEATURE_FLAG_UPDATED",
]);

export type AnalyticsEventValidation = {
  type: string;
  catalogued: boolean;
  entry?: EventCatalogEntry;
  opsOnly: boolean;
};

export function validateAnalyticsEventType(type: string): AnalyticsEventValidation {
  const entry = getEventCatalogEntryByAnalyticsType(type);
  if (entry) {
    return { type, catalogued: true, entry, opsOnly: false };
  }
  if (ANALYTICS_OPS_ALLOWLIST.has(type)) {
    return { type, catalogued: true, opsOnly: true };
  }
  return { type, catalogued: false, opsOnly: false };
}

/** Every analytics type that must appear in EVENT_CATALOG or ANALYTICS_OPS_ALLOWLIST. */
export const REQUIRED_ANALYTICS_EVENT_TYPES = [
  "USER_SIGNED_UP",
  "BUSINESS_CREATED",
  "BUSINESS_UPDATED",
  "BUSINESS_ACTIVATED",
  "STAFF_CREATED",
  "STAFF_UPDATED",
  "STAFF_DEACTIVATED",
  "SERVICE_CREATED",
  "SERVICE_UPDATED",
  "SERVICE_DEACTIVATED",
  "AVAILABILITY_UPDATED",
  "TIME_OFF_CREATED",
  "TIME_OFF_REMOVED",
  "BOOKING_CREATED",
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "BOOKING_COMPLETED",
  "BOOKING_RESCHEDULED",
  "BOOKING_NO_SHOW",
  "CUSTOMER_CREATED",
  "CUSTOMER_UPDATED",
  "MESSAGE_RECEIVED",
  "MESSAGE_SENT",
  "CHANNEL_IDENTITY_LINKED",
  "PAYMENT_INTENT_CREATED",
  "PAYMENT_SUCCEEDED",
  "PAYMENT_FAILED",
  "REFUND_CREATED",
  "REVIEW_RECEIVED",
  "PORTFOLIO_ITEM_ATTACHED",
  "NOTIFICATION_SENT",
  "NOTIFICATION_FAILED",
  "INCIDENT_CREATED",
  "INCIDENT_UPDATED",
  "CAPABILITY_STATE_CHANGED",
  "COMMERCE_SIGNAL_DETECTED",
  "TWIN_OBSERVATION_GENERATED",
  "TWIN_INSIGHT_GENERATED",
  "TWIN_RISK_DETECTED",
  "TWIN_OPPORTUNITY_DETECTED",
  "ONBOARDING_ACT_COMPLETED",
  "ONBOARDING_GO_LIVE_BLOCKED",
  "PRESENTATION_PRESET_CHANGED",
  ...ANALYTICS_OPS_ALLOWLIST,
] as const;

export function listUncataloguedAnalyticsTypes(): string[] {
  return REQUIRED_ANALYTICS_EVENT_TYPES.filter((type) => {
    const v = validateAnalyticsEventType(type);
    return !v.catalogued;
  });
}

export function assertAnalyticsEventCatalogComplete(): void {
  const missing = listUncataloguedAnalyticsTypes();
  if (missing.length > 0) {
    throw new Error(
      `Analytics event types missing from EVENT_CATALOG or ops allowlist: ${missing.join(", ")}`,
    );
  }
}

export function catalogCoverageReport(): {
  catalogEntries: number;
  analyticsMapped: number;
  opsAllowlisted: number;
  v1Required: number;
} {
  const mapped = EVENT_CATALOG.filter((e) => e.analyticsType).length;
  return {
    catalogEntries: EVENT_CATALOG.length,
    analyticsMapped: mapped,
    opsAllowlisted: ANALYTICS_OPS_ALLOWLIST.size,
    v1Required: EVENT_CATALOG.filter((e) => e.v1Required).length,
  };
}
