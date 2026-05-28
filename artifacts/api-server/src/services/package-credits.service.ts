import { db, packageCreditLedgerTable } from "@workspace/db";
import { eq, and, gt, or, isNull, asc } from "drizzle-orm";
import { generateId } from "../lib/id";

export async function listPackageCredits(businessId: string, customerId?: string) {
  const conditions = [eq(packageCreditLedgerTable.businessId, businessId)];
  if (customerId) conditions.push(eq(packageCreditLedgerTable.customerId, customerId));
  return db
    .select()
    .from(packageCreditLedgerTable)
    .where(and(...conditions))
    .orderBy(packageCreditLedgerTable.createdAt);
}

export async function grantPackageCredits(
  businessId: string,
  input: {
    customerId: string;
    packageName: string;
    creditsTotal: number;
    expiresAt?: string;
  },
) {
  const id = generateId();
  const [row] = await db
    .insert(packageCreditLedgerTable)
    .values({
      id,
      businessId,
      customerId: input.customerId,
      packageName: input.packageName.trim(),
      creditsTotal: input.creditsTotal,
      creditsRemaining: input.creditsTotal,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning();
  return row;
}

export async function burnPackageCredit(businessId: string, ledgerId: string, amount = 1) {
  const [row] = await db
    .select()
    .from(packageCreditLedgerTable)
    .where(
      and(
        eq(packageCreditLedgerTable.id, ledgerId),
        eq(packageCreditLedgerTable.businessId, businessId),
      ),
    );
  if (!row || row.creditsRemaining < amount) return { error: "insufficient" as const };
  const [updated] = await db
    .update(packageCreditLedgerTable)
    .set({
      creditsRemaining: row.creditsRemaining - amount,
      updatedAt: new Date(),
    })
    .where(eq(packageCreditLedgerTable.id, ledgerId))
    .returning();
  return { ledger: updated };
}

/** Best active ledger row for a customer (FIFO by expiry). */
export async function findActivePackageCredit(
  businessId: string,
  customerId: string,
): Promise<(typeof packageCreditLedgerTable.$inferSelect) | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(packageCreditLedgerTable)
    .where(
      and(
        eq(packageCreditLedgerTable.businessId, businessId),
        eq(packageCreditLedgerTable.customerId, customerId),
        gt(packageCreditLedgerTable.creditsRemaining, 0),
        or(
          isNull(packageCreditLedgerTable.expiresAt),
          gt(packageCreditLedgerTable.expiresAt, now),
        ),
      ),
    )
    .orderBy(asc(packageCreditLedgerTable.expiresAt));
  return rows[0] ?? null;
}
