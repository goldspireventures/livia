/**
 * @workspace/metering
 *
 * Usage meters (per ADR 0018, pattern #6).
 *
 * Records countable usage events that the settlement engine consumes
 * (see future @workspace/settlement). Decoupled from billing intentionally
 * so we can experiment with revenue models per cohort.
 *
 * v1: meters live in our DB.
 * v1.5+: consider streaming to a third-party (Orb, m3ter) if usage outgrows.
 */
import { z } from "zod";

export const meterKeySchema = z.enum([
  "booking_completed",
  "voice_minute_inbound",
  "voice_minute_outbound",
  "voice_call_completed",
  "voice_booking_outcome",
  "whatsapp_message_outbound",
  "sms_message_outbound",
  "active_staff_seat",
  "audit_log_event",
  "peer_set_insight_view",
  "migration_run",
]);
export type MeterKey = z.infer<typeof meterKeySchema>;

export const meterEventSchema = z.object({
  businessId: z.string().min(1),
  meterKey: meterKeySchema,
  /** Monotonic counter increment (e.g., 1 for a booking; minutes for voice). */
  quantity: z.number().nonnegative(),
  /** ISO-8601 — when the metered usage occurred. */
  occurredAt: z.string().datetime(),
  /** Free-form metadata for settlement (e.g., the booking_id that drove the increment). */
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type MeterEvent = z.infer<typeof meterEventSchema>;

export interface MeterRecorder {
  record(event: MeterEvent): Promise<void>;
}

/** In-memory recorder for tests and local dev. */
export class InMemoryMeterRecorder implements MeterRecorder {
  public readonly events: MeterEvent[] = [];
  async record(event: MeterEvent): Promise<void> {
    const validated = meterEventSchema.parse(event);
    this.events.push(validated);
  }
}
