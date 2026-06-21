import { inngest } from "../lib/inngest";
import { db, hostRenterLinksTable, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { deliverInAppNotification } from "../services/in-app-notifications.service";

/** Friday 08:00 UTC — mark due rents and notify host owners. */
export const hostRentCollect = inngest.createFunction(
  { id: "host-rent-collect", retries: 2 },
  { cron: "0 8 * * 5" },
  async ({ step }) => {
    const links = await step.run("list-active-links", async () =>
      db.select().from(hostRenterLinksTable).where(eq(hostRenterLinksTable.isActive, true)),
    );

    let due = 0;
    for (const link of links) {
      if (link.rentStatus === "paid") continue;
      await step.run(`due-${link.id}`, async () => {
        await db
          .update(hostRenterLinksTable)
          .set({ rentStatus: "due", updatedAt: new Date() })
          .where(eq(hostRenterLinksTable.id, link.id));

        const [host] = await db
          .select({ ownerId: businessesTable.ownerId, name: businessesTable.name })
          .from(businessesTable)
          .where(eq(businessesTable.id, link.hostBusinessId))
          .limit(1);
        if (host?.ownerId) {
          await deliverInAppNotification({
            kind: "host.rent_due",
            businessId: link.hostBusinessId,
            title: "Chair rent due",
            body: `${link.chairLabel} rent is due — open Host floor to mark paid.`,
            priority: "watch",
            resourceKind: "host_renter_link",
            resourceId: link.id,
            dedupeKey: `host-rent:${link.id}:${new Date().toISOString().slice(0, 10)}`,
            audience: "operators",
          }).catch(() => undefined);
        }

        logger.info(
          { hostBusinessId: link.hostBusinessId, renterBusinessId: link.renterBusinessId },
          "host-rent-collect: rent marked due",
        );
        return { linkId: link.id };
      });
      due++;
    }

    return { links: links.length, markedDue: due };
  },
);
