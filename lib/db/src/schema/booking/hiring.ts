import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { businessesTable } from "../identity/businesses";

export const hiringPostsTable = pgTable(
  "hiring_posts",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: text("status").notNull().default("open"),
    description: text("description"),
    roleType: text("role_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("hiring_posts_business_idx").on(t.businessId)],
);

export const hiringApplicationsTable = pgTable(
  "hiring_applications",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => hiringPostsTable.id, { onDelete: "cascade" }),
    applicantName: text("applicant_name").notNull(),
    applicantEmail: text("applicant_email"),
    applicantPhone: text("applicant_phone"),
    note: text("note"),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("hiring_applications_post_idx").on(t.postId)],
);
