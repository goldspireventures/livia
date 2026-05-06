# Livia

Livia is a premium AI-native operating system for appointment-based service businesses — barbershops, tattoo studios, dental practices, nail salons. Beachhead market: EU, starting Dublin. The product is **Livia**; the AI character that does the work under the hood is called **Liv** (Livia is never marketed as "AI software" — Liv shows up only where she has to legally and where she actually helps the customer).

This repo is a single pnpm monorepo containing the API, web dashboard, mobile app, marketing site, a mockup sandbox, and the shared libraries that bind them together.

## Repo map

```
artifacts/
  api-server/        Node 24 + Express 5 + Drizzle + Postgres. Multi-tenant API.
  livia-dashboard/   React + Vite + Tailwind. Owner cockpit (web).
  livia-mobile/      Expo (iOS + Android). Owner app + custom Clerk sign-in.
  livia-marketing/   Astro/Vite. livia.io — the brand bible.
  mockup-sandbox/    Vite preview server for canvas-based UI mockups.
lib/
  db/                Drizzle schema (source of truth: lib/db/src/schema/*).
  api-spec/          OpenAPI source (lib/api-spec/openapi.yaml). Codegen → api-zod + api-client-react.
  api-zod/           Generated Zod schemas (do not hand-edit).
  api-client-react/  Generated React Query hooks (do not hand-edit).
  ai-disclosure/     Centralised legal disclosure copy (EU AI Act Art. 50).
  integrations/
    anthropic-ai/    Claude wrapper (via Replit AI Integrations — no API key required).
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
pnpm --filter @workspace/db run push        # dev DB schema (uses DATABASE_URL)
pnpm --filter @workspace/api-server run dev # API
# Web + Mobile + marketing artifacts auto-start via the Replit workflow runner.
```

Required env vars (full list with defaults: `docs/onboarding-engineer.md`):

- `CLERK_*` — auth (api / web / mobile variants).
- `DATABASE_URL` — Postgres.
- `AI_INTEGRATIONS_ANTHROPIC_*` — Claude via Replit AI Integrations (no `ANTHROPIC_API_KEY`).

Optional (transports degrade to PENDING-only writes when absent — no boot failure):

- `SENTRY_DSN_*`, `LOG_LEVEL`, `TWILIO_*`, `RESEND_*`, `PUBLIC_BASE_URL`, `INTERNAL_CRON_SECRET`.

## Where to look first

| You want to… | Open |
|---|---|
| Understand the data model | `lib/db/src/schema/` (one file per aggregate; `businesses.ts` holds the 5 AI columns). |
| Understand the HTTP contract | `lib/api-spec/openapi.yaml`. Re-run `pnpm --filter @workspace/api-spec run codegen` after edits. |
| Understand the brand | `artifacts/livia-marketing/src/index.css` + `docs/adr/0004-marketing-site-as-brand-bible.md`. |
| Understand a load-bearing decision | `docs/adr/`. Each ADR is ~50 lines; status-sorted, immutable. |
| See what we're shipping next | `docs/launch-plan.md` — five lanes, three gates. |
| Onboard a new engineer | `docs/onboarding-engineer.md` (Day 1 / Week 1 / Month 1 checklist at the bottom). |

## How to contribute

- One branch / commit per task. Conventional-style summary lines (`feat(dashboard): …`, `chore(brand): …`).
- **Always run `pnpm run typecheck` before declaring done.** It runs the full project-references graph and is the only "definition of done" for code shape.
- **Never edit `lib/db/src/schema/*` without a migration**, and **never edit `lib/api-spec/openapi.yaml` without re-running `pnpm codegen`** — there is a CI guard for the latter (`scripts/check-codegen.sh`).
- Architectural changes start with a new ADR in `docs/adr/`. ADRs are immutable once accepted; new decisions get new files (with `Supersedes: 0003` if they replace one).
- Brand discipline is non-negotiable — see `docs/adr/0004-marketing-site-as-brand-bible.md` and `docs/adr/0007-aurora-tokens-and-gradient-discipline.md`.
- Two project-wide naming taboos enforced in CI: never reintroduce **"Bliq"** in user-facing copy or new code (the rename happened in Task #38 — see `docs/adr/0001-codename-bliq-renamed-to-livia.md`); never use **"Olivia"** anywhere (founder's daughter's name; CI guard fails the build).

## Who to ask

We are small enough that there is no escalation ladder — direct is correct. Ping the founder.
