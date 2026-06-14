import { and, eq } from "drizzle-orm";
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

/** Bundled asset — reliable on staging (no hotlink blocks). */
const DEMO_TATTOO_PROOF_IMAGE = "/w2-gateway/cards/tattoo.jpg";

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
      const [customer] = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(eq(customersTable.businessId, ink.id))
        .limit(1);
      const proofId = generateId();
      await db.insert(designProofAssetsTable).values({
        id: proofId,
        businessId: ink.id,
        customerId: customer?.id ?? null,
        status: "pending_review",
        note: "Demo: sleeve concept — client awaiting artist sign-off",
        imageUrl: DEMO_TATTOO_PROOF_IMAGE,
      });
      const { ensureDesignProofGuestAccess } = await import("./design-proof-guest-access.service");
      await ensureDesignProofGuestAccess(ink.id, proofId);
      designProofs += 1;
    } else if (existing.some((p) => !p.imageUrl)) {
      const row = existing.find((p) => !p.imageUrl);
      if (row) {
        await db
          .update(designProofAssetsTable)
          .set({ imageUrl: DEMO_TATTOO_PROOF_IMAGE, updatedAt: new Date() })
          .where(eq(designProofAssetsTable.id, row.id));
      }
    } else {
      const row = existing[0];
      if (row) {
        const { ensureDesignProofGuestAccess } = await import("./design-proof-guest-access.service");
        await ensureDesignProofGuestAccess(ink.id, row.id);
        if (row.imageUrl?.includes("unsplash.com")) {
          await db
            .update(designProofAssetsTable)
            .set({ imageUrl: DEMO_TATTOO_PROOF_IMAGE, updatedAt: new Date() })
            .where(eq(designProofAssetsTable.id, row.id));
        }
      }
    }

    const approved = await listDesignProofs(ink.id, "approved");
    if (approved.length === 0) {
      const proofId = generateId();
      await db.insert(designProofAssetsTable).values({
        id: proofId,
        businessId: ink.id,
        status: "approved",
        note: "Flash: anchor & rope — walk-in available",
        imageUrl: DEMO_TATTOO_PROOF_IMAGE,
      });
      designProofs += 1;
    } else if (approved.some((p) => p.imageUrl?.includes("unsplash.com"))) {
      for (const p of approved.filter((x) => x.imageUrl?.includes("unsplash.com"))) {
        await db
          .update(designProofAssetsTable)
          .set({ imageUrl: DEMO_TATTOO_PROOF_IMAGE, updatedAt: new Date() })
          .where(eq(designProofAssetsTable.id, p.id));
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
    const [draftIntake] = await db
      .select({ id: medicalIntakeRecordsTable.id })
      .from(medicalIntakeRecordsTable)
      .where(
        and(
          eq(medicalIntakeRecordsTable.businessId, medspa.id),
          eq(medicalIntakeRecordsTable.status, "draft"),
        ),
      )
      .limit(1);
    if (!draftIntake) {
      const [customer] = await db
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(eq(customersTable.businessId, medspa.id))
        .limit(1);
      if (customer) {
        const intakeId = generateId();
        await db.insert(medicalIntakeRecordsTable).values({
          id: intakeId,
          businessId: medspa.id,
          customerId: customer.id,
          status: "draft",
        });
        const { ensureMedicalIntakeGuestAccess } = await import(
          "./medical-intake-guest-access.service"
        );
        await ensureMedicalIntakeGuestAccess(medspa.id, intakeId);
        medspaIntakes += 1;
      }
    } else if (intakes.length === 0) {
      const { ensureMedicalIntakeGuestAccess } = await import(
        "./medical-intake-guest-access.service"
      );
      await ensureMedicalIntakeGuestAccess(medspa.id, draftIntake.id);
    }
  }

  return { designProofs, classSessions, medspaConsents, medspaIntakes };
}
