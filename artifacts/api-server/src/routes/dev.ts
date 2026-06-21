import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
import { buildSimToken, getSimOwnerForBusiness } from "../lib/sim-auth";
import { getOrCreateUser } from "../services/users.service";
import { createBusiness, getBusinessesForUser } from "../services/businesses.service";
import { createStaff } from "../services/staff.service";
import { createService } from "../services/services.service";
import {
  db,
  customersTable,
  bookingsTable,
  availabilityRulesTable,
  staffServicesTable,
  businessesTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { generateId } from "../lib/id";
import { getMessagingChannels, updateMessagingChannels } from "../services/messaging-channels.service";
import { processInboundMetaMessage } from "../services/meta-inbound.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

function makeDt(base: Date, daysOffset: number, hour: number, minute = 0) {
  const t = new Date(base);
  t.setDate(t.getDate() + daysOffset);
  t.setHours(hour, minute, 0, 0);
  return t;
}

async function seedAvailability(
  businessId: string,
  staffIds: string[],
  days: number[],
  startTime: string,
  endTime: string,
) {
  const rows = staffIds.flatMap((sid) =>
    days.map((d) => ({
      id: generateId(),
      businessId,
      staffId: sid,
      dayOfWeek: d,
      startTime,
      endTime,
    })),
  );
  await db.insert(availabilityRulesTable).values(rows);
}

async function seedCustomers(
  businessId: string,
  defs: Array<{ firstName: string; lastName: string; email: string; phone: string }>,
) {
  const rows = defs.map((c) => ({
    id: generateId(),
    businessId,
    firstName: c.firstName,
    lastName: c.lastName,
    displayName: `${c.firstName} ${c.lastName}`,
    email: c.email,
    phone: c.phone,
  }));
  return db.insert(customersTable).values(rows).returning();
}

async function seedBookings(
  base: Date,
  businessId: string,
  customers: { id: string }[],
  defs: Array<{
    ci: number;
    staffId: string;
    serviceId: string;
    status: BookingStatus;
    daysOffset: number;
    hour: number;
    minute?: number;
    durationMinutes: number;
    notes?: string;
  }>,
) {
  const rows = defs.map((b) => {
    const start = makeDt(base, b.daysOffset, b.hour, b.minute ?? 0);
    const end = new Date(start.getTime() + b.durationMinutes * 60_000);
    return {
      id: generateId(),
      businessId,
      customerId: customers[Math.min(b.ci, customers.length - 1)]!.id,
      staffId: b.staffId,
      serviceId: b.serviceId,
      status: b.status,
      startAt: start,
      endAt: end,
      notes: b.notes ?? null,
      channelType: "WEB" as const,
    };
  });
  await db.insert(bookingsTable).values(rows);
}

// Only available in non-production environments
router.post("/dev/seed", requireAuth, async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    sendError(res, req, 403, "Seed not available in production");
    return;
  }

  const userId = getUserId(req);
  await getOrCreateUser(userId);

  // Guard: don't double-seed
  const existing = await getBusinessesForUser(userId);
  if (existing.length > 0) {
    res.json({
      message: "Already seeded — businesses already exist for this user",
      businesses: existing.map((b) => ({ id: b.id, name: b.name, slug: b.slug })),
    });
    return;
  }

  const ts = Date.now().toString(36);
  const now = new Date();

  // ════════════════════════════════════════════════════════════════════════════
  // BUSINESS 1 — Luxe Salon & Spa  (hair & wellness, London)
  // ════════════════════════════════════════════════════════════════════════════
  const salon = await createBusiness(userId, {
    name: "Luxe Salon & Spa",
    slug: `luxe-salon-${ts}`,
    description: "Premium hair, beauty and wellness services in the heart of the city.",
    category: "hair_salon",
    email: "hello@luxesalon.co",
    phone: "+44 20 7946 0958",
    timezone: "Europe/London",
    city: "London",
    country: "GB",
  });

  const [maya, james, sofia] = await Promise.all([
    createStaff(salon.id, { firstName: "Maya",  lastName: "Patel", displayName: "Maya Patel",  email: "maya@luxesalon.co",  color: "#8B5CF6" }),
    createStaff(salon.id, { firstName: "James", lastName: "Chen",  displayName: "James Chen",  email: "james@luxesalon.co", color: "#3B82F6" }),
    createStaff(salon.id, { firstName: "Sofia", lastName: "Russo", displayName: "Sofia Russo", email: "sofia@luxesalon.co", color: "#EC4899" }),
  ]);

  const [cut, colour, blowDry, massage, facial] = await Promise.all([
    createService(salon.id, { name: "Haircut & Style",    description: "Precision cut and blow-dry finish",           durationMinutes: 60,  priceMinor: 6500,  currency: "GBP", sortOrder: 1 }),
    createService(salon.id, { name: "Full Colour",        description: "Root-to-tip colour with toner",               durationMinutes: 120, priceMinor: 12000, currency: "GBP", sortOrder: 2 }),
    createService(salon.id, { name: "Blow-Dry",           description: "Wash and blow-dry styling",                   durationMinutes: 45,  priceMinor: 4500,  currency: "GBP", sortOrder: 3 }),
    createService(salon.id, { name: "Deep Tissue Massage",description: "60-minute full-body deep tissue massage",      durationMinutes: 60,  priceMinor: 8500,  currency: "GBP", sortOrder: 4 }),
    createService(salon.id, { name: "Luxury Facial",      description: "Cleanse, exfoliate, and hydrate treatment",   durationMinutes: 75,  priceMinor: 9500,  currency: "GBP", sortOrder: 5 }),
  ]);

  await db.insert(staffServicesTable).values([
    { staffId: maya.id,  serviceId: cut.id    },
    { staffId: maya.id,  serviceId: colour.id },
    { staffId: maya.id,  serviceId: blowDry.id },
    { staffId: james.id, serviceId: cut.id    },
    { staffId: james.id, serviceId: blowDry.id },
    { staffId: james.id, serviceId: massage.id },
    { staffId: sofia.id, serviceId: facial.id  },
    { staffId: sofia.id, serviceId: massage.id },
    { staffId: sofia.id, serviceId: blowDry.id },
  ]);

  await seedAvailability(salon.id, [maya.id, james.id, sofia.id], [1,2,3,4,5,6], "09:00", "18:00");

  const salonCustomers = await seedCustomers(salon.id, [
    { firstName: "Alice",   lastName: "Thompson", email: "alice.t@email.com",  phone: "+44 7700 900001" },
    { firstName: "Ben",     lastName: "Okafor",   email: "ben.o@email.com",    phone: "+44 7700 900002" },
    { firstName: "Chloe",   lastName: "Marsh",    email: "chloe.m@email.com",  phone: "+44 7700 900003" },
    { firstName: "David",   lastName: "Kim",      email: "david.k@email.com",  phone: "+44 7700 900004" },
    { firstName: "Emma",    lastName: "Silva",    email: "emma.s@email.com",   phone: "+44 7700 900005" },
    { firstName: "Finn",    lastName: "Larsen",   email: "finn.l@email.com",   phone: "+44 7700 900006" },
    { firstName: "Grace",   lastName: "Yuen",     email: "grace.y@email.com",  phone: "+44 7700 900007" },
    { firstName: "Hassan",  lastName: "Ali",      email: "hassan.a@email.com", phone: "+44 7700 900008" },
  ]);

  await seedBookings(now, salon.id, salonCustomers, [
    { ci: 0, staffId: maya.id,  serviceId: cut.id,    status: "CONFIRMED", daysOffset:  0, hour: 10, durationMinutes: 60 },
    { ci: 1, staffId: james.id, serviceId: blowDry.id,status: "CONFIRMED", daysOffset:  0, hour: 11, durationMinutes: 45 },
    { ci: 2, staffId: sofia.id, serviceId: facial.id, status: "PENDING",   daysOffset:  0, hour: 14, durationMinutes: 75 },
    { ci: 3, staffId: maya.id,  serviceId: colour.id, status: "PENDING",   daysOffset:  1, hour:  9, durationMinutes: 120 },
    { ci: 4, staffId: james.id, serviceId: massage.id,status: "CONFIRMED", daysOffset:  1, hour: 13, durationMinutes: 60 },
    { ci: 5, staffId: sofia.id, serviceId: blowDry.id,status: "CONFIRMED", daysOffset:  2, hour: 10, minute: 30, durationMinutes: 45 },
    { ci: 6, staffId: maya.id,  serviceId: cut.id,    status: "CONFIRMED", daysOffset:  3, hour: 15, durationMinutes: 60 },
    { ci: 7, staffId: james.id, serviceId: massage.id,status: "PENDING",   daysOffset:  4, hour: 11, durationMinutes: 60 },
    { ci: 0, staffId: sofia.id, serviceId: facial.id, status: "CONFIRMED", daysOffset:  5, hour:  9, durationMinutes: 75 },
    { ci: 1, staffId: maya.id,  serviceId: blowDry.id,status: "COMPLETED", daysOffset: -1, hour: 14, durationMinutes: 45 },
    { ci: 2, staffId: james.id, serviceId: cut.id,    status: "COMPLETED", daysOffset: -2, hour: 10, durationMinutes: 60, notes: "Client loved the layered finish" },
    { ci: 3, staffId: sofia.id, serviceId: massage.id,status: "COMPLETED", daysOffset: -3, hour: 11, durationMinutes: 60 },
    { ci: 4, staffId: maya.id,  serviceId: colour.id, status: "COMPLETED", daysOffset: -5, hour:  9, durationMinutes: 120 },
    { ci: 5, staffId: james.id, serviceId: blowDry.id,status: "NO_SHOW",   daysOffset: -4, hour: 16, durationMinutes: 45 },
    { ci: 6, staffId: sofia.id, serviceId: facial.id, status: "CANCELLED", daysOffset: -6, hour: 13, durationMinutes: 75, notes: "Client cancelled same day" },
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // BUSINESS 2 — Iron & Ink Tattoo Studio  (tattoo, Manchester)
  // ════════════════════════════════════════════════════════════════════════════
  const tattoo = await createBusiness(userId, {
    name: "Iron & Ink Tattoo Studio",
    slug: `iron-ink-${ts}`,
    description: "Custom fine-line and traditional tattoos by Manchester's most-booked artists.",
    category: "tattoo",
    email: "book@ironink.co.uk",
    phone: "+44 161 496 0123",
    timezone: "Europe/London",
    city: "Manchester",
    country: "GB",
  });

  const [kai, zara] = await Promise.all([
    createStaff(tattoo.id, { firstName: "Kai",  lastName: "Brooks", displayName: "Kai Brooks", email: "kai@ironink.co.uk",  color: "#F97316" }),
    createStaff(tattoo.id, { firstName: "Zara", lastName: "Ahmed",  displayName: "Zara Ahmed", email: "zara@ironink.co.uk", color: "#10B981" }),
  ]);

  const [consult, smallTat, medTat, largeTat, touchUp] = await Promise.all([
    createService(tattoo.id, { name: "Design Consultation", description: "1-hour design brief and sketch session",        durationMinutes: 60,  priceMinor: 5000,  currency: "GBP", sortOrder: 1 }),
    createService(tattoo.id, { name: "Small Tattoo (< 3\")", description: "Fine detail work up to 3 inches",             durationMinutes: 120, priceMinor: 15000, currency: "GBP", sortOrder: 2 }),
    createService(tattoo.id, { name: "Medium Tattoo (3–6\")",description: "Mid-size piece, single session",              durationMinutes: 240, priceMinor: 35000, currency: "GBP", sortOrder: 3 }),
    createService(tattoo.id, { name: "Large Tattoo (6\"+)",  description: "Large-scale work or sleeve session",           durationMinutes: 360, priceMinor: 65000, currency: "GBP", sortOrder: 4 }),
    createService(tattoo.id, { name: "Touch-Up Session",     description: "Colour refresh and line repairs",             durationMinutes: 90,  priceMinor: 8000,  currency: "GBP", sortOrder: 5 }),
  ]);

  await db.insert(staffServicesTable).values([
    { staffId: kai.id,  serviceId: consult.id  },
    { staffId: kai.id,  serviceId: smallTat.id },
    { staffId: kai.id,  serviceId: medTat.id   },
    { staffId: kai.id,  serviceId: largeTat.id },
    { staffId: zara.id, serviceId: consult.id  },
    { staffId: zara.id, serviceId: smallTat.id },
    { staffId: zara.id, serviceId: touchUp.id  },
  ]);

  // Tattoo studio: Tue–Sat 11:00–19:00
  await seedAvailability(tattoo.id, [kai.id, zara.id], [2,3,4,5,6], "11:00", "19:00");

  const tattooCustomers = await seedCustomers(tattoo.id, [
    { firstName: "Liam",      lastName: "Walker",  email: "liam.w@email.com",      phone: "+44 7700 900011" },
    { firstName: "Olivia",    lastName: "Stone",   email: "olivia.s@email.com",    phone: "+44 7700 900012" },
    { firstName: "Noah",      lastName: "Banks",   email: "noah.b@email.com",      phone: "+44 7700 900013" },
    { firstName: "Ava",       lastName: "Cruz",    email: "ava.c@email.com",       phone: "+44 7700 900014" },
    { firstName: "Elijah",    lastName: "Foster",  email: "elijah.f@email.com",    phone: "+44 7700 900015" },
    { firstName: "Charlotte", lastName: "Webb",    email: "charlotte.w@email.com", phone: "+44 7700 900016" },
  ]);

  await seedBookings(now, tattoo.id, tattooCustomers, [
    { ci: 0, staffId: kai.id,  serviceId: consult.id,  status: "CONFIRMED", daysOffset:  0, hour: 12, durationMinutes: 60 },
    { ci: 1, staffId: zara.id, serviceId: smallTat.id, status: "CONFIRMED", daysOffset:  0, hour: 14, durationMinutes: 120 },
    { ci: 2, staffId: kai.id,  serviceId: medTat.id,   status: "PENDING",   daysOffset:  1, hour: 11, durationMinutes: 240 },
    { ci: 3, staffId: zara.id, serviceId: consult.id,  status: "CONFIRMED", daysOffset:  2, hour: 13, durationMinutes: 60 },
    { ci: 4, staffId: kai.id,  serviceId: largeTat.id, status: "CONFIRMED", daysOffset:  3, hour: 11, durationMinutes: 360 },
    { ci: 5, staffId: zara.id, serviceId: touchUp.id,  status: "PENDING",   daysOffset:  4, hour: 15, durationMinutes: 90 },
    { ci: 0, staffId: kai.id,  serviceId: smallTat.id, status: "COMPLETED", daysOffset: -1, hour: 13, durationMinutes: 120, notes: "Geometric wrist piece — client very happy" },
    { ci: 1, staffId: zara.id, serviceId: touchUp.id,  status: "COMPLETED", daysOffset: -2, hour: 14, durationMinutes: 90 },
    { ci: 2, staffId: kai.id,  serviceId: consult.id,  status: "COMPLETED", daysOffset: -3, hour: 11, durationMinutes: 60, notes: "Sketch approved, booking large piece next month" },
    { ci: 3, staffId: zara.id, serviceId: smallTat.id, status: "COMPLETED", daysOffset: -5, hour: 12, durationMinutes: 120 },
    { ci: 4, staffId: kai.id,  serviceId: medTat.id,   status: "NO_SHOW",   daysOffset: -4, hour: 11, durationMinutes: 240 },
    { ci: 5, staffId: zara.id, serviceId: consult.id,  status: "CANCELLED", daysOffset: -6, hour: 16, durationMinutes: 60, notes: "Cancelled — wants to reschedule after holiday" },
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // BUSINESS 3 — Peak Performance  (personal training, Birmingham)
  // ════════════════════════════════════════════════════════════════════════════
  const gym = await createBusiness(userId, {
    name: "Peak Performance",
    slug: `peak-performance-${ts}`,
    description: "Results-driven personal training and nutrition coaching for every goal.",
    category: "fitness",
    email: "train@peakperformance.co.uk",
    phone: "+44 121 496 0456",
    timezone: "Europe/London",
    city: "Birmingham",
    country: "GB",
  });

  const [marcus, leila] = await Promise.all([
    createStaff(gym.id, { firstName: "Marcus", lastName: "Reed",  displayName: "Marcus Reed",  email: "marcus@peakperformance.co.uk", color: "#2563EB" }),
    createStaff(gym.id, { firstName: "Leila",  lastName: "Nazari",displayName: "Leila Nazari", email: "leila@peakperformance.co.uk",  color: "#EF4444" }),
  ]);

  const [pt, hiit, nutrition, bodyComp, mobility] = await Promise.all([
    createService(gym.id, { name: "1-on-1 Personal Training",      description: "Private session tailored to your goals",     durationMinutes: 60, priceMinor: 7500, currency: "GBP", sortOrder: 1 }),
    createService(gym.id, { name: "Group HIIT Class",              description: "High-intensity interval training, max 8 pax", durationMinutes: 45, priceMinor: 2500, currency: "GBP", sortOrder: 2 }),
    createService(gym.id, { name: "Nutrition Consultation",        description: "Macro planning and meal strategy session",    durationMinutes: 45, priceMinor: 6000, currency: "GBP", sortOrder: 3 }),
    createService(gym.id, { name: "Body Composition Assessment",   description: "InBody scan + coach debrief",                durationMinutes: 30, priceMinor: 4000, currency: "GBP", sortOrder: 4 }),
    createService(gym.id, { name: "Recovery & Mobility",           description: "Assisted stretch and soft-tissue work",      durationMinutes: 60, priceMinor: 5500, currency: "GBP", sortOrder: 5 }),
  ]);

  await db.insert(staffServicesTable).values([
    { staffId: marcus.id, serviceId: pt.id        },
    { staffId: marcus.id, serviceId: hiit.id      },
    { staffId: marcus.id, serviceId: bodyComp.id  },
    { staffId: leila.id,  serviceId: pt.id        },
    { staffId: leila.id,  serviceId: nutrition.id },
    { staffId: leila.id,  serviceId: mobility.id  },
    { staffId: leila.id,  serviceId: hiit.id      },
  ]);

  // Gym: Mon–Sat 06:00–21:00
  await seedAvailability(gym.id, [marcus.id, leila.id], [1,2,3,4,5,6], "06:00", "21:00");

  const gymCustomers = await seedCustomers(gym.id, [
    { firstName: "Tyler",   lastName: "Grant",   email: "tyler.g@email.com",   phone: "+44 7700 900021" },
    { firstName: "Jasmine", lastName: "Powell",  email: "jasmine.p@email.com", phone: "+44 7700 900022" },
    { firstName: "Ethan",   lastName: "Richards",email: "ethan.r@email.com",   phone: "+44 7700 900023" },
    { firstName: "Mia",     lastName: "Costa",   email: "mia.c@email.com",     phone: "+44 7700 900024" },
    { firstName: "Connor",  lastName: "Blake",   email: "connor.b@email.com",  phone: "+44 7700 900025" },
    { firstName: "Priya",   lastName: "Sharma",  email: "priya.s@email.com",   phone: "+44 7700 900026" },
  ]);

  await seedBookings(now, gym.id, gymCustomers, [
    { ci: 0, staffId: marcus.id, serviceId: pt.id,       status: "CONFIRMED", daysOffset:  0, hour:  7, durationMinutes: 60 },
    { ci: 1, staffId: leila.id,  serviceId: nutrition.id,status: "CONFIRMED", daysOffset:  0, hour:  9, durationMinutes: 45 },
    { ci: 2, staffId: marcus.id, serviceId: hiit.id,     status: "PENDING",   daysOffset:  0, hour: 12, durationMinutes: 45 },
    { ci: 3, staffId: leila.id,  serviceId: mobility.id, status: "CONFIRMED", daysOffset:  1, hour:  8, durationMinutes: 60 },
    { ci: 4, staffId: marcus.id, serviceId: bodyComp.id, status: "CONFIRMED", daysOffset:  1, hour: 10, durationMinutes: 30 },
    { ci: 5, staffId: leila.id,  serviceId: pt.id,       status: "PENDING",   daysOffset:  2, hour:  7, durationMinutes: 60 },
    { ci: 0, staffId: marcus.id, serviceId: pt.id,       status: "CONFIRMED", daysOffset:  3, hour: 18, durationMinutes: 60 },
    { ci: 1, staffId: leila.id,  serviceId: nutrition.id,status: "CONFIRMED", daysOffset:  4, hour: 11, durationMinutes: 45 },
    { ci: 2, staffId: marcus.id, serviceId: pt.id,       status: "COMPLETED", daysOffset: -1, hour:  7, durationMinutes: 60, notes: "Hit new deadlift PR — great session" },
    { ci: 3, staffId: leila.id,  serviceId: mobility.id, status: "COMPLETED", daysOffset: -2, hour:  9, durationMinutes: 60 },
    { ci: 4, staffId: marcus.id, serviceId: bodyComp.id, status: "COMPLETED", daysOffset: -3, hour: 10, durationMinutes: 30, notes: "Body fat down 2% from last month" },
    { ci: 5, staffId: leila.id,  serviceId: hiit.id,     status: "NO_SHOW",   daysOffset: -4, hour: 12, durationMinutes: 45 },
    { ci: 0, staffId: marcus.id, serviceId: pt.id,       status: "COMPLETED", daysOffset: -5, hour: 18, durationMinutes: 60 },
    { ci: 1, staffId: leila.id,  serviceId: nutrition.id,status: "CANCELLED", daysOffset: -6, hour:  9, durationMinutes: 45, notes: "Rescheduled to next week" },
  ]);

  res.json({
    message: "Demo workspace seeded successfully — 3 businesses created",
    businesses: [
      { id: salon.id, name: salon.name, slug: salon.slug, category: "Hair & Wellness", staff: 3, services: 5, customers: 8, bookings: 15 },
      { id: tattoo.id, name: tattoo.name, slug: tattoo.slug, category: "Tattoo Studio", staff: 2, services: 5, customers: 6, bookings: 12 },
      { id: gym.id, name: gym.name, slug: gym.slug, category: "Personal Training", staff: 2, services: 5, customers: 6, bookings: 14 },
    ],
  });
});

router.delete("/dev/seed", requireAuth, async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    sendError(res, req, 403, "Wipe not available in production");
    return;
  }

  const userId = getUserId(req);
  const businesses = await getBusinessesForUser(userId);
  const businessIds = businesses.map((b) => b.id);

  if (businessIds.length === 0) {
    res.json({ message: "Nothing to wipe", deleted: 0 });
    return;
  }

  // Cascade deletes are configured on FKs: deleting businesses will cascade
  // to staff/services/customers/bookings/availability/conversations/etc.
  await db.delete(businessesTable).where(inArray(businessesTable.id, businessIds));

  res.json({
    message: `Wiped ${businessIds.length} business${businessIds.length === 1 ? "" : "es"} and all related data`,
    deleted: businessIds.length,
  });
});

/**
 * Issue a short-lived sim bearer token for a demo business.
 * Only works in development. Requires the business to have a seeded owner.
 */
router.post("/dev/sim-token", async (req, res): Promise<void> => {
  if (process.env.NODE_ENV !== "development") {
    res.status(404).json({ error: "Not available" });
    return;
  }
  const businessId = (req.body?.businessId as string | undefined)?.trim();
  if (!businessId) {
    res.status(400).json({ error: "businessId required" });
    return;
  }
  const userId = await getSimOwnerForBusiness(businessId);
  if (!userId) {
    res.status(404).json({ error: "No owner found for business" });
    return;
  }
  const token = buildSimToken(userId, businessId);
  res.json({ token, userId, businessId });
});

router.post("/dev/meta/inbound", requireAuth, async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production" && process.env["META_DEV_SIMULATE"] !== "true") {
    sendError(res, req, 404, "Not available");
    return;
  }
  const businessId = (req.body?.businessId as string | undefined)?.trim();
  const channel = (req.body?.channel as string | undefined) ?? "WHATSAPP";
  const from = (req.body?.from as string | undefined)?.trim() ?? "+353871234567";
  const text = (req.body?.text as string | undefined)?.trim() ?? "Hello";
  const displayName = (req.body?.displayName as string | undefined)?.trim();

  if (!businessId) {
    sendError(res, req, 400, "businessId required");
    return;
  }

  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
  if (!biz) {
    sendError(res, req, 404, "Business not found");
    return;
  }

  const ch = await getMessagingChannels(businessId);
  if (channel === "WHATSAPP" && !ch.whatsapp?.phoneNumberId) {
    await updateMessagingChannels(businessId, {
      whatsapp: { phoneNumberId: "dev_wa_phone_id", displayPhone: "+353 87 123 4567" },
    });
  }
  if (channel === "INSTAGRAM" && !ch.instagram?.pageId) {
    await updateMessagingChannels(businessId, {
      instagram: { pageId: "dev_ig_page_id" },
    });
  }

  const refreshed = await getMessagingChannels(businessId);

  const inbound =
    channel === "INSTAGRAM"
      ? {
          channel: "INSTAGRAM" as const,
          businessLookup: { instagramPageId: refreshed.instagram!.pageId },
          externalParticipantId: from,
          externalMessageId: `sim_ig_${Date.now()}`,
          text,
          displayName,
        }
      : {
          channel: "WHATSAPP" as const,
          businessLookup: { whatsappPhoneNumberId: refreshed.whatsapp!.phoneNumberId },
          externalParticipantId: from.replace(/\D/g, ""),
          externalMessageId: `sim_wa_${Date.now()}`,
          text,
          displayName,
        };

  process.env["META_DEV_SIMULATE"] = "true";
  const result = await processInboundMetaMessage(inbound);
  res.json(result);
});

export default router;
