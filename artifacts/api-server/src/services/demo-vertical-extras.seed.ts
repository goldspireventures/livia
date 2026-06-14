import { and, eq } from "drizzle-orm";
import {
  db,
  businessesTable,
  customersTable,
  designProofAssetsTable,
  designProofRevisionsTable,
  classSessionsTable,
  medspaConsentRecordsTable,
  medicalIntakeRecordsTable,
} from "@workspace/db";
import {
  MEDSPA_PROCEDURES,
  getDemoEndClient,
  normalizePhoneE164,
  stripDesignProofGuestFeedback,
} from "@workspace/policy";
import { generateId } from "../lib/id";
import { listDesignProofs } from "./design-proofs.service";
import { listClassSessions } from "./class-sessions.service";
import { listPendingConsents, listIntakesAwaitingReview } from "./medspa.service";

/** Bundled tattoo linework — reliable on staging (no hotlink blocks). */
const DEMO_PROOF_ART = {
  serpent: "/body-art/demo-proofs/serpent-bloom.svg",
  wave: "/body-art/demo-proofs/wave-crest.svg",
  mandala: "/body-art/demo-proofs/mandala-back.svg",
  anchor: "/body-art/demo-proofs/anchor-rope.svg",
  skull: "/body-art/demo-proofs/skull-roses.svg",
  koi: "/body-art/demo-proofs/koi-sleeve.svg",
} as const;

const INK_ANCHOR_DEMO_PROOFS: Array<{
  note: string;
  status: "draft" | "pending_review" | "approved" | "rejected";
  imageUrl: string;
  proofKind: "flash" | "custom_commission" | "client_supplied";
  publishRight: "private" | "portfolio_ok" | "flash_resell_ok";
  customerIndex?: number;
  /** Demo guest hub — Mary McNamara at Ink & Anchor for `/my` proof walkthrough */
  linkDemoGuestMary?: boolean;
}> = [
  {
    note: "Serpent & bloom — half sleeve",
    status: "pending_review",
    imageUrl: DEMO_PROOF_ART.serpent,
    proofKind: "custom_commission",
    publishRight: "private",
    linkDemoGuestMary: true,
  },
  {
    note: "Wave crest — forearm",
    status: "rejected",
    imageUrl: DEMO_PROOF_ART.wave,
    proofKind: "custom_commission",
    publishRight: "private",
    customerIndex: 1,
  },
  {
    note: "Mandala back piece — full back",
    status: "pending_review",
    imageUrl: DEMO_PROOF_ART.mandala,
    proofKind: "custom_commission",
    publishRight: "private",
    customerIndex: 2,
  },
  {
    note: "Anchor & rope — chest flash",
    status: "approved",
    imageUrl: DEMO_PROOF_ART.anchor,
    proofKind: "flash",
    publishRight: "flash_resell_ok",
    customerIndex: 3,
  },
  {
    note: "Skull & roses — upper arm",
    status: "approved",
    imageUrl: DEMO_PROOF_ART.skull,
    proofKind: "flash",
    publishRight: "flash_resell_ok",
    customerIndex: 4,
  },
  {
    note: "Koi sleeve — round 1 draft",
    status: "draft",
    imageUrl: DEMO_PROOF_ART.koi,
    proofKind: "custom_commission",
    publishRight: "private",
  },
];

async function findMaryMcNamaraCustomerId(businessId: string): Promise<string | null> {
  const mary = getDemoEndClient("mary");
  const rows = await db
    .select({
      id: customersTable.id,
      phone: customersTable.phone,
      firstName: customersTable.firstName,
      lastName: customersTable.lastName,
    })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId));

  const byPhone = rows.find((r) => normalizePhoneE164(r.phone) === mary.phoneE164);
  if (byPhone) return byPhone.id;

  const byName = rows.find(
    (r) =>
      r.firstName?.toLowerCase() === mary.firstName.toLowerCase() &&
      r.lastName?.toLowerCase() === mary.lastName.toLowerCase(),
  );
  return byName?.id ?? null;
}

function proofBaseNote(note?: string | null): string {
  return stripDesignProofGuestFeedback(note)?.trim() ?? "";
}

async function seedInkAnchorDesignProofs(businessId: string): Promise<number> {
  const customers = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(eq(customersTable.businessId, businessId))
    .limit(6);

  const maryCustomerId = await findMaryMcNamaraCustomerId(businessId);
  const existing = await listDesignProofs(businessId);
  const keepNotes = new Set(INK_ANCHOR_DEMO_PROOFS.map((s) => s.note));
  for (const row of existing) {
    const legacy =
      row.note?.startsWith("Demo:") ||
      row.note?.startsWith("Flash:") ||
      row.imageUrl?.includes("/w2-gateway/cards/tattoo.jpg");
    if (legacy && (!row.note || !keepNotes.has(row.note))) {
      await db.delete(designProofAssetsTable).where(eq(designProofAssetsTable.id, row.id));
    }
  }

  const refreshed = await listDesignProofs(businessId);
  const { ensureDesignProofGuestAccess } = await import("./design-proof-guest-access.service");
  let created = 0;

  for (const spec of INK_ANCHOR_DEMO_PROOFS) {
    const row = refreshed.find((p) => proofBaseNote(p.note) === spec.note);
    const customerId = spec.linkDemoGuestMary
      ? maryCustomerId
      : spec.customerIndex != null
        ? customers[spec.customerIndex]?.id ?? null
        : null;

    if (!row) {
      const proofId = generateId();
      await db.insert(designProofAssetsTable).values({
        id: proofId,
        businessId,
        customerId,
        status: spec.status,
        note: spec.note,
        imageUrl: spec.imageUrl,
        proofKind: spec.proofKind,
        publishRight: spec.publishRight,
      });
      if (spec.status === "pending_review") {
        await ensureDesignProofGuestAccess(businessId, proofId);
      }
      created += 1;
      continue;
    }

    const staleImage =
      !row.imageUrl ||
      row.imageUrl.includes("unsplash.com") ||
      row.imageUrl.includes("/w2-gateway/cards/tattoo.jpg");
    if (
      staleImage ||
      row.note !== spec.note ||
      row.status !== spec.status ||
      row.proofKind !== spec.proofKind ||
      row.publishRight !== spec.publishRight
    ) {
      await db
        .update(designProofAssetsTable)
        .set({
          note: spec.note,
          status: spec.status,
          imageUrl: spec.imageUrl,
          customerId: customerId ?? row.customerId,
          proofKind: spec.proofKind,
          publishRight: spec.publishRight,
          updatedAt: new Date(),
        })
        .where(eq(designProofAssetsTable.id, row.id));
    }
    if (spec.status === "pending_review") {
      await ensureDesignProofGuestAccess(businessId, row.id);
    }
  }

  await purgeInkAnchorOrphanProofs(businessId, maryCustomerId);
  await seedMarySerpentRevisionHistory(businessId, maryCustomerId);

  return created;
}

/** Demo guest hub — three artwork versions in one frame for arrow walkthrough. */
async function seedMarySerpentRevisionHistory(
  businessId: string,
  maryCustomerId: string | null,
): Promise<void> {
  if (!maryCustomerId) return;

  const maryNote = "Serpent & bloom — half sleeve";
  const rows = await db
    .select({
      id: designProofAssetsTable.id,
      note: designProofAssetsTable.note,
    })
    .from(designProofAssetsTable)
    .where(
      and(
        eq(designProofAssetsTable.businessId, businessId),
        eq(designProofAssetsTable.customerId, maryCustomerId),
      ),
    );

  let proof = rows.find((r) => proofBaseNote(r.note) === maryNote);
  if (!proof) {
    const proofId = generateId();
    await db.insert(designProofAssetsTable).values({
      id: proofId,
      businessId,
      customerId: maryCustomerId,
      status: "rejected",
      note: maryNote,
      imageUrl: DEMO_PROOF_ART.serpent,
      proofKind: "custom_commission",
      publishRight: "private",
      version: 1,
    });
    proof = { id: proofId, note: maryNote };
  }

  const { recordDesignProofRevision } = await import("./design-proof-revisions.service");
  await db
    .delete(designProofRevisionsTable)
    .where(eq(designProofRevisionsTable.proofId, proof.id));

  const revisionArt = [
    { version: 1, imageUrl: DEMO_PROOF_ART.serpent },
    { version: 2, imageUrl: DEMO_PROOF_ART.koi },
    { version: 3, imageUrl: DEMO_PROOF_ART.wave },
  ] as const;

  for (const rev of revisionArt) {
    await recordDesignProofRevision({
      proofId: proof.id,
      version: rev.version,
      imageUrl: rev.imageUrl,
      note: maryNote,
    });
  }

  const guestNote = `${maryNote}\n\n— Guest: Smaller serpent, more bloom on the shoulder.`;
  await db
    .update(designProofAssetsTable)
    .set({
      version: 3,
      imageUrl: DEMO_PROOF_ART.wave,
      status: "rejected",
      note: guestNote,
      updatedAt: new Date(),
    })
    .where(eq(designProofAssetsTable.id, proof.id));

  const { ensureDesignProofGuestAccess } = await import("./design-proof-guest-access.service");
  await ensureDesignProofGuestAccess(businessId, proof.id);
}

async function purgeInkAnchorOrphanProofs(businessId: string, maryCustomerId: string | null) {
  if (!maryCustomerId) return;
  const maryKeepNote = "Serpent & bloom — half sleeve";
  const rows = await db
    .select({ id: designProofAssetsTable.id, note: designProofAssetsTable.note })
    .from(designProofAssetsTable)
    .where(
      and(
        eq(designProofAssetsTable.businessId, businessId),
        eq(designProofAssetsTable.customerId, maryCustomerId),
      ),
    );
  let keptMaryProof = false;
  for (const row of rows) {
    const baseNote = proofBaseNote(row.note);
    if (baseNote === maryKeepNote && !keptMaryProof) {
      keptMaryProof = true;
      continue;
    }
    await db.delete(designProofAssetsTable).where(eq(designProofAssetsTable.id, row.id));
  }
}

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
    designProofs += await seedInkAnchorDesignProofs(ink.id);
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
