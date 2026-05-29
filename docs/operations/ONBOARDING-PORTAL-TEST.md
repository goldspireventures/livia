# Onboarding portal — test then ship

## Lanes

| Lane | URL | Sign-in | Portal |
|------|-----|---------|--------|
| **Local test** | `http://localhost:5173/dev/onboarding-preview` | No | Always on |
| **Staging test** | `https://app.staging.livia-hq.com/onboarding-preview` | No | On (after [`STAGING-SETUP.md`](./STAGING-SETUP.md)) |
| **Staging real** | `https://app.staging.livia-hq.com/onboarding` | Yes (staging Clerk) | Default on (`VITE_LIVIA_DEPLOY_ENV=staging`) |
| **Production** | `https://app.livia-hq.com/onboarding` | Yes | Only if `VITE_ONBOARDING_PORTAL_EXPERIENCE=true` |

Without the env flag, `/onboarding` keeps the **legacy card wizard** (12 steps, safe default).

## Portal = 3 chapters (UI only)

Preview and portal mode show **3 chapters**, not 12 chips:

1. **Your shop** — create, profile, hours (menu/team seeded; skipped on Continue)
2. **Liv & your link** — Liv + public page (channels optional; skipped on Continue)
3. **Go live** — checklist + cockpit (billing/invite/import auto-complete when you finish the link step)

The API still stores all **A1–A12** acts; skipped screens are auto-marked complete on Continue. Backend policy trim is a later pass once UI is signed off.

## Local test checklist (~10 min)

1. `pnpm dev:dashboard` (+ API if testing A8 iframe: `pnpm dev:api`, demo seed).
2. Open preview → **Replay arrival** → Enter setup.
3. Jump to **A6** — edit greeting; phone preview updates.
4. Jump to **A8** — iframe shows `/b/luxe-salon-spa` (or `?slug=…`).
5. Jump to **A12** — tick checklist; cockpit tease fills; **Open your cockpit** (toast in preview).
6. Click through chapter spine (Back / chips) — transitions feel OK.
7. Optional: `prefers-reduced-motion` on — no sickness, still usable.

## Ship to real onboarding

1. In `artifacts/livia-dashboard/.env`:
   ```env
   VITE_ONBOARDING_PORTAL_EXPERIENCE=true
   ```
2. Restart dashboard dev server.
3. Sign in → `/onboarding` — confirm same portal (arrival once per browser).
4. Staging/prod: set the same var on Vercel when ready for customers.

## Roll back

Remove the env var or set it to anything other than `true`. Redeploy/restart.

## Not in this rollout

- Policy-level fewer acts (still 12 in DB; UI compresses navigation).
- Mobile portal parity.

Track those separately after sign-off on web portal UX.
