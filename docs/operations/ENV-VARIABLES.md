# Environment variables

**Canonical reference.** Copy templates from [`.env.example`](../../.env.example) (local) and [`railway.env.example`](../../railway.env.example) (production API).

## Does Railway auto-update when we remove vars from the repo?

**No.** Railway keeps whatever you set in the dashboard until you delete it there. Pushing code or changing `.env.example` does **not** add, change, or remove Railway variables.

After each deploy:

1. Set any **new** canonical names from `railway.env.example`.
2. **Delete** deprecated names listed below (they are ignored once unused, but clutter the UI).
3. Redeploy if you only changed variables (Railway → Deploy).

Optional: run `node scripts/print-production-env.mjs` for a copy-paste checklist.

### Sync from your machine (Railway CLI)

```bash
npm i -g @railway/cli
railway login
railway link   # livia-api service
cp railway.production.env.example railway.production.env
# edit railway.production.env (real secrets)
pnpm railway:sync-env -- --prune-legacy
# Railway dashboard → Deploy
pnpm prod:smoke
```

Railway still does not read `railway.production.env` from git — you run the script when values change.

---

## Logs — can we see the spinner issue?

| Where | What you get today |
|-------|-------------------|
| **This repo** | `pnpm prod:smoke` — Clerk `host_invalid`, API health, bundle key type (no login needed) |
| **Railway** | API request logs, Clerk proxy errors, `pino` JSON in deployment logs |
| **Vercel** | Build logs only; dashboard is static — client errors are **not** here |
| **Browser / device** | DevTools → Network (`clerk`, `__clerk`) and Console — **best for spinner** |
| **Sentry** | Off until `VITE_SENTRY_DSN` (web) / `SENTRY_DSN_API` (API) / `EXPO_PUBLIC_SENTRY_DSN` (mobile) are set |

There is no centralized “spinner” log until Sentry is wired. Railway will not show Clerk client failures — only `/api/__clerk` proxy responses.

---

## Local `.env` — staging vs production DB

| Variable | Use |
|----------|-----|
| `DATABASE_URL` | **Default** for local ops — point at **staging** Supabase (session pooler `:5432` for DDL) |
| `DATABASE_URL_PROD` | Production Supabase only — used when you pass `--prod` / `:prod` scripts |

**Never** swap `DATABASE_URL` manually between environments. Use:

```bash
pnpm db:targets          # show host hints (no secrets printed)
pnpm db:sync:staging     # db:push + SQL migrations → staging
pnpm db:sync:prod        # db:push + SQL migrations → production
pnpm db:push:prod        # schema only → production
pnpm db:migrate:sql:prod # SQL only → production
```

Under the hood: `scripts/with-db-target.mjs` sets `LIVIA_DB_TARGET` so `drizzle-push` does not reload staging from `.env` while targeting prod.

---

## Railway (API) — production minimum

| Variable | Example | Notes |
|----------|---------|--------|
| `DATABASE_URL` | Postgres connection string | Required |
| `NODE_ENV` | `production` | Set by Railway usually |
| `CLERK_SECRET_KEY` | `sk_live_…` | Same Clerk app as Vercel `pk_live_` |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_…` | API JWT verification (match dashboard) |
| `DASHBOARD_URL` | `https://app.livia-hq.com` | Clerk proxy = `{DASHBOARD_URL}/api/__clerk` |
| `MARKETING_URL` | `https://livia-hq.com` | Email/demo links |
| `API_PUBLIC_URL` | `https://api.livia-hq.com` | Uploads, absolute URLs |
| `CORS_ALLOWED_ORIGINS` | `https://app.livia-hq.com,https://livia-hq.com` | Also auto-merges surface URLs |

**Do not set on Railway** (local / E2E only): `E2E_*`, `LIVIA_DEMO_ENABLED`, `WORKFLOWS_DISABLED`, `META_DEV_SIMULATE`, `SIM_AUTH_*`.

**Delete if still present** (legacy — code reads canonical names via fallbacks):

`DASHBOARD_BASE_URL`, `DASHBOARD_PUBLIC_URL`, `TENANT_DASHBOARD_URL`, `LIVIA_DASHBOARD_URL`, `MARKETING_PUBLIC_URL`, `INTERNAL_PUBLIC_URL`, `PUBLIC_BASE_URL`, `CLERK_PROXY_URL`, `LIVIA_DASHBOARD_URL`, `LIVIA_MARKETING_URL`, `GRAFANA_EMBED_BASE_URL`, `GRAFANA_LOCAL_URL`, `INTERNAL_GRAFANA_URL`, `LOKI_QUERY_BASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

---

## Vercel (dashboard)

| Variable | Example |
|----------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_…` |

No `VITE_API_BASE_URL` in production — uses `/api` rewrite to Railway.

---

## Expo / mobile (EAS)

| Variable | Example |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://api.livia-hq.com` |
| `EXPO_PUBLIC_DASHBOARD_URL` | `https://app.livia-hq.com` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | same `pk_` as dashboard |
| `EXPO_PUBLIC_MARKETING_URL` | `https://livia-hq.com` |

---

## Marketing (Vercel)

Second Vercel project: **Root Directory** = `artifacts/livia-marketing`, domain `livia-hq.com`. Step-by-step: [`VERCEL-PRODUCTION-SETUP.md`](./VERCEL-PRODUCTION-SETUP.md).

| Variable | Example |
|----------|---------|
| `VITE_DASHBOARD_URL` | `https://app.livia-hq.com` |
| `VITE_MARKETING_URL` | `https://livia-hq.com` |
| `VITE_API_BASE_URL` | `https://api.livia-hq.com` |
| `VITE_LEGAL_BASE_URL` | `https://livia-hq.com/legal` (optional; defaults from `VITE_MARKETING_URL`) |

---

## Platform exec (`projectlazarus@livia-hq.com`)

Workforce domains and tiers: [`WORKFORCE-ONBOARDING.md`](./WORKFORCE-ONBOARDING.md).

| Variable | Where | Example |
|----------|-------|---------|
| `LIVIA_STAFF_EMAIL_DOMAINS` | Railway API | `livia-hq.com` |
| `GOLDSPIRE_STAFF_EMAIL_DOMAINS` | Railway API | `goldspireventures.com` (validation only; grants via cockpit) |
| `LIVIA_PLATFORM_EXEC_EMAILS` | Railway API | `projectlazarus@livia-hq.com` |
| `INTERNAL_PORTAL_URL` | Railway API | `https://ops.livia-hq.com` |
| `INTERNAL_EXEC_PATH` | Railway API + Internal Vite | `l7-random-slug` |
| `VITE_INTERNAL_PORTAL_URL` | Dashboard + Internal Vite | same as portal |
| `VITE_INTERNAL_EXEC_PATH` | Dashboard + Internal Vite | same slug |
| `VITE_PLATFORM_EXEC_EMAILS` | Dashboard Vite | `projectlazarus@livia-hq.com` |
| `VITE_LIVIA_STAFF_EMAIL_DOMAINS` | Dashboard + Internal Vite | mirror API |
| `VITE_GOLDSPIRE_STAFF_EMAIL_DOMAINS` | Dashboard + Internal Vite | mirror API (UI hints) |
| `EXPO_PUBLIC_PLATFORM_EXEC_EMAILS` | Mobile EAS | same as exec list |

Sign-in at app with exec email → redirect to ops portal. See [`EXEC-COMMAND-CENTER.md`](./EXEC-COMMAND-CENTER.md).

---

## Founder cockpit (optional deep links)

| Variable | Example |
|----------|---------|
| `FOUNDER_GITHUB_URL` | `https://github.com/goldspire-global/livia` |
| `FOUNDER_VERCEL_URL` | Vercel project dashboard |
| `FOUNDER_RAILWAY_URL` | Railway project dashboard |
| `API_STAGING_URL` | Set when staging exists (cockpit staging status) |

### Deploy label + beta gate (Railway API)

Same artifact on staging and prod — **only env differs**.

| Variable | Production | Staging |
|----------|------------|---------|
| `LIVIA_DEPLOY_ENV` | `production` | `staging` |
| `LIVIA_BETA_SIGNUP_MODE` | `invite` (default if unset in prod code) | `open` |
| `LIVIA_SKIP_PRODUCTION_ENV_CHECK` | **never** | optional for drills |

### Staging QA relaxations (Railway API — `LIVIA_DEPLOY_ENV=staging` only)

Master switch defaults **ON** on staging. Set `LIVIA_STAGING_RELAXED=false` to run prod-strict checks before promote.

| Variable | Default (staging) | Values | Effect |
|----------|-----------------|--------|--------|
| `LIVIA_STAGING_RELAXED` | `true` (implicit) | `false` disables all below | Master gate |
| `LIVIA_STAGING_RELAX_GUEST_OTP` | `bypass` | `bypass` \| `dev` \| `strict` | Guest hub `/my` OTP — bypass accepts magic code + shows session code; strict = real SMS path |
| `LIVIA_STAGING_RELAX_GUEST_PHONE` | `loose` | `loose` \| `strict` | Loose accepts short test numbers (`+1999…` synthetic E.164) |
| `LIVIA_STAGING_GUEST_OTP_MAGIC` | `000000` | 4–8 digits | Magic code for bypass mode |
| `LIVIA_STAGING_RELAX_LEGAL_GATE` | off | `true` | Skip platform legal acceptance on staging |

**Read current values:** `GET /api/public/surface-config` (guest UI) or Founder Cockpit → Ship Lane (ops). Authenticated: `GET /api/me/platform-config` → `stagingRelaxations`.

**To test real OTP/SMS on staging:** set `LIVIA_STAGING_RELAX_GUEST_OTP=strict` + configure Twilio on Railway.

Prod boot **requires** `DASHBOARD_URL`, `MARKETING_URL`, `API_PUBLIC_URL` (no localhost).

Clients: `GET /api/me/platform-config` returns deploy env + public URLs.

### Staging stack (separate deploys)

Full runbook: [`STAGING-SETUP.md`](./STAGING-SETUP.md). Templates: `railway.env.staging.example`, `artifacts/livia-dashboard/.env.staging.example`, `artifacts/livia-mobile/.env.staging.example`.

| Variable | Staging dashboard |
|----------|-------------------|
| `VITE_LIVIA_DEPLOY_ENV` | `staging` |
| `VITE_ONBOARDING_PORTAL_EXPERIENCE` | `true` (optional; staging defaults portal on) |
| `VITE_DEMO_LOGIN` | `true` |

---

## Optional integrations (API)

Set only when you use the feature; app degrades without them.

| Group | Variables |
|-------|-------------|
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` |
| Email | `RESEND_API_KEY`, `RESEND_DEFAULT_FROM`, `SUPPORT_INBOX_EMAIL` |
| SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| Meta | `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN` |
| Liv AI | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (optional) |
| Workflows | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |
| Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| Observability | `SENTRY_DSN_API`, `SENTRY_RELEASE` |
| Internal ops | `INTERNAL_OPS_SECRET`, `INTERNAL_CRON_SECRET` (cron routes only) |
| Logs (local/docker) | `LOKI_PUSH_URL`, `GRAFANA_URL` |
| Partner API | `PARTNER_API_KEY`, `API_KEY_PEPPER` |

---

## Local-only / testing

| Variable | Used by |
|----------|---------|
| `E2E_API_BASE`, `E2E_DASHBOARD_BASE`, `E2E_MARKETING_URL`, `E2E_DEMO_SLUG` | Playwright |
| `LIVIA_DEMO_ENABLED`, `LIVIA_DEMO_PASSWORD` | Demo portal |
| `INTERNAL_URL` | Default `http://localhost:5175` if unset |
| `WORKFLOWS_DISABLED`, `INNGEST_DEV` | Skip Inngest locally |

---

## Implementation

Central reads: `artifacts/api-server/src/lib/env-config.ts` and `public-urls.ts`.

## “Prod ready” vs “deployed correctly”

**Gates A–E** (typecheck, E2E, policy, no demo placeholders) mean the **codebase** is in shape for beta — not that Railway/Vercel env is correct. Deployment is a separate step: [`APP-STORE-PRODUCTION-CHECKLIST.md`](./APP-STORE-PRODUCTION-CHECKLIST.md) and `pnpm prod:smoke`.
