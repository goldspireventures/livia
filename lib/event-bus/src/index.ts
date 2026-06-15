/**
 * @workspace/event-bus
 *
 * Typed domain-event registry + thin Inngest wrapper (per ADR 0013, ADR 0018 pattern #2).
 *
 * Every state change in Livia emits a typed domain event. New consumers
 * subscribe without modifying the producer. New monetisable surfaces
 * (intelligence, white-label, partner integrations) don't require core changes.
 *
 * v1: thin wrapper; we register events here so the registry is a single
 * source of truth even before Inngest is wired in any environment.
 */
import { z } from "zod";

/** ---------- The event registry (the contract) ---------- */

export const eventRegistry = {
  // Booking domain
  "booking.created": z.object({
    businessId: z.string(),
    bookingId: z.string(),
    customerId: z.string(),
    serviceId: z.string(),
    staffId: z.string().nullable(),
    source: z.enum(["voice", "whatsapp", "sms", "web", "walk-in", "owner-manual", "partner-api"]),
    sourceConversationId: z.string().nullable(),
    startAt: z.string().datetime(),
  }),
  "booking.confirmed": z.object({ businessId: z.string(), bookingId: z.string() }),
  "booking.cancelled": z.object({
    businessId: z.string(),
    bookingId: z.string(),
    reason: z.string().nullable(),
  }),
  "booking.completed": z.object({ businessId: z.string(), bookingId: z.string() }),
  "booking.rescheduled": z.object({
    businessId: z.string(),
    bookingId: z.string(),
    previousStartAt: z.string().datetime(),
    newStartAt: z.string().datetime(),
  }),
  "booking.no-show": z.object({ businessId: z.string(), bookingId: z.string() }),

  // Conversations / inbox
  "conversation.created": z.object({
    businessId: z.string(),
    conversationId: z.string(),
    channel: z.string(),
  }),
  "conversation.updated": z.object({
    businessId: z.string(),
    conversationId: z.string(),
    status: z.enum(["OPEN", "HANDED_OFF", "CLOSED"]),
    aiHandled: z.boolean(),
  }),

  // Voice
  "voice.call.received": z.object({
    businessId: z.string(),
    callSid: z.string(),
    fromNumber: z.string(),
  }),
  "voice.call.completed": z.object({
    businessId: z.string(),
    callSid: z.string(),
    durationSeconds: z.number().int().nonnegative(),
    bookedBookingId: z.string().nullable(),
  }),

  // Audit (audit-log writes itself; this event is the public notification)
  "audit.event.recorded": z.object({
    businessId: z.string(),
    auditLogId: z.string(),
    actionClass: z.string(),
  }),

  // Refund / time-off (workflow-driven)
  "refund.proposed": z.object({
    businessId: z.string(),
    refundId: z.string(),
    amountEurCents: z.number().int().nonnegative(),
  }),
  "refund.approved": z.object({ businessId: z.string(), refundId: z.string() }),
  "refund.escalated": z.object({ businessId: z.string(), refundId: z.string() }),
  "time-off.proposed": z.object({ businessId: z.string(), requestId: z.string() }),
  "time-off.approved": z.object({ businessId: z.string(), requestId: z.string() }),

  // Cross-tenant intelligence (never leaves boundary; per ADR 0014)
  "peer-set.aggregate.computed": z.object({
    aggregateKey: z.string(),
    contributingTenantCount: z.number().int().min(10),
  }),

  "morning.briefing.ready": z.object({
    businessId: z.string(),
    briefingDate: z.string(),
    briefingId: z.string(),
  }),

  "payment.failed": z.object({
    businessId: z.string(),
    paymentId: z.string(),
    amountMinor: z.number().int().nonnegative().optional(),
    currency: z.string().optional(),
  }),

  "commerce.signal.detected": z.object({
    businessId: z.string(),
    signalId: z.string(),
    severity: z.enum(["act", "watch", "info"]),
  }),

  // Twin understanding outputs → Liv reactions
  "twin.observation.generated": z.object({
    businessId: z.string(),
    observationKey: z.string(),
    domain: z.string(),
    title: z.string(),
    body: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
    href: z.string().optional(),
  }),
  "twin.insight.generated": z.object({
    businessId: z.string(),
    observationKey: z.string(),
    domain: z.string(),
    title: z.string(),
    body: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
    href: z.string().optional(),
  }),
  "twin.risk.detected": z.object({
    businessId: z.string(),
    riskId: z.string(),
    domain: z.string(),
    title: z.string(),
    body: z.string(),
    href: z.string().optional(),
    confidence: z.enum(["high", "medium", "low"]).optional(),
  }),
  "twin.opportunity.detected": z.object({
    businessId: z.string(),
    opportunityId: z.string(),
    domain: z.string(),
    title: z.string(),
    body: z.string(),
    href: z.string().optional(),
    confidence: z.enum(["high", "medium", "low"]).optional(),
  }),

  // Eval / rollback
  "eval.rollback.triggered": z.object({
    businessId: z.string().nullable(),
    suite: z.string(),
    rollbackClass: z.enum(["DETERMINISTIC", "POLICY_VIOLATION", "AGENT_LOOP", "UNKNOWN"]),
    requiresHumanApproval: z.boolean(),
  }),
} as const satisfies Record<string, z.ZodType>;

export type EventName = keyof typeof eventRegistry;
export type EventPayload<K extends EventName> = z.infer<(typeof eventRegistry)[K]>;

/** ---------- Publisher (the runtime contract) ---------- */

export interface EventPublisher {
  publish<K extends EventName>(name: K, payload: EventPayload<K>): Promise<void>;
}

/** Default in-process publisher — useful for tests and local dev before Inngest is wired. */
export class InMemoryEventPublisher implements EventPublisher {
  public readonly published: Array<{ name: EventName; payload: unknown }> = [];

  async publish<K extends EventName>(name: K, payload: EventPayload<K>): Promise<void> {
    const schema = eventRegistry[name];
    schema.parse(payload);
    this.published.push({ name, payload });
  }
}
