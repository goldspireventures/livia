import { db, livPromptVersionsTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";
import { generateId } from "../lib/id";

export const LIV_PROMPT_KEYS = ["system.core", "vertical.module"] as const;
export type LivPromptKey = (typeof LIV_PROMPT_KEYS)[number];

export async function getActivePromptOverrides(
  businessId: string,
): Promise<Record<string, string>> {
  const rows = await db
    .select()
    .from(livPromptVersionsTable)
    .where(
      and(eq(livPromptVersionsTable.businessId, businessId), eq(livPromptVersionsTable.isActive, true)),
    );

  const out: Record<string, string> = {};
  for (const row of rows) {
    out[row.promptKey] = row.content;
  }
  return out;
}

export async function listPromptVersions(businessId: string, promptKey?: string) {
  const conditions = [eq(livPromptVersionsTable.businessId, businessId)];
  if (promptKey) conditions.push(eq(livPromptVersionsTable.promptKey, promptKey));

  return db
    .select()
    .from(livPromptVersionsTable)
    .where(and(...conditions))
    .orderBy(desc(livPromptVersionsTable.version));
}

export async function upsertPromptVersion(args: {
  businessId: string;
  promptKey: LivPromptKey;
  content: string;
}) {
  const existing = await db
    .select()
    .from(livPromptVersionsTable)
    .where(
      and(
        eq(livPromptVersionsTable.businessId, args.businessId),
        eq(livPromptVersionsTable.promptKey, args.promptKey),
        eq(livPromptVersionsTable.isActive, true),
      ),
    )
    .limit(1);

  const nextVersion = (existing[0]?.version ?? 0) + 1;

  if (existing[0]) {
    await db
      .update(livPromptVersionsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(livPromptVersionsTable.id, existing[0].id));
  }

  const [row] = await db
    .insert(livPromptVersionsTable)
    .values({
      id: generateId(),
      businessId: args.businessId,
      promptKey: args.promptKey,
      version: nextVersion,
      content: args.content,
      isActive: true,
    })
    .returning();

  return row;
}
