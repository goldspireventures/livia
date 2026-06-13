import { pgTable, text, timestamp, pgEnum, jsonb, integer, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// Legacy enum kept for back-compat with existing rows. New code writes to roleV2.
export const membershipRoleEnum = pgEnum("membership_role", ["OWNER", "ADMIN", "STAFF"]);

// ADR 0009 role taxonomy. Lives alongside the legacy enum during migration.
//   OWN        — Owner-Operator (single shop, P2b/P3/P5).
//   ADM        — Admin (Owner-as-Admin, the manager-of-managers role).
//   ADM-D      — Admin-Delegated (scope-limited admin; team / shop / brand-shell scope).
//   STA        — Staff (the practitioner; P2b's "I am the business" identity).
//   REC        — Receptionist (read + booking ops; no money/staffing).
//   OWNER_HOST — Owner-Host (chair-rental / multi-vertical landlord at v1.5+).
export const membershipRoleV2Enum = pgEnum("membership_role_v2", [
  "OWN", "ADM", "ADM-D", "STA", "REC", "OWNER_HOST", "OPS",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "ACTIVE", "SUSPENDED", "REVOKED",
]);

export const businessVerticalEnum = pgEnum("business_vertical", [
  "hair",
  "beauty",
  "body-art",
  "wellness",
  "fitness",
  "medspa",
  "allied-health",
  "pet-grooming",
  "automotive-detailing",
  "event-vendors",
]);

export const businessTierEnum = pgEnum("business_tier", [
  "solo", "studio", "chain", "mid-chain", "franchise", "chair-host", "white-label",
]);

export const businessEuRegionEnum = pgEnum("business_eu_region", ["fra", "dub"]);

export const businessStructureKindEnum = pgEnum("business_structure_kind", [
  "standalone",
  "location",
  "brand_entity",
]);

export const businessesTable = pgTable(
  "businesses",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    category: text("category"),
    email: text("email"),
    phone: text("phone"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    // EU-default locale (per v1 P2b solo Hair en-IE).
    country: text("country").notNull().default("IE"),
    currency: text("currency").notNull().default("EUR"),
    locale: text("locale").notNull().default("en-IE"),
    timezone: text("timezone").notNull().default("Europe/Dublin"),
    // Composable monetisation primitives (ADR 0018).
    vertical: businessVerticalEnum("vertical").notNull().default("hair"),
    /** GTM D0 — sub-segment profile from @workspace/policy subvertical-profiles */
    subverticalProfileId: text("subvertical_profile_id"),
    tier: businessTierEnum("tier").notNull().default("solo"),
    euRegion: businessEuRegionEnum("eu_region").notNull().default("fra"),
    logoUrl: text("logo_url"),
    coverImageUrl: text("cover_image_url"),
    /** Track D2 — tenant skin; defaults to platform-default on signup. */
    presentationPresetId: text("presentation_preset_id").default("platform-default"),
    brandAccentHex: text("brand_accent_hex"),
    websiteUrl: text("website_url"),
    instagramHandle: text("instagram_handle"),
    aiEnabled: text("ai_enabled").notNull().default("true"),
    aiTone: text("ai_tone").notNull().default("FRIENDLY"),
    aiGreeting: text("ai_greeting"),
    aiKnowledge: text("ai_knowledge"),
    aiCanBookDirectly: text("ai_can_book_directly").notNull().default("true"),
    /** Per-tenant Liv outbound template overrides — keys from @workspace/policy liv-platform-program. */
    livOutboundOverrides: jsonb("liv_outbound_overrides")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    twilioPhoneNumber: text("twilio_phone_number"),
    twilioPhoneSid: text("twilio_phone_sid"),
    resendFromAddress: text("resend_from_address"),
    /** Plan catalogue id (solo, studio, trial, …). Defaults from tier when unset. */
    planId: text("plan_id"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeSubscriptionStatus: text("stripe_subscription_status"),
    /** Start of current Stripe billing period (for usage rollups). */
    billingPeriodStart: timestamp("billing_period_start", { withTimezone: true }),
    /** Entitlement keys explicitly removed from the plan (e.g. trial without voice). */
    entitlementDenylist: jsonb("entitlement_denylist").$type<string[]>().default([]),
    /** Extra entitlements beyond plan (e.g. peer_set_insights add-on). */
    entitlementGrants: jsonb("entitlement_grants").$type<string[]>().default([]),
    designPartnerEndsAt: timestamp("design_partner_ends_at", { withTimezone: true }),
    /** Wizard progress (acts A1–A12). See @workspace/policy onboarding-state. */
    onboardingState: jsonb("onboarding_state").$type<Record<string, unknown>>(),
    /** Self-declared entity type at onboarding — not KYB-verified */
    tenantAttestation: jsonb("tenant_attestation").$type<Record<string, unknown>>(),
    /** Meta WA / IG / Messenger connection — see docs/product/CHANNELS-EU-MESSAGING.md */
    messagingChannels: jsonb("messaging_channels").$type<Record<string, unknown>>(),
    /** Deposit, buffers, strikes — see @workspace/policy operational-policy */
    operationalPolicy: jsonb("operational_policy").$type<Record<string, unknown>>(),
    /** Per-tenant capability instances — see @workspace/policy capability-instances */
    capabilityInstances: jsonb("capability_instances")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    parentBusinessId: text("parent_business_id"),
    structureKind: businessStructureKindEnum("structure_kind").notNull().default("standalone"),
    livPackConfig: jsonb("liv_pack_config").$type<Record<string, unknown>>(),
    /** Up to 4 service ids pinned to the top grid on public /b (order preserved). */
    publicFeaturedServiceIds: jsonb("public_featured_service_ids").$type<string[]>(),
    /** Mini-store config — products live in retail_products. */
    retailStore: jsonb("retail_store")
      .$type<{
        enabled?: boolean;
        title?: string;
        postSessionSuggest?: boolean;
      }>()
      .notNull()
      .default({ enabled: false, title: "Take home", postSessionSuggest: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("businesses_slug_idx").on(t.slug),
    index("businesses_owner_idx").on(t.ownerId),
    index("businesses_vertical_idx").on(t.vertical),
    index("businesses_tier_idx").on(t.tier),
  ],
);

export const businessMembershipsTable = pgTable(
  "business_memberships",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // Legacy role kept for back-compat; new code reads roleV2.
    role: membershipRoleEnum("role").notNull().default("STAFF"),
    // ADR 0009 role.
    roleV2: membershipRoleV2Enum("role_v2"),
    status: membershipStatusEnum("status").notNull().default("ACTIVE"),
    // Scope for ADM-D and OWNER_HOST: which teams/shops/brand-shells this membership covers.
    // Shape: { teams?: string[]; shops?: string[]; brandShells?: string[] }
    scope: jsonb("scope"),
    capRefundEurCents: integer("cap_refund_eur_cents"),
    capTimeoffDays: integer("cap_timeoff_days"),
    // Self-reference to membership of manager (used by Senior-w-admin chains).
    reportsToId: text("reports_to_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("memberships_business_idx").on(t.businessId),
    index("memberships_user_idx").on(t.userId),
    uniqueIndex("memberships_unique_idx").on(t.businessId, t.userId),
    index("memberships_role_v2_idx").on(t.businessId, t.roleV2),
    index("memberships_reports_to_idx").on(t.reportsToId),
  ],
);

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({ createdAt: true, updatedAt: true });
export const selectBusinessSchema = createSelectSchema(businessesTable);
export const insertMembershipSchema = createInsertSchema(businessMembershipsTable).omit({ createdAt: true, updatedAt: true });
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;
export type BusinessMembership = typeof businessMembershipsTable.$inferSelect;
