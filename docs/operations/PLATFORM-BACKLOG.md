# Platform backlog — comprehensive todo (2026-05)

**Single tracker** for staging, workforce access, onboarding portal, prod readiness, and deploy discipline.

**Same code staging → prod:** behaviour differences = **env only** ([`audits/PLATFORM-PRODUCTION-READINESS-AUDIT.md`](../audits/PLATFORM-PRODUCTION-READINESS-AUDIT.md)).

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
2. [`audits/PLATFORM-PRODUCTION-READINESS-AUDIT.md`](../audits/PLATFORM-PRODUCTION-READINESS-AUDIT.md)
3. [`WORKFORCE-ONBOARDING.md`](./WORKFORCE-ONBOARDING.md)
4. [`ENV-VARIABLES.md`](./ENV-VARIABLES.md)
