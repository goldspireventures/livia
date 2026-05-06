import { Prisma, type PaymentIntentStatus } from "@prisma/client";
import { z } from "zod";

import { LiviaEventTypes, logEvent } from "@/lib/events";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getBookingById } from "@/services/booking/bookingService";
import {
  createStripePaymentIntent,
  isStripeSecretConfigured,
  mapStripePaymentIntentStatus,
} from "@/services/payments/stripeAdapter";

const PaymentIntentStatusSchema = z.enum([
  "CREATED",
  "REQUIRES_ACTION",
  "PROCESSING",
  "SUCCEEDED",
  "CANCELED",
  "FAILED",
]);

const CreatePaymentIntentInput = z.object({
  businessId: z.string().min(1),
  actorUserId: z.string().min(1),
  bookingId: z.string().min(1).optional().nullable(),
  amountMinorUnits: z.number().int().positive(),
  currency: z.string().length(3),
  provider: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function createPaymentIntentRecord(input: z.infer<typeof CreatePaymentIntentInput>) {
  const parsed = CreatePaymentIntentInput.parse(input);
  const { businessId, actorUserId, bookingId, amountMinorUnits, currency, provider, metadata } = parsed;

  if (bookingId) {
    await getBookingById({ businessId, bookingId });
  }

  const providerNorm = (provider?.trim() || "stripe").toLowerCase();

  const row = await prisma.paymentIntentRecord.create({
    data: {
      businessId,
      bookingId: bookingId ?? null,
      provider: providerNorm,
      amountMinorUnits,
      currency: currency.toUpperCase(),
      status: "CREATED",
      metadata: metadata ?? undefined,
    },
  });

  await logEvent({
    type: LiviaEventTypes.PAYMENT_INTENT_CREATED,
    source: "api",
    businessId,
    actorUserId,
    subjectType: "PaymentIntentRecord",
    subjectId: row.id,
    payload: { bookingId: row.bookingId, amountMinorUnits, currency: row.currency },
  });

  if (providerNorm === "stripe" && isStripeSecretConfigured()) {
    try {
      const pi = await createStripePaymentIntent({
        amountMinorUnits,
        currency,
        metadata: {
          liviaPaymentIntentRecordId: row.id,
          businessId,
          bookingId: bookingId ?? null,
        },
        idempotencyKey: `livia-pi-${row.id}`,
      });

      const updated = await prisma.paymentIntentRecord.update({
        where: { id: row.id },
        data: {
          externalId: pi.id,
          status: mapStripePaymentIntentStatus(pi.status),
        },
      });

      await logEvent({
        type: LiviaEventTypes.PAYMENT_INTENT_UPDATED,
        source: "api",
        businessId,
        actorUserId,
        subjectType: "PaymentIntentRecord",
        subjectId: row.id,
        payload: { stripePaymentIntentId: pi.id, source: "stripe_create" },
      });

      return updated;
    } catch (err) {
      await prisma.paymentIntentRecord.delete({ where: { id: row.id } }).catch(() => undefined);
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw badRequest(`Could not create Stripe PaymentIntent: ${msg}`);
    }
  }

  return row;
}

const ListPaymentIntentsInput = z.object({
  businessId: z.string().min(1),
  bookingId: z.string().min(1).optional(),
});

export async function listPaymentIntentRecords(input: z.infer<typeof ListPaymentIntentsInput>) {
  const { businessId, bookingId } = ListPaymentIntentsInput.parse(input);
  return prisma.paymentIntentRecord.findMany({
    where: {
      businessId,
      ...(bookingId ? { bookingId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

const GetPaymentIntentInput = z.object({
  businessId: z.string().min(1),
  paymentIntentId: z.string().min(1),
});

export async function getPaymentIntentRecordById(input: z.infer<typeof GetPaymentIntentInput>) {
  const { businessId, paymentIntentId } = GetPaymentIntentInput.parse(input);
  const row = await prisma.paymentIntentRecord.findFirst({
    where: { id: paymentIntentId, businessId },
  });
  if (!row) throw notFound("Payment intent not found.");
  return row;
}

const UpdatePaymentIntentInput = z.object({
  businessId: z.string().min(1),
  paymentIntentId: z.string().min(1),
  actorUserId: z.string().min(1),
  data: z
    .object({
      status: PaymentIntentStatusSchema.optional(),
      externalId: z.string().min(1).optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional().nullable(),
    })
    .strict(),
});

export async function updatePaymentIntentRecord(input: z.infer<typeof UpdatePaymentIntentInput>) {
  const { businessId, paymentIntentId, actorUserId, data } = UpdatePaymentIntentInput.parse(input);
  const current = await getPaymentIntentRecordById({ businessId, paymentIntentId });

  if (data.externalId) {
    const duplicate = await prisma.paymentIntentRecord.findFirst({
      where: {
        businessId,
        provider: current.provider,
        externalId: data.externalId,
        NOT: { id: paymentIntentId },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw conflict("Another payment intent already uses this external id for this provider.");
    }
  }

  try {
    const updated = await prisma.paymentIntentRecord.update({
      where: { id: paymentIntentId },
      data: {
        ...(data.status ? { status: data.status as PaymentIntentStatus } : {}),
        ...(data.externalId !== undefined ? { externalId: data.externalId } : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata === null ? Prisma.JsonNull : data.metadata } : {}),
      },
    });

    await logEvent({
      type: LiviaEventTypes.PAYMENT_INTENT_UPDATED,
      source: "api",
      businessId,
      actorUserId,
      subjectType: "PaymentIntentRecord",
      subjectId: paymentIntentId,
      payload: { updatedFields: Object.keys(data) },
    });

    return updated;
  } catch (err: unknown) {
    const code = typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
    if (code === "P2002") {
      throw conflict("Duplicate external payment id for this provider.");
    }
    throw err;
  }
}
