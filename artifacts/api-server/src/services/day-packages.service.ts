import {
  db,
  dayPackagesTable,
  dayPackageStepsTable,
  bookingsTable,
} from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { generateId } from "../lib/id";
import { createBooking } from "./bookings.service";
import { resourceCapacityAvailable } from "./booking-resources.service";

export async function listDayPackages(businessId: string, activeOnly = true) {
  const conditions = [eq(dayPackagesTable.businessId, businessId)];
  if (activeOnly) conditions.push(eq(dayPackagesTable.isActive, true));
  const packages = await db
    .select()
    .from(dayPackagesTable)
    .where(and(...conditions))
    .orderBy(asc(dayPackagesTable.sortOrder));

  const out = [];
  for (const pkg of packages) {
    const steps = await db
      .select()
      .from(dayPackageStepsTable)
      .where(eq(dayPackageStepsTable.packageId, pkg.id))
      .orderBy(asc(dayPackageStepsTable.sequence));
    out.push({ ...pkg, steps });
  }
  return out;
}

export async function createDayPackage(
  businessId: string,
  input: {
    name: string;
    description?: string;
    priceMinor?: number;
    currency?: string;
    steps: Array<{
      serviceId: string;
      resourceId?: string;
      staffId?: string;
      durationMinutes: number;
      bufferAfterMinutes?: number;
      label?: string;
    }>;
  },
) {
  const totalDuration = input.steps.reduce(
    (s, step) => s + step.durationMinutes + (step.bufferAfterMinutes ?? 15),
    0,
  );
  const packageId = generateId();
  await db.insert(dayPackagesTable).values({
    id: packageId,
    businessId,
    name: input.name.trim(),
    description: input.description,
    totalDurationMinutes: totalDuration,
    priceMinor: input.priceMinor ?? 0,
    currency: input.currency ?? "EUR",
  });

  let seq = 1;
  for (const step of input.steps) {
    await db.insert(dayPackageStepsTable).values({
      id: generateId(),
      packageId,
      sequence: seq++,
      serviceId: step.serviceId,
      resourceId: step.resourceId ?? null,
      staffId: step.staffId ?? null,
      durationMinutes: step.durationMinutes,
      bufferAfterMinutes: step.bufferAfterMinutes ?? 15,
      label: step.label ?? null,
    });
  }

  const [pkg] = await db.select().from(dayPackagesTable).where(eq(dayPackagesTable.id, packageId));
  const steps = await db
    .select()
    .from(dayPackageStepsTable)
    .where(eq(dayPackageStepsTable.packageId, packageId))
    .orderBy(asc(dayPackageStepsTable.sequence));
  return { ...pkg!, steps };
}

export async function bookDayPackage(
  businessId: string,
  input: {
    packageId: string;
    customerId: string;
    itineraryStartAt: string;
    staffId?: string;
    channelType?: string;
  },
) {
  const [pkg] = await db
    .select()
    .from(dayPackagesTable)
    .where(
      and(eq(dayPackagesTable.id, input.packageId), eq(dayPackagesTable.businessId, businessId)),
    );
  if (!pkg || !pkg.isActive) throw new Error("PACKAGE_NOT_FOUND");

  const steps = await db
    .select()
    .from(dayPackageStepsTable)
    .where(eq(dayPackageStepsTable.packageId, pkg.id))
    .orderBy(asc(dayPackageStepsTable.sequence));
  if (steps.length === 0) throw new Error("PACKAGE_EMPTY");

  let cursor = new Date(input.itineraryStartAt);
  const created: Array<typeof bookingsTable.$inferSelect> = [];

  for (const step of steps) {
    const endAt = new Date(cursor.getTime() + step.durationMinutes * 60_000);

    if (step.resourceId) {
      const ok = await resourceCapacityAvailable({
        businessId,
        resourceId: step.resourceId,
        startAt: cursor,
        endAt,
      });
      if (!ok) throw new Error("RESOURCE_AT_CAPACITY");
    }

    const booking = await createBooking(businessId, {
      serviceId: step.serviceId,
      customerId: input.customerId,
      staffId: input.staffId ?? step.staffId ?? undefined,
      resourceId: step.resourceId ?? undefined,
      startAt: cursor.toISOString(),
      channelType: input.channelType ?? "WEB",
      source: "web",
      notes: `[Day package: ${pkg.name}] Step ${step.sequence}${step.label ? ` — ${step.label}` : ""}`,
    });

    created.push(booking);
    cursor = new Date(endAt.getTime() + step.bufferAfterMinutes * 60_000);
  }

  return {
    packageId: pkg.id,
    packageName: pkg.name,
    bookings: created,
    itineraryEndAt: cursor.toISOString(),
  };
}

export async function getPublicDayPackages(businessId: string) {
  return listDayPackages(businessId, true);
}
