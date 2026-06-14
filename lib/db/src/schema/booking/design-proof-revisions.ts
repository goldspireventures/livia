import { pgTable, text, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { designProofAssetsTable } from "./design-proofs";

export const designProofRevisionsTable = pgTable(
  "design_proof_revisions",
  {
    id: text("id").primaryKey(),
    proofId: text("proof_id")
      .notNull()
      .references(() => designProofAssetsTable.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    imageUrl: text("image_url"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("design_proof_revisions_proof_idx").on(t.proofId),
    uniqueIndex("design_proof_revisions_proof_version_uniq").on(t.proofId, t.version),
  ],
);

export type DesignProofRevision = typeof designProofRevisionsTable.$inferSelect;
