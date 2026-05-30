import {
  db,
  medspaConsentRecordsTable,
  medicalIntakeRecordsTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import {
  MEDSPA_CONSENT_VERSION,
  MEDSPA_PROCEDURES,
  buildMedspaConsentBody,
  getMedspaProcedure,
} from "@workspace/policy";
import { generateId } from "../lib/id";

export function listMedspaProcedures() {
  return MEDSPA_PROCEDURES.map((p) => ({
    code: p.code,
    label: p.label,
    consentVersion: p.consentVersion,
    summary: p.summary,
    risksBullets: p.risksBullets,
  }));
}

export async function listPendingConsents(businessId: string, limit = 50) {
  return db
    .select()
    .from(medspaConsentRecordsTable)
    .where(
      and(
        eq(medspaConsentRecordsTable.businessId, businessId),
        eq(medspaConsentRecordsTable.status, "pending"),
      ),
    )
    .orderBy(desc(medspaConsentRecordsTable.createdAt))
    .limit(limit);
}

export async function listIntakesAwaitingReview(businessId: string, limit = 50) {
  return db
    .select()
    .from(medicalIntakeRecordsTable)
    .where(
      and(
        eq(medicalIntakeRecordsTable.businessId, businessId),
        eq(medicalIntakeRecordsTable.status, "submitted"),
      ),
    )
    .orderBy(desc(medicalIntakeRecordsTable.submittedAt))
    .limit(limit);
}

export async function createConsentRecord(args: {
  businessId: string;
  customerId: string;
  procedureCode: string;
  marketCode?: string;
  bookingId?: string;
}) {
  const procedure = getMedspaProcedure(args.procedureCode);
  if (!procedure) throw new Error("Unknown procedure");
  const id = generateId();
  const marketCode = args.marketCode ?? "IE";
  const body = buildMedspaConsentBody(procedure, marketCode);
  const [row] = await db
    .insert(medspaConsentRecordsTable)
    .values({
      id,
      businessId: args.businessId,
      customerId: args.customerId,
      bookingId: args.bookingId ?? null,
      procedureCode: procedure.code,
      procedureLabel: procedure.label,
      consentVersion: procedure.consentVersion,
      status: "pending",
      marketCode,
      metadata: { body },
    })
    .returning();
  return row!;
}

export async function signConsentRecord(args: {
  businessId: string;
  consentId: string;
  signatureName: string;
  bookingId?: string;
}) {
  const [row] = await db
    .update(medspaConsentRecordsTable)
    .set({
      status: "signed",
      signatureName: args.signatureName.trim(),
      signedAt: new Date(),
      bookingId: args.bookingId ?? undefined,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(medspaConsentRecordsTable.id, args.consentId),
        eq(medspaConsentRecordsTable.businessId, args.businessId),
      ),
    )
    .returning();
  return row ?? null;
}

export async function upsertMedicalIntake(args: {
  businessId: string;
  customerId: string;
  bookingId?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
  priorProcedures?: string;
  notes?: string;
  submit?: boolean;
}) {
  const existing = await db
    .select()
    .from(medicalIntakeRecordsTable)
    .where(
      and(
        eq(medicalIntakeRecordsTable.businessId, args.businessId),
        eq(medicalIntakeRecordsTable.customerId, args.customerId),
        eq(medicalIntakeRecordsTable.status, "draft"),
      ),
    )
    .orderBy(desc(medicalIntakeRecordsTable.createdAt))
    .limit(1);

  const payload = {
    allergies: args.allergies ?? null,
    medications: args.medications ?? null,
    conditions: args.conditions ?? null,
    priorProcedures: args.priorProcedures ?? null,
    notes: args.notes ?? null,
    bookingId: args.bookingId ?? null,
    status: args.submit ? "submitted" : "draft",
    submittedAt: args.submit ? new Date() : null,
    updatedAt: new Date(),
  };

  if (existing[0]) {
    const [row] = await db
      .update(medicalIntakeRecordsTable)
      .set(payload)
      .where(eq(medicalIntakeRecordsTable.id, existing[0].id))
      .returning();
    if (row && row.status === "draft") {
      const { ensureMedicalIntakeGuestAccess } = await import(
        "./medical-intake-guest-access.service"
      );
      await ensureMedicalIntakeGuestAccess(args.businessId, row.id);
    }
    return row!;
  }

  const [row] = await db
    .insert(medicalIntakeRecordsTable)
    .values({
      id: generateId(),
      businessId: args.businessId,
      customerId: args.customerId,
      ...payload,
    })
    .returning();
  if (row && row.status === "draft") {
    const { ensureMedicalIntakeGuestAccess } = await import(
      "./medical-intake-guest-access.service"
    );
    await ensureMedicalIntakeGuestAccess(args.businessId, row.id);
  }
  return row!;
}

export async function markIntakeReviewed(businessId: string, intakeId: string) {
  const [row] = await db
    .update(medicalIntakeRecordsTable)
    .set({ status: "reviewed", updatedAt: new Date() })
    .where(
      and(
        eq(medicalIntakeRecordsTable.id, intakeId),
        eq(medicalIntakeRecordsTable.businessId, businessId),
      ),
    )
    .returning();
  return row ?? null;
}

/** Public book path: create + sign consent in one transaction-friendly call */
export async function recordPublicMedspaConsent(args: {
  businessId: string;
  customerId: string;
  bookingId: string;
  procedureCode: string;
  signatureName: string;
  marketCode?: string;
}) {
  const pending = await createConsentRecord({
    businessId: args.businessId,
    customerId: args.customerId,
    procedureCode: args.procedureCode,
    marketCode: args.marketCode,
    bookingId: args.bookingId,
  });
  return signConsentRecord({
    businessId: args.businessId,
    consentId: pending.id,
    signatureName: args.signatureName,
    bookingId: args.bookingId,
  });
}

export { MEDSPA_CONSENT_VERSION };
