import { db, businessesTable, businessMembershipsTable, usersTable } from "@workspace/db";
import { and, eq, lt } from "drizzle-orm";
import { onboardingStateSchema } from "@workspace/policy";
import { logger } from "../lib/logger";
import { sendOperationalEmail } from "./transactional-email.service";

const STUCK_HOURS = 48;

export type StuckBusiness = {
  id: string;
  name: string;
  slug: string;
  percentComplete: number;
  currentAct: string;
  updatedAt: Date;
  ownerEmail: string | null;
};

export async function findStuckOnboardingBusinesses(limit = 200): Promise<StuckBusiness[]> {
  const cutoff = new Date(Date.now() - STUCK_HOURS * 60 * 60_000);
  const rows = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      slug: businessesTable.slug,
      onboardingState: businessesTable.onboardingState,
      updatedAt: businessesTable.updatedAt,
    })
    .from(businessesTable)
    .where(lt(businessesTable.updatedAt, cutoff))
    .limit(limit);

  const stuck: StuckBusiness[] = [];
  for (const r of rows) {
    const parsed = onboardingStateSchema.safeParse(r.onboardingState);
    if (!parsed.success) continue;
    const { percentComplete, completedActs, currentAct } = parsed.data;
    if (percentComplete >= 50 || completedActs.includes("a12_go_live")) continue;

    const [owner] = await db
      .select({ email: usersTable.email })
      .from(businessMembershipsTable)
      .innerJoin(usersTable, eq(usersTable.id, businessMembershipsTable.userId))
      .where(
        and(
          eq(businessMembershipsTable.businessId, r.id),
          eq(businessMembershipsTable.role, "OWNER"),
        ),
      )
      .limit(1);

    stuck.push({
      id: r.id,
      name: r.name,
      slug: r.slug,
      percentComplete,
      currentAct,
      updatedAt: r.updatedAt,
      ownerEmail: owner?.email ?? null,
    });
  }
  return stuck;
}

export async function sendOnboardingStuckNudges(): Promise<{
  scanned: number;
  emailed: number;
  skipped: number;
  failed: number;
}> {
  const stuck = await findStuckOnboardingBusinesses();
  const dashboardBase = (process.env["PUBLIC_BASE_URL"] ?? "https://app.livia.io").replace(/\/+$/, "");
  let emailed = 0;
  let skipped = 0;
  let failed = 0;

  for (const s of stuck) {
    if (!s.ownerEmail) {
      skipped++;
      continue;
    }
    const body = [
      `Hi — you're ${s.percentComplete}% through setting up ${s.name} on Livia.`,
      ``,
      `Pick up where you left off (${s.currentAct.replace(/^a\d+_/, "").replace(/_/g, " ")}):`,
      `${dashboardBase}/onboarding`,
      ``,
      `Need a hand? Reply to this email or use Help in the app.`,
      `— Livia`,
    ].join("\n");

    const result = await sendOperationalEmail({
      businessId: s.id,
      to: s.ownerEmail,
      subject: `Finish setting up ${s.name} on Livia`,
      body,
      templateKey: "onboarding-stuck-nudge",
    });
    if (result === "sent") emailed++;
    else if (result === "skipped") skipped++;
    else failed++;
  }

  logger.info({ stuck: stuck.length, emailed, skipped, failed }, "onboarding-stuck nudge sweep");
  return { scanned: stuck.length, emailed, skipped, failed };
}
