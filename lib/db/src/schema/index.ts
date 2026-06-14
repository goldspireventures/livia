// Identity domain (the spine: users, businesses, memberships, delegations)
export * from "./identity/users";
export * from "./identity/businesses";
export * from "./identity/staff";
export * from "./identity/delegations";
export * from "./identity/host-renter-links";
export * from "./identity/premises";
export * from "./identity/premises-co-tenant-invites";
export * from "./identity/channel-premises-routing";
export * from "./identity/franchise-links";
export * from "./identity/enterprise-sso";

// Booking domain (services, customers, bookings, availability, time-off-requests)
export * from "./booking/services";
export * from "./booking/customers";
export * from "./booking/bookings";
export * from "./booking/availability";
export * from "./booking/time-off-requests";
export * from "./booking/staff-shifts";
export * from "./booking/shift-templates";
export * from "./booking/hiring";
export * from "./booking/class-sessions";
export * from "./booking/package-credits";
export * from "./booking/design-proofs";
export * from "./booking/design-proof-revisions";
export * from "./booking/design-proof-guest-access";
export * from "./booking/booking-resources";
export * from "./booking/day-packages";
export * from "./booking/care-series";
export * from "./booking/allied-health";
export * from "./booking/pets";
export * from "./booking/medspa";
export * from "./booking/booking-guest-access";
export * from "./booking/medical-intake-guest-access";
export * from "./booking/visit-feedback";
export * from "./booking/consult-first";

// Conversations (modality-agnostic)
export * from "./conversations/conversations";

// Voice (Twilio call sessions)
export * from "./voice/voice-call-sessions";

// Payments
export * from "./payments/payments";
export * from "./payments/stripe-events";

// Retail (mini-store)
export * from "./retail/retail-products";

// Notifications
export * from "./notifications/notifications";
export * from "./notifications/in-app-notifications";

// AI (operational; eval traces live in @workspace/eval)
export * from "./ai/ai";
export * from "./ai/public-chat-rate-limits";
export * from "./ai/liv-action-proposals";

// Events (product analytics; audit log lives in @workspace/audit-log)
export * from "./events/events";

// Entitlements (feature flags table; product compositions in @workspace/entitlements)
export * from "./entitlements/feature-flags";

// Marketing
export * from "./marketing/marketing-leads";

// Guest hub (W6 — P7 cross-shop vault)
export * from "./guest/guest-hub";
export * from "./guest/aftercare-sequence";

// Billing (usage meters; plan composition in @workspace/entitlements)
export * from "./billing";

// Workflows (Inngest idempotency + pause ledger)
export * from "./workflows";

// Integrations (partner API keys, outbound webhooks)
export * from "./integrations";

// Support (tenant → Livia Inc)
export * from "./support/support-tickets";

// Internal ops (monitoring, alerts — Livia Inc only)
export * from "./internal-ops";

// Liv platform (briefings, versioned prompts)
export * from "./liv";

// Media assets (avatars, attachments)
export * from "./media";
