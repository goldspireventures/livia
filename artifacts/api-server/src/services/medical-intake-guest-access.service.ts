import { randomBytes } from "node:crypto";
import {
  db,
  businessesTable,
  customersTable,
  medicalIntakeGuestAccessTable,
  medicalIntakeRecordsTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";

export async function ensureMedicalIntakeGuestAccess(
  businessId: string,
  intakeId: string,
): Promise<string> {
  const [existing] = await db
    .select({ token: medicalIntakeGuestAccessTable.token })
    .from(medicalIntakeGuestAccessTable)
    .where(eq(medicalIntakeGuestAccessTable.intakeId, intakeId))
    .limit(1);
  if (existing?.token) return existing.token;

  const token = randomBytes(18).toString("base64url");
  await db.insert(medicalIntakeGuestAccessTable).values({
    intakeId,
    businessId,
    token,
  });
  return token;
}

export type GuestIntakeView = {
  intakeId: string;
  businessId: string;
  businessName: string;
  slug: string;
  vertical: string | null;
  status: string;
  customerFirstName: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  priorProcedures: string | null;
  notes: string | null;
  logoUrl: string | null;
};

export async function getGuestIntakeByToken(
  slug: string,
  token: string,
): Promise<GuestIntakeView | null> {
  const [row] = await db
    .select({
      intakeId: medicalIntakeRecordsTable.id,
      businessId: medicalIntakeRecordsTable.businessId,
      status: medicalIntakeRecordsTable.status,
      allergies: medicalIntakeRecordsTable.allergies,
      medications: medicalIntakeRecordsTable.medications,
      conditions: medicalIntakeRecordsTable.conditions,
      priorProcedures: medicalIntakeRecordsTable.priorProcedures,
      notes: medicalIntakeRecordsTable.notes,
      businessName: businessesTable.name,
      slug: businessesTable.slug,
      vertical: businessesTable.vertical,
      logoUrl: businessesTable.logoUrl,
      customerFirstName: customersTable.firstName,
    })
    .from(medicalIntakeGuestAccessTable)
    .innerJoin(
      medicalIntakeRecordsTable,
      eq(medicalIntakeGuestAccessTable.intakeId, medicalIntakeRecordsTable.id),
    )
    .innerJoin(businessesTable, eq(medicalIntakeRecordsTable.businessId, businessesTable.id))
    .innerJoin(customersTable, eq(medicalIntakeRecordsTable.customerId, customersTable.id))
    .where(
      and(
        eq(medicalIntakeGuestAccessTable.token, token),
        eq(businessesTable.slug, slug),
      ),
    )
    .limit(1);

  if (!row) return null;
  return {
    intakeId: row.intakeId,
    businessId: row.businessId,
    businessName: row.businessName,
    slug: row.slug,
    vertical: row.vertical,
    status: row.status,
    customerFirstName: row.customerFirstName,
    allergies: row.allergies,
    medications: row.medications,
    conditions: row.conditions,
    priorProcedures: row.priorProcedures,
    notes: row.notes,
    logoUrl: row.logoUrl,
  };
}

export async function submitGuestIntakeByToken(
  slug: string,
  token: string,
  payload: {
    allergies?: string;
    medications?: string;
    conditions?: string;
    priorProcedures?: string;
    notes?: string;
  },
) {
  const view = await getGuestIntakeByToken(slug, token);
  if (!view) return null;
  if (view.status !== "draft") return { error: "already_submitted" as const, view };

  const [updated] = await db
    .update(medicalIntakeRecordsTable)
    .set({
      allergies: payload.allergies?.trim() || null,
      medications: payload.medications?.trim() || null,
      conditions: payload.conditions?.trim() || null,
      priorProcedures: payload.priorProcedures?.trim() || null,
      notes: payload.notes?.trim() || null,
      status: "submitted",
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(medicalIntakeRecordsTable.id, view.intakeId))
    .returning();

  return { row: updated, view };
}
