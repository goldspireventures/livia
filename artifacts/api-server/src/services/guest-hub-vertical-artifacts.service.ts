/**
 * Vertical-native artifacts surfaced on W6 `/my` (guest vault).
 */
import {
  db,
  customersTable,
  designProofAssetsTable,
  medspaConsentRecordsTable,
  medicalIntakeRecordsTable,
  staffTable,
} from "@workspace/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { BusinessVertical } from "@workspace/policy";
import { guestPublicVisitPrep } from "@workspace/policy";
import { listPetsForCustomer } from "./pets.service";
import { listLivMemoryForEntity } from "./liv-memory.service";
import { ensureDesignProofGuestAccess } from "./design-proof-guest-access.service";
import { ensureMedicalIntakeGuestAccess } from "./medical-intake-guest-access.service";
import { listCareSeries, suggestNextSessionStart } from "./care-series.service";
import { resolveGuestTokenUrl } from "../lib/guest-public-urls";
import { isPatchTestValid, publicServiceFillHint, type BeautyServiceKind } from "@workspace/policy";
import { listServices } from "./services.service";
import { getPublicBeautyGuestHints } from "./beauty-ops.service";
import { listGuestFitnessEnrollments } from "./fitness-public.service";

export type GuestHubPetArtifact = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  behaviourNotes: string | null;
  allergyNotes: string | null;
};

export type GuestHubProofArtifact = {
  proofId: string;
  status: string;
  note: string | null;
  reviewUrl: string;
};

export type GuestHubConsentArtifact = {
  id: string;
  label: string;
  status: string;
  kind: "consent" | "intake";
  actionUrl: string | null;
};

export type GuestHubCarePlanArtifact = {
  name: string;
  sessionsCompleted: number;
  sessionsTotal: number;
  cadenceDays: number;
  status: string;
  nextBookHint: string | null;
} | null;

export type GuestHubStylistArtifact = {
  staffId: string;
  displayName: string;
} | null;

export type GuestHubBeautyArtifact = {
  patchTestValid: boolean;
  fillDueHint: string | null;
} | null;

export type GuestHubFitnessArtifact = {
  enrollments: Array<{
    title: string;
    startsAt: string;
    status: string;
    waitlistPosition: number | null;
  }>;
} | null;

export type GuestHubVerticalArtifacts = {
  pets: GuestHubPetArtifact[];
  proofs: GuestHubProofArtifact[];
  vehicleHighlight: string | null;
  consentItems: GuestHubConsentArtifact[];
  carePlan: GuestHubCarePlanArtifact;
  wellnessPrep: string[];
  preferredStylist: GuestHubStylistArtifact;
  beautyMemory: GuestHubBeautyArtifact;
  fitnessStatus: GuestHubFitnessArtifact;
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

export async function loadGuestVerticalArtifacts(input: {
  businessId: string;
  customerId: string;
  slug: string;
  vertical: string | null | undefined;
}): Promise<GuestHubVerticalArtifacts> {
  const vertical = (input.vertical ?? "beauty") as BusinessVertical;

  if (vertical === "pet-grooming") {
    const pets = await listPetsForCustomer(input.businessId, input.customerId);
    return {
      ...EMPTY,
      pets: pets.map((p) => ({
        id: p.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        behaviourNotes: p.behaviourNotes,
        allergyNotes: p.allergyNotes,
      })),
    };
  }

  if (vertical === "body-art") {
    const proofs = await db
      .select({
        id: designProofAssetsTable.id,
        status: designProofAssetsTable.status,
        note: designProofAssetsTable.note,
      })
      .from(designProofAssetsTable)
      .where(
        and(
          eq(designProofAssetsTable.businessId, input.businessId),
          eq(designProofAssetsTable.customerId, input.customerId),
          inArray(designProofAssetsTable.status, ["pending_review", "draft"]),
        ),
      )
      .orderBy(desc(designProofAssetsTable.createdAt))
      .limit(3);

    const proofRows: GuestHubProofArtifact[] = [];
    for (const p of proofs) {
      const token = await ensureDesignProofGuestAccess(input.businessId, p.id);
      proofRows.push({
        proofId: p.id,
        status: p.status,
        note: p.note,
        reviewUrl: resolveGuestTokenUrl(input.slug, "proof", token),
      });
    }
    return { ...EMPTY, proofs: proofRows };
  }

  if (vertical === "automotive-detailing") {
    const memoryRows = await listLivMemoryForEntity({
      businessId: input.businessId,
      entityType: "customer",
      entityId: input.customerId,
      limit: 5,
    });
    const vehicleHighlight =
      memoryRows.find((m) => /vehicle|plate|car|van|ceramic|detail/i.test(m.content))?.content ??
      memoryRows[0]?.content ??
      null;
    return { ...EMPTY, vehicleHighlight };
  }

  if (vertical === "medspa") {
    const consentRows = await db
      .select({
        id: medspaConsentRecordsTable.id,
        label: medspaConsentRecordsTable.procedureLabel,
        status: medspaConsentRecordsTable.status,
      })
      .from(medspaConsentRecordsTable)
      .where(
        and(
          eq(medspaConsentRecordsTable.businessId, input.businessId),
          eq(medspaConsentRecordsTable.customerId, input.customerId),
          inArray(medspaConsentRecordsTable.status, ["pending", "draft"]),
        ),
      )
      .orderBy(desc(medspaConsentRecordsTable.createdAt))
      .limit(5);

    const intakeRows = await db
      .select({ id: medicalIntakeRecordsTable.id, status: medicalIntakeRecordsTable.status })
      .from(medicalIntakeRecordsTable)
      .where(
        and(
          eq(medicalIntakeRecordsTable.businessId, input.businessId),
          eq(medicalIntakeRecordsTable.customerId, input.customerId),
          eq(medicalIntakeRecordsTable.status, "draft"),
        ),
      )
      .orderBy(desc(medicalIntakeRecordsTable.createdAt))
      .limit(3);

    const consentItems: GuestHubConsentArtifact[] = [];
    for (const row of consentRows) {
      consentItems.push({
        id: row.id,
        label: row.label,
        status: row.status,
        kind: "consent",
        actionUrl: null,
      });
    }
    for (const row of intakeRows) {
      const token = await ensureMedicalIntakeGuestAccess(input.businessId, row.id);
      consentItems.push({
        id: row.id,
        label: "Medical intake form",
        status: row.status,
        kind: "intake",
        actionUrl: resolveGuestTokenUrl(input.slug, "intake", token),
      });
    }
    return { ...EMPTY, consentItems };
  }

  if (vertical === "allied-health") {
    const series = await listCareSeries(input.businessId, input.customerId);
    const active = series.find((s) => s.status === "active") ?? series[0];
    const nextStart = active
      ? suggestNextSessionStart({
          cadenceDays: active.cadenceDays,
          sessions: active.sessions.map((s) => ({
            sessionNumber: s.sessionNumber,
            bookingId: s.bookingId,
          })),
        })
      : null;
    const carePlan = active
      ? {
          name: active.name,
          sessionsCompleted: active.sessionsCompleted,
          sessionsTotal: active.sessionsTotal,
          cadenceDays: active.cadenceDays,
          status: active.status,
          nextBookHint: nextStart
            ? `Book your next session around ${nextStart.toLocaleDateString("en-IE", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}`
            : null,
        }
      : null;
    return { ...EMPTY, carePlan };
  }

  if (vertical === "wellness") {
    return {
      ...EMPTY,
      wellnessPrep: guestPublicVisitPrep("wellness"),
    };
  }

  if (vertical === "hair") {
    const [customer] = await db
      .select({ preferredStaffId: customersTable.preferredStaffId })
      .from(customersTable)
      .where(
        and(
          eq(customersTable.businessId, input.businessId),
          eq(customersTable.id, input.customerId),
        ),
      )
      .limit(1);
    let preferredStylist: GuestHubStylistArtifact = null;
    if (customer?.preferredStaffId) {
      const [staff] = await db
        .select({ id: staffTable.id, displayName: staffTable.displayName })
        .from(staffTable)
        .where(eq(staffTable.id, customer.preferredStaffId))
        .limit(1);
      if (staff?.displayName) {
        preferredStylist = { staffId: staff.id, displayName: staff.displayName };
      }
    }
    return { ...EMPTY, preferredStylist };
  }

  if (vertical === "beauty") {
    const [customer] = await db
      .select({ patchTestCompletedAt: customersTable.patchTestCompletedAt })
      .from(customersTable)
      .where(
        and(
          eq(customersTable.businessId, input.businessId),
          eq(customersTable.id, input.customerId),
        ),
      )
      .limit(1);
    const hints = await getPublicBeautyGuestHints(input.businessId, input.customerId);
    const services = await listServices(input.businessId, true);
    const serviceById = new Map(services.map((s) => [s.id, s]));
    let fillDueHint: string | null = null;
    for (const v of hints.lastVisits) {
      const svc = serviceById.get(v.serviceId);
      if (!svc) continue;
      const hint = publicServiceFillHint(
        {
          serviceKind: (svc.serviceKind as BeautyServiceKind | null) ?? null,
          rebookIntervalDays: svc.rebookIntervalDays,
          category: svc.category,
          requiresPatchTest: svc.requiresPatchTest,
          name: svc.name,
        },
        v.at,
      );
      if (hint) {
        fillDueHint = hint;
        break;
      }
    }
    return {
      ...EMPTY,
      beautyMemory: {
        patchTestValid: isPatchTestValid(customer?.patchTestCompletedAt),
        fillDueHint,
      },
    };
  }

  if (vertical === "fitness") {
    const enrollments = await listGuestFitnessEnrollments(
      input.businessId,
      input.customerId,
    );
    return {
      ...EMPTY,
      fitnessStatus: enrollments.length
        ? {
            enrollments: enrollments.map((e) => ({
              title: e.title,
              startsAt: e.startsAt,
              status: e.status,
              waitlistPosition: e.waitlistPosition,
            })),
          }
        : null,
    };
  }

  return EMPTY;
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
  const pendingConsent = artifacts.consentItems.find((c) => c.status === "pending" || c.status === "draft");
  if (pendingConsent) {
    return pendingConsent.kind === "intake"
      ? "Medical intake form to complete"
      : `${pendingConsent.label} — consent pending`;
  }
  if (artifacts.carePlan) {
    const { name, sessionsCompleted, sessionsTotal } = artifacts.carePlan;
    return `${name}: session ${sessionsCompleted + 1} of ${sessionsTotal}`;
  }
  if (artifacts.vehicleHighlight) {
    const v = artifacts.vehicleHighlight.trim();
    return v.length > 80 ? `${v.slice(0, 77)}…` : v;
  }
  if (pack && pack.creditsRemaining > 0) {
    return `${pack.packageName}: ${pack.creditsRemaining} of ${pack.creditsTotal} sessions left`;
  }
  if (artifacts.wellnessPrep.length > 0) {
    return artifacts.wellnessPrep[0] ?? null;
  }
  if (artifacts.preferredStylist) {
    return `Your stylist: ${artifacts.preferredStylist.displayName}`;
  }
  if (artifacts.beautyMemory?.fillDueHint) {
    return artifacts.beautyMemory.fillDueHint;
  }
  if (artifacts.fitnessStatus?.enrollments[0]) {
    const e = artifacts.fitnessStatus.enrollments[0];
    return e.status === "waitlisted"
      ? `Waitlist #${e.waitlistPosition ?? "?"} — ${e.title}`
      : `Class booked: ${e.title}`;
  }
  return null;
}
