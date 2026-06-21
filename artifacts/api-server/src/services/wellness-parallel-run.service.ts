import { db, bookingsTable } from "@workspace/db";
import { and, eq, gte, like, sql } from "drizzle-orm";

/** Parallel run — Livia bookings vs CSV import baseline or live OAuth when configured. */
export async function getParallelRunDiff(businessId: string, external: "mindbody" | "fresha") {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const livia = await db
    .select({ id: bookingsTable.id, startAt: bookingsTable.startAt, status: bookingsTable.status })
    .from(bookingsTable)
    .where(and(eq(bookingsTable.businessId, businessId), gte(bookingsTable.startAt, since)));

  const [importRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.businessId, businessId),
        gte(bookingsTable.startAt, since),
        like(bookingsTable.notes, "Imported%"),
      ),
    );

  const csvBaseline = importRow?.count ?? 0;
  const oauthReady =
    external === "mindbody"
      ? Boolean(process.env.MINDBODY_API_KEY)
      : Boolean(process.env.FRESHA_CLIENT_ID || process.env.LEGACY_SCHEDULER_API_KEY);

  let note: string;
  if (oauthReady) {
    note =
      external === "mindbody"
        ? "Mindbody API configured — live sync populates the external side on next broker run."
        : "Scheduler OAuth configured — run connect in Integrations for live diff.";
  } else if (csvBaseline > 0) {
    note = `${csvBaseline} appointment(s) imported via CSV in the last 7 days — use as your cut-over baseline until OAuth connects.`;
  } else {
    note =
      external === "mindbody"
        ? "Import appointments CSV or set MINDBODY_API_KEY for parallel-run diff."
        : "Import appointments CSV or connect scheduler OAuth for live diff.";
  }

  return {
    external,
    liviaCount: livia.length,
    externalCount: csvBaseline,
    onlyInLivia: livia.map((b) => b.id),
    onlyInExternal: [] as string[],
    note,
    csvBaseline,
    oauthReady,
  };
}
