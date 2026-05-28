import { inngest } from "../lib/inngest";
import { db, hostRenterLinksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

/** Friday 08:00 UTC — mark due rents and log for future email/SMS (v1.5). */
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
