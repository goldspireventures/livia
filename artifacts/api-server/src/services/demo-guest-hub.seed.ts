/**
 * W6 `/my` demo depth — guest vault links for the canonical demo client (Mary).
 * Sign in locally with +353 87 100 0001 after `pnpm demo:provision`.
 */
import {
  db,
  bookingsTable,
  businessesTable,
  customersTable,
  designProofAssetsTable,
  guestFavoritesTable,
  guestIdentitiesTable,
  medspaConsentRecordsTable,
  medicalIntakeRecordsTable,
} from "@workspace/db";
import { MEDSPA_PROCEDURES } from "@workspace/policy";
import { and, eq, gte, inArray } from "drizzle-orm";
import { normalizeGuestHubPhone } from "@workspace/policy";
import { generateId } from "../lib/id";
import { linkGuestToShop } from "./guest-hub.service";
import { createCustomer } from "./customers.service";
import { grantPackageCredits } from "./package-credits.service";
import { listServices } from "./services.service";
import { listStaff } from "./staff.service";

/** Matches demo-inbox Mary McNamara (`+353 87 100 0001`). */
export const DEMO_GUEST_PHONE_RAW = "+353 87 100 0001";

/** All 9 GTM showcase slugs — Mary linked in `/my` after provision. */
const DEMO_GUEST_SLUGS = [
  "luxe-salon-spa",
  "bloom-beauty-dublin",
  "harbour-wellness-cork",
  "ink-anchor-galway",
  "clarity-medspa-dublin",
  "motion-physio-cork",
  "peak-fitness-dublin",
  "paws-parlour-dublin",
  "shine-studio-belfast",
] as const;

const FAVORITE_SLUGS = new Set(["luxe-salon-spa", "bloom-beauty-dublin", "harbour-wellness-cork"]);

export async function seedDemoGuestHub(): Promise<{
  guestId: string;
  phoneE164: string;
  shopsLinked: number;
  favorites: number;
  packageCredits: number;
}> {
  const phoneE164 = normalizeGuestHubPhone(DEMO_GUEST_PHONE_RAW, "IE", "loose");
  if (!phoneE164) {
    return { guestId: "", phoneE164: "", shopsLinked: 0, favorites: 0, packageCredits: 0 };
  }

  const [existingGuest] = await db
    .select({ id: guestIdentitiesTable.id })
    .from(guestIdentitiesTable)
    .where(eq(guestIdentitiesTable.phoneE164, phoneE164))
    .limit(1);

  const guestId = existingGuest?.id ?? generateId();
  if (!existingGuest) {
    await db.insert(guestIdentitiesTable).values({
      id: guestId,
      phoneE164,
      verifiedAt: new Date(),
    });
  }

  let shopsLinked = 0;
  let favorites = 0;
  let packageCredits = 0;

  for (const slug of DEMO_GUEST_SLUGS) {
    const [biz] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.slug, slug))
      .limit(1);
    if (!biz) continue;

    await linkGuestToShop(guestId, biz.id, new Date());
    shopsLinked += 1;

    let [customer] = await db
      .select({ id: customersTable.id })
      .from(customersTable)
      .where(and(eq(customersTable.businessId, biz.id), eq(customersTable.phone, phoneE164)))
      .limit(1);

    if (!customer) {
      const created = await createCustomer(biz.id, {
        firstName: "Mary",
        lastName: "McNamara",
        displayName: "Mary McNamara",
        email: "mary.m@email.ie",
        phone: phoneE164,
      });
      customer = { id: created.id };
    }

    if (slug === "bloom-beauty-dublin") {
      const patchAt = new Date();
      patchAt.setDate(patchAt.getDate() - 2);
      await db
        .update(customersTable)
        .set({ patchTestCompletedAt: patchAt, updatedAt: new Date() })
        .where(eq(customersTable.id, customer.id));
      const now = new Date();
      const [upcoming] = await db
        .select({ id: bookingsTable.id })
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.businessId, biz.id),
            eq(bookingsTable.customerId, customer.id),
            gte(bookingsTable.startAt, now),
            inArray(bookingsTable.status, ["PENDING", "CONFIRMED"]),
          ),
        )
        .limit(1);

      if (!upcoming) {
        const services = await listServices(biz.id, true);
        const staff = await listStaff(biz.id);
        const service = services[0];
        const stylist = staff[0];
        if (service && stylist) {
          const start = new Date(now);
          start.setDate(start.getDate() + 5);
          start.setHours(11, 0, 0, 0);
          const end = new Date(start.getTime() + service.durationMinutes * 60_000);
          await db.insert(bookingsTable).values({
            id: generateId(),
            businessId: biz.id,
            customerId: customer.id,
            staffId: stylist.id,
            serviceId: service.id,
            status: "CONFIRMED",
            startAt: start,
            endAt: end,
            channelType: "WEB",
            notes: "Demo guest hub — lash fill",
          });
        }
      }
    }

    if (slug === "luxe-salon-spa") {
      const staff = await listStaff(biz.id);
      const stylist = staff[0];
      if (stylist) {
        await db
          .update(customersTable)
          .set({ preferredStaffId: stylist.id, updatedAt: new Date() })
          .where(eq(customersTable.id, customer.id));
      }
      const { listLivMemoryForEntity, appendLivMemory } = await import("./liv-memory.service");
      const existing = await listLivMemoryForEntity({
        businessId: biz.id,
        entityType: "customer",
        entityId: customer.id,
        limit: 3,
      });
      if (!existing.some((m) => /balayage|colour|tone/i.test(m.content))) {
        await appendLivMemory({
          businessId: biz.id,
          entityType: "customer",
          entityId: customer.id,
          kind: "preference",
          content: "Prefers cool-toned balayage — avoid warm gold",
          createdBy: "owner",
        });
      }
    }

    if (slug === "paws-parlour-dublin") {
      const { listPetsForCustomer, createPet } = await import("./pets.service");
      const pets = await listPetsForCustomer(biz.id, customer.id);
      if (pets.length === 0) {
        await createPet(biz.id, customer.id, {
          name: "Max",
          species: "dog",
          breed: "Cockapoo",
          behaviourNotes: "Nervous with dryers — prefers quiet corner",
          allergyNotes: "Chicken sensitivity",
        });
      }
    }

    if (slug === "ink-anchor-galway") {
      const { listDesignProofs } = await import("./design-proofs.service");
      const pending = await listDesignProofs(biz.id, "pending_review");
      if (pending[0]) {
        await db
          .update(designProofAssetsTable)
          .set({ customerId: customer.id, updatedAt: new Date() })
          .where(eq(designProofAssetsTable.id, pending[0].id));
      }
    }

    if (slug === "peak-fitness-dublin") {
      const { listPackageCredits } = await import("./package-credits.service");
      const credits = await listPackageCredits(biz.id, customer.id);
      if (credits.length === 0) {
        await grantPackageCredits(biz.id, {
          customerId: customer.id,
          packageName: "10-class pack",
          creditsTotal: 10,
          expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        });
        packageCredits += 1;
      }
    }

    if (slug === "shine-studio-belfast") {
      const { listLivMemoryForEntity, appendLivMemory } = await import("./liv-memory.service");
      const existing = await listLivMemoryForEntity({
        businessId: biz.id,
        entityType: "customer",
        entityId: customer.id,
        limit: 3,
      });
      if (!existing.some((m) => /vehicle|plate|audi/i.test(m.content))) {
        await appendLivMemory({
          businessId: biz.id,
          entityType: "customer",
          entityId: customer.id,
          kind: "preference",
          content: "Audi A4 · Glacier white · ceramic package 2/3 complete",
          createdBy: "owner",
        });
      }
    }

    if (slug === "harbour-wellness-cork") {
      const { listPackageCredits } = await import("./package-credits.service");
      const credits = await listPackageCredits(biz.id, customer.id);
      if (credits.length === 0) {
        await grantPackageCredits(biz.id, {
          customerId: customer.id,
          packageName: "5-session massage pack",
          creditsTotal: 5,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        });
        packageCredits += 1;
      }
    }

    if (slug === "clarity-medspa-dublin") {
      const [pendingConsent] = await db
        .select({ id: medspaConsentRecordsTable.id })
        .from(medspaConsentRecordsTable)
        .where(
          and(
            eq(medspaConsentRecordsTable.businessId, biz.id),
            eq(medspaConsentRecordsTable.customerId, customer.id),
            eq(medspaConsentRecordsTable.status, "pending"),
          ),
        )
        .limit(1);
      if (!pendingConsent) {
        const procedure =
          MEDSPA_PROCEDURES.find((p) => p.code === "botox-consult") ?? MEDSPA_PROCEDURES[0]!;
        await db.insert(medspaConsentRecordsTable).values({
          id: generateId(),
          businessId: biz.id,
          customerId: customer.id,
          procedureCode: procedure.code,
          procedureLabel: procedure.label,
          consentVersion: procedure.consentVersion,
          status: "pending",
          marketCode: "IE",
          metadata: { demoGuestHub: true },
        });
      }

      const [draftIntake] = await db
        .select({ id: medicalIntakeRecordsTable.id })
        .from(medicalIntakeRecordsTable)
        .where(
          and(
            eq(medicalIntakeRecordsTable.businessId, biz.id),
            eq(medicalIntakeRecordsTable.customerId, customer.id),
            eq(medicalIntakeRecordsTable.status, "draft"),
          ),
        )
        .limit(1);
      if (!draftIntake) {
        const intakeId = generateId();
        await db.insert(medicalIntakeRecordsTable).values({
          id: intakeId,
          businessId: biz.id,
          customerId: customer.id,
          status: "draft",
        });
        const { ensureMedicalIntakeGuestAccess } = await import(
          "./medical-intake-guest-access.service"
        );
        await ensureMedicalIntakeGuestAccess(biz.id, intakeId);
      }
    }

    if (slug === "motion-physio-cork") {
      const { listCareSeries, createCareSeries } = await import("./care-series.service");
      const series = await listCareSeries(biz.id, customer.id);
      if (series.length === 0) {
        const services = await listServices(biz.id, true);
        const followUp = services.find((s) => /follow/i.test(s.name)) ?? services[0];
        if (followUp) {
          await createCareSeries(biz.id, {
            customerId: customer.id,
            name: "Post-op rehab plan",
            serviceId: followUp.id,
            sessionsTotal: 6,
            cadenceDays: 7,
            expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    }

    if (FAVORITE_SLUGS.has(slug)) {
      await db
        .insert(guestFavoritesTable)
        .values({ guestId, businessId: biz.id })
        .onConflictDoNothing();
      favorites += 1;
    }
  }

  // Ensure luxe Mary customer phone is E164 (demo-inbox may store spaced format).
  const [luxe] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.slug, "luxe-salon-spa"))
    .limit(1);
  if (luxe) {
    const [mary] = await db
      .select({ id: customersTable.id, phone: customersTable.phone })
      .from(customersTable)
      .where(
        and(
          eq(customersTable.businessId, luxe.id),
          eq(customersTable.email, "mary.m@email.ie"),
        ),
      )
      .limit(1);
    if (mary && mary.phone !== phoneE164) {
      await db
        .update(customersTable)
        .set({ phone: phoneE164 })
        .where(eq(customersTable.id, mary.id));
    }
  }

  return { guestId, phoneE164, shopsLinked, favorites, packageCredits };
}
