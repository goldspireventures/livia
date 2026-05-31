# Staging test guide — R3 ship (2026-05-31)

Use this after **`main` is deployed** to staging (Vercel app + Railway API). URLs assume default hosts; override with env if yours differ.

| Surface | URL |
|---------|-----|
| App | https://app.staging.livia-hq.com |
| API | https://api.staging.livia-hq.com |
| Marketing | https://staging.livia-hq.com |
| Guest hub | https://app.staging.livia-hq.com/my |

**Prereqs on Railway staging API:** `LIVIA_DEMO_ENABLED=true`, `LIVIA_DEPLOY_ENV=staging`, Clerk keys aligned with dashboard. Optional: `pnpm db:seed:staging` if demo shops are empty.

---

## 1. Automated smoke (from your laptop)

```bash
# Quick HTTP + marketing bundle checks
pnpm staging:readiness --strict

# Broader staging E2E (marketing + public book + preset picker)
pnpm test:e2e:staging

# Full staging pass (adds headless R3 lifecycle — needs demo provisioned)
pnpm test:e2e:staging:full
```

**Pass criteria:** all steps green; no 404 on `/api/demo/status`.

---

## 2. Manual — tenant (signed in)

Use demo **Luxe Salon** (`luxe-salon-spa`) or any showcase shop from `/demo`.

### A. Settings → Public appearance

1. Sign in at https://app.staging.livia-hq.com/sign-in (demo path or your test user).
2. Open **Settings → Shop** tab (`/settings?tab=shop`).
3. Confirm **Public appearance** shows a **grid of preset cards** (not “rolls out later”).
4. Click a different preset → card gets primary border; **preview iframe** on the right refreshes.
5. Set **Logo URL** (optional test image HTTPS URL) → saves; open `/b/{your-slug}` and confirm logo on storefront.

### B. Onboarding preset pick (if shop still in onboarding)

1. Continue onboarding until **“Liv & your link”** (public link act).
2. Confirm block **“How customers see your booking page”** with preset buttons (`data-testid="onboarding-presentation-pick"`).
3. Pick a preset → toast “Look updated”; complete act if checklist allows.

### C. Owner Today / Inbox

1. **Today** — vertical accent line uses shop brand when set in presentation API.
2. **Inbox** — queue loads; Liv chips on threads (manager/owner).

---

## 3. Manual — guest surfaces (no login)

With demo provisioned, open these (tokens from API or demo launcher):

| Surface | How to get URL |
|---------|----------------|
| Public book | https://app.staging.livia-hq.com/b/luxe-salon-spa |
| Proof (body-art) | Demo launcher or `GET /api/demo/guest-surfaces/ink-anchor-galway/proof` |
| Pay | `GET /api/demo/guest-surfaces/luxe-salon-spa/pay` |
| Intake | `GET /api/demo/guest-surfaces/clarity-medspa-dublin/intake` |
| Waitlist | `GET /api/demo/guest-surfaces/peak-fitness-dublin/waitlist` |

**Pass:** each page loads mobile shell; no 500; primary CTA visible (book, approve, pay, submit, accept).

### Guest hub

1. https://app.staging.livia-hq.com/my — OTP or demo path per your Clerk setup.
2. Favorites, upcoming, book-again, Liv chat strip load.

---

## 4. Manual — internal ops (optional)

1. https://ops.livia-hq.com (or your internal host) with ops secret.
2. **Support** → open thread → **Context pane** shows tenant surface + “Open tenant” / public `/b` link.
3. Shell uses **amber** accent (unified exec + support).

---

## 5. Mobile (Expo / device)

Point app at staging API (`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_DASHBOARD_URL` in `.env` or staging example).

1. **Settings** → Logo URL field (owner); **Public appearance** card when presets enabled on API.
2. **Today** tab — accent follows tenant brand when set.

---

## 6. If something fails

| Symptom | Fix |
|---------|-----|
| Preset panel says “rolls out later” | API missing `LIVIA_DEPLOY_ENV=staging` → redeploy api-server |
| `/api/demo/status` 404 | `LIVIA_DEMO_ENABLED=true` on staging |
| Clerk sign-in fails | Align `CLERK_*` on Railway + Vercel; `pnpm clerk:check-keys` |
| Guest token 404 | `pnpm demo:provision` against staging DB or `POST /api/demo/provision` |

**Logs:** Railway api-server deploy logs; Vercel dashboard build for app.

---

## Related

- [`STAGING-MANUAL-CHECKLIST.md`](./STAGING-MANUAL-CHECKLIST.md) — infra setup  
- [`STAGING-SETUP.md`](./STAGING-SETUP.md)  
- [`PRESENTATION-PRESET-PRODUCTION.md`](./PRESENTATION-PRESET-PRODUCTION.md) — prod flag only after UAT  
- [`R3-BUILD-STATUS.md`](./R3-BUILD-STATUS.md)
