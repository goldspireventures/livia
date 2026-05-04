# Bliq repository layout (onboarding map)

One-page map of **where things live** and **how layers interact**. Canonical service ↔ API paths are also in [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md).

## Root (ship + configure)

| Item | Purpose |
|------|---------|
| `package.json` / `package-lock.json` | Dependencies and npm scripts |
| `next.config.ts` | Next.js / Turbopack config |
| `postcss.config.mjs` | Tailwind PostCSS pipeline |
| `eslint.config.mjs` / `tsconfig.json` | Lint and TypeScript |
| `prisma.config.ts` | Prisma CLI / datasource wiring |
| `.env.example` | Documented env vars (copy to local `.env`, gitignored) |
| `AGENTS.md`, `CLAUDE.md` | Agent / editor entry points |
| `.cursor/rules/` | Shared Cursor rules (commit) |
| `.github/` | CI workflows |
| `README.md` | Contributor quick start |

**Not part of your mental model:** `node_modules/` (regenerate with `npm install`) and `.next/` (regenerate with `next dev` / `next build`). Omit them from backups or moves when you only need source.

## `docs/` (why and how we agree)

| Kind | Examples |
|------|-----------|
| Product + roadmap | `BLIQ_BUILD_PLAN.md`, `ROADMAP.md`, `MASTER_SPINE.md`, `TRANCHES.md` |
| Day-to-day editing | `CURSOR_RULES.md`, this file |
| Standards pack | `elite/*` |
| Deep dives | `MASTER_APPENDIX_*`, `PAYMENTS_STRIPE.md`, `REPO_DELTA.md` |

**Rule of thumb:** one **canonical** doc per topic; others link to it at the top instead of duplicating.

## `prisma/` (persistence contract)

| Item | Role |
|------|------|
| `schema.prisma` | Data model (source of truth for DB shape) |
| `migrations/` | Ordered migration history (append only) |
| `seed.ts` | Optional demo/fixture data |

## `src/` (application)

### Layering

1. **`src/app/api/**`** — HTTP handlers: `NextRequest`, `await params`, Zod, membership checks, call **services**, return JSON. **No business rules.**
2. **`src/services/<domain>/`** — Tenant-scoped domain logic, Prisma usage, orchestration. **Centre of gravity.**
3. **`src/lib/**`** — Shared plumbing: Prisma client, env, HTTP helpers, events, errors, small pure helpers. **No feature-sized workflows.**

### Domain folders (`src/services/`)

| Path | Area |
|------|------|
| `business/` | Business + membership |
| `staff/` | Staff |
| `catalog/` | Service catalog + staff–service assignments |
| `customer/` | Customers + channel identities |
| `booking/` | Bookings (+ public booking helpers where scoped) |
| `availability/` | Availability rules, slots, time off |
| `payments/` | PSP adapters, intents, webhooks (no Stripe in routes) |
| `featureFlags/` | Feature flags |
| `auth/` | Clerk / user identity glue |
| `health.ts` | Health check service |

### HTTP surface (`src/app/api/`)

- **Tenant APIs:** `api/businesses/[businessId]/...` for all tenant-scoped resources.
- **Public (slug):** `api/public/businesses/[slug]/...` where intentionally unauthenticated.
- **Global:** e.g. `api/health`, `api/webhooks/stripe`.

### UI (`src/app/**` pages, `src/components/**`)

- Pages: routing, composition, server/client boundaries.
- Components: UI and local interaction; call APIs or server actions; **do not** duplicate service rules.

### Cross-cutting

- `src/proxy.ts` — auth/session/routing concerns only (Next.js 16 proxy; `clerkMiddleware` from `@clerk/nextjs/server`).
- `src/styles/globals.css` — global CSS and Tailwind entry.

## Adding a feature (repeatable order)

1. Schema change in `prisma/` if needed → migrate.
2. Logic in `src/services/<domain>/`.
3. Thin route in `src/app/api/businesses/[businessId]/...`.
4. UI under `src/app/...` and `src/components/...` if needed.

This keeps tenancy, validation, and events consistent and avoids logic in routes or random `lib/` files.
