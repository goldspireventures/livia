import { db, livEntityMemoryTable } from "@workspace/db";
import { and, eq, desc, isNull, or, gt } from "drizzle-orm";
import { generateId } from "../lib/id";

export type LivMemoryKind =
  | "note"
  | "preference"
  | "ritual"
  | "procedural"
  | "pressure"
  | "therapist_pref"
  | "health_light";

export async function listLivMemoryForEntity(args: {
  businessId: string;
  entityType: "customer" | "staff" | "business";
  entityId: string;
  limit?: number;
}) {
  const now = new Date();
  const rows = await db
    .select()
    .from(livEntityMemoryTable)
    .where(
      and(
        eq(livEntityMemoryTable.businessId, args.businessId),
        eq(livEntityMemoryTable.entityType, args.entityType),
        eq(livEntityMemoryTable.entityId, args.entityId),
        or(
          isNull(livEntityMemoryTable.expiresAt),
          gt(livEntityMemoryTable.expiresAt, now),
        ),
      ),
    )
    .orderBy(desc(livEntityMemoryTable.createdAt))
    .limit(args.limit ?? 20);

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as LivMemoryKind,
    content: r.content,
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function appendLivMemory(args: {
  businessId: string;
  entityType: "customer" | "staff" | "business";
  entityId: string;
  kind: LivMemoryKind;
  content: string;
  createdBy: "staff" | "owner" | "liv";
  ttlDays?: number;
}) {
  const content = args.content.trim();
  if (!content) throw new Error("EMPTY_CONTENT");

  const expiresAt = args.ttlDays
    ? new Date(Date.now() + args.ttlDays * 86400000)
    : null;

  const [row] = await db
    .insert(livEntityMemoryTable)
    .values({
      id: generateId(),
      businessId: args.businessId,
      entityType: args.entityType,
      entityId: args.entityId,
      kind: args.kind,
      content,
      createdBy: args.createdBy,
      expiresAt,
    })
    .returning();

  return row;
}

/** Injected into Liv system prompts — bounded, factual. */
export async function buildLivMemoryBlockForCustomer(
  businessId: string,
  customerId: string,
): Promise<string> {
  const rows = await listLivMemoryForEntity({
    businessId,
    entityType: "customer",
    entityId: customerId,
    limit: 8,
  });
  if (rows.length === 0) return "";

  const lines = rows.map((r) => `- [${r.kind}] ${r.content}`);
  return `\n\nCUSTOMER MEMORY (use naturally, do not invent beyond this):\n${lines.join("\n")}\n`;
}

export async function buildLivMemoryBlockForBusiness(businessId: string): Promise<string> {
  const rows = await listLivMemoryForEntity({
    businessId,
    entityType: "business",
    entityId: businessId,
    limit: 10,
  });
  const ritual = rows.filter((r) => r.kind === "ritual" || r.kind === "note");
  if (!ritual.length) return "";
  const lines = ritual.map((r) => `- [${r.kind}] ${r.content}`);
  return `\n\nBUSINESS MEMORY (owner rituals — respect, do not invent):\n${lines.join("\n")}\n`;
}
