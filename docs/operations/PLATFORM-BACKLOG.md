# Platform backlog — comprehensive todo (2026-05)

**Single tracker** for staging, workforce access, onboarding portal, prod readiness, deploy discipline, **composable evolution**, and **support-point investigation**.

**Same code staging → prod:** behaviour differences = **env only** ([`audits/PLATFORM-PRODUCTION-READINESS-AUDIT.md`](../audits/PLATFORM-PRODUCTION-READINESS-AUDIT.md)).

**Program (full build plan + master checklist):** [`product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](../product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md)  
**Specs:** [`engineering/COMPOSABLE-EVOLUTION.md`](../engineering/COMPOSABLE-EVOLUTION.md) · [`operations/SUPPORT-POINTS-AND-INVESTIGATION.md`](./SUPPORT-POINTS-AND-INVESTIGATION.md)

---

## P0 — Prod safety

- [x] **Beta fail-closed on prod** — unset `LIVIA_BETA_SIGNUP_MODE` → `invite` when `NODE_ENV=production`
- [x] **URL env required on prod boot** — `assertProductionEnvAtBoot()` in `index.ts` (skip: `LIVIA_SKIP_PRODUCTION_ENV_CHECK=true`)
- [x] **`LIVIA_BETA_SIGNUP_MODE=invite`** in `railway.env.example`
- [x] **API wedge gates** — `withBusinessFeature()` on medspa, class-sessions, design-proofs routes
- [ ] **Rotate Supabase DB password** — ops if exposed in terminal logs

---

## P1 — Platform access (workforce)

### Code done (deploy + ops)

- [x] `@workspace/policy` workforce types (Livia auto, Goldspire cockpit-only)
- [x] Cockpit **Goldspire workforce access** UI + API
- [x] Migration `026-workforce-access-grants.sql`
- [x] Beta signup + cockpit grant cache
- [x] `GET /me/workforce-access`
- [x] Internal `/join` checklist
- [x] Demo `@demo.livia-hq.com` (+ legacy `@livia.io`)
- [x] **`resolvePlatformPrincipal`** + `platformPrincipal` on `GET /me`
- [x] **`GET /me/platform-config`** — deploy env, URLs, beta mode, demo flag
- [x] Dashboard exec handoff → **`/api/me`** (not client allowlist)
- [x] Mobile exec routing → **`/api/me/operator-surface`**

### Ops still required

- [ ] Run migration on **staging + prod** DBs
- [ ] Railway prod/staging workforce env vars
- [ ] Clerk company accounts `@livia-hq.com`
- [ ] Grant Goldspire inboxes in cockpit
- [ ] **`requireCapability()` middleware** — tier gates on internal/exec routes (code next)
- [ ] Internal ops role from server (not self-typed header only)
- [ ] `join.livia-hq.com` front door (later)

---

## P1 — Staging stack

Follow [`STAGING-MANUAL-CHECKLIST.md`](./STAGING-MANUAL-CHECKLIST.md).

- [ ] **A** DB migrated
- [ ] **B** Railway staging API + `api.staging.livia-hq.com`
- [ ] **C** Clerk staging keys in Vercel
- [ ] **D** Vercel staging rewrites → staging API (not prod)
- [ ] **E** Marketing staging (optional)
- [ ] **F** DNS
- [ ] **G** `pnpm smoke:staging` green — CI job added (non-blocking on `main`)
- [ ] **H** Mobile staging EAS profile
- [ ] **I** Prod `API_STAGING_URL` for cockpit

Set on Railway staging API: `LIVIA_DEPLOY_ENV=staging`

---

## P1 — Onboarding portal

- [ ] Staging test — [`ONBOARDING-PORTAL-TEST.md`](./ONBOARDING-PORTAL-TEST.md)
- [ ] Prod flag only after staging sign-off
- [ ] Playwright E2E preview (deferred)
- [ ] Policy 3-act trim (deferred)

---

## P1 — Deploy discipline

- [ ] GitHub Environment prod gate (manual promote)
- [x] CI **`staging-smoke`** job on `main` (continue-on-error)
- [x] Founder release runbook updated
- [x] Platform audit doc + agent checklist

---

## P1 — Presentation presets (staging only)

**Spec:** [`design/PRESENTATION-PRESETS-AND-ROLLOUT.md`](../design/PRESENTATION-PRESETS-AND-ROLLOUT.md) · **Architecture:** [`design/EXPERIENCE-ARCHITECTURE.md`](../design/EXPERIENCE-ARCHITECTURE.md) · **Master checklist:** [`product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](../product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md) §8.5 · **Catalog:** `lib/policy/src/presentation-presets.ts`

**Phase D0 ✅**

- [x] D0.1 Policy catalog (9 verticals × 4 presets incl. Platform Default / Aurora)
- [x] D0.2 `presentationPresetsEnabled()` staging gate
- [x] D0.3 Experience architecture docs (Track E)
- [x] D0.4 `presentation-presets.test.ts`

**Phase D1 — Policy & tenant experience**

- [ ] D1.1–D1.5 TenantExperienceSkin + resolver + tests + contract doc

**Phase D2 — Database & API**

- [ ] D2.1–D2.7 migration, schema, PATCH/GET, audit, ENV docs

**Phase D3 — Dashboard**

- [ ] D3.1–D3.9 theme apply, `useSurfaceClass`, CSS bundles, surface-adaptive, appearance panel, a11y

**Phase D4 — Mobile + tablet**

- [ ] D4.1–D4.7 mobile theme, surface hook, tablet splits, parity doc

**Phase D5 — Public `/b`**

- [ ] D5.1–D5.4 public API skin + body-art consult flow

**Phase D6 — Vertical ritual homes**

- [ ] D6.1–D6.8 `vertical-ritual-homes.ts`; body-art P0; remaining verticals

**Phase D7 — Staging QA**

- [ ] D7.1–D7.8 36 presets × 3 surfaces matrix; E2E; channel vocabulary

**Phase D8 — Prod gate**

- [ ] D8.1–D8.5 sign-off + FOUNDER-SHIP-LANE if promoting to prod

Env (staging): `LIVIA_PRESENTATION_PRESETS=true` or `LIVIA_ENV=staging`.

---

## P1 — Composable evolution (hub-and-spoke)

**Spec:** [`engineering/COMPOSABLE-EVOLUTION.md`](../engineering/COMPOSABLE-EVOLUTION.md) · **Program Track A:** [`PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](../product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md) §4

- [x] Canonical doc — three rings, change playbooks, domain map template
- [ ] **A1** Audit + remove duplicate vertical/onboarding lists in dashboard/mobile
- [ ] **A1** All pickers → `GET /api/onboarding/catalog` only
- [ ] **A2** Domain dependency map filled for P0 domains (onboarding, tenant experience, inbox, bookings, support, billing)
- [ ] **A2** `onboarding-engineer.md` + `AGENTS.md` link to COMPOSABLE-EVOLUTION
- [ ] **A3** PR template: hub change → playbook + domain map + tests
- [ ] **A3** Zod jurisdiction enum from policy (ties to P2 below)

**Exit:** No app-local onboarding gate logic; hub changes follow written playbook in review.

---

## P1 — Support points and investigation

**Spec:** [`SUPPORT-POINTS-AND-INVESTIGATION.md`](./SUPPORT-POINTS-AND-INVESTIGATION.md) · **Program Tracks B–C:** [`PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](../product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md) §5–6

### Registry and policy

- [x] Canonical doc — baseline (requestId, tickets, triage), surfaceId catalog, wire-up contract
- [ ] **B1** `lib/policy/src/support-points.ts` — P0 `surfaceId` entries with paths, tests, runbooks
- [ ] **B1** `getSupportPoint` / `listSupportPoints` + `support-points.test.ts`

### Dashboard

- [ ] **B2** `support-surface-map.ts` (route → surfaceId, second-shop override)
- [ ] **B2** `use-support-context.ts`
- [ ] **B2** `HelpSupportDialog` — required `surfaceId`; all call sites (layout, inbox, booking-detail, liv-incidents)
- [ ] **B2** Sentry `surface` tag on route change

### API and triage

- [ ] **B3** `support-ticket-triage.service.ts` — triage from `context.surfaceId` + registry `suggestedReply`
- [ ] **B3** Internal queue filter by `surfaceId` / `surface:*` tag

### Mobile

- [ ] **B4** Mobile Help → support tickets with `surfaceId`
- [ ] **B4** Mobile Sentry `surface` tag
- [ ] **B4** `WEB-MOBILE-PARITY.md` support-context row

### Internal portal (Track C)

- [ ] **C1** `GET /internal/ops/support-points`
- [ ] **C1** Ticket detail — registry enrichment (“Likely code paths”)
- [ ] **C1** Investigate panel — paste `requestId`, log/Sentry hints
- [ ] **C1** `SUPPORT-RUNBOOK.md` — surfaceId triage steps

**Exit:** ≥90% Help submits include `surfaceId`; operator drill <10 min to first file.

---

## P2 — Anti-patchwork (remaining)

- [ ] Onboarding catalog dedupe → `/api/onboarding/catalog` only
- [ ] Zod jurisdiction enum from policy (FR, tiers)
- [ ] Domain cleanup — mobile `demo-guide.tsx`, premises UI, Clerk demo reprovision
- [x] Marketing lead default source → `livia-hq.com`
- [x] `platform-exec.ts` deprecated on clients (API is source of truth)
- [ ] Feature flags: wire tenants or remove unused path
- [ ] OpenAPI: add `/me/platform-config`, `/me/workforce-access`; run `pnpm codegen`
- [ ] Mobile `LIVIA_DEPLOY_ENV` via EAS
- [ ] `SUPPORT_INBOX_EMAIL` env everywhere

---

## P2 — Ops

- [ ] Prod secrets inventory signed
- [ ] Internal portal deploy `ops.livia-hq.com`
- [x] Beta docs sync — [`BETA-ONBOARDING-FLOW.md`](../product/BETA-ONBOARDING-FLOW.md)

---

## P3 — Later

- Workforce SSO / SCIM
- Separate Clerk staging app
- Canary rollout
- Full visual E2E
- Inngest tenant_id on every step

---

## Env quick reference

| Variable | Prod | Staging |
|----------|------|---------|
| `LIVIA_DEPLOY_ENV` | `production` | `staging` |
| `LIVIA_BETA_SIGNUP_MODE` | `invite` | `open` |
| `LIVIA_DEMO_ENABLED` | unset/false | `true` |
| URL triplets | `*.livia-hq.com` | `*.staging.livia-hq.com` |

Templates: `railway.env.example`, `railway.env.staging.example`

---

## Canonical docs

1. [`LIVIA-ALIGNMENT.md`](../LIVIA-ALIGNMENT.md)
2. [`product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](../product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md)
3. [`engineering/COMPOSABLE-EVOLUTION.md`](../engineering/COMPOSABLE-EVOLUTION.md)
4. [`SUPPORT-POINTS-AND-INVESTIGATION.md`](./SUPPORT-POINTS-AND-INVESTIGATION.md)
5. [`audits/PLATFORM-PRODUCTION-READINESS-AUDIT.md`](../audits/PLATFORM-PRODUCTION-READINESS-AUDIT.md)
6. [`WORKFORCE-ONBOARDING.md`](./WORKFORCE-ONBOARDING.md)
7. [`ENV-VARIABLES.md`](./ENV-VARIABLES.md)
