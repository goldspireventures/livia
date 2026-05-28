export const PARTNER_SCOPES = [
  "bookings:write",
  "bookings:read",
  "customers:read",
  "services:read",
  "slots:read",
  "business:read",
] as const;

export type PartnerScope = (typeof PARTNER_SCOPES)[number];

export const WEBHOOK_SUBSCRIBABLE_EVENTS = [
  "booking.created",
  "booking.confirmed",
  "booking.cancelled",
  "booking.completed",
  "booking.no-show",
] as const;

export type WebhookEventName = (typeof WEBHOOK_SUBSCRIBABLE_EVENTS)[number];

export function isPartnerScope(s: string): s is PartnerScope {
  return (PARTNER_SCOPES as readonly string[]).includes(s);
}

export function isWebhookEvent(s: string): s is WebhookEventName {
  return (WEBHOOK_SUBSCRIBABLE_EVENTS as readonly string[]).includes(s);
}
