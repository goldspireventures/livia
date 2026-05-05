import { Router, type IRouter } from "express";
import { requireAuth, getUserId } from "../lib/auth";
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
} from "@workspace/db";
import { generateId } from "../lib/id";

const router: IRouter = Router();

// Only available in non-production environments
router.post("/dev/seed", requireAuth, async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Seed not available in production" });
    return;
  }

  const userId = getUserId(req);
  await getOrCreateUser(userId);

  // Guard: don't double-seed
  const existing = await getBusinessesForUser(userId);
  if (existing.length > 0) {
    res.json({
      message: "Already seeded — business already exists for this user",
      businessId: existing[0].id,
    });
    return;
  }

  // ── 1. Business ──────────────────────────────────────────────────────────
  const biz = await createBusiness(userId, {
    name: "Luxe Salon & Spa",
    slug: `luxe-salon-${Date.now().toString(36)}`,
    description: "Premium hair, beauty and wellness services in the heart of the city.",
    category: "hair_salon",
    email: "hello@luxesalon.co",
    phone: "+44 20 7946 0958",
    timezone: "Europe/London",
    city: "London",
    country: "GB",
  });

  // ── 2. Staff ─────────────────────────────────────────────────────────────
  const [maya, james, sofia] = await Promise.all([
    createStaff(biz.id, {
      firstName: "Maya",
      lastName: "Patel",
      displayName: "Maya Patel",
      email: "maya@luxesalon.co",
      color: "#8B5CF6",
    }),
    createStaff(biz.id, {
      firstName: "James",
      lastName: "Chen",
      displayName: "James Chen",
      email: "james@luxesalon.co",
      color: "#3B82F6",
    }),
    createStaff(biz.id, {
      firstName: "Sofia",
      lastName: "Russo",
      displayName: "Sofia Russo",
      email: "sofia@luxesalon.co",
      color: "#EC4899",
    }),
  ]);

  // ── 3. Services ───────────────────────────────────────────────────────────
  const [cut, color, blowout, massage, facial] = await Promise.all([
    createService(biz.id, {
      name: "Haircut & Style",
      description: "Precision cut and blow-dry finish",
      durationMinutes: 60,
      priceMinor: 8500,
      currency: "GBP",
      sortOrder: 1,
    }),
    createService(biz.id, {
      name: "Full Colour",
      description: "Root-to-tip colour with toner",
      durationMinutes: 120,
      priceMinor: 15000,
      currency: "GBP",
      sortOrder: 2,
    }),
    createService(biz.id, {
      name: "Blow-Dry",
      description: "Wash and blow-dry styling",
      durationMinutes: 45,
      priceMinor: 4500,
      currency: "GBP",
      sortOrder: 3,
    }),
    createService(biz.id, {
      name: "Deep Tissue Massage",
      description: "60-minute full-body deep tissue massage",
      durationMinutes: 60,
      priceMinor: 9000,
      currency: "GBP",
      sortOrder: 4,
    }),
    createService(biz.id, {
      name: "Luxury Facial",
      description: "Cleanse, exfoliate, and hydrate treatment",
      durationMinutes: 75,
      priceMinor: 11000,
      currency: "GBP",
      sortOrder: 5,
    }),
  ]);

  // ── 4. Staff ↔ Services ───────────────────────────────────────────────────
  await db.insert(staffServicesTable).values([
    { staffId: maya.id, serviceId: cut.id },
    { staffId: maya.id, serviceId: color.id },
    { staffId: maya.id, serviceId: blowout.id },
    { staffId: james.id, serviceId: cut.id },
    { staffId: james.id, serviceId: blowout.id },
    { staffId: james.id, serviceId: massage.id },
    { staffId: sofia.id, serviceId: facial.id },
    { staffId: sofia.id, serviceId: massage.id },
    { staffId: sofia.id, serviceId: blowout.id },
  ]);

  // ── 5. Availability (Mon–Sat 9:00–18:00) ─────────────────────────────────
  const days = [1, 2, 3, 4, 5, 6]; // Mon=1 … Sat=6
  const availRows = [maya, james, sofia].flatMap((s) =>
    days.map((d) => ({
      id: generateId(),
      businessId: biz.id,
      staffId: s.id,
      dayOfWeek: d,
      startTime: "09:00",
      endTime: "18:00",
    }))
  );
  await db.insert(availabilityRulesTable).values(availRows);

  // ── 6. Customers ──────────────────────────────────────────────────────────
  const customerDefs = [
    { firstName: "Alice", lastName: "Thompson", email: "alice.t@email.com", phone: "+44 7700 900001" },
    { firstName: "Ben", lastName: "Okafor", email: "ben.o@email.com", phone: "+44 7700 900002" },
    { firstName: "Chloe", lastName: "Marsh", email: "chloe.m@email.com", phone: "+44 7700 900003" },
    { firstName: "David", lastName: "Kim", email: "david.k@email.com", phone: "+44 7700 900004" },
    { firstName: "Emma", lastName: "Silva", email: "emma.s@email.com", phone: "+44 7700 900005" },
    { firstName: "Finn", lastName: "Larsen", email: "finn.l@email.com", phone: "+44 7700 900006" },
    { firstName: "Grace", lastName: "Yuen", email: "grace.y@email.com", phone: "+44 7700 900007" },
    { firstName: "Hassan", lastName: "Ali", email: "hassan.a@email.com", phone: "+44 7700 900008" },
  ];

  const customers = await db
    .insert(customersTable)
    .values(
      customerDefs.map((c) => ({
        id: generateId(),
        businessId: biz.id,
        firstName: c.firstName,
        lastName: c.lastName,
        displayName: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
      }))
    )
    .returning();

  // ── 7. Bookings ───────────────────────────────────────────────────────────
  const now = new Date();
  const d = (daysOffset: number, hour: number, minute = 0) => {
    const t = new Date(now);
    t.setDate(t.getDate() + daysOffset);
    t.setHours(hour, minute, 0, 0);
    return t;
  };

  type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  const bookingDefs: Array<{
    customerIdx: number;
    staffId: string;
    serviceId: string;
    status: BookingStatus;
    startOffset: number;
    startHour: number;
    startMin?: number;
    durationMinutes: number;
    notes?: string;
  }> = [
    // Today / upcoming
    { customerIdx: 0, staffId: maya.id, serviceId: cut.id,     status: "CONFIRMED",  startOffset: 0,  startHour: 10, durationMinutes: 60 },
    { customerIdx: 1, staffId: james.id, serviceId: blowout.id, status: "CONFIRMED",  startOffset: 0,  startHour: 11, durationMinutes: 45 },
    { customerIdx: 2, staffId: sofia.id, serviceId: facial.id,  status: "PENDING",    startOffset: 0,  startHour: 14, durationMinutes: 75 },
    { customerIdx: 3, staffId: maya.id, serviceId: color.id,    status: "PENDING",    startOffset: 1,  startHour: 9,  durationMinutes: 120 },
    { customerIdx: 4, staffId: james.id, serviceId: massage.id, status: "CONFIRMED",  startOffset: 1,  startHour: 13, durationMinutes: 60 },
    { customerIdx: 5, staffId: sofia.id, serviceId: blowout.id, status: "CONFIRMED",  startOffset: 2,  startHour: 10, startMin: 30, durationMinutes: 45 },
    { customerIdx: 6, staffId: maya.id, serviceId: cut.id,      status: "CONFIRMED",  startOffset: 3,  startHour: 15, durationMinutes: 60 },
    { customerIdx: 7, staffId: james.id, serviceId: massage.id, status: "PENDING",    startOffset: 4,  startHour: 11, durationMinutes: 60 },
    { customerIdx: 0, staffId: sofia.id, serviceId: facial.id,  status: "CONFIRMED",  startOffset: 5,  startHour: 9,  durationMinutes: 75 },
    // Past — completed
    { customerIdx: 1, staffId: maya.id, serviceId: blowout.id, status: "COMPLETED",   startOffset: -1, startHour: 14, durationMinutes: 45 },
    { customerIdx: 2, staffId: james.id, serviceId: cut.id,    status: "COMPLETED",   startOffset: -2, startHour: 10, durationMinutes: 60, notes: "Client loved the layered finish" },
    { customerIdx: 3, staffId: sofia.id, serviceId: massage.id,status: "COMPLETED",   startOffset: -3, startHour: 11, durationMinutes: 60 },
    { customerIdx: 4, staffId: maya.id, serviceId: color.id,   status: "COMPLETED",   startOffset: -5, startHour: 9,  durationMinutes: 120 },
    // Past — no-show / cancelled
    { customerIdx: 5, staffId: james.id, serviceId: blowout.id,status: "NO_SHOW",     startOffset: -4, startHour: 16, durationMinutes: 45 },
    { customerIdx: 6, staffId: sofia.id, serviceId: facial.id, status: "CANCELLED",   startOffset: -6, startHour: 13, durationMinutes: 75, notes: "Client cancelled same day" },
  ];

  await db.insert(bookingsTable).values(
    bookingDefs.map((b) => {
      const start = d(b.startOffset, b.startHour, b.startMin);
      const end = new Date(start.getTime() + b.durationMinutes * 60000);
      return {
        id: generateId(),
        businessId: biz.id,
        customerId: customers[b.customerIdx].id,
        staffId: b.staffId,
        serviceId: b.serviceId,
        status: b.status,
        startAt: start,
        endAt: end,
        notes: b.notes ?? null,
        channelType: "WEB" as const,
      };
    })
  );

  res.json({
    message: "Demo workspace seeded successfully",
    business: { id: biz.id, name: biz.name, slug: biz.slug },
    counts: {
      staff: 3,
      services: 5,
      customers: 8,
      bookings: bookingDefs.length,
    },
  });
});

export default router;
