/**
 * Vertical-native artifacts surfaced on W6 `/my` (guest vault).
 */
import {
  db,
  businessesTable,
  customersTable,
  designProofAssetsTable,
  medspaConsentRecordsTable,
  medicalIntakeRecordsTable,
  staffTable,
} from "@workspace/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { BusinessVertical } from "@workspace/policy";
import { guestPublicVisitPrep, isPatchTestValid } from "@workspace/policy";
import { listPetsForCustomer } from "./pets.service";
import { listLivMemoryForEntity } from "./liv-memory.service";
import { ensureDesignProofGuestAccess } from "./design-proof-guest-access.service";
import { ensureMedicalIntakeGuestAccess } from "./medical-intake-guest-access.service";
import { listCareSeries } from "./care-series.service";
import { listGuestFitnessEnrollments } from "./fitness-public.service";
import { getBeautyFillCycleRadar } from "./beauty-ops.service";
import { resolveGuestTokenUrl } from "../lib/guest-public-urls";
import { getGuestHubSession } from "./guest-hub.service";
import { normalizePhoneE164 } from "@workspace/policy";

export type GuestHubVerticalArtifacts = {
  pets: Array<{
    id: string;
    name: string;
    species: string;
    breed: string | null;
    behaviourNotes: string | null;
    allergyNotes: string | null;
  }>;
  proofs: Array<{
    proofId: string;
    status: string;
    note: string | null;
    imageUrl: string | null;
    reviewUrl: string;
    version: number;
    versions: Array<{
      version: number;
      imageUrl: string | null;
      createdAt: string;
    }>;
  }>;
  vehicleHighlight: string | null;
  consentItems: Array<{
    id: string;
    label: string;
    status: string;
    kind: "consent" | "intake";
    actionUrl: string | null;
  }>;
  carePlan: {
    name: string;
    sessionsCompleted: number;
    sessionsTotal: number;
    cadenceDays: number;
    status: string;
    nextBookHint?: string | null;
  } | null;
  wellnessPrep: string[];
  preferredStylist?: { staffId: string; displayName: string } | null;
  beautyMemory?: { patchTestValid: boolean; fillDueHint: string | null } | null;
  fitnessStatus?: {
    enrollments: Array<{
      title: string;
      startsAt: string;
      status: string;
      waitlistPosition: number | null;
    }>;
  } | null;
};

const EMPTY: GuestHubVerticalArtifacts = {
  pets: [],
  proofs: [],
  vehicleHighlight: null,
  consentItems: [],
  carePlan: null,
  wellnessPrep: [],
  preferredStylist: null,
  beautyMemory: null,
  fitnessStatus: null,
};

export async function loadGuestVerticalArtifacts(args: {
  businessId: string;
  customerId: string;
  slug: string;
  vertical: BusinessVertical;
}): Promise<GuestHubVerticalArtifacts> {
  const { businessId, customerId, slug, vertical } = args;
  const out: GuestHubVerticalArtifacts = { ...EMPTY, wellnessPrep: [] };

  if (vertical === "pet-grooming") {
    const pets = await listPetsForCustomer(businessId, customerId);
    out.pets = pets.map((p) => ({
      id: p.id,
      name: p.name,
      species: p.species,
      breed: p.breed,
      behaviourNotes: p.behaviourNotes,
      allergyNotes: p.allergyNotes,
    }));
    return out;
  }

  if (vertical === "body-art") {
    const {
      consolidateDesignProofThreadsForCustomer,
      ensureDesignProofRevisionsSeeded,
      revisionsToGuestVersions,
    } = await import("./design-proof-revisions.service");

    await consolidateDesignProofThreadsForCustomer(businessId, customerId);

    const proofs = await db
      .select({
        id: designProofAssetsTable.id,
        status: designProofAssetsTable.status,
        note: designProofAssetsTable.note,
        imageUrl: designProofAssetsTable.imageUrl,
        version: designProofAssetsTable.version,
        createdAt: designProofAssetsTable.createdAt,
      })
      .from(designProofAssetsTable)
      .where(
        and(
          eq(designProofAssetsTable.businessId, businessId),
          eq(designProofAssetsTable.customerId, customerId),
          inArray(designProofAssetsTable.status, ["pending_review", "rejected"]),
        ),
      )
      .orderBy(desc(designProofAssetsTable.createdAt))
      .limit(8);

    const pending = proofs.filter((p) => p.status === "pending_review");
    const actionable = pending.length > 0 ? [pending[0]!] : proofs[0] ? [proofs[0]] : [];

    for (const proof of actionable) {
      const revisions = await ensureDesignProofRevisionsSeeded(proof.id);
      const token = await ensureDesignProofGuestAccess(businessId, proof.id);
      out.proofs.push({
        proofId: proof.id,
        status: proof.status,
        note: proof.note,
        imageUrl: proof.imageUrl,
        reviewUrl: resolveGuestTokenUrl(slug, "proof", token),
        version: proof.version ?? 1,
        versions: revisionsToGuestVersions(revisions, {
          version: proof.version ?? 1,
          imageUrl: proof.imageUrl,
        }),
      });
    }
    return out;
  }

  if (vertical === "automotive-detailing") {
    const memories = await listLivMemoryForEntity({
      businessId,
      entityType: "customer",
      entityId: customerId,
      limit: 3,
    });
    const vehicle = memories.find((m) => /vehicle|car|reg|vin/i.test(m.content ?? ""));
    out.vehicleHighlight = vehicle?.content ?? memories[0]?.content ?? null;
    return out;
  }

  if (vertical === "hair") {
    const [customer] = await db
      .select({ preferredStaffId: customersTable.preferredStaffId })
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .limit(1);
    if (customer?.preferredStaffId) {
      const [staff] = await db
        .select({ id: staffTable.id, displayName: staffTable.displayName })
        .from(staffTable)
        .where(eq(staffTable.id, customer.preferredStaffId))
        .limit(1);
      if (staff?.displayName) {
        out.preferredStylist = { staffId: staff.id, displayName: staff.displayName };
      }
    }
    const series = await listCareSeries(businessId, customerId);
    const active = series.find((s) => s.status === "active");
    if (active) {
      const completed = active.sessions.filter((s) => s.bookingId).length;
      out.carePlan = {
        name: active.name,
        sessionsCompleted: completed,
        sessionsTotal: active.sessionsTotal,
        cadenceDays: active.cadenceDays,
        status: active.status,
        nextBookHint:
          completed < active.sessionsTotal
            ? `Session ${completed + 1} of ${active.sessionsTotal}`
            : null,
      };
    }
    return out;
  }

  if (vertical === "beauty") {
    const [customer] = await db
      .select({ patchTestCompletedAt: customersTable.patchTestCompletedAt })
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .limit(1);
    const radar = await getBeautyFillCycleRadar(businessId);
    const dueRow = radar.rows.find((r) => r.customerId === customerId);
    out.beautyMemory = {
      patchTestValid: isPatchTestValid(customer?.patchTestCompletedAt),
      fillDueHint: dueRow
        ? `${dueRow.serviceName} due — last visit ${dueRow.daysSince} days ago`
        : null,
    };
    return out;
  }

  if (vertical === "fitness") {
    const enrollments = await listGuestFitnessEnrollments(businessId, customerId);
    out.fitnessStatus = enrollments.length > 0 ? { enrollments } : null;
    return out;
  }

  if (vertical === "wellness") {
    out.wellnessPrep = guestPublicVisitPrep(vertical, null);
    return out;
  }

  if (vertical === "medspa") {
    const consents = await db
      .select({
        id: medspaConsentRecordsTable.id,
        procedureCode: medspaConsentRecordsTable.procedureCode,
        status: medspaConsentRecordsTable.status,
      })
      .from(medspaConsentRecordsTable)
      .where(
        and(
          eq(medspaConsentRecordsTable.businessId, businessId),
          eq(medspaConsentRecordsTable.customerId, customerId),
          eq(medspaConsentRecordsTable.status, "pending"),
        ),
      )
      .limit(5);

    for (const c of consents) {
      out.consentItems.push({
        id: c.id,
        label: c.procedureCode,
        status: c.status,
        kind: "consent",
        actionUrl: null,
      });
    }

    const intakes = await db
      .select({
        id: medicalIntakeRecordsTable.id,
        status: medicalIntakeRecordsTable.status,
      })
      .from(medicalIntakeRecordsTable)
      .where(
        and(
          eq(medicalIntakeRecordsTable.businessId, businessId),
          eq(medicalIntakeRecordsTable.customerId, customerId),
          eq(medicalIntakeRecordsTable.status, "draft"),
        ),
      )
      .limit(3);

    for (const intake of intakes) {
      const token = await ensureMedicalIntakeGuestAccess(businessId, intake.id);
      out.consentItems.push({
        id: intake.id,
        label: "Medical intake",
        status: intake.status,
        kind: "intake",
        actionUrl: resolveGuestTokenUrl(slug, "intake", token),
      });
    }
    return out;
  }

  if (vertical === "allied-health") {
    const series = await listCareSeries(businessId, customerId);
    const active = series.find((s) => s.status === "active");
    if (active) {
      const completed = active.sessions.filter((s) => s.bookingId).length;
      out.carePlan = {
        name: active.name,
        sessionsCompleted: completed,
        sessionsTotal: active.sessionsTotal,
        cadenceDays: active.cadenceDays,
        status: active.status,
        nextBookHint:
          completed < active.sessionsTotal
            ? `Session ${completed + 1} of ${active.sessionsTotal}`
            : null,
      };
    }
    return out;
  }

  return out;
}

export async function getGuestProofVersions(args: {
  hubToken: string;
  slug: string;
  proofId: string;
}): Promise<{
  version: number;
  imageUrl: string | null;
  versions: Array<{ version: number; imageUrl: string | null; createdAt: string }>;
} | null> {
  const session = await getGuestHubSession(args.hubToken);
  if (!session?.guestId || !session.phoneE164) return null;

  const [shop] = await db
    .select({ id: businessesTable.id, vertical: businessesTable.vertical })
    .from(businessesTable)
    .where(eq(businessesTable.slug, args.slug))
    .limit(1);
  if (!shop || shop.vertical !== "body-art") return null;

  const phone = normalizePhoneE164(session.phoneE164);
  if (!phone) return null;

  const [customer] = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(
      and(eq(customersTable.businessId, shop.id), eq(customersTable.phone, phone)),
    )
    .limit(1);
  if (!customer) return null;

  const [proof] = await db
    .select({
      version: designProofAssetsTable.version,
      imageUrl: designProofAssetsTable.imageUrl,
    })
    .from(designProofAssetsTable)
    .where(
      and(
        eq(designProofAssetsTable.id, args.proofId),
        eq(designProofAssetsTable.businessId, shop.id),
        eq(designProofAssetsTable.customerId, customer.id),
      ),
    )
    .limit(1);
  if (!proof) return null;

  const {
    ensureDesignProofRevisionsSeeded,
    revisionsToGuestVersions,
  } = await import("./design-proof-revisions.service");
  const revisions = await ensureDesignProofRevisionsSeeded(args.proofId);

  return {
    version: proof.version ?? 1,
    imageUrl: proof.imageUrl,
    versions: revisionsToGuestVersions(revisions, {
      version: proof.version ?? 1,
      imageUrl: proof.imageUrl,
    }),
  };
}

export function summarizeGuestShopHint(
  artifacts: GuestHubVerticalArtifacts,
  pack?: { creditsRemaining: number; creditsTotal: number; packageName: string } | null,
): string | null {
  const pet = artifacts.pets[0];
  if (pet) {
    return pet.behaviourNotes
      ? `${pet.name} — ${pet.behaviourNotes}`
      : `${pet.name}${pet.breed ? ` (${pet.breed})` : ""} on file`;
  }
  if (artifacts.proofs.length > 0) {
    return "Design proof awaiting your review";
  }
  if (artifacts.vehicleHighlight) {
    const v = artifacts.vehicleHighlight.trim();
    return v.length > 80 ? `${v.slice(0, 77)}…` : v;
  }
  if (pack && pack.creditsRemaining > 0) {
    return `${pack.packageName} — ${pack.creditsRemaining} of ${pack.creditsTotal} left`;
  }
  if (artifacts.beautyMemory?.fillDueHint) {
    return artifacts.beautyMemory.fillDueHint;
  }
  if (artifacts.preferredStylist) {
    return `Your stylist: ${artifacts.preferredStylist.displayName}`;
  }
  return null;
}
