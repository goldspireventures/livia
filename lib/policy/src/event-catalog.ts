/**
 * Canonical event catalog — Volume H hub.
 * Maps business-reality events to analytics types and domain-bus keys.
 * @see docs/engineering/EVENT-TAXONOMY.md
 */

export type EventCategory =
  | "business"
  | "people"
  | "scheduling"
  | "communication"
  | "commerce"
  | "trust"
  | "capability"
  | "experience"
  | "twin"
  | "liv"
  | "onboarding";

export type EventImportance = "critical" | "high" | "medium" | "low";

export type EventCatalogEntry = {
  /** PascalCase canonical name (EVENT_TAXONOMY.md) */
  name: string;
  category: EventCategory;
  owner: string;
  importance: EventImportance;
  /** Flat analytics row type in `events` table, when emitted */
  analyticsType?: string;
  /** Typed domain bus key in @workspace/event-bus, when published */
  domainBusKey?: string;
  /** V1 activation / ops paths must emit this event */
  v1Required?: boolean;
};

export const EVENT_CATALOG: EventCatalogEntry[] = [
  {
    name: "BusinessCreated",
    category: "business",
    owner: "business-domain",
    importance: "high",
    analyticsType: "BUSINESS_CREATED",
    v1Required: true,
  },
  {
    name: "BusinessActivated",
    category: "business",
    owner: "onboarding-domain",
    importance: "critical",
    analyticsType: "BUSINESS_ACTIVATED",
    v1Required: true,
  },
  {
    name: "BookingCreated",
    category: "scheduling",
    owner: "bookings-domain",
    importance: "high",
    analyticsType: "BOOKING_CREATED",
    domainBusKey: "booking.created",
    v1Required: true,
  },
  {
    name: "BookingConfirmed",
    category: "scheduling",
    owner: "bookings-domain",
    importance: "high",
    analyticsType: "BOOKING_CONFIRMED",
    domainBusKey: "booking.confirmed",
  },
  {
    name: "BookingCancelled",
    category: "scheduling",
    owner: "bookings-domain",
    importance: "high",
    analyticsType: "BOOKING_CANCELLED",
    domainBusKey: "booking.cancelled",
  },
  {
    name: "BookingCompleted",
    category: "scheduling",
    owner: "bookings-domain",
    importance: "high",
    analyticsType: "BOOKING_COMPLETED",
    domainBusKey: "booking.completed",
  },
  {
    name: "BookingRescheduled",
    category: "scheduling",
    owner: "bookings-domain",
    importance: "high",
    analyticsType: "BOOKING_RESCHEDULED",
    domainBusKey: "booking.rescheduled",
    v1Required: true,
  },
  {
    name: "CustomerCreated",
    category: "people",
    owner: "people-domain",
    importance: "medium",
    analyticsType: "CUSTOMER_CREATED",
  },
  {
    name: "PaymentCaptured",
    category: "commerce",
    owner: "commerce-layer",
    importance: "critical",
    analyticsType: "PAYMENT_SUCCEEDED",
  },
  {
    name: "OnboardingActCompleted",
    category: "onboarding",
    owner: "onboarding-domain",
    importance: "medium",
    analyticsType: "ONBOARDING_ACT_COMPLETED",
  },
  {
    name: "OnboardingGoLiveBlocked",
    category: "onboarding",
    owner: "onboarding-domain",
    importance: "medium",
    analyticsType: "ONBOARDING_GO_LIVE_BLOCKED",
  },
  {
    name: "MessageSent",
    category: "communication",
    owner: "relationship-layer",
    importance: "medium",
    analyticsType: "MESSAGE_SENT",
  },
  {
    name: "ReviewReceived",
    category: "trust",
    owner: "trust-layer",
    importance: "high",
    analyticsType: "REVIEW_RECEIVED",
  },
  {
    name: "UserSignedUp",
    category: "people",
    owner: "identity-domain",
    importance: "medium",
    analyticsType: "USER_SIGNED_UP",
  },
  {
    name: "BusinessUpdated",
    category: "business",
    owner: "business-domain",
    importance: "low",
    analyticsType: "BUSINESS_UPDATED",
  },
  {
    name: "PresentationPresetChanged",
    category: "experience",
    owner: "experience-layer",
    importance: "medium",
    analyticsType: "PRESENTATION_PRESET_CHANGED",
  },
  {
    name: "StaffCreated",
    category: "people",
    owner: "people-domain",
    importance: "medium",
    analyticsType: "STAFF_CREATED",
  },
  {
    name: "StaffUpdated",
    category: "people",
    owner: "people-domain",
    importance: "low",
    analyticsType: "STAFF_UPDATED",
  },
  {
    name: "StaffArchived",
    category: "people",
    owner: "people-domain",
    importance: "medium",
    analyticsType: "STAFF_DEACTIVATED",
  },
  {
    name: "ServiceCreated",
    category: "scheduling",
    owner: "service-domain",
    importance: "medium",
    analyticsType: "SERVICE_CREATED",
  },
  {
    name: "ServiceUpdated",
    category: "scheduling",
    owner: "service-domain",
    importance: "low",
    analyticsType: "SERVICE_UPDATED",
  },
  {
    name: "ServiceArchived",
    category: "scheduling",
    owner: "service-domain",
    importance: "low",
    analyticsType: "SERVICE_DEACTIVATED",
  },
  {
    name: "AvailabilityUpdated",
    category: "scheduling",
    owner: "scheduling-domain",
    importance: "medium",
    analyticsType: "AVAILABILITY_UPDATED",
  },
  {
    name: "TimeOffCreated",
    category: "scheduling",
    owner: "scheduling-domain",
    importance: "medium",
    analyticsType: "TIME_OFF_CREATED",
  },
  {
    name: "TimeOffRemoved",
    category: "scheduling",
    owner: "scheduling-domain",
    importance: "medium",
    analyticsType: "TIME_OFF_REMOVED",
  },
  {
    name: "BookingNoShow",
    category: "scheduling",
    owner: "bookings-domain",
    importance: "high",
    analyticsType: "BOOKING_NO_SHOW",
    domainBusKey: "booking.no-show",
  },
  {
    name: "CustomerUpdated",
    category: "people",
    owner: "people-domain",
    importance: "low",
    analyticsType: "CUSTOMER_UPDATED",
  },
  {
    name: "MessageReceived",
    category: "communication",
    owner: "relationship-layer",
    importance: "medium",
    analyticsType: "MESSAGE_RECEIVED",
  },
  {
    name: "ChannelIdentityLinked",
    category: "communication",
    owner: "relationship-layer",
    importance: "medium",
    analyticsType: "CHANNEL_IDENTITY_LINKED",
  },
  {
    name: "PaymentIntentCreated",
    category: "commerce",
    owner: "commerce-layer",
    importance: "high",
    analyticsType: "PAYMENT_INTENT_CREATED",
  },
  {
    name: "PaymentFailed",
    category: "commerce",
    owner: "commerce-layer",
    importance: "high",
    analyticsType: "PAYMENT_FAILED",
  },
  {
    name: "RefundCreated",
    category: "commerce",
    owner: "commerce-layer",
    importance: "high",
    analyticsType: "REFUND_CREATED",
  },
  {
    name: "PortfolioItemAttached",
    category: "trust",
    owner: "trust-layer",
    importance: "medium",
    analyticsType: "PORTFOLIO_ITEM_ATTACHED",
  },
  {
    name: "NotificationSent",
    category: "communication",
    owner: "notification-layer",
    importance: "medium",
    analyticsType: "NOTIFICATION_SENT",
  },
  {
    name: "NotificationFailed",
    category: "communication",
    owner: "notification-layer",
    importance: "high",
    analyticsType: "NOTIFICATION_FAILED",
  },
  {
    name: "IncidentCreated",
    category: "liv",
    owner: "liv-ops",
    importance: "high",
    analyticsType: "INCIDENT_CREATED",
  },
  {
    name: "IncidentUpdated",
    category: "liv",
    owner: "liv-ops",
    importance: "medium",
    analyticsType: "INCIDENT_UPDATED",
  },
  {
    name: "CapabilityStateChanged",
    category: "capability",
    owner: "capability-graph",
    importance: "medium",
    analyticsType: "CAPABILITY_STATE_CHANGED",
  },
  {
    name: "CommerceSignalDetected",
    category: "commerce",
    owner: "commerce-intelligence",
    importance: "high",
    analyticsType: "COMMERCE_SIGNAL_DETECTED",
  },
  {
    name: "ObservationGenerated",
    category: "twin",
    owner: "twin-layer",
    importance: "high",
    analyticsType: "TWIN_OBSERVATION_GENERATED",
    domainBusKey: "twin.observation.generated",
  },
  {
    name: "InsightGenerated",
    category: "twin",
    owner: "twin-layer",
    importance: "high",
    analyticsType: "TWIN_INSIGHT_GENERATED",
    domainBusKey: "twin.insight.generated",
  },
  {
    name: "RiskDetected",
    category: "twin",
    owner: "twin-layer",
    importance: "high",
    analyticsType: "TWIN_RISK_DETECTED",
    domainBusKey: "twin.risk.detected",
  },
  {
    name: "OpportunityDetected",
    category: "twin",
    owner: "twin-layer",
    importance: "medium",
    analyticsType: "TWIN_OPPORTUNITY_DETECTED",
    domainBusKey: "twin.opportunity.detected",
  },
];

const byAnalyticsType = new Map(
  EVENT_CATALOG.filter((e) => e.analyticsType).map((e) => [e.analyticsType!, e]),
);

const byName = new Map(EVENT_CATALOG.map((e) => [e.name, e]));

export function getEventCatalogEntryByName(name: string): EventCatalogEntry | undefined {
  return byName.get(name);
}

export function getEventCatalogEntryByAnalyticsType(
  analyticsType: string,
): EventCatalogEntry | undefined {
  return byAnalyticsType.get(analyticsType);
}

export function listV1RequiredEvents(): EventCatalogEntry[] {
  return EVENT_CATALOG.filter((e) => e.v1Required);
}

export function listEventCatalogByCategory(category: EventCategory): EventCatalogEntry[] {
  return EVENT_CATALOG.filter((e) => e.category === category);
}
