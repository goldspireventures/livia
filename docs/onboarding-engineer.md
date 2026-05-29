# Onboarding — first engineer / designer

Welcome. This is the only doc you have to read before your first PR. Everything else is linked from here.

## What Livia is

Livia is a premium AI-native **operating system for appointment-based service businesses** globally (hair, beauty, tattoo, wellness, fitness, medspa, allied health, and more). **Ireland / EN-IE** is the first market we prove; **hair/barber** is the first vertical pack, not the product definition. The product is **Livia**; the AI colleague is **Liv**.

**Read first:** [`docs/LIVIA-ALIGNMENT.md`](./LIVIA-ALIGNMENT.md) · **Active build:** [`docs/product/OPERATION-SOLIDIFY.md`](./product/OPERATION-SOLIDIFY.md) · **Platform evolution + ops:** [`docs/product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](./product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md)

## What's shipped

- Multi-tenant API (Node 24 + Express 5 + Postgres + Drizzle), with Clerk auth and conflict-safe booking creation under advisory locks.
- Web dashboard (React + Vite) — the **Cockpit** layout, with a live timeline spine, action queue, and staff-on-shift card.
- Mobile app (Expo, iOS + Android) — premium polish: Aurora ambient backdrop, gradient CTAs, haptics, custom Clerk sign-in.
- Public booking page at `/b/:slug` with chat widget powered by Liv (Anthropic Claude tool-loop, `find_slots` + `create_booking`).
- AI Inbox — owners watch Liv's conversations live, can take over, and configure tone / greeting / knowledge / auto-book in Settings → AI Assistant.
- Brand re-alignment complete (Task #40, May 2026): dashboard is rebased onto the marketing site (`livia.io`), which is the brand bible — see ADR 0004.

## Where to start reading (in this order)

1. [`docs/LIVIA-ALIGNMENT.md`](./LIVIA-ALIGNMENT.md) — company, product, Liv, production-grade bar.
2. [`README.md`](../README.md) — repo map, run-it-locally, where to look first.
3. [`docs/LOCAL_DEV.md`](./LOCAL_DEV.md) — run API, dashboard, marketing, mobile on your machine.
4. [`docs/launch-plan.md`](./launch-plan.md) — what we're shipping and why. Five lanes, three gates.
5. [`docs/operating-cadence.md`](./operating-cadence.md) — how we run the week.
6. [`docs/demo-script.md`](./demo-script.md) — what the product *should feel like* when it works.
7. [`docs/adr/`](./adr/) — architecture decision records. Read these before suggesting changes to anything load-bearing:
   - [0001 — Codename Bliq renamed to Livia](./adr/0001-codename-bliq-renamed-to-livia.md)
   - [0002 — Multi-tenant via `businessId` scoping](./adr/0002-multi-tenant-via-business-id-scoping.md)
   - [0003 — Clerk for authentication](./adr/0003-clerk-for-auth.md)
   - [0004 — Marketing site as brand bible](./adr/0004-marketing-site-as-brand-bible.md)
   - [0005 — OpenAPI as contract source](./adr/0005-openapi-as-contract-source.md)
   - [0006 — Monorepo via pnpm workspaces](./adr/0006-monorepo-via-pnpm-workspaces.md)
   - [0007 — Aurora tokens and gradient discipline](./adr/0007-aurora-tokens-and-gradient-discipline.md)
7. `lib/db/src/schema/` — single source of truth for the data model. Conversations live in `conversations.ts`; the 5 AI columns on `businesses` are the contract for Liv's behaviour.
8. `lib/api-spec/openapi.yaml` — single source of truth for HTTP. `pnpm --filter @workspace/api-spec run codegen` regenerates hooks + Zod schemas. CI guard: `scripts/check-codegen.sh` (lane Engineering E4).

## How to run the repo

```bash
pnpm install
pnpm run typecheck                                   # full graph
pnpm --filter @workspace/db run push                 # dev DB schema
pnpm --filter @workspace/api-server run dev          # API
# Other terminals: pnpm dev:dashboard, pnpm dev:marketing, pnpm dev:mobile:device
```

Required env: `CLERK_*`, `DATABASE_URL`, `ANTHROPIC_API_KEY` (optional in dev — Liv chat degrades gracefully).

Optional (transports degrade to PENDING-only writes when absent — no boot failure): `SENTRY_DSN_*`, `LOG_LEVEL`, `TWILIO_*`, `RESEND_*`, `PUBLIC_BASE_URL`, `INTERNAL_CRON_SECRET`.

## Brand rules — non-negotiable

See [ADR 0007](./adr/0007-aurora-tokens-and-gradient-discipline.md) for the full statement. The short version:

- **Aurora** = product surface. Cyan `#06b6d4` is the only primary action colour. Violet for AI moments, mint for success. The aurora gradient is an **accent**, not a headline treatment.
- **Aurum** = wordmark only — champagne / cream / bronze chrome. **Never** Aurum on action buttons. The single sanctioned exception is `.celebrate-shimmer` (one-shot champagne sweep on booking confirmation).
- **Wordmark** = Cormorant Garamond, italic *v*. Always rendered via `LiviaWordmark` / `LiviaMark`.
- **Voice** = precise, calm, slightly poetic. Empty states whisper. AI suggestions invite, never pressure.
- Tagline: *For barbershops, tattoo studios, dental practices — and every appointment in between.*

## AI guardrails

- Liv is the AI character. The product is Livia. Never collapse the two in customer-facing copy.
- Brand layer is silent on "AI" — no "AI-powered" badges in marketing.
- Disclosure shows up where it legally must: chat widget first message (EU AI Act Art. 50), Privacy + ToS (GDPR Art. 22), Anthropic AUP footer on the public booking page.
- Liv's behaviour is configured per-business via the 5 AI columns on `businesses` — no global hardcoded persona.

## Product rules and troubleshooting (read before hub or support changes)

| Topic | Doc |
|-------|-----|
| Tenant bundle (copy, skin, onboarding gates) | [`product/TENANT-EXPERIENCE-CONTRACT.md`](./product/TENANT-EXPERIENCE-CONTRACT.md) |
| Changing onboarding / presets / vertical copy | [`engineering/COMPOSABLE-EVOLUTION.md`](./engineering/COMPOSABLE-EVOLUTION.md) — follow the change playbooks (§5) |
| Experience architecture (presets, surface, channels) | [`design/EXPERIENCE-ARCHITECTURE.md`](./design/EXPERIENCE-ARCHITECTURE.md) · rollout [`design/PRESENTATION-PRESETS-AND-ROLLOUT.md`](./design/PRESENTATION-PRESETS-AND-ROLLOUT.md) |
| Support tickets, `requestId`, `surfaceId` | [`operations/SUPPORT-POINTS-AND-INVESTIGATION.md`](./operations/SUPPORT-POINTS-AND-INVESTIGATION.md) |
| Master todo for evolution + investigation | [`product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](./product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md) · [`operations/PLATFORM-BACKLOG.md`](./operations/PLATFORM-BACKLOG.md) |

**Observability today:** `x-request-id` on every API call (logs + Sentry + error JSON). Dashboard Help → `POST .../support/tickets` with route and entity ids in `context`. Internal portal: `pnpm dev:internal` → Support queue ([`operations/INTERNAL-SUPPORT-LIFECYCLE.md`](./operations/INTERNAL-SUPPORT-LIFECYCLE.md)).

## EU compliance posture

- We assume EU AI Act + GDPR apply from day one. We are a deployer of an AI system; disclosures are mandatory; data-export and data-delete must work end-to-end before Gate 3.
- We are an Anthropic processor — their AUP applies downstream.
- Compliance lane in `docs/launch-plan.md` (C1–C12) is the working list. Don't ship a feature that adds a new disclosure surface without ticking the matching C-item.

## Things to never do

- **Never reintroduce the legacy codename in user-facing copy or new code.** See [ADR 0001](./adr/0001-codename-bliq-renamed-to-livia.md). Product code is clean; CI fails on reintroduction.
- **Never use the name "Olivia" anywhere** — in code, comments, copy, file names, UI strings, or commit messages. CI guard fails the build (lane Compliance C12).
- **Never use Aurum for an action button.** See [ADR 0007](./adr/0007-aurora-tokens-and-gradient-discipline.md).
- **Never edit `lib/db/src/schema/*` without a migration**, and never edit `lib/api-spec/openapi.yaml` without re-running `pnpm codegen` (CI guard: `scripts/check-codegen.sh`).
- **Never deploy on a Friday after 16:00 IST** unless it's a P0 hotfix. See [`docs/operating-cadence.md`](./operating-cadence.md).

## Day 1 / Week 1 / Month 1

**Day 1 — productive by EOD.**

- [ ] Read `README.md` end-to-end.
- [ ] Read this file end-to-end.
- [ ] Run `pnpm install` + `pnpm run typecheck` — confirm green.
- [ ] Bring up the API + dashboard locally; sign in via Clerk; create a test booking against a seeded shop (`pnpm --filter scripts run seed:demo`).
- [ ] Read ADRs 0001, 0002, 0007 — the three you'll feel within your first week.
- [ ] Skim `docs/demo-script.md` to understand what "good" looks like.
- [ ] Pick one PROPOSED tracker task that touches the surface you're least familiar with. Don't start it yet.

**Week 1 — first PR landed.**

- [ ] Read the remaining ADRs (0003, 0004, 0005, 0006).
- [ ] Read `lib/db/src/schema/businesses.ts` and `lib/db/src/schema/conversations.ts` — the two most important schemas.
- [ ] Read `lib/api-spec/openapi.yaml` — at least the AI Inbox + bookings sections.
- [ ] Open a branch for that tracker task. First PR is small (< 200 LOC). Ship it.
- [ ] Sit in on one design-partner call (see `docs/operating-cadence.md`).

**Month 1 — owning a lane.**

- [ ] Take ownership of one of the five lanes in `docs/launch-plan.md`. The founder remains the gate-keeper but you drive the next 2-3 items in the lane.
- [ ] Have written at least one ADR — for a decision you made that future-you (or a future hire) would appreciate not having to re-litigate.
- [ ] Have shipped to TestFlight or Play Store internal testing at least once.
- [ ] Have read and understood the EU AI Act Art. 50 disclosure surfaces (Compliance C1, C2) — they are non-obvious and load-bearing for our launch posture.

## When you're stuck

Ping the founder. We're small enough that there's no escalation ladder — direct is correct.
