# Staging setup — test web + mobile before production

**Goal:** `app.staging.livia-hq.com` + `api.staging.livia-hq.com` + mobile pointed at staging — same flows as prod, isolated data, demo + onboarding preview allowed.

**Status:** Infra is **provisioned by you** (Supabase, Clerk, Railway, Vercel, DNS). This doc is the runbook; code is ready for when DNS is live.

**Step-by-step checklist (tick boxes):** [`STAGING-MANUAL-CHECKLIST.md`](./STAGING-MANUAL-CHECKLIST.md)

---

## URLs (target)

| Surface | Staging | Production (today) |
|---------|---------|------------------|
| API | `https://api.staging.livia-hq.com` | `https://api.livia-hq.com` |
| Dashboard | `https://app.staging.livia-hq.com` | `https://app.livia-hq.com` |
| Marketing | `https://staging.livia-hq.com` *(or subdomain you choose)* | `https://livia-hq.com` |
| Onboarding preview (no sign-in) | `https://app.staging.livia-hq.com/onboarding-preview` | **not available** (local only) |
| Signed-in portal onboarding | `https://app.staging.livia-hq.com/onboarding` | prod: flag required |

---

## Provision order

Do these once; keep staging and prod credentials separate.

### 1. Supabase

1. Create a **second** project (EU region, match prod).
2. Run migrations: `pnpm deploy:migrate` against staging `DATABASE_URL` (or Railway deploy hook).
3. Optional: `pnpm db:seed` on staging only for demo slugs.

### 2. Clerk

1. Create a **staging** Clerk application (test keys are fine).
2. Add allowed origins / redirect URLs:
   - `https://app.staging.livia-hq.com`
   - `exp://` / Expo scheme if using dev client
3. DNS: `clerk.staging.livia-hq.com` CNAME if using custom Frontend API (mirror prod pattern).

### 3. Railway (API)

1. Duplicate the prod service → name e.g. `livia-api-staging`.
2. Attach staging `DATABASE_URL` only.
3. Paste env from [`railway.env.staging.example`](../../railway.env.staging.example) at repo root.
4. Custom domain: `api.staging.livia-hq.com`.
5. Set `API_STAGING_URL=https://api.staging.livia-hq.com` on **prod** API too (cockpit “staging prep” status).

### 4. Vercel (dashboard + marketing)

**Dashboard** — new project, root `artifacts/livia-dashboard`:

| Variable | Staging value |
|----------|----------------|
| `VITE_LIVIA_DEPLOY_ENV` | `staging` |
| `VITE_CLERK_PUBLISHABLE_KEY` | staging `pk_test_` or `pk_live_` |
| `VITE_API_BASE_URL` | `https://api.staging.livia-hq.com` |
| `VITE_MARKETING_URL` | `https://staging.livia-hq.com` |
| `VITE_DEMO_LOGIN` | `true` |
| `VITE_ONBOARDING_PORTAL_EXPERIENCE` | `true` *(optional; staging defaults portal **on**)* |

Domain: `app.staging.livia-hq.com`  

**Important:** Prod `vercel.json` rewrites `/api/*` → `api.livia-hq.com`. For the **staging Vercel project**, either:

- Paste [`artifacts/livia-dashboard/vercel.staging.json`](../../artifacts/livia-dashboard/vercel.staging.json) over `vercel.json` in that project only, **or**
- Vercel → Project → Settings → Rewrites → set destination to `https://api.staging.livia-hq.com/api/:path*`

Without this, Clerk proxy and `/api/healthz` on staging app hit **production** API.

**Marketing** — new project, root `artifacts/livia-marketing`:

| Variable | Staging value |
|----------|----------------|
| `VITE_DASHBOARD_URL` | `https://app.staging.livia-hq.com` |
| `VITE_API_BASE_URL` | `https://api.staging.livia-hq.com` |
| `VITE_MARKETING_URL` | `https://staging.livia-hq.com` |

### 5. DNS (Cloudflare)

Grey-cloud CNAMEs:

- `api.staging` → Railway staging service
- `app.staging` → Vercel dashboard staging project
- `staging` → Vercel marketing (if used)

### 6. Smoke

```bash
pnpm smoke:staging
# or
pnpm prod:smoke --app https://app.staging.livia-hq.com --api https://api.staging.livia-hq.com
```

Expect: healthz 200, Clerk key in bundle (`pk_test_` OK), HTML loads.

---

## Test web onboarding (staging)

1. **Preview (no Clerk):**  
   `https://app.staging.livia-hq.com/onboarding-preview`  
   Optional: `?act=a8_public_link&slug=luxe-salon-spa` (needs demo seed on staging API).

2. **Real flow:** sign up / sign in on staging Clerk →  
   `https://app.staging.livia-hq.com/onboarding`  
   Portal + 3-chapter UI should be on by default (`VITE_LIVIA_DEPLOY_ENV=staging`).

3. **Demo:** `https://app.staging.livia-hq.com/demo` (with `VITE_DEMO_LOGIN=true` + API `LIVIA_DEMO_ENABLED=true` on staging Railway).

---

## Test mobile (staging)

Copy [`artifacts/livia-mobile/.env.staging.example`](../artifacts/livia-mobile/.env.staging.example) → `artifacts/livia-mobile/.env` (do not commit).

```bash
# Device on same Wi‑Fi, or use tunnel
pnpm --filter @workspace/livia-mobile run dev:staging
```

Sign in with a **staging Clerk** user. Onboarding deep-links open `app.staging.livia-hq.com/onboarding` in the browser for heavy steps (public link, billing).

**TestFlight / internal build:** EAS profile with the same `EXPO_PUBLIC_*` values baked at build time — rebuild when staging URLs change.

---

## Promote to production

1. Merge to `main`.
2. Deploy **staging** → `pnpm smoke:staging` + manual onboarding preview + one mobile sign-in.
3. Deploy **production** (same SHA when possible).
4. `pnpm prod:smoke` against prod URLs.
5. Only then set `VITE_ONBOARDING_PORTAL_EXPERIENCE=true` on **prod** dashboard if portal is signed off.

---

## What stays off on production

| Staging OK | Production |
|------------|--------------|
| `LIVIA_DEMO_ENABLED=true` | **Unset** |
| `/onboarding-preview` | **404** (no route) |
| `VITE_DEMO_LOGIN=true` | **Unset** |
| Portal onboarding default on | Opt-in via `VITE_ONBOARDING_PORTAL_EXPERIENCE=true` |

---

## Local vs staging vs prod

| | Local | Staging | Prod |
|--|-------|---------|------|
| Web preview | `:5173/dev/onboarding-preview` | `app.staging…/onboarding-preview` | — |
| API | `:3000` | `api.staging…` | `api.livia-hq.com` |
| DB | dev Supabase | staging project | prod project |
| Clerk | dev / test app | staging app | live app |

---

## Code knobs (reference)

| Variable | Where |
|----------|--------|
| `VITE_LIVIA_DEPLOY_ENV=staging` | Dashboard Vercel (staging project) |
| `VITE_ONBOARDING_PORTAL_EXPERIENCE` | Dashboard — force on/off portal on `/onboarding` |
| `VITE_ONBOARDING_PREVIEW_ROUTE=true` | Rare: enable preview on non-staging host |
| `API_STAGING_URL` | Railway prod API — cockpit staging status |
| `EXPO_PUBLIC_API_BASE_URL` | Mobile `.env` / EAS |

See also: [`ONBOARDING-PORTAL-TEST.md`](./ONBOARDING-PORTAL-TEST.md), [`ENV-VARIABLES.md`](./ENV-VARIABLES.md).
