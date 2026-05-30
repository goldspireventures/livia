import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { designProofAssetsTable } from "./design-proofs";
import { businessesTable } from "../identity/businesses";

/** Opaque token for guest design-proof approve/reject without login. */
export const designProofGuestAccessTable = pgTable(
  "design_proof_guest_access",
  {
    proofId: text("proof_id")
      .primaryKey()
      .references(() => designProofAssetsTable.id, { onDelete: "cascade" }),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("design_proof_guest_access_business_idx").on(t.businessId),
    index("design_proof_guest_access_token_idx").on(t.token),
  ],
);
