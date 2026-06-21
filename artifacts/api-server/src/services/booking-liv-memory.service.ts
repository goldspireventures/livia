import { db, businessesTable, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { appendLivMemory, listLivMemoryForEntity } from "./liv-memory.service";

/** After a visit completes, Liv records a lightweight memory line (relationship wedge). */
export async function recordVisitMemoryForBooking(args: {
  businessId: string;
  customerId: string;
  serviceId: string;
}): Promise<void> {
  const [biz] = await db
    .select({ vertical: businessesTable.vertical, name: businessesTable.name })
    .from(businessesTable)
    .where(eq(businessesTable.id, args.businessId))
    .limit(1);
  const [svc] = await db
    .select({ name: servicesTable.name, category: servicesTable.category })
    .from(servicesTable)
    .where(eq(servicesTable.id, args.serviceId))
    .limit(1);
  if (!biz || !svc) return;

  const existing = await listLivMemoryForEntity({
    businessId: args.businessId,
    entityType: "customer",
    entityId: args.customerId,
    limit: 5,
  });
  const snippet = `${svc.name}${svc.category ? ` (${svc.category})` : ""}`;
  if (existing.some((m) => m.content.includes(snippet) && m.createdBy === "liv")) return;

  const vertical = biz.vertical ?? "hair";
  const kind =
    vertical === "allied-health" || vertical === "wellness"
      ? "therapist_pref"
      : vertical === "beauty" || vertical === "hair"
        ? "preference"
        : vertical === "pet-grooming"
          ? "note"
          : "note";

  await appendLivMemory({
    businessId: args.businessId,
    entityType: "customer",
    entityId: args.customerId,
    kind,
    content: `Completed visit: ${snippet} at ${biz.name}.`,
    createdBy: "liv",
  });
}
