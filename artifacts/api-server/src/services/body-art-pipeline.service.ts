/**
 * Body-art consult → proof → session pipeline (Innovation P0).
 */
import {
  db,
  bookingsTable,
  customersTable,
  designProofAssetsTable,
  servicesTable,
} from "@workspace/db";
import { and, desc, eq, inArray } from "drizzle-orm";

export type BodyArtPipelineRow = {
  bookingId: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  startAt: string;
  status: string;
  stage: "consult" | "proof" | "session" | "complete";
  proofId: string | null;
  proofStatus: string | null;
};

export async function getBodyArtPipeline(businessId: string): Promise<{
  consultCount: number;
  proofPendingCount: number;
  sessionReadyCount: number;
  rows: BodyArtPipelineRow[];
}> {
  const raw = await db
    .select({
      bookingId: bookingsTable.id,
      customerId: bookingsTable.customerId,
      customerName: customersTable.displayName,
      customerFirst: customersTable.firstName,
      customerLast: customersTable.lastName,
      serviceName: servicesTable.name,
      serviceCategory: servicesTable.category,
      startAt: bookingsTable.startAt,
      status: bookingsTable.status,
    })
    .from(bookingsTable)
    .innerJoin(servicesTable, eq(bookingsTable.serviceId, servicesTable.id))
    .innerJoin(customersTable, eq(bookingsTable.customerId, customersTable.id))
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        inArray(bookingsTable.status, ["PENDING", "CONFIRMED", "COMPLETED"]),
      ),
    )
    .orderBy(desc(bookingsTable.startAt))
    .limit(40);

  const proofs = await db
    .select({
      id: designProofAssetsTable.id,
      customerId: designProofAssetsTable.customerId,
      bookingId: designProofAssetsTable.bookingId,
      status: designProofAssetsTable.status,
    })
    .from(designProofAssetsTable)
    .where(eq(designProofAssetsTable.businessId, businessId))
    .orderBy(desc(designProofAssetsTable.createdAt))
    .limit(60);

  const proofByBooking = new Map(
    proofs.filter((p) => p.bookingId).map((p) => [p.bookingId!, p] as const),
  );
  const proofByCustomer = new Map<string, (typeof proofs)[0]>();
  for (const p of proofs) {
    if (p.customerId && !proofByCustomer.has(p.customerId)) {
      proofByCustomer.set(p.customerId, p);
    }
  }

  const rows: BodyArtPipelineRow[] = raw.map((r) => {
    const isConsult =
      /consult/i.test(r.serviceName) || /consult/i.test(r.serviceCategory ?? "");
    const proof = proofByBooking.get(r.bookingId) ?? proofByCustomer.get(r.customerId);
    let stage: BodyArtPipelineRow["stage"] = "session";
    if (r.status === "COMPLETED") stage = "complete";
    else if (isConsult && !proof) stage = "consult";
    else if (proof && proof.status !== "approved") stage = "proof";
    else if (proof?.status === "approved") stage = "session";

    return {
      bookingId: r.bookingId,
      customerId: r.customerId,
      customerName:
        r.customerName?.trim() ||
        [r.customerFirst, r.customerLast].filter(Boolean).join(" ").trim() ||
        "Guest",
      serviceName: r.serviceName,
      startAt: r.startAt.toISOString(),
      status: r.status,
      stage,
      proofId: proof?.id ?? null,
      proofStatus: proof?.status ?? null,
    };
  });

  const stageRank: Record<BodyArtPipelineRow["stage"], number> = {
    proof: 0,
    consult: 1,
    session: 2,
    complete: 3,
  };
  const deduped = new Map<string, BodyArtPipelineRow>();
  for (const row of rows) {
    const existing = deduped.get(row.customerId);
    if (!existing || stageRank[row.stage] < stageRank[existing.stage]) {
      deduped.set(row.customerId, row);
    }
  }
  const uniqueRows = [...deduped.values()].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
  );

  return {
    consultCount: uniqueRows.filter((r) => r.stage === "consult").length,
    proofPendingCount: uniqueRows.filter((r) => r.stage === "proof").length,
    sessionReadyCount: uniqueRows.filter((r) => r.stage === "session").length,
    rows: uniqueRows,
  };
}
