import { db, usageEventsTable } from "@workspace/db";
import {
  meterEventSchema,
  type MeterEvent,
  type MeterRecorder,
} from "@workspace/metering";
import { logger } from "./logger";

export class DbMeterRecorder implements MeterRecorder {
  async record(event: MeterEvent): Promise<void> {
    const parsed = meterEventSchema.parse(event);
    try {
      await db.insert(usageEventsTable).values({
        businessId: parsed.businessId,
        meterKey: parsed.meterKey,
        quantity: Math.round(parsed.quantity),
        occurredAt: new Date(parsed.occurredAt),
        metadata: parsed.metadata,
      });
    } catch (err) {
      logger.error(
        { err, businessId: parsed.businessId, meterKey: parsed.meterKey },
        "meter record failed",
      );
      throw err;
    }
  }
}

export const meterRecorder = new DbMeterRecorder();

export async function recordMeter(
  businessId: string,
  meterKey: MeterEvent["meterKey"],
  quantity: number,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await meterRecorder.record({
    businessId,
    meterKey,
    quantity,
    occurredAt: new Date().toISOString(),
    metadata,
  });
}
