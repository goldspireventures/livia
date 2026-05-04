# Bliq — where we are now (snapshot)

_Generated for product/engineering alignment; update as releases ship._

## Business / product

**What Bliq is:** A **mobile-first, multi-tenant operating system** for appointment-based service businesses — generic **Business → Staff → Service → Customer → Booking** model (not a single-vertical app).

**What customers get (today):** **Public booking path** — business overview and slot list by slug under **`/api/public/businesses/[slug]`**, and a minimal **mobile-friendly book UI** at **`/book/[slug]`** (pick service, date, slot, name + email). Slots respect availability rules, time off, and existing bookings.

**What businesses get (today):** **Tenant-scoped operations** via HTTP: businesses and memberships, staff and service catalog (with who-can-perform-what), customers and channel identities, **bookings with staff overlap protection**, availability rules and time off, feature flags, **payment intent records + Stripe PaymentIntent when keys are set**, and **Payment rows on successful webhook**. **`/dashboard`** lists **upcoming bookings** across businesses the user belongs to (Clerk session, or dev **`?userId=`** when Clerk keys are unset).

**Strategic gaps vs long-term vision:** **Notifications**, **messaging channels (WhatsApp, etc.)**, **full owner shell** (lists/detail/settings beyond upcoming bookings), **storefront**, **Capacitor apps**, **rate limits on public book**, and **AI/ops tables** are planned in [TRANCHES.md](./TRANCHES.md) / master appendices.

## Infra / tech

| Area | State |
|------|--------|
| **Stack** | Next.js App Router, TypeScript, Tailwind, Prisma, PostgreSQL (Supabase-friendly URLs). |
| **Tenancy** | All tenant data under `/api/businesses/[businessId]/...`; `membershipService` on routes. |
| **Architecture** | Business logic in `src/services/*`; thin routes; Zod; `logEvent` for mutations. |
| **DB** | Prisma schema with core domain + payments + events; migrations in `prisma/migrations/`. |
| **Payments** | **Phase 7:** Stripe create + **`POST /api/webhooks/stripe`** + `Payment` on success. PSP code only under `src/services/payments/*`. |
| **CI** | GitHub Actions: install, `prisma generate`, lint, typecheck, build (dummy `DATABASE_URL`). |
| **Docs** | `BLIQ_BUILD_PLAN` (source of truth), `ROADMAP`, `MASTER_SPINE` + appendices, **`docs/elite/`** (imported standards pack), `REPO_DELTA`, `FOLDER_STRUCTURE`. |
| **Auth** | **Clerk** when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set (`src/proxy.ts` protects tenant APIs + dashboard; public book + public API + webhooks stay open). **Dev fallback:** `?userId=` on reads and `actorUserId` / `ownerUserId` on writes when Clerk is not configured. |

**Production checklist (short):** Configure real `DATABASE_URL` / `DIRECT_URL`, set Clerk keys, add **rate limits** on **`/api/public/*`**, configure Stripe webhook URL in Dashboard, secrets only in env / host manager.
