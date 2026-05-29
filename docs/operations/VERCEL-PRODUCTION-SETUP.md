# Vercel production setup — livia-hq.com

Three **separate** Vercel projects on the same GitHub repo. Each uses a **Root Directory** under `artifacts/` so builds do not clash.

| Vercel project | Domain | Root directory | Config |
|----------------|--------|----------------|--------|
| **livia-dashboard** (existing) | `app.livia-hq.com` | `.` (repo root) | `/vercel.json` |
| **livia-marketing** (new) | `livia-hq.com`, `www` → apex redirect | `artifacts/livia-marketing` | `vercel.json` in that folder |
| **livia-internal** (optional) | `ops.livia-hq.com` | `artifacts/livia-internal` | `vercel.json` in that folder |

Railway API stays on `api.livia-hq.com`. Clerk CNAME: `clerk.livia-hq.com` → Clerk Frontend API.

---

## 1. Dashboard (`app.livia-hq.com`)

Already wired via root `vercel.json`:

- Build: `pnpm --filter @workspace/livia-dashboard run build`
- `/api/*` rewrites to `https://api.livia-hq.com/api/*`
- Do **not** set `VITE_API_BASE_URL` in production (uses rewrite)

**Vercel env (Production):**

| Variable | Value |
|----------|--------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_…` |
| `VITE_MARKETING_URL` | `https://livia-hq.com` |
| `VITE_INTERNAL_PORTAL_URL` | `https://ops.livia-hq.com` (when ops is live) |
| `VITE_INTERNAL_EXEC_PATH` | same slug as Railway `INTERNAL_EXEC_PATH` |
| `VITE_PLATFORM_EXEC_EMAILS` | `projectlazarus@livia-hq.com` |

Redeploy after env changes.

---

## 2. Marketing (`livia-hq.com`)

### Project (live)

- **Vercel project:** `livia-marketing` (team: ayo's projects)
- **GitHub:** `goldspire-global/livia` connected
- **Production env:** `VITE_DASHBOARD_*`, `VITE_MARKETING_URL`, `VITE_API_BASE_URL`, `VITE_LEGAL_BASE_URL` set

**Vercel → Settings → General → Root Directory:** `artifacts/livia-marketing` (so `main` pushes build the marketing app, not the dashboard).

**CLI deploy from repo root** (full monorepo upload):

```bash
VERCEL_ORG_ID=team_… VERCEL_PROJECT_ID=prj_… vercel deploy --prod --yes --local-config vercel.marketing.json
```

(`vercel.marketing.json` at repo root; do not deploy from `artifacts/livia-marketing` alone — workspace packages need the full tree.)

### Domains

`livia-hq.com` is added on the project. DNS is on **Cloudflare** (not Vercel nameservers):

1. Cloudflare → **livia-hq.com** → DNS → add **A** record: `@` → `76.76.21.21` (proxy off / DNS only for first verify).
2. Optional **www**: CNAME `www` → `cname.vercel-dns.com`, or add `www.livia-hq.com` in Vercel and redirect to apex.
3. Wait for Vercel domain verification (email when ready).

### Env (Production)

| Variable | Value |
|----------|--------|
| `VITE_DASHBOARD_URL` | `https://app.livia-hq.com` |
| `VITE_DASHBOARD_SIGN_UP_URL` | `https://app.livia-hq.com/sign-up` |
| `VITE_DASHBOARD_SIGN_IN_URL` | `https://app.livia-hq.com/sign-in` (optional) |
| `VITE_MARKETING_URL` | `https://livia-hq.com` |
| `VITE_API_BASE_URL` | `https://api.livia-hq.com` |
| `VITE_LEGAL_BASE_URL` | `https://livia-hq.com/legal` (optional) |

### Smoke after deploy

- `https://livia-hq.com` — hero **Get started** → app sign-up
- `/legal/privacy`, `/legal/tos`, `/legal/dpa`
- `/contact` — `hello@livia-hq.com`
- Waitlist form hits API (CORS must include `https://livia-hq.com` on Railway)

---

## 3. Internal ops (`ops.livia-hq.com`, optional)

Founder/exec console only — not linked from marketing.

1. New Vercel project, **Root Directory:** `artifacts/livia-internal`.
2. Domain: `ops.livia-hq.com`.
3. **Env:**

| Variable | Value |
|----------|--------|
| `VITE_DASHBOARD_URL` | `https://app.livia-hq.com` |
| `VITE_INTERNAL_PORTAL_URL` | `https://ops.livia-hq.com` |
| `VITE_INTERNAL_EXEC_PATH` | long random slug (not `/cockpit`) |
| `VITE_PLATFORM_EXEC_EMAILS` | `projectlazarus@livia-hq.com` |

4. **Railway API** (same slug + portal URL):

```bash
INTERNAL_PORTAL_URL=https://ops.livia-hq.com
INTERNAL_EXEC_PATH=<same-slug>
INTERNAL_URL=https://ops.livia-hq.com
LIVIA_PLATFORM_EXEC_EMAILS=projectlazarus@livia-hq.com
```

5. Paste `INTERNAL_OPS_SECRET` in the ops UI on first load (never commit).

6. Add `https://ops.livia-hq.com` to Railway `CORS_ALLOWED_ORIGINS` (or rely on auto-merge via `INTERNAL_URL`).

---

## Clerk checklist

- Production instance: `app.livia-hq.com`, `livia-hq.com` allowed origins if needed.
- CNAME `clerk.livia-hq.com` (preferred) — dashboard **without** `/api/__clerk` proxy unless you must.
- User `projectlazarus@livia-hq.com` exists; Google OAuth if you use it on app sign-in.

---

## Verify from repo

```bash
pnpm prod:verify-domains
pnpm prod:smoke
pnpm founder:pre-ship
```

See also [`ENV-VARIABLES.md`](./ENV-VARIABLES.md) and [`EXEC-COMMAND-CENTER.md`](./EXEC-COMMAND-CENTER.md).
