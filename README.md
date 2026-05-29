# Livia

Livia is a premium AI-native **operating system for appointment-based service businesses** globally — hair, beauty, tattoo, wellness, fitness, medspa, allied health, and more. **Ireland / English-IE** is the first market we prove; **hair/barber** is the first vertical pack, not the product definition. The product is **Livia**; the AI colleague is **Liv**.

**Start here:** [`docs/LIVIA-ALIGNMENT.md`](docs/LIVIA-ALIGNMENT.md) · **Active program:** [`docs/product/SYSTEM-REALIGNMENT-PROGRAM.md`](docs/product/SYSTEM-REALIGNMENT-PROGRAM.md)

This repo is a single pnpm monorepo containing the API, web dashboard, mobile app, marketing site, a mockup sandbox, and the shared libraries that bind them together.

## Repo map

```
artifacts/
  api-server/        Node 24 + Express 5 + Drizzle + Postgres. Multi-tenant API.
  livia-dashboard/   React + Vite + Tailwind. Owner cockpit (web).
  livia-mobile/      Expo (iOS + Android). Owner app + custom Clerk sign-in.
  livia-marketing/   Astro/Vite. livia-hq.com — the brand bible.
  mockup-sandbox/    Non-shipping design preview (wordmarks/mockups only — not in prod builds).
lib/
  db/                Drizzle schema (source of truth: lib/db/src/schema/*).
  api-spec/          OpenAPI source (lib/api-spec/openapi.yaml). Codegen → api-zod + api-client-react.
  api-zod/           Generated Zod schemas (do not hand-edit).
  api-client-react/  Generated React Query hooks (do not hand-edit).
  ai-disclosure/     Centralised legal disclosure copy (EU AI Act Art. 50).
  integrations/
    anthropic-ai/    Claude wrapper for Liv (set `ANTHROPIC_API_KEY` in `.env`).
    resend/          Transactional email wrapper.
    twilio/          SMS wrapper.
docs/
  adr/               Architecture Decision Records — read these before changing anything load-bearing.
  launch-plan.md     The single source of truth for the roadmap (5 lanes, 3 gates).
  operating-cadence.md How the founder runs the build week.
  onboarding-engineer.md First doc to read when you join.
  demo-script.md     What the product should *feel* like when it works.
scripts/             Repo scripts (codegen guard, demo seed, post-merge ops).
```

## Run it locally

```bash
pnpm install
pnpm run typecheck                          # full graph — must pass before declaring done
pnpm run db:push                            # dev DB schema (loads root .env)
pnpm --filter @workspace/api-server run dev # API
# In another terminal: pnpm dev:dashboard (:5173), pnpm dev:marketing (:5174), pnpm dev:mobile (Expo).
```

Required env: copy [`.env.example`](.env.example) → `.env`, then per-artifact templates under `artifacts/*/`.env.example` (dashboard, **marketing**, **internal**, mobile).

- `CLERK_*` — auth (api / web / mobile variants).
- `DATABASE_URL` — Postgres.
- `INTERNAL_OPS_SECRET` — internal ops UI (`pnpm dev:internal`, :5175).
- `ANTHROPIC_API_KEY` — Liv chat, briefings, and public booking assistant (optional in dev; features degrade gracefully).

**Surfaces:** `pnpm dev:api` (:3000) · `pnpm dev:dashboard` (:5173) · `pnpm dev:marketing` (:5174) · `pnpm dev:internal` (:5175). Production: `app.livia-hq.com`, `api.livia-hq.com`.

Optional (transports degrade to PENDING-only writes when absent — no boot failure):

- `SENTRY_DSN_*`, `LOG_LEVEL`, `TWILIO_*`, `RESEND_*`, `PUBLIC_BASE_URL`, `INTERNAL_CRON_SECRET`, `INTERNAL_OPS_SECRET`.
- `META_ACCESS_TOKEN`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `META_DEV_SIMULATE` — WhatsApp / Instagram / Messenger (see [`docs/product/CHANNELS-EU-MESSAGING.md`](docs/product/CHANNELS-EU-MESSAGING.md)).

**Production-ready product (live users):** [`docs/product/LIVIA-PRODUCTION-READY.md`](docs/product/LIVIA-PRODUCTION-READY.md) · **Env template:** [`.env.example`](.env.example) · **Beta walkthrough:** [`docs/testing/MANUAL-WALKTHROUGH-BETA.md`](docs/testing/MANUAL-WALKTHROUGH-BETA.md) · **E2E runbook:** [`docs/testing/E2E-RUNBOOK.md`](docs/testing/E2E-RUNBOOK.md) · **Prep:** `node scripts/e2e-prep.mjs` · **Gate 3:** `pnpm smoke:gate3` · **E2E:** `pnpm test:e2e:api` / `pnpm test:e2e` · **SQL migrations:** `pnpm run db:migrate:sql`

## Where to look first

| You want to… | Open |
|---|---|
| **Who we are / what we build** | [`docs/LIVIA-ALIGNMENT.md`](docs/LIVIA-ALIGNMENT.md) |
| **System-wide realignment (active)** | [`docs/product/SYSTEM-REALIGNMENT-PROGRAM.md`](docs/product/SYSTEM-REALIGNMENT-PROGRAM.md) |
| **Paper product architecture** | [`docs/product/README.md`](docs/product/README.md) → [`LIVIA-GLOBAL-PRODUCT-SYSTEM.md`](docs/product/LIVIA-GLOBAL-PRODUCT-SYSTEM.md) |
| Understand the data model | `lib/db/src/schema/` (one file per aggregate; `businesses.ts` holds the 5 AI columns). |
| Understand the HTTP contract | `lib/api-spec/openapi.yaml`. Re-run `pnpm --filter @workspace/api-spec run codegen` after edits. |
| Understand the brand | `artifacts/livia-marketing/src/index.css` + `docs/adr/0004-marketing-site-as-brand-bible.md`. |
| Understand a load-bearing decision | `docs/adr/`. Each ADR is ~50 lines; status-sorted, immutable. |
| See what we're shipping next | `docs/launch-plan.md` — five lanes, three gates. |
| Onboard a new engineer | [`docs/START-HERE.md`](docs/START-HERE.md) → [`docs/LIVIA-ALIGNMENT.md`](docs/LIVIA-ALIGNMENT.md) → [`docs/onboarding-engineer.md`](docs/onboarding-engineer.md) |

## How to contribute

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Short version:

- One branch / commit per task. Conventional-style summary lines (`feat(dashboard): …`, `chore(brand): …`).
- **Always run `pnpm run typecheck` before declaring done.** It runs the full project-references graph and is the only "definition of done" for code shape.
- **Never edit `lib/db/src/schema/*` without a migration**, and **never edit `lib/api-spec/openapi.yaml` without re-running `pnpm codegen`** — there is a CI guard for the latter (`scripts/check-codegen.sh`).
- Architectural changes start with a new ADR in `docs/adr/`. ADRs are immutable once accepted; new decisions get new files (with `Supersedes: 0003` if they replace one).
- Brand discipline is non-negotiable — see `docs/adr/0004-marketing-site-as-brand-bible.md` and `docs/adr/0007-aurora-tokens-and-gradient-discipline.md`.
- Two project-wide naming taboos enforced in CI: never reintroduce the **legacy codename** in user-facing copy or new code (see [`docs/adr/0001-codename-bliq-renamed-to-livia.md`](docs/adr/0001-codename-bliq-renamed-to-livia.md)); never use **"Olivia"** anywhere (founder's daughter's name; CI guard fails the build).

## Who to ask

We are small enough that there is no escalation ladder — direct is correct. Ping the founder.
