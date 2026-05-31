import { db, execWorkEventsTable } from "@workspace/db";
import { isExecHatId, type ExecHatId } from "@workspace/policy";
import { desc, eq } from "drizzle-orm";
import { generateId } from "../lib/id";

export type ExecWorkEventLink = { label: string; href: string };

export type CreateExecWorkEventInput = {
  hatId: ExecHatId;
  summary: string;
  actor: "human" | "agent";
  actorLabel?: string;
  links?: ExecWorkEventLink[];
  sessionId?: string;
  source?: "cursor" | "cli" | "manual" | "git" | "support";
};

export async function createExecWorkEvent(input: CreateExecWorkEventInput) {
  const summary = input.summary.trim();
  if (!summary || summary.length > 280) {
    throw Object.assign(new Error("summary required (max 280 chars)"), { status: 400 });
  }
  if (!isExecHatId(input.hatId)) {
    throw Object.assign(new Error("invalid hatId"), { status: 400 });
  }

  const [row] = await db
    .insert(execWorkEventsTable)
    .values({
      id: generateId(),
      hatId: input.hatId,
      summary,
      actor: input.actor,
      actorLabel: input.actorLabel?.trim() || null,
      links: input.links ?? [],
      sessionId: input.sessionId?.trim() || null,
      source: input.source ?? null,
    })
    .returning();

  return row!;
}

export async function listExecWorkEvents(opts?: { hatId?: ExecHatId; limit?: number }) {
  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 100);
  const q = db.select().from(execWorkEventsTable).orderBy(desc(execWorkEventsTable.createdAt)).limit(limit);
  if (opts?.hatId) {
    return db
      .select()
      .from(execWorkEventsTable)
      .where(eq(execWorkEventsTable.hatId, opts.hatId))
      .orderBy(desc(execWorkEventsTable.createdAt))
      .limit(limit);
  }
  return q;
}

/** Recent events grouped by hat — for cockpit snapshot. */
export async function listRecentExecWorkEventsByHat(limitPerHat = 5) {
  const rows = await listExecWorkEvents({ limit: limitPerHat * 6 });
  const byHat: Record<
    ExecHatId,
    Array<{
      id: string;
      summary: string;
      actor: string;
      actorLabel: string | null;
      createdAt: Date;
      links: unknown;
    }>
  > = {
    ceo: [],
    coo: [],
    cpo: [],
    cto: [],
    cs: [],
    cro: [],
  };

  for (const row of rows) {
    const hat = row.hatId as ExecHatId;
    if (!byHat[hat]) continue;
    if (byHat[hat].length >= limitPerHat) continue;
    byHat[hat].push({
      id: row.id,
      summary: row.summary,
      actor: row.actor,
      actorLabel: row.actorLabel,
      createdAt: row.createdAt,
      links: row.links,
    });
  }

  return byHat;
}
