import { db, domainEventDedupTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  eventRegistry,
  type EventName,
  type EventPayload,
  type EventPublisher,
  InMemoryEventPublisher,
} from "@workspace/event-bus";
import { inngest, isInngestWorkflowsEnabled } from "./inngest";
import { logger } from "./logger";

const testPublisher = new InMemoryEventPublisher();

class InngestEventPublisher implements EventPublisher {
  async publish<K extends EventName>(name: K, payload: EventPayload<K>): Promise<void> {
    eventRegistry[name].parse(payload);
    // Inngest namespaces events with the app id (`livia`) automatically.
    await inngest.send({
      name,
      data: payload as Record<string, unknown>,
    });
  }
}

let publisher: EventPublisher | null = null;

export function getEventPublisher(): EventPublisher {
  if (process.env.NODE_ENV === "test") return testPublisher;
  if (!publisher) {
    publisher = isInngestWorkflowsEnabled() ? new InngestEventPublisher() : testPublisher;
  }
  return publisher;
}

/**
 * Publish a domain event once per dedupeKey (e.g. `bizId:bookingId:confirmed`).
 * Duplicate publishes are no-ops — satisfies Phase 3 idempotency exit criteria.
 */
function businessIdFromPayload(name: EventName, payload: unknown): string {
  const p = payload as { businessId?: string };
  if (p.businessId) return p.businessId;
  if (name === "peer-set.aggregate.computed") return "system";
  throw new Error(`Event ${name} requires businessId in payload`);
}

export async function publishDomainEvent<K extends EventName>(
  name: K,
  payload: EventPayload<K>,
  dedupeKey: string,
): Promise<boolean> {
  eventRegistry[name].parse(payload);
  const businessId = businessIdFromPayload(name, payload);

  try {
    await db.insert(domainEventDedupTable).values({
      dedupeKey,
      eventName: name,
      businessId,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      logger.debug({ dedupeKey, name }, "domain event deduped");
      return false;
    }
    throw err;
  }

  try {
    await getEventPublisher().publish(name, payload);
    logger.info({ name, businessId, dedupeKey }, "domain event published");
    const { fanOutDomainEventToWebhooks } = await import(
      "../services/webhook-delivery.service"
    );
    void fanOutDomainEventToWebhooks(name, payload, dedupeKey).catch((webhookErr) => {
      logger.warn({ webhookErr, name, dedupeKey }, "webhook fanout failed");
    });
    void import("../services/liv-reactions.service")
      .then(({ processLivReactionsForEvent }) => processLivReactionsForEvent(name, payload))
      .catch((livErr) => {
        logger.warn({ livErr, name, businessId }, "liv reactions failed");
      });
    void import("../services/notification-orchestrator.service")
      .then(({ processPushNotificationsForEvent }) =>
        processPushNotificationsForEvent(name, payload),
      )
      .catch((pushErr) => {
        logger.warn({ pushErr, name, businessId }, "push notifications failed");
      });
    return true;
  } catch (err) {
    await db.delete(domainEventDedupTable).where(eq(domainEventDedupTable.dedupeKey, dedupeKey));
    logger.warn({ err, name, dedupeKey }, "domain event publish failed");
    throw err;
  }
}

export function getTestEventPublisher(): InMemoryEventPublisher {
  return testPublisher;
}
