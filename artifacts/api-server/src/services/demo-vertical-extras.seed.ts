import { eq } from "drizzle-orm";
import {
  db,
  businessesTable,
  customersTable,
  designProofAssetsTable,
  classSessionsTable,
  medspaConsentRecordsTable,
  medicalIntakeRecordsTable,
} from "@workspace/db";
import { MEDSPA_PROCEDURES } from "@workspace/policy";
import { generateId } from "../lib/id";
import { listDesignProofs } from "./design-proofs.service";
import { listClassSessions } from "./class-sessions.service";
import { listPendingConsents, listIntakesAwaitingReview } from "./medspa.service";

const DEMO_TATTOO_PROOF_IMAGE =
  "https://images.unsplash.com/photo-1598371839696-5c5bb00bc9bc?w=800&h=800&fit=crop";

/** Vertical-specific demo richness for beta showcase shops. */
export async function seedVerticalDemoExtras(): Promise<{
  designProofs: number;
  classSessions: number;
  medspaConsents: number;
  medspaIntakes: number;
}> {
  let designProofs = 0;
  let classSessions = 0;
  let medspaConsents = 0;
  let medspaIntakes = 0;

  const [ink] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, "ink-anchor-galway"))
    .limit(1);
  if (ink) {
    const existing = await listDesignProofs(ink.id, "pending_review");
    if (existing.length === 0) {
      await db.insert(designProofAssetsTable).values({
        id: generateId(),
        businessId: ink.id,
        status: "pending_review",
        note: "Demo: sleeve concept — client awaiting artist sign-off",
        imageUrl: DEMO_TATTOO_PROOF_IMAGE,
      });
      designProofs += 1;
    } else if (existing.some((p) => !p.imageUrl)) {
      const row = existing.find((p) => !p.imageUrl);
      if (row) {
        await db
          .update(designProofAssetsTable)
          .set({ imageUrl: DEMO_TATTOO_PROOF_IMAGE, updatedAt: new Date() })
          .where(eq(designProofAssetsTable.id, row.id));
      }
    }
  }

  const [peak] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, "peak-fitness-dublin"))
    .limit(1);
  if (peak) {
    const start = new Date();
    start.setHours(start.getHours() + 3, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 45);
    const existing = await listClassSessions(peak.id, {
      from: start.toISOString(),
      to: end.toISOString(),
    });
    if (existing.length === 0) {
      await db.insert(classSessionsTable).values({
        id: generateId(),
        businessId: peak.id,
        title: "HIIT — Docklands",
        startsAt: start,
        endsAt: end,
        capacity: 12,
        waitlistCapacity: 4,
        status: "scheduled",
      });
      classSessions += 1;
    }
  }

  const [medspa] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, "clarity-medspa-dublin"))
    .limit(1);
  if (medspa) {
    const pendingConsents = await listPendingConsents(medspa.id);
    if (pendingConsents.length === 0) {
      const [customer] = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(eq(customersTable.businessId, medspa.id))
        .limit(1);
      if (customer) {
        const procedure = MEDSPA_PROCEDURES.find((p) => p.code === "botox-consult") ?? MEDSPA_PROCEDURES[0]!;
        await db.insert(medspaConsentRecordsTable).values({
          id: generateId(),
          businessId: medspa.id,
          customerId: customer.id,
          procedureCode: procedure.code,
          procedureLabel: procedure.label,
          consentVersion: procedure.consentVersion,
          status: "pending",
          marketCode: "IE",
          metadata: { demo: true },
        });
        medspaConsents += 1;
      }
    }

    const intakes = await listIntakesAwaitingReview(medspa.id);
    if (intakes.length === 0) {
      const [customer] = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(eq(customersTable.businessId, medspa.id))
        .limit(1);
      if (customer) {
        await db.insert(medicalIntakeRecordsTable).values({
          id: generateId(),
          businessId: medspa.id,
          customerId: customer.id,
          allergies: "Demo: nickel sensitivity (patch test on file)",
          medications: "None declared",
          conditions: "Mild rosacea",
          priorProcedures: "SPF daily; no prior injectables",
          notes: "First visit — review before consult room",
          status: "submitted",
          submittedAt: new Date(),
        });
        medspaIntakes += 1;
      }
    }
  }

  return { designProofs, classSessions, medspaConsents, medspaIntakes };
}
