/**
 * Idempotent demo seed. Requires DATABASE_URL in .env (see prisma.config.ts).
 * Run: npm run db:seed
 *
 * Ensures demo-bliq has owner, a service, staff, assignment, and Mon–Fri UTC
 * availability so `/book/demo-bliq` can list slots after seed.
 */
import { createBusiness } from "@/services/business/businessService";
import { prisma } from "@/lib/prisma";

const DEMO_OWNER_EMAIL = "seed-owner@bliq.example";
const DEMO_SLUG = "demo-bliq";

/** Weekday 0=Sun .. 6=Sat (schema convention). Mon–Fri = 1..5 */
const DEMO_WEEKDAYS = [1, 2, 3, 4, 5] as const;
const DEMO_START_MINUTES = 9 * 60;
const DEMO_END_MINUTES = 17 * 60;

async function ensureDemoCatalog(businessId: string) {
  let service = await prisma.service.findFirst({
    where: { businessId, active: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!service) {
    service = await prisma.service.create({
      data: {
        businessId,
        name: "Standard visit",
        description: "Demo service for public booking",
        durationMinutes: 30,
        active: true,
        sortOrder: 0,
      },
    });
  }

  let staff = await prisma.staff.findFirst({
    where: { businessId, active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!staff) {
    staff = await prisma.staff.create({
      data: {
        businessId,
        firstName: "Alex",
        lastName: "Demo",
        displayName: "Alex Demo",
        active: true,
      },
    });
  }

  await prisma.staffServiceAssignment.upsert({
    where: {
      staffId_serviceId: { staffId: staff.id, serviceId: service.id },
    },
    create: { businessId, staffId: staff.id, serviceId: service.id },
    update: {},
  });

  for (const weekday of DEMO_WEEKDAYS) {
    const exists = await prisma.availabilityRule.findFirst({
      where: { businessId, staffId: staff.id, weekday },
    });
    if (!exists) {
      await prisma.availabilityRule.create({
        data: {
          businessId,
          staffId: staff.id,
          weekday,
          startMinutes: DEMO_START_MINUTES,
          endMinutes: DEMO_END_MINUTES,
          timezone: "UTC",
          active: true,
        },
      });
    }
  }

}

async function main() {
  let user = await prisma.user.findUnique({ where: { email: DEMO_OWNER_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: DEMO_OWNER_EMAIL, name: "Demo Owner" },
    });
  }

  let business = await prisma.business.findUnique({
    where: { slug: DEMO_SLUG },
    select: { id: true },
  });

  if (!business) {
    await createBusiness({
      ownerUserId: user.id,
      name: "Demo Business",
      slug: DEMO_SLUG,
      timezone: "UTC",
    });
    business = await prisma.business.findUniqueOrThrow({
      where: { slug: DEMO_SLUG },
      select: { id: true },
    });
    console.log(`Created demo business (${DEMO_SLUG}) and owner (${DEMO_OWNER_EMAIL}).`);
  } else {
    console.log(`Demo business ${DEMO_SLUG} already exists; ensuring catalog + availability.`);
  }

  await prisma.businessMembership.findFirstOrThrow({
    where: { businessId: business.id, role: "OWNER" },
    select: { userId: true },
  });

  await ensureDemoCatalog(business.id);
  console.log(`Demo catalog ready: service, staff, assignment, Mon–Fri UTC rules. Open /book/${DEMO_SLUG}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
