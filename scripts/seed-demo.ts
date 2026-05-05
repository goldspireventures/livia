import { db, businessesTable, businessMembershipsTable, staffTable, servicesTable, staffServicesTable, customersTable, bookingsTable, availabilityRulesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

const SLUG = "luxe-salon-spa";
const USER_PLACEHOLDER = "seed-demo-user";

async function main() {
  // Check if already seeded
  const existing = await db.select().from(businessesTable).where(eq(businessesTable.slug, SLUG));
  if (existing.length > 0) {
    console.log(`Already seeded — business "${SLUG}" exists (id: ${existing[0].id})`);
    process.exit(0);
  }

  console.log("Seeding demo workspace...");

  // 1. Business
  const bizId = generateId();
  const [biz] = await db.insert(businessesTable).values({
    id: bizId,
    name: "Luxe Salon & Spa",
    slug: SLUG,
    description: "Premium hair, beauty and wellness services in the heart of the city.",
    category: "hair_salon",
    email: "hello@luxesalon.co",
    phone: "+44 20 7946 0958",
    timezone: "Europe/London",
    city: "London",
    country: "GB",
  }).returning();

  // 2. Staff
  const makeStaff = (firstName: string, lastName: string, email: string, color: string) => ({
    id: generateId(),
    businessId: bizId,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    email,
    color,
    isActive: true,
  });

  const staffRows = [
    makeStaff("Maya", "Patel", "maya@luxesalon.co", "#8B5CF6"),
    makeStaff("James", "Chen", "james@luxesalon.co", "#3B82F6"),
    makeStaff("Sofia", "Russo", "sofia@luxesalon.co", "#EC4899"),
  ];
  const [maya, james, sofia] = await db.insert(staffTable).values(staffRows).returning();

  // 3. Services
  const svcBase = (name: string, description: string, durationMinutes: number, priceMinor: number) => ({
    id: generateId(),
    businessId: bizId,
    name,
    description,
    durationMinutes,
    priceMinor,
    currency: "GBP",
    isActive: true,
  });

  const [cut, color, blowout, massage, facial] = await db.insert(servicesTable).values([
    svcBase("Haircut & Style", "Precision cut and blow-dry finish", 60, 6500),
    svcBase("Colour Treatment", "Full colour, highlights or balayage", 120, 12000),
    svcBase("Blowout", "Shampoo, condition and blowout", 45, 4500),
    svcBase("Deep Tissue Massage", "60-minute targeted muscle relief", 60, 8500),
    svcBase("Signature Facial", "Cleanse, exfoliate and hydrate", 75, 9500),
  ]).returning();

  // 4. Staff-Services
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

  // 5. Availability (Mon-Sat 9-18)
  const days = [1, 2, 3, 4, 5, 6];
  await db.insert(availabilityRulesTable).values(
    [maya, james, sofia].flatMap((s) =>
      days.map((d) => ({
        id: generateId(),
        businessId: bizId,
        staffId: s.id,
        dayOfWeek: d,
        startTime: "09:00",
        endTime: "18:00",
      }))
    )
  );

  // 6. Customers
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

  const customers = await db.insert(customersTable).values(
    customerDefs.map((c) => ({
      id: generateId(),
      businessId: bizId,
      firstName: c.firstName,
      lastName: c.lastName,
      displayName: `${c.firstName} ${c.lastName}`,
      email: c.email,
      phone: c.phone,
    }))
  ).returning();

  // 7. Bookings
  const now = new Date();
  const d = (daysOffset: number, hour: number, minute = 0) => {
    const t = new Date(now);
    t.setDate(t.getDate() + daysOffset);
    t.setHours(hour, minute, 0, 0);
    return t;
  };

  type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

  const bookingDefs: Array<{
    customerIdx: number; staffId: string; serviceId: string;
    status: BookingStatus; startOffset: number; startHour: number;
    startMin?: number; durationMinutes: number; notes?: string;
  }> = [
    { customerIdx: 0, staffId: maya.id,  serviceId: cut.id,     status: "CONFIRMED", startOffset: 0,  startHour: 10, durationMinutes: 60 },
    { customerIdx: 1, staffId: james.id, serviceId: blowout.id, status: "CONFIRMED", startOffset: 0,  startHour: 11, durationMinutes: 45 },
    { customerIdx: 2, staffId: sofia.id, serviceId: facial.id,  status: "PENDING",   startOffset: 0,  startHour: 14, durationMinutes: 75 },
    { customerIdx: 3, staffId: maya.id,  serviceId: color.id,   status: "PENDING",   startOffset: 1,  startHour: 9,  durationMinutes: 120 },
    { customerIdx: 4, staffId: james.id, serviceId: massage.id, status: "CONFIRMED", startOffset: 1,  startHour: 13, durationMinutes: 60 },
    { customerIdx: 5, staffId: sofia.id, serviceId: blowout.id, status: "CONFIRMED", startOffset: 2,  startHour: 10, startMin: 30, durationMinutes: 45 },
    { customerIdx: 6, staffId: maya.id,  serviceId: cut.id,     status: "CONFIRMED", startOffset: 3,  startHour: 15, durationMinutes: 60 },
    { customerIdx: 7, staffId: james.id, serviceId: massage.id, status: "PENDING",   startOffset: 4,  startHour: 11, durationMinutes: 60 },
    { customerIdx: 0, staffId: sofia.id, serviceId: facial.id,  status: "CONFIRMED", startOffset: 5,  startHour: 9,  durationMinutes: 75 },
    { customerIdx: 1, staffId: maya.id,  serviceId: blowout.id, status: "COMPLETED", startOffset: -1, startHour: 14, durationMinutes: 45 },
    { customerIdx: 2, staffId: james.id, serviceId: cut.id,     status: "COMPLETED", startOffset: -2, startHour: 10, durationMinutes: 60, notes: "Client loved the layered finish" },
    { customerIdx: 3, staffId: sofia.id, serviceId: massage.id, status: "COMPLETED", startOffset: -3, startHour: 11, durationMinutes: 60 },
    { customerIdx: 4, staffId: maya.id,  serviceId: color.id,   status: "COMPLETED", startOffset: -5, startHour: 9,  durationMinutes: 120 },
    { customerIdx: 5, staffId: james.id, serviceId: blowout.id, status: "NO_SHOW",   startOffset: -4, startHour: 16, durationMinutes: 45 },
    { customerIdx: 6, staffId: sofia.id, serviceId: facial.id,  status: "CANCELLED", startOffset: -6, startHour: 13, durationMinutes: 75, notes: "Client cancelled same day" },
  ];

  await db.insert(bookingsTable).values(
    bookingDefs.map((b) => {
      const start = d(b.startOffset, b.startHour, b.startMin);
      const end = new Date(start.getTime() + b.durationMinutes * 60_000);
      return {
        id: generateId(),
        businessId: bizId,
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

  console.log("✓ Seeded successfully:");
  console.log(`  Business: ${biz.name} (slug: ${biz.slug})`);
  console.log(`  Staff: 3, Services: 5, Customers: 8, Bookings: ${bookingDefs.length}`);
  console.log(`  Public URL: /b/${biz.slug}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
