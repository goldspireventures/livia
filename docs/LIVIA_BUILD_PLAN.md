# Livia — Build Plan & Source of Truth

**Foundational document.** Agents must read this file first to understand Livia as a product and platform, non‑negotiable engineering rules, and product philosophy. Then read `prisma/schema.prisma`, relevant `src/services/*`, and `docs/CURSOR_RULES.md` before changing code.

**Roadmap index:** [docs/ROADMAP.md](./ROADMAP.md) explains how Part D **phases** (0–7+) relate to a longer master product spec (section numbers are not the same as phases). **Master spec spine + appendices:** [docs/MASTER_SPINE.md](./MASTER_SPINE.md). **Livia ↔ master index:** [docs/MASTER_LIVIA_INDEX.md](./MASTER_LIVIA_INDEX.md). **Tranches (T0–T6):** [docs/TRANCHES.md](./TRANCHES.md). **Folder layout:** [docs/FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md). **Spec vs repo:** [docs/REPO_DELTA.md](./REPO_DELTA.md). **Product/infra snapshot:** [docs/LIVIA_STATUS_SUMMARY.md](./LIVIA_STATUS_SUMMARY.md). **Elite standards pack (imported):** [docs/elite/README.md](./elite/README.md).

---

## Part A — Product & platform (source of truth)

### 1. What Livia Is

Livia is a **mobile-first, multi-tenant, AI-ready operating system for service businesses**.

It is NOT:

- just a booking app
- just for barbers
- a niche tool

It IS:

- a platform that allows any service-based business to run its operations end-to-end

Core idea:

> Livia replaces fragmented tools (booking apps, spreadsheets, messaging, payments, admin) with a single unified system.

---

### 2. Core Product Vision

Livia helps businesses manage:

- bookings
- customers
- staff
- services
- availability
- payments
- storefronts
- messaging
- automation
- AI-driven insights

Over time, Livia becomes:

> the central operating layer for how service businesses run.

The first build should focus on a **serious foundation**, not a toy MVP.

---

### 3. Target Users

Livia must support barbers, salons, nail techs, lash techs, tutors, personal trainers, tattoo artists, consultants, mechanics, mobile/home service providers, and similar appointment-based businesses.

Rule:

> Never design anything that only works for one niche.

Everything must be **generic and extensible**.

---

### 4. Platform Nature

Livia is:

- **multi-tenant** — everything scoped by `businessId`
- **API-first** — web and mobile consume the same APIs
- **mobile-first** — most users will use mobile
- **event-driven** — important actions emit events
- **service-layer driven** — business logic lives in `src/services/*`
- **AI-augmented** — AI is never the source of truth for core domain state

---

### 5. Architecture & Engineering Rules (Non-Negotiable)

#### 5.1 Service layer

- ALL business logic must live in `src/services/*`
- NO business logic in API routes
- NO business logic in UI components

#### 5.2 API design

Always use tenant-nested routes:

**Prefix:** `/api/businesses/[businessId]/...`

Examples:

- `/api/businesses/[businessId]/staff`
- `/api/businesses/[businessId]/services`
- `/api/businesses/[businessId]/bookings`

Never create parallel top-level tenant APIs such as `/api/staff` or `/api/services` unless a resource is genuinely **platform-global** and non-tenant (rare).

**Why:** `businessId` stays visible in the URL, handlers align with `membershipService` checks, and cross-tenant mistakes are harder.

**Next.js App Router:** dynamic segment `params` in route handlers is typed as a **Promise**; handlers must `await params` before reading `businessId`, `staffId`, etc.

#### 5.3 Multi-tenancy

- Every query MUST be scoped by `businessId`
- No cross-tenant data access
- No global queries unless explicitly required and documented

Routes should use `membershipService` (or equivalent) so users cannot act outside businesses they belong to.

#### 5.4 Data integrity

Do **not** hard-delete important domain records (staff, services, bookings, customers). Prefer **active / inactive** (or equivalent lifecycle) flags and preserve history for audits, payments, and support.

> **Note:** Some existing endpoints may still perform destructive deletes where the schema or an older phase allowed it; **new work and refactors** should align with soft lifecycle and archival patterns.

#### 5.5 Events

Important actions emit events (e.g. `BUSINESS_CREATED`, `STAFF_CREATED`, `SERVICE_UPDATED`, `BOOKING_CREATED`, `PAYMENT_SUCCEEDED`). Use `logEvent` / the `Event` model.

Rules:

- Events must never crash the main flow if logging fails
- Events must not contain sensitive data (tokens, secrets, full card numbers)

#### 5.6 Validation

- All API input must use **Zod**
- Services must enforce critical invariants even when the API already validated

Never trust the frontend as the only validation layer.

#### 5.7 Mobile-first requirement

Assume: **the primary user is on mobile.**

Implications: simple flows, minimal steps, clear feedback; no hover-only interactions; no desktop-only assumptions.

#### 5.8 Web compatibility

- Everything must still work on the web
- Layouts must be responsive
- APIs must stay consistent across clients

#### 5.9 Quick engineering checklist

1. Business logic only in `src/services/*`; routes and UI stay thin.
2. Tenant-owned HTTP APIs live under `/api/businesses/[businessId]/...` only.
3. Prisma queries for tenant data always include `businessId` in `where` / create payloads.
4. Never hardcode barber-only concepts; use generic names: Business, Staff, Service, Customer, Booking, AvailabilityRule, Payment, Storefront, Event.
5. Use Prisma only through the shared Prisma client.
6. Stripe and future PSPs: no direct calls from routes; logic under `src/services/payments/*`.
7. Future AI: behind a central client — not embedded ad hoc in domain services.
8. Do not ship fake external integrations; webhook boundaries should be real when a channel is implemented.
9. Every roadmap phase must compile before moving on.

---

### 6. Booking Philosophy

Booking logic must be:

- **deterministic**
- **backend-controlled**
- **conflict-safe**

Rules:

- No double booking for the same staff when staff is assigned
- No booking outside availability once the slot engine enforces it
- No booking inactive staff or inactive services
- No booking during time off

The **slot / availability engine** is the source of truth for “can this book?” — not the client.

---

### 7. Payment Philosophy

- Payments must be **abstracted** (`src/services/payments/*`).
- **Stripe** is the first provider, not a permanent dependency.
- **Mulah** may replace or extend payments later.

Rules:

- No Stripe (or other PSP) logic inside booking services
- No card data storage in Livia
- Flow payment state through payment services / provider adapters

---

### 8. Messaging Philosophy

Target channels over time may include WhatsApp, SMS, Instagram, Snapchat identity, and similar.

Rules:

- Do not fake integrations — real webhook boundaries when implemented
- Log messages where the product requires an audit trail
- Keep **channel identity** separate from **Customer** until explicitly linked or confirmed

---

### 9. Storefront Philosophy

Livia is not only a backend. Businesses should have **public-facing** pages, brand presence, and **booking entry points**.

Rules:

- **Template-driven** (not a drag-and-drop builder in early versions)
- Mobile-first public UX
- Storefront uses the same tenant-nested booking APIs as other clients

---

### 10. AI Philosophy

AI is **assistive**, **observational**, and **analytical**.

AI is NOT:

- authoritative over bookings, payments, permissions, or tenancy
- allowed to run destructive actions automatically

Rules:

- All AI calls go through a **shared AI client** when introduced
- Log / audit AI outputs where appropriate
- AI never **replaces** server-side validation for bookings, payments, or authorization

---

### 11. UX Philosophy

Livia should feel **fast**, **clean**, **modern**, **premium**, and **simple**.

Avoid clutter, enterprise bloat, overly long forms, and unnecessary steps.

---

### 12. Development Rules for Cursor

**Before making changes**

- Read this document
- Read `prisma/schema.prisma`
- Read relevant `src/services/*` and routes you will touch

**When implementing**

- Follow phase instructions in Part D where they apply
- Do not skip validation or assume missing logic is acceptable
- Do not introduce shortcuts that violate Part A §5–§11

**After implementing**

- Run `npm run build` and fix errors
- Summarize changes, explain how to test, list assumptions and TODOs

---

### 13. What Not To Do

Never:

- hardcode barber-specific logic
- bypass the service layer
- put domain logic in routes or UI
- trust frontend validation alone
- create cross-tenant queries
- fake external integrations
- assume desktop-first usage
- skip error handling for user-visible failures
- silently swallow **critical** errors

---

### 14. Long-Term Direction

Livia evolves toward:

- deeper business OS (operations, reporting)
- financial layer (Mulah and other rails)
- messaging hub
- AI assistant surfaces (within §10 guardrails)
- marketplace / discovery if product chooses
- analytics engine

Build **cleanly** so the codebase can grow into that vision.

---

### 15. Final Principle

When unsure, default to:

- **safety** over speed
- **clarity** over cleverness
- **scalability** over shortcuts
- **mobile-first** over desktop-first

> Build Livia as if it will power **thousands** of businesses, not just one.

---

## Part B — Current Technical Direction

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL via Supabase
- Zod for validation
- Stripe first via payment abstraction; future Mulah payment provider
- Capacitor later for iOS and Android (**not set up in this repo yet**)
- Sentry later for monitoring
- Central AI client later (see §10)

Important setup notes:

- Repo uses `src/` structure; `@/*` points to `src/*`.
- `styles/`, `prisma/`, and `public/` remain at repo root.
- Prisma schema lives in `prisma/schema.prisma`; sync with `npx prisma db push` or migrations per team practice.
- Supabase session pooler may be required when direct connection is IPv6-only.

---

## Part C — HTTP API — Tenant-Nested Style (Canonical)

**Prefix:** `/api/businesses/[businessId]/...`

**Patterns:**

| Area | Method | Path |
|------|--------|------|
| Business (tenant root) | POST, GET | `/api/businesses` |
| Business | GET, PATCH | `/api/businesses/[businessId]` |
| Staff | GET, POST | `/api/businesses/[businessId]/staff` |
| Staff | GET, PATCH, DELETE | `/api/businesses/[businessId]/staff/[staffId]` |
| Services (catalog) | GET, POST | `/api/businesses/[businessId]/services` |
| Service | GET, PATCH, DELETE | `/api/businesses/[businessId]/services/[serviceId]` |
| Staff ↔ service assignments | GET, POST | `/api/businesses/[businessId]/staff/[staffId]/services` |
| Unassign | DELETE | `/api/businesses/[businessId]/staff/[staffId]/services/[serviceId]` |
| Staff for a service | GET | `/api/businesses/[businessId]/services/[serviceId]/staff` |
| Customers | GET, POST | `/api/businesses/[businessId]/customers` |
| Customer | GET, PATCH, DELETE | `/api/businesses/[businessId]/customers/[customerId]` |
| Channel identities (on a customer) | GET, POST | `/api/businesses/[businessId]/customers/[customerId]/channel-identities` |
| Channel identity | GET, PATCH, DELETE | `/api/businesses/[businessId]/customers/[customerId]/channel-identities/[channelIdentityId]` |
| Bookings | GET, POST | `/api/businesses/[businessId]/bookings` |
| Booking | GET, PATCH | `/api/businesses/[businessId]/bookings/[bookingId]` |
| Availability rules (per staff) | GET, POST | `/api/businesses/[businessId]/staff/[staffId]/availability-rules` |
| Availability rule | GET, PATCH, DELETE | `/api/businesses/[businessId]/staff/[staffId]/availability-rules/[ruleId]` |
| Time off (per staff) | GET, POST | `/api/businesses/[businessId]/staff/[staffId]/time-offs` |
| Time off | GET, PATCH, DELETE | `/api/businesses/[businessId]/staff/[staffId]/time-offs/[timeOffId]` |
| Feature flags | GET, POST | `/api/businesses/[businessId]/feature-flags` |
| Feature flag | GET, PATCH, DELETE | `/api/businesses/[businessId]/feature-flags/[featureFlagId]` |
| Payment intents (records) | GET, POST | `/api/businesses/[businessId]/payment-intents` |
| Payment intent | GET, PATCH | `/api/businesses/[businessId]/payment-intents/[paymentIntentId]` |

**Future phases** should extend the same tree (examples, not all built yet):

- `/api/businesses/[businessId]/payments` …
- **Stripe webhooks (global):** `POST /api/webhooks/stripe` — verifies signatures and updates tenant `PaymentIntentRecord` rows (see Phase 7). **Stripe Connect / `PaymentAccount` onboarding** remains a follow-up.

**Temporary auth (until a real session):** list/detail routes take `?userId=...`; mutating routes send `actorUserId` in the JSON body where applicable. Mark with TODO comments in handlers.

---

## Part D — Build Roadmap

### Phase 0 — Foundation

Status: mostly complete.

Purpose:

- establish repo structure
- set up Prisma
- connect Supabase
- validate build

Expected files:

- `src/app`
- `src/lib`
- `src/services`
- `src/components`
- `src/types`
- `src/hooks`
- `src/utils`
- `prisma/schema.prisma`

Completion criteria:

- `npm run build` passes
- `npx prisma generate` passes
- database schema synced

---

### Phase 1 — Business + Membership Foundation

Purpose:
Create the tenant ownership layer.

Build:

- Prisma client singleton
- event logger
- business service
- membership service
- thin business API routes

Files:

- `src/lib/prisma.ts`
- `src/lib/events.ts`
- `src/services/business/businessService.ts`
- `src/services/business/membershipService.ts`
- `src/app/api/businesses/route.ts`
- `src/app/api/businesses/[businessId]/route.ts`

Rules:

- create business and owner membership in one transaction
- emit `BUSINESS_CREATED`
- emit `BUSINESS_UPDATED`
- for now, temporary `userId` may be passed in request body/query until real auth is implemented
- mark temporary auth clearly with TODO comments

Cursor prompt:

```text
Implement Phase 1 of Livia: Business + Membership Foundation.

Context:
Livia is a multi-tenant service-business operating platform. Business is the tenant root. Business logic belongs in src/services. API routes must be thin.

Build only:

1. Prisma client singleton
- src/lib/prisma.ts
- export prisma
- safe for Next.js hot reload

2. Event logger
- src/lib/events.ts
- logEvent({ type, source, level?, businessId?, actorUserId?, subjectType?, subjectId?, payload? })
- write to Event table
- default level INFO
- never crash main flow if logging fails

3. Business service
- src/services/business/businessService.ts
Functions:
- createBusiness({ ownerUserId, name, slug, timezone? })
- getBusinessById({ businessId })
- getBusinessBySlug({ slug })
- updateBusiness({ businessId, data })

Rules:
- create Business and OWNER BusinessMembership in one transaction
- slug must be unique
- emit BUSINESS_CREATED and BUSINESS_UPDATED events
- no HTTP logic

4. Membership service
- src/services/business/membershipService.ts
Functions:
- getUserBusinesses({ userId })
- assertUserCanAccessBusiness({ userId, businessId })
- assertUserRole({ userId, businessId, allowedRoles })

5. API routes
- POST /api/businesses
- GET /api/businesses
- GET /api/businesses/[businessId]
- PATCH /api/businesses/[businessId]

Rules:
- use zod
- route handlers only parse, call services, return JSON
- no business logic in routes
- accept temporary userId until auth exists
- mark temporary auth with TODO

After implementation:
- run build/typecheck if possible
- summarize files changed
- explain how to test routes

---

### Phase 2 — Staff + Services + Assignments

Purpose:
Operations staff and service catalog for a business, plus which services each staff member can perform.

Status: implemented (tenant-nested API only).

Build:

- Staff service (CRUD-style + deactivate)
- Service catalog service (CRUD-style + deactivate)
- Staff–service assignment service
- Thin API routes under `/api/businesses/[businessId]/...` (see Part C table)

Files:

- `src/services/staff/staffService.ts`
- `src/services/catalog/serviceCatalogService.ts`
- `src/services/catalog/staffServiceAssignmentService.ts`
- `src/app/api/businesses/[businessId]/staff/route.ts`
- `src/app/api/businesses/[businessId]/staff/[staffId]/route.ts`
- `src/app/api/businesses/[businessId]/services/route.ts`
- `src/app/api/businesses/[businessId]/services/[serviceId]/route.ts`
- `src/app/api/businesses/[businessId]/staff/[staffId]/services/route.ts`
- `src/app/api/businesses/[businessId]/staff/[staffId]/services/[serviceId]/route.ts`
- `src/app/api/businesses/[businessId]/services/[serviceId]/staff/route.ts`

Rules:

- all Prisma queries for staff/services/assignments include `businessId` in `where` (or create payload) — no cross-tenant access
- mutations require `OWNER` or `ADMIN` via `assertUserRole` (same pattern as business PATCH)
- reads require `assertUserCanAccessBusiness` unless a stricter rule is documented for a phase
- emit events: `STAFF_*`, `SERVICE_*`, `STAFF_SERVICE_*` (see `src/lib/events.ts`)

Completion criteria:

- `npx prisma validate` and `npx prisma generate` succeed
- `npm run build` passes
- routes registered under `businesses/[businessId]` only

---

### Phase 3 — Customers + channel identities

Purpose:
Tenant-scoped customer records and contact identifiers (`ChannelIdentity`) used for bookings and messaging later.

Status: implemented (tenant-nested API only).

Build:

- Customer service (create, list, get, update, delete)
- Channel identity service nested under a customer (create, list, get, update, delete)
- Thin API routes (see Part C table)

Files:

- `src/services/customer/customerService.ts`
- `src/services/customer/channelIdentityService.ts`
- `src/app/api/businesses/[businessId]/customers/route.ts`
- `src/app/api/businesses/[businessId]/customers/[customerId]/route.ts`
- `src/app/api/businesses/[businessId]/customers/[customerId]/channel-identities/route.ts`
- `src/app/api/businesses/[businessId]/customers/[customerId]/channel-identities/[channelIdentityId]/route.ts`

Rules:

- every query includes `businessId`; customer-scoped routes also verify `customerId` belongs to that business
- mutations require `OWNER` or `ADMIN` (same as Phase 2 catalog)
- reads require `assertUserCanAccessBusiness`
- deleting a customer is blocked when they have any `Booking` rows; channel rows for that customer are removed first on successful delete (align future refactors with Part A §5.4 lifecycle preference)
- duplicate `(businessId, channel, value)` on channel identities returns a conflict (DB unique + service handling)
- emit `CUSTOMER_*` and `CHANNEL_IDENTITY_*` events (see `src/lib/events.ts`)

Completion criteria:

- `npm run build` passes

---

### Phase 4 — Bookings

Purpose:
Create and manage appointments: customer, service, optional staff, time range, and status lifecycle.

Status: implemented (tenant-nested API only).

Build:

- Booking service with validation against `Customer`, `Service`, and `Staff` in the same business
- Optional `staffId` requires an active staff member **assigned** to the service (`StaffServiceAssignment`)
- If `endsAt` is omitted on create, it defaults to `startsAt + service.durationMinutes`
- Staff double-booking prevention: overlapping time with another non-`CANCELLED` booking for the same `staffId` is rejected
- List supports optional filters: `from`, `to` (ISO datetimes, overlap window when both set), `status`, `customerId`, `staffId`

Files:

- `src/services/booking/bookingService.ts`
- `src/app/api/businesses/[businessId]/bookings/route.ts`
- `src/app/api/businesses/[businessId]/bookings/[bookingId]/route.ts`

Rules:

- reads: `assertUserCanAccessBusiness`
- writes: `OWNER`, `ADMIN`, or `STAFF` (front desk)
- emit `BOOKING_CREATED`, `BOOKING_UPDATED` (see `src/lib/events.ts`)

Completion criteria:

- `npm run build` passes

---

### Phase 5 — Availability rules + time off

Purpose:
Recurring weekly availability windows per staff member (`AvailabilityRule`) and ad-hoc blocks (`TimeOff`), scoped to the business and staff.

Status: implemented (tenant-nested under each staff member).

Build:

- `AvailabilityRule`: weekday `0–6` (Sun–Sat), `startMinutes` / `endMinutes` same-day segment `(0,1440]` end exclusive at next midnight use `1440`, optional `effectiveFrom` / `effectiveTo`, `timezone`, `active`, `metadata`
- `TimeOff`: `startsAt` / `endsAt`, optional `reason`, `metadata`; list supports optional `from` / `to` overlap filter

Files:

- `src/services/availability/availabilityRuleService.ts`
- `src/services/availability/timeOffService.ts`
- `src/app/api/businesses/[businessId]/staff/[staffId]/availability-rules/route.ts`
- `src/app/api/businesses/[businessId]/staff/[staffId]/availability-rules/[ruleId]/route.ts`
- `src/app/api/businesses/[businessId]/staff/[staffId]/time-offs/route.ts`
- `src/app/api/businesses/[businessId]/staff/[staffId]/time-offs/[timeOffId]/route.ts`

Rules:

- reads: `assertUserCanAccessBusiness`
- writes: `OWNER` or `ADMIN` (same as staff profile mutations)
- emit `AVAILABILITY_RULE_*` and `TIME_OFF_*` events (see `src/lib/events.ts`)

Completion criteria:

- `npm run build` passes

---

### Phase 6 — Feature flags + payment intent records

Purpose:

- **Feature flags:** per-tenant toggles (`FeatureFlag`) for gradual rollouts and ops.
- **Payment intent records:** persist `PaymentIntentRecord` rows (optionally linked to a `Booking`) as the system-of-record before/while a PSP (Stripe) is wired. **No outbound Stripe calls in this phase**—only DB rows and events; use `src/services/payments/paymentProvider.ts` as the place PSP code must live later.

Status: implemented.

Files:

- `src/services/payments/paymentProvider.ts` (conventions / shared types)
- `src/services/payments/paymentIntentService.ts`
- `src/services/featureFlags/featureFlagService.ts`
- `src/app/api/businesses/[businessId]/feature-flags/route.ts`
- `src/app/api/businesses/[businessId]/feature-flags/[featureFlagId]/route.ts`
- `src/app/api/businesses/[businessId]/payment-intents/route.ts`
- `src/app/api/businesses/[businessId]/payment-intents/[paymentIntentId]/route.ts`

Rules:

- feature flags: **read** for any business member; **write** `OWNER` / `ADMIN`
- payment intents: **list/get/patch** `OWNER` / `ADMIN` only (sensitive)
- emit `FEATURE_FLAG_*` and `PAYMENT_INTENT_*` events

Completion criteria:

- `npm run build` passes

---

### Phase 7 — Stripe adapter + webhooks

Status: implemented.

Purpose:

- **Create:** When `STRIPE_SECRET_KEY` is set and `provider` is `stripe` (default), `POST .../payment-intents` creates a Stripe `PaymentIntent`, stores `externalId`, and maps Stripe status onto `PaymentIntentRecord`. If Stripe fails, the local row is rolled back.
- **Webhooks:** `POST /api/webhooks/stripe` verifies `Stripe-Signature` with `STRIPE_WEBHOOK_SECRET`, updates matching `PaymentIntentRecord` rows, and on `payment_intent.succeeded` creates a **`Payment`** row (`SUCCEEDED`, `BOOKING`) when one does not already exist for that intent.
- **Connect / `PaymentAccount` onboarding:** not in this phase — add when product needs connected accounts.

Files:

- `src/services/payments/stripeAdapter.ts` — Stripe client, status mapping, create PaymentIntent.
- `src/services/payments/stripeWebhookService.ts` — verify + apply webhook events.
- `src/services/payments/paymentIntentService.ts` — orchestrates local row + Stripe create.
- `src/app/api/webhooks/stripe/route.ts` — global webhook (thin; no business logic).

Rules:

- No Stripe SDK imports outside `src/services/payments/*`.
- Webhook route must use **raw body** (`req.text()`) for signature verification.

Completion criteria:

- `npm run build` passes
- With env keys set, Stripe CLI can forward events to `/api/webhooks/stripe` and DB rows update.

Cursor prompt (next phase):

```text
Implement the next Livia phase per docs/LIVIA_BUILD_PLAN.md (read Part A first).

Use tenant-nested APIs only: /api/businesses/[businessId]/...
Business logic in src/services/*; thin routes; Zod; membership checks; events.
```
