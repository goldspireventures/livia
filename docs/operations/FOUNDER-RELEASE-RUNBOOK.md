# Founder release runbook (solo · pre-staging)

**Use this until** `app.staging.livia-hq.com` exists. Your **command center** is **Livia Internal** exec overview (`pnpm dev:internal` → secret path in `.env` — see [`EXEC-COMMAND-CENTER.md`](./EXEC-COMMAND-CENTER.md)) or **mobile** → 7× tap on version label.

Staging prep (no cost yet): [`staging-prep-livia-hq.md`](./staging-prep-livia-hq.md).

---

## Daily (2 minutes)

1. Open **exec overview** (internal) → **Refresh**.
2. If you deployed yesterday: confirm **Production health** is all green.
3. Glance **Support** — anything urgent? Open queue from cockpit (in-app link).

---

## Every production deploy

| Step | Where | Done when |
|------|--------|-----------|
| 1 | GitHub Actions on your commit | CI green |
| 2 | Merge to `main` | Vercel + Railway build |
| 3 | Exec overview → **Production health** | All required ✓ |
| 4 | Incognito → `https://app.livia-hq.com/sign-in` | Sign-in works |
| 5 | Customer-visible? | One line in `docs/changelog.md` |

Optional before a risky change: `pnpm founder:release-gate` on your laptop (writes `founder-gate.json` — cockpit shows it when API runs locally).

Terminal equivalent: `pnpm founder:pre-ship` (= smoke + reminder).

---

## What you are *not* doing yet (OK)

- Separate staging stack (saves cost until design partners).
- Canary 5% → 100% (Vercel/Railway manual promote is fine).
- Mobile store release every web deploy (mobile is a slower lane).

---

## When to add staging (Option A)

Trigger when **any** of:

- First paying tenant on prod DB.
- You need to test a **database migration** without fear.
- A design partner needs a stable URL that is not production.

Then follow [`staging-prep-livia-hq.md`](./staging-prep-livia-hq.md) and change this runbook to: merge → staging smoke → promote to prod.

---

## External apps (minimize hops)

Set on Railway API (optional — cockpit links appear when set):

| Variable | Example |
|----------|---------|
| `FOUNDER_GITHUB_URL` | `https://github.com/goldspire-global/livia` |
| `FOUNDER_VERCEL_URL` | Your Vercel team/project URL |
| `FOUNDER_RAILWAY_URL` | Your Railway project URL |

Everything else (support, tenants, flags, prod probes) stays **in cockpit**.

---

## Monday business (30 min)

Not in cockpit — update [`docs/company/NORTH-STAR-DASHBOARD.md`](../company/NORTH-STAR-DASHBOARD.md): partners, Gate 2, “Liv by name” interviews.

Cockpit covers **ops + ship**; north-star doc covers **company proof**.
