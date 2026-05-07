// Identity domain (the spine: users, businesses, memberships, delegations)
export * from "./identity/users";
export * from "./identity/businesses";
export * from "./identity/staff";
export * from "./identity/delegations";

// Booking domain (services, customers, bookings, availability, time-off-requests)
export * from "./booking/services";
export * from "./booking/customers";
export * from "./booking/bookings";
export * from "./booking/availability";
export * from "./booking/time-off-requests";

// Conversations (modality-agnostic)
export * from "./conversations/conversations";

// Payments
export * from "./payments/payments";

// Notifications
export * from "./notifications/notifications";

// AI (operational; eval traces live in @workspace/eval)
export * from "./ai/ai";

// Events (product analytics; audit log lives in @workspace/audit-log)
export * from "./events/events";

// Entitlements (feature flags table; product compositions in @workspace/entitlements)
export * from "./entitlements/feature-flags";

// Marketing
export * from "./marketing/marketing-leads";
