# Livia

Mobile-first, multi-tenant **operating system for appointment-based service businesses** — APIs and services today; native shell later.

## Docs for contributors

0. **[docs/REPO_LAYOUT.md](docs/REPO_LAYOUT.md)** — one-page map of folders and layers; **[docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md)** — canonical `src/services/*` ↔ API layout.
1. **[docs/LIVIA_BUILD_PLAN.md](docs/LIVIA_BUILD_PLAN.md)** — product principles, architecture rules, HTTP surface, phased roadmap (read first).
2. **[docs/ROADMAP.md](docs/ROADMAP.md)** — how Livia phases relate to the broader master spec.
3. **[docs/MASTER_SPINE.md](docs/MASTER_SPINE.md)** — short master-spec spine + links to appendices (screens, AI, schema target, events).
4. **[docs/CURSOR_RULES.md](docs/CURSOR_RULES.md)** — day-to-day editing rules.
5. **[docs/REPO_DELTA.md](docs/REPO_DELTA.md)** — spec vs current implementation checklist.
6. **[docs/elite/README.md](docs/elite/README.md)** — imported standards (API contract, security, event catalog targets, UX, release plan, testing strategy).

## Stack

Next.js (App Router), TypeScript, Tailwind, Prisma, PostgreSQL (Supabase). Tenant APIs live under `/api/businesses/[businessId]/...`.

## Local setup

1. **Node 20+** and npm.
2. Copy env: `cp .env.example .env` and set `DATABASE_URL` (and `DIRECT_URL` for migrations — see comments in [prisma/schema.prisma](prisma/schema.prisma) and [prisma.config.ts](prisma.config.ts)).
3. Install: `npm ci` (or `npm install`).
4. Prisma client: `npm run prisma:generate`.
5. Apply schema: `npm run prisma:migrate` (or `npx prisma db push` per team practice).
6. **Optional demo data:** `npm run db:seed` (idempotent demo user + business; requires DB).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create/apply migrations (dev) |
| `npm run db:seed` | Seed demo tenant (see [prisma/seed.ts](prisma/seed.ts)) |

`prisma db seed` uses `package.json` → `prisma.seed`; Prisma 6 may warn that this moves fully into `prisma.config.ts` in Prisma 7 — safe to ignore until upgrade.

## Auth

Livia uses **Clerk**. Owner and tenant routes are protected via middleware; API routes resolve the caller from the **Clerk session** (no `?userId=` / `actorUserId` fallbacks).

## Health check

`GET /api/health` — no tenant context.

## Cursor / MCP

- Commit **`.cursor/rules/*.mdc`** for shared agent rules.
- Copy **`.cursor/mcp.json.example`** to **`.cursor/mcp.json`** locally; real `mcp.json` is gitignored if present.

## Stripe (Phase 7)

When `STRIPE_SECRET_KEY` is set, `POST /api/businesses/[businessId]/payment-intents` also creates a Stripe PaymentIntent and stores `externalId`. Set `STRIPE_WEBHOOK_SECRET` and point Stripe to **`POST /api/webhooks/stripe`** (global URL). See [docs/PAYMENTS_STRIPE.md](docs/PAYMENTS_STRIPE.md).

## Deploy

Vercel-compatible; set production `DATABASE_URL` (and optional `DIRECT_URL`, Stripe keys when used). Run `npm run build` in CI before merge (see `.github/workflows/ci.yml`).
