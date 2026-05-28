# Europe onboarding ready — manual E2E gate

**Audience:** founder, QA, design partners  
**When:** Before inviting strangers to create real accounts on production/staging.

This is the **single walkthrough** for “Livia as in the App Store / official web app.” For full visual captures, see [`FULL-VISUAL-AUDIT-WEB-MOBILE.md`](./FULL-VISUAL-AUDIT-WEB-MOBILE.md).

---

## What “ready” means

| Check | Command / signal |
|-------|------------------|
| API + libs typecheck | `pnpm run typecheck` |
| Unit / contract tests | `pnpm --filter @workspace/api-server run test` |
| Production security invariants | `production-security.test.ts` in api-server test script |
| Web visual (routes × verticals) | `pnpm e2e:full-visual-audit:web` |
| Mobile visual (Maestro) | `pnpm e2e:full-visual-audit:mobile` (simulator + app running) |
| Automated gate script | `node scripts/production-readiness-gate.mjs` |

**Production customer surface:** demo API off, `/demo` and `/guides` not routable on prod dashboard builds (`VITE_DEMO_LOGIN` unset), mobile `/demo` blocked in release builds.

---

## Your manual walkthrough (fresh user path)

### 1. Environment

Copy `.env.example` → `.env`. Required:

- `DATABASE_URL` / `SUPABASE_DATABASE_URL`
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`
- Dashboard `artifacts/livia-dashboard/.env` with same Clerk publishable key

**Do not set** in production: `LIVIA_DEMO_ENABLED`, `LIVIA_DEMO_ALLOW_IN_PRODUCTION`, `META_DEV_SIMULATE`, `VITE_DEMO_LOGIN`, `EXPO_PUBLIC_DEMO_LOGIN`.

### 2. Start stack

```powershell
pnpm dev:api
pnpm dev:dashboard
# optional mobile: pnpm --filter livia-mobile run ios
```

### 3. Fresh founder path (Europe onboarding)

1. Open `http://127.0.0.1:5173/sign-up` — create a **new** Clerk user (not demo email).
2. Land on `/onboarding` — complete wizard (no “Load full demo” card in prod builds).
3. Finish **A12** only after a **test booking** (public `/b/{slug}` or staff “New booking”).
4. Go-live → `/bookings?create=1`.
5. Spot-check: Today, Bookings, Clients, Inbox, Settings (shop, Liv, policy), public `/b/{slug}`.

### 4. Seeded demo path (internal QA only)

For sales/QA with demo data (local/staging only):

```powershell
pnpm e2e:prep
# or POST http://127.0.0.1:3001/api/demo/provision
```

Then `VITE_DEMO_LOGIN=true` on dashboard and sign in via `/demo` or persona API — **never on production customer deploy**.

### 5. What you should feel

- Role-appropriate nav (owner vs staff vs founder Glance).
- Liv disclosed on AI surfaces; errors show `requestId` when something fails.
- No internal ops URLs, no E2E playbook on `/guides`, no dev seed buttons on dashboard.
- Vertical copy fits business type (physio ≠ salon language on allied-health shops).

---

## If something fails

1. Note **requestId** from toast or network tab.
2. Internal portal → Support → trace by request ID (ops secret).
3. File under [`UX-FULL-PLATFORM-AUDIT-2026-05-24.md`](./UX-FULL-PLATFORM-AUDIT-2026-05-24.md).

---

## Canonical docs (no duplicates)

| Topic | Doc |
|-------|-----|
| Production env | [`operations/PRODUCTION-CERTIFICATION.md`](../operations/PRODUCTION-CERTIFICATION.md) |
| Live product truth | [`product/LIVIA-PRODUCTION-READY.md`](../product/LIVIA-PRODUCTION-READY.md) |
| Honest gaps | [`product/LIVIA-IDEA-TO-REALITY.md`](../product/LIVIA-IDEA-TO-REALITY.md) |
| Web ↔ mobile | [`product/WEB-MOBILE-PARITY.md`](../product/WEB-MOBILE-PARITY.md) |
| Doc index | [`DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md) |

---

## Off-platform (you do manually)

- Clerk production instance + EU-friendly sign-up
- Stripe live mode + webhooks
- Domain TLS, `CORS_ALLOWED_ORIGINS`, marketing site
- App Store / Play Console listings
- Legal counsel on Terms / Privacy / DPA
