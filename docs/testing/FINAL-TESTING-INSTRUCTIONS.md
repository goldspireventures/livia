# Final testing instructions — Livia full stack

Use this as your single script: **Phase 1 demo data** → **Phase 2 fresh signup**. All commands were verified on Windows/PowerShell unless noted.

---

## Before you start (once)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run codegen
pnpm run db:push
pnpm demo:provision
```

Confirm automated gate (optional but recommended):

```powershell
pnpm gate:production-ready
pnpm test:e2e:api
```

Playwright onboarding + comms smoke:

```powershell
pnpm e2e:prep
pnpm --filter @workspace/e2e exec playwright test e2e/tests/prod-onboarding-notifications.spec.ts
```

### Environment files

| File | Required |
|------|----------|
| Repo `.env` | `DATABASE_URL`, `CLERK_*`, `LIVIA_DEMO_PASSWORD`, `INTERNAL_OPS_SECRET` |
| `artifacts/livia-dashboard/.env` | `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL=http://127.0.0.1:3001` |
| `artifacts/livia-marketing/.env` | Copy from `.env.example` |
| `artifacts/livia-internal/.env` | Copy from `.env.example` |
| `artifacts/livia-mobile/.env` | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` |

### Optional — onboarding videos (strongly recommended)

In `artifacts/livia-dashboard/.env` add Loom/YouTube URLs:

```env
VITE_ONBOARDING_VIDEO_WELCOME=https://www.loom.com/share/YOUR_ID
VITE_ONBOARDING_VIDEO_CHANNELS=https://www.loom.com/share/YOUR_ID
VITE_ONBOARDING_VIDEO_LIV=https://www.loom.com/share/YOUR_ID
VITE_ONBOARDING_VIDEO_TOUR=https://www.loom.com/share/YOUR_ID
```

Record using [`docs/gtm/loom-onboarding-1.md`](../gtm/loom-onboarding-1.md). Without URLs, text-only guidance still works.

### Optional — web push on desktop

Generate VAPID keys once:

```powershell
npx web-push generate-vapid-keys
```

Add to repo `.env`:

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@livia.io
```

Add to `artifacts/livia-dashboard/.env`:

```env
VITE_VAPID_PUBLIC_KEY=<same public key>
```

Restart API after changing VAPID.

---

## Start the stack (5 terminals)

| # | Command | URL |
|---|---------|-----|
| 1 | `pnpm dev:api` | http://127.0.0.1:3001 |
| 2 | `pnpm dev:dashboard` | http://127.0.0.1:5173 |
| 3 | `pnpm dev:marketing` | http://127.0.0.1:5174 |
| 4 | `pnpm dev:internal` | http://127.0.0.1:5175 |
| 5 | `pnpm dev:mobile:device` | Physical iPhone (Expo Go) |

If port **3001** is busy, stop the old API process before starting a new one.

---

# Phase 1 — Full demo visualization

## 1.1 Web — demo launcher

1. Open http://127.0.0.1:5173/demo  
2. Click doors or use password **`LiviaDemo2026!`** (from `LIVIA_DEMO_PASSWORD`)

| Persona | Email | Lands on |
|---------|-------|----------|
| Founder | `demo-founder@livia.io` | `/chain` |
| Owner | `demo-owner@livia.io` | `/dashboard` |
| Manager | `demo-admin@livia.io` | `/inbox` |
| Senior staff | `demo-staff-senior@livia.io` | `/my-day` |
| Reception | `demo-frontdesk@livia.io` | `/bookings` |

3. **Switch persona** chip (bottom-right) to hop roles without re-provisioning.

## 1.2 Channels + Liv (owner)

1. Settings → **Communications**  
2. Watch **channel setup video** (if URL configured)  
3. Walk **5-step wizard**: priorities → Meta checklist → webhook → paste IDs → **Simulate inbound**  
4. Open **Inbox** — thread with Liv reply + AI disclosure  
5. Settings → **Liv** — tone, greeting, knowledge  
6. Settings → **Push & alerts** — confirm toggles; on desktop allow browser notifications when prompted  

## 1.3 Platform tour

After onboarding progress ~70%+ (demo shops qualify), a **Quick tour** dialog appears with optional video steps.  
Reset for QA: `localStorage.removeItem('livia.platformTour.dismissed.v1')` then reload.

## 1.4 Marketing + internal

| URL | Check |
|-----|-------|
| http://127.0.0.1:5174 | Home, pricing, link to demo |
| http://127.0.0.1:5175 | Paste `INTERNAL_OPS_SECRET`, search `aurora` |

## 1.5 Mobile (physical iPhone)

1. Terminal 5 prints `exp://192.168.x.x:8083` — use **your** IP  
2. Expo Go → scan or enter URL  
3. Allow **notifications** when prompted  
4. Sign in `demo-owner@livia.io` / `LiviaDemo2026!`  
5. Tap a push (or create booking on web) → should open booking or inbox  

**Android emulator (optional):**

```powershell
adb reverse tcp:3001 tcp:3001
pnpm dev:mobile
```

## 1.6 Public customer path

Incognito → http://127.0.0.1:5173/b/aurora-studio — complete a test booking.

## 1.7 Vertical showcases (spot-check)

Open 2–3 slugs from http://127.0.0.1:3001/api/demo/status — e.g. `paws-parlour-dublin`, `clarity-medspa-dublin`, `motion-physio-cork`.

---

# Phase 2 — Fresh signup (your real walkthrough)

1. **Incognito** → http://127.0.0.1:5173/sign-up (not `demo-*` email)  
2. http://127.0.0.1:5173/legal-acceptance — accept platform ToS + Privacy  
3. http://127.0.0.1:5173/onboarding  
   - Watch **welcome video** (if configured)  
   - A1: pick vertical + **legal entity** + attestation checkbox  
   - Complete acts A2–A12 (shop, services, team, hours, **channels wizard**, Liv, public link, go-live checklist + vertical extras)  
4. Run **test booking** on `/b/your-slug`  
5. Complete go-live checklist (tick test booking — **required** to finish A12)  
6. Land on dashboard — **tour** + **notification strip** when pending/handoffs exist  
7. Repeat sign-in on phone with same account  

**Beta invite test (staging):** set `LIVIA_BETA_SIGNUP_MODE=invite` and add your email to `LIVIA_BETA_INVITE_EMAILS` — non-invited emails get 403 on create business.

**Local skip (dev only):** `LIVIA_SKIP_LEGAL_GATE=1` in `.env` skips step 2.

---

## What to verify (checklist)

### Onboarding & training
- [ ] Welcome video plays (or clear text fallback)  
- [ ] Channel wizard completes without support call  
- [ ] Platform tour can be skipped and does not return after dismiss  
- [ ] Onboarding progress banner links back to `/onboarding`  

### Notifications
- [ ] Mobile push on new booking (web: create booking while phone signed in)  
- [ ] Mobile push on simulated WhatsApp inbound  
- [ ] Web amber strip when pending bookings or inbox handoffs  
- [ ] Web push (if VAPID configured) when tab in background  
- [ ] Push toggles in Settings → Communications persist  

### Operations
- [ ] Inbox: WhatsApp + Instagram badges, take over / resume Liv  
- [ ] Bookings: pending approval, running late  
- [ ] Liv books via simulate → staff push “Liv booked” (OWNER/ADMIN)  

### Cross-surface
- [ ] Marketing → demo CTA works  
- [ ] Internal ops tenant card deep links  
- [ ] Mobile settings note points to web for channel wizard  

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Demo password fails | Match `LIVIA_DEMO_PASSWORD` in `.env` |
| No push on phone | Allow notifications; check Expo token registered (sign in again) |
| No web push | Set VAPID keys; restart API; allow browser permission on dashboard |
| Video blank | Use full Loom share URL or YouTube watch URL in `VITE_ONBOARDING_VIDEO_*` |
| Phone cannot reach API | Same Wi‑Fi; use LAN IP from `dev:mobile:device`; Windows firewall |
| Playwright fails sign-in | Run `pnpm demo:provision`; set `E2E_*` in `.env` |

---

## Reference docs

| Doc | Topic |
|-----|-------|
| [`FULL-STACK-LOCAL-RUNBOOK.md`](./FULL-STACK-LOCAL-RUNBOOK.md) | Terminals & ports |
| [`MANUAL-WALKTHROUGH-DEMO.md`](./MANUAL-WALKTHROUGH-DEMO.md) | Demo personas & URLs |
| [`CHANNELS-EU-MESSAGING.md`](../product/CHANNELS-EU-MESSAGING.md) | WhatsApp / IG spec |
| [`NOTIFICATIONS.md`](../product/NOTIFICATIONS.md) | Push architecture |
| [`BETA-ONBOARDING-FLOW.md`](../product/BETA-ONBOARDING-FLOW.md) | Legal, KYB, per-vertical flow |
| [`DEMO-FULL-SHOWCASE.md`](./DEMO-FULL-SHOWCASE.md) | All demo shops |

---

## READY FOR MANUAL E2E

When terminals 1–2 are up, `pnpm demo:provision` succeeded, and you can sign in as `demo-owner@livia.io`, start **Phase 1** above.
