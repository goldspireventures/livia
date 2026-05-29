# Staging — manual checklist (your side)

Work top to bottom. Check off as you go. Code fix for Vercel `PORT` build error is in `vite.config.ts` — **redeploy dashboard after pulling**.

---

## Phase A — Database (Supabase ✅)

You have **Livia Staging** (`cztfyxmlguqnxkgisfnh.supabase.co`). `main` + “PRODUCTION” badge is normal (primary branch of *this* project).

- [ ] **A1.** Supabase → **Project Settings → Database** → copy **Connection string (URI)** — use **Transaction pooler** (port 6543) for Railway.
- [ ] **A2.** On your PC (repo root, staging URL in env):

  ```bash
  # PowerShell — one line, replace with your pooler URL
  $env:DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
  pnpm deploy:migrate
  ```

  Or run migrations from Railway after A4 using the same `DATABASE_URL` variable.

- [ ] **A3.** (Optional) Demo data for onboarding iframe: `pnpm db:seed` with staging `DATABASE_URL` only.

---

## Phase B — API (Railway staging)

Screenshot shows **@workspace/api-server** deployed but **Unexposed**.

- [ ] **B1.** Railway → **staging** environment → **api-server** → **Variables**  
  Paste from [`railway.env.staging.example`](../../railway.env.staging.example). Minimum to fill:

  | Variable | Value |
  |----------|--------|
  | `DATABASE_URL` | Supabase pooler URI (A1) |
  | `CLERK_SECRET_KEY` | From Clerk **livia staging** → API keys |
  | `CLERK_PUBLISHABLE_KEY` | Same app, publishable key |
  | `DASHBOARD_URL` | `https://app.staging.livia-hq.com` |
  | `MARKETING_URL` | `https://staging.livia-hq.com` (or your marketing staging host) |
  | `API_PUBLIC_URL` | `https://api.staging.livia-hq.com` |
  | `CORS_ALLOWED_ORIGINS` | `https://app.staging.livia-hq.com,https://staging.livia-hq.com` |
  | `CLERK_PROXY_URL` | `https://app.staging.livia-hq.com/api/__clerk` |
  | `LIVIA_DEMO_ENABLED` | `true` |
  | `INTERNAL_OPS_SECRET` | Long random string |

- [ ] **B2.** **Settings → Networking → Generate domain** (Railway `*.up.railway.app`) — confirms service is up.
- [ ] **B3.** **Settings → Networking → Custom domain** → `api.staging.livia-hq.com`  
  Cloudflare: **CNAME** `api.staging` → Railway target (grey cloud OK). Wait for TLS.
- [ ] **B4.** Redeploy after variables save. Logs should show listening, no DB auth errors.
- [ ] **B5.** Browser: `https://api.staging.livia-hq.com/api/healthz` → JSON ok.

---

## Phase C — Clerk (livia staging)

Screenshot shows **livia staging / Development** — good for staging (test keys).

- [ ] **C1.** Clerk → **livia staging** → **API keys** → copy **Publishable** + **Secret** into Railway (B1) and Vercel (D1).
- [ ] **C2.** **Configure → Domains** (or Paths): add staging URLs when dashboard exists:
  - `https://app.staging.livia-hq.com`
  - Sign-in / sign-up redirect URLs if prompted
- [ ] **C3.** If prod uses Clerk CNAME (`clerk.livia-hq.com`): optionally add `clerk.staging.livia-hq.com` for staging, or use **proxy** via dashboard `/api/__clerk` (set `CLERK_PROXY_URL` on Railway + `vercel.staging.json` rewrites).
- [ ] **C4.** First sign-up on staging app completes “Watching for users” in Clerk.

---

## Phase D — Dashboard (Vercel)

Build failed: `PORT environment variable is required` — fixed in repo; **push + redeploy**.

- [ ] **D1.** New Vercel project (or existing staging project):
  - **Root Directory:** `artifacts/livia-dashboard`
  - **Framework:** Vite
  - **Build:** `pnpm --filter @workspace/livia-dashboard run build` (or use repo `vercel.json` install/build)
- [ ] **D2.** **Environment variables** (Production + Preview):

  | Variable | Value |
  |----------|--------|
  | `VITE_LIVIA_DEPLOY_ENV` | `staging` |
  | `VITE_CLERK_PUBLISHABLE_KEY` | Clerk staging publishable |
  | `VITE_API_BASE_URL` | `https://api.staging.livia-hq.com` |
  | `VITE_MARKETING_URL` | `https://staging.livia-hq.com` |
  | `VITE_DEMO_LOGIN` | `true` |
  | `VITE_ONBOARDING_PORTAL_EXPERIENCE` | `true` |

  Optional: `PORT=5173`, `BASE_PATH=/` (not required after vite fix).

- [ ] **D3.** **Rewrites:** Use [`artifacts/livia-dashboard/vercel.staging.json`](../../artifacts/livia-dashboard/vercel.staging.json) as `vercel.json` **in this project only** (staging API proxy), or set rewrite in Vercel UI → `https://api.staging.livia-hq.com/api/:path*`.
- [ ] **D4.** **Domains** → `app.staging.livia-hq.com` (CNAME to Vercel).
- [ ] **D5.** Deploy succeeds → open `https://app.staging.livia-hq.com/` (sign-in page).
- [ ] **D6.** `https://app.staging.livia-hq.com/onboarding-preview` (no login).
- [ ] **D7.** Sign up → `https://app.staging.livia-hq.com/onboarding`.

---

## Phase E — Marketing (optional but recommended)

- [ ] **E1.** Vercel project, root `artifacts/livia-marketing`.
- [ ] **E2.** Env: `VITE_DASHBOARD_URL`, `VITE_API_BASE_URL`, `VITE_MARKETING_URL` → staging hosts.
- [ ] **E3.** Domain `staging.livia-hq.com` → Vercel.

---

## Phase F — DNS (Cloudflare)

| Record | Type | Target |
|--------|------|--------|
| `api.staging` | CNAME | Railway custom domain |
| `app.staging` | CNAME | Vercel dashboard |
| `staging` | CNAME | Vercel marketing (if E done) |

---

## Phase G — Verify

```bash
pnpm smoke:staging
```

- [ ] API + app healthz pass
- [ ] Clerk key in bundle (`pk_test_` fine)
- [ ] Onboarding preview loads
- [ ] One full sign-up on staging

---

## Phase H — Mobile

- [ ] **H1.** Copy `artifacts/livia-mobile/.env.staging.example` → `.env` (gitignored).
- [ ] **H2.** Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` = staging Clerk publishable.
- [ ] **H3.** `pnpm --filter @workspace/livia-mobile run dev:staging` → sign in → onboarding opens staging web where needed.

---

## Phase I — Prod cockpit (optional)

On **production** Railway API only:

- [ ] `API_STAGING_URL=https://api.staging.livia-hq.com`  
  (Founder cockpit “staging prep” shows partial/live.)

---

## Common mistakes

| Symptom | Fix |
|---------|-----|
| Vercel build `PORT required` | Pull latest dashboard `vite.config.ts`, redeploy |
| App loads but API 401 / CORS | `CORS_ALLOWED_ORIGINS` + staging Clerk keys match |
| `/api/healthz` HTML on app | Staging rewrites still point at **prod** API — fix D3 |
| Clerk `host_invalid` | Add `app.staging.livia-hq.com` in Clerk domains |
| Preview 404 on prod | Preview only on **staging** or localhost — expected |
| Railway “Unexposed” | B2–B3: generate + custom domain |

---

**When all green:** test onboarding + mobile on staging; only then enable portal flag on production dashboard.
