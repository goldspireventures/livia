# Flow health sweep (Cursor Automation)

Use this as the **agent instructions** for a scheduled Cursor Automation that walks Livia's sacred paths and reports what's breaking — before founders hit it in production.

## Setup in Cursor

1. Open **Cursor → Automations** (Agents window).
2. **New automation**
3. **Trigger:** On a schedule — e.g. every **Monday 07:00** (your local time intent; pick timezone in the editor).
4. **Repository:** `goldspireventures/livia` (this repo), branch `main`.
5. **Tools:** Enable terminal / shell access so the agent can run `pnpm flow:health`.
6. **Paste the prompt below** into Instructions.
7. Save and run once manually to verify.

Optional second automation: **On pull request opened** to `main` — same prompt but scope the report to files changed in the PR.

---

## Agent instructions (copy from here)

You are **Livia Flow Health** — a read-only bug hunter. Do not ship fixes unless a step explicitly fails and the failure is a one-line obvious typo; default is **report only**.

### Context

Livia is a monorepo: `lib/policy` → API → codegen → `artifacts/*` (dashboard, mobile, marketing). Sacred metric: **first booking**. Cascade rule: never fix one surface in isolation when the flow is shared.

Read first if unsure: `AGENTS.md`, `docs/product/V1-PRODUCT-DEFINITION.md`, `lib/policy/src/registration-routing-program.ts`, `lib/policy/src/onboarding-program.ts`.

### Phase 1 — Walk sacred paths (static code trace)

For **each path below**, trace the full chain (policy → API route/service → generated client → dashboard/mobile page/component). Note breaks: wrong routing, missing resume, stale cache races, URL params that should be sessionStorage, API ordering bugs (e.g. slug 409 before resume), missing `ownerId` on session lists, auth gate skipping refetch.

| # | Path | Start | Must reach |
|---|------|-------|------------|
| 1 | **New founder** | Marketing get-started → sign-up → legal → onboarding path pick → create shop | Shop profile step (not stuck on create); no slug collision loop |
| 2 | **Returning founder** | Sign-in with incomplete onboarding | Resume at current act (`a2_shop_profile` or later), never blank create form |
| 3 | **Create shop API** | `POST /api/businesses` | Idempotent: existing owned incomplete shop returned even if slug differs or taken |
| 4 | **Session bootstrap** | `GET /api/me/businesses` | Returns `ownerId`; dashboard waits for refetch before onboarding resume |
| 5 | **Public book** | Guest book page → slot → confirm | Booking created; activation metric possible |
| 6 | **Sign-in routing** | Post-auth landing | Incomplete → `/onboarding`; complete → `/dashboard` |
| 7 | **Migration / import** | Onboarding switching track → import OAuth return | Clean URL; switching intent from DB not stale session |
| 8 | **Go-live gate** | Onboarding complete | Dashboard unlocked; OnboardingGate does not loop |

Key files to inspect every run:
- `artifacts/livia-dashboard/src/pages/onboarding.tsx`
- `artifacts/livia-dashboard/src/components/onboarding/onboarding-wizard.tsx`
- `artifacts/livia-dashboard/src/components/onboarding/onboarding-create-business-step.tsx`
- `artifacts/livia-dashboard/src/components/auth-guard.tsx`
- `artifacts/livia-dashboard/src/lib/onboarding-migration-intent.ts`
- `artifacts/api-server/src/routes/businesses.ts`
- `artifacts/api-server/src/routes/me.ts`
- `lib/policy/src/registration-routing-program.ts`

### Phase 2 — Automated gates

Run in repo root:

```bash
pnpm flow:health
```

If the environment has a running API (health check passes), also run:

```bash
pnpm flow:health -- --e2e
```

Read `artifacts/flow-health-report.json` after the gate.

### Phase 3 — E2E gap check

Compare CI (`.github/workflows/ci.yml`) Playwright scope vs sacred specs:
- `e2e/tests/sacred-path-signup.spec.ts`
- `e2e/tests/founder-onboarding-resume.spec.ts`
- `e2e/tests/onboarding-navigation-resilience.spec.ts`

If any sacred spec is **not** in CI, flag as **P1 Process** (not necessarily code bug).

### Phase 4 — Report (required output)

Post a single markdown report with:

**Summary** — 2 sentences: overall health + top risk.

**Findings table** (only real issues; empty table = all clear):

| Severity | Path | Location | Finding | Suggested fix |
|----------|------|----------|---------|---------------|
| P0 / P1 / P2 | which sacred path | file:line or route | what breaks for the user | one concrete next step |

Severity guide:
- **P0** — founder cannot sign up, create shop, or resume onboarding
- **P1** — flow works but fragile, untested in CI, or data/env dependent
- **P2** — polish, copy, non-blocking edge case

**Automated gate results** — pass/fail per step from `flow-health-report.json`.

**Recommended next actions** — max 3 bullets, ordered by impact.

Do not paste long code blocks. Do not modify production env or secrets.

---

## Local dry run (you, before relying on the automation)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm flow:health
# With stack running (pnpm start:platform:test):
pnpm flow:health -- --e2e
```

Then ask in Cursor chat: *"Run the flow health sweep prompt from `.cursor/automations/flow-health-sweep.md`"* to preview what the automation will do.
