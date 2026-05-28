# Real-world E2E testing guide (how you would test it)

> **Superseded for beta cohorts:** use [`MANUAL-WALKTHROUGH-BETA.md`](./MANUAL-WALKTHROUGH-BETA.md) — this file is kept for historical context only.

**Status:** v1.0 (2026-05-21)  
**Audience:** founder, QA, design partners  
**Time:** ~3–4 hours for full pass (web + phone + one public booking as a customer)

This mimics **real life**: discover Livia → sign up → set up shop → customer books online → appointment appears on owner phone and dashboard → something breaks → you report it.

---

## 0. Before you start

### Stack to run

| Service | Command | URL |
|---------|---------|-----|
| API | `pnpm run dev:api` | http://localhost:3001 |
| Dashboard | `pnpm run dev:dashboard` | http://localhost:5173 |
| Marketing (optional) | `cd artifacts/livia-marketing && pnpm run dev` | http://localhost:5174 |
| Mobile | `pnpm run dev:mobile` | Expo QR → physical device |

### One-time prep

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run codegen
pnpm run db:push
# Apply 005-onboarding-support.sql if db:push did not add columns
node scripts/seed-demo.mjs
```

**Clerk:** same `pk_test_` key in `artifacts/livia-dashboard/.env` and `artifacts/livia-mobile/.env`.

### Automated smoke (15 min)

```powershell
pnpm --filter @workspace/api-server run test
pnpm test:e2e:api
pnpm test:e2e
# Marketing (with site running):
$env:E2E_MARKETING_URL="http://127.0.0.1:5174"
pnpm --filter @workspace/e2e exec playwright test eu-full-platform
```

---

## 1. Act as a prospect (Phase 1 — livia.io)

**Goal:** First contact feels premium and honest.

| Step | Do | Pass if |
|------|-----|---------|
| 1.1 | Open marketing home | Hero mentions **EU** salons/beauty/barber/tattoo/wellness — **no dental** |
| 1.2 | Open `/pricing` | EUR tiers visible; beta “on the house” clear |
| 1.3 | Open `/how-it-works` | Lists SMS + WhatsApp + Instagram + Messenger in one inbox |
| 1.4 | Open `/verticals/hair` | Vertical-specific copy |
| 1.5 | Submit waitlist form | Success toast / no error |
| 1.6 | Open `/changelog` | Recent entries load |

**Fail killer:** Marketing promises something the app cannot do → check `docs/audits/marketing-vs-reality.md`.

---

## 2. Act as a new EU owner (Phase 2 — onboarding)

**Goal:** Self-serve setup without a sales call.

| Step | Do | Pass if |
|------|-----|---------|
| 2.1 | Dashboard → Sign up (new Clerk user) | Lands on `/onboarding` |
| 2.2 | **Load demo** OR create business: Ireland, Hair, Solo | Business created; wizard shows step 2+ |
| 2.3 | Walk acts: Shop → Services preview → Team → Liv → Channels → Public link | Progress % increases; **Continue** persists after refresh |
| 2.4 | Open public link in **incognito** | `/b/{your-slug}` loads |
| 2.5 | Finish wizard → Dashboard | Banner “Setup X%” gone at 100% |

**Optional:** Second browser as “you tomorrow” — sign in again; progress remembered.

---

## 3. Act as the owner — day one (Phases 3–4)

**Goal:** Shop runs from dashboard + mobile.

### Web (dashboard)

| Step | Do | Pass if |
|------|-----|---------|
| 3.1 | Dashboard | Today/cockpit shows sensible data |
| 3.2 | **Clients** → add client “Anna Test” | Saves; appears in list |
| 3.3 | **Bookings** → New booking wizard | Pick Anna, service, staff, slot → **Confirmed** |
| 3.4 | **Bookings** → open booking | Status transitions work; **Help → Liv misbehaved** sends ticket |
| 3.5 | **Services** / **Staff** | Edit existing seeded rows |
| 3.6 | **Settings** → Liv tone + greeting | Saves |
| 3.7 | **Settings** → Billing | Plan info loads; checkout opens (Stripe test) if configured |
| 3.8 | **Audit log** | Recent human actions visible |
| 3.9 | Sidebar **Help** | Ticket submits |

### Mobile (physical device — flagship)

| Step | Do | Pass if |
|------|-----|---------|
| 3.10 | Sign in same Clerk user | Business loads |
| 3.11 | **My Day** / **Bookings** | Booking from 3.3 visible with correct **local time** |
| 3.12 | **Customers** | Anna Test visible |
| 3.13 | **Settings** | Liv toggle, legal links |

**Fail killer:** Booking on web not on mobile (timezone, wrong business, cache).

---

## 4. Act as a customer (public booking — money path)

**Goal:** No-login customer books; owner sees it everywhere.

Use **incognito** or your phone (not logged in as owner).

| Step | Do | Pass if |
|------|-----|---------|
| 4.1 | Open `https://your-dashboard-host/b/{slug}` | Services list loads |
| 4.2 | Pick service → slot → enter name “Ciara Murphy”, phone, email | Form validates |
| 4.3 | Confirm booking | Confirmation screen; celebration / clear next step |
| 4.4 | Owner: refresh **Bookings** (web) | New booking **PENDING** or **CONFIRMED** |
| 4.5 | Owner: mobile **Bookings** | Same booking appears |
| 4.6 | Optional: public **chat** widget | First message includes AI disclosure |

**Deposit (Phase 4):** If Connect enabled, deposit policy text shows; payment only in test mode.

---

## 5. Act when something breaks (Phases 5–6)

**Goal:** Trust path works.

| Step | Do | Pass if |
|------|-----|---------|
| 5.1 | Cancel a booking from detail | Status **CANCELLED**; audit entry |
| 5.2 | Help → **Bug** “Test from QA” | 201 success; message in toast |
| 5.3 | Internal portal (`pnpm run dev:internal`) → paste ops secret → search tenant | Health card loads |
| 5.4 | Internal → open tickets list (if shown) | Sees open ticket from 5.2 |

---

## 6. Demo path (fast narrated demo — Gate 1)

For investor / partner in 90 seconds:

1. `livia.io` or dashboard `/demo`  
2. Login as demo owner persona  
3. Show **Inbox** + **Bookings** + **public** `/b/luxe-salon-spa`  
4. One sentence: “Liv answers SMS; this is the EU OS for appointment businesses.”

Script: `docs/demo-script.md`

---

## 7. What “better than expected” means

| Area | Bar |
|------|-----|
| **Copy** | Vertical-appropriate (hair vs beauty labels); no generic “Customer Profile” everywhere |
| **Time** | All times in **shop timezone** (Dublin for IE) |
| **Onboarding** | Feels like Duolingo progress, not a single form dump |
| **Public book** | Calm, 4-step, works on mobile browser |
| **Help** | Obvious sidebar; Liv errors pre-filled category |
| **Honesty** | No broken nav; no 500 on happy path |

---

## 8. Social channels — WhatsApp, Instagram, Messenger (launch)

**Spec:** [`docs/product/CHANNELS-EU-MESSAGING.md`](../product/CHANNELS-EU-MESSAGING.md)

### A. Configure (once per environment)

| Step | Do | Pass if |
|------|-----|---------|
| 8.1 | Apply migration `006-messaging-channels.sql` + `pnpm run db:push` | Column `messaging_channels` exists |
| 8.2 | API `.env`: `META_ACCESS_TOKEN`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `META_DEV_SIMULATE=true` | Server boots |
| 8.3 | Meta Developer → Webhook URL = `{PUBLIC_BASE_URL}/api/channels/meta` | Verify challenge succeeds |
| 8.4 | Re-seed demo: `node scripts/seed-demo.mjs` (fresh) OR configure IDs manually | Demo has WA+IG threads |

### B. Owner setup (dashboard)

| Step | Do | Pass if |
|------|-----|---------|
| 8.5 | Settings → Communications → **Social channels** | Panel visible |
| 8.6 | Paste WhatsApp Phone number ID + IG Page ID → Save | Toast success |
| 8.7 | Dev: **Simulate inbound** (WhatsApp) | Toast “check Inbox” |
| 8.8 | Inbox → open **Emma Walsh** (WhatsApp) | Thread shows Liv reply with disclosure |
| 8.9 | Simulate Instagram inbound | Second thread appears |
| 8.10 | Report Liv on IG thread | Support ticket created |

### C. Live Meta (staging/prod)

| Step | Do | Pass if |
|------|-----|---------|
| 8.11 | Message business WhatsApp from personal phone | Inbox thread + Liv reply within ~30s |
| 8.12 | DM business Instagram | Same |

**Wow moment:** Owner sees **one inbox** for web + SMS + WhatsApp + Instagram — no more switching apps.

---

## 9. Known limitations

| Item | Status |
|------|--------|
| Telegram / Viber live transport | v1.5 (documented in channel spec) |
| IE voice regulatory prod number | Phase 7 |
| Legal pages publish | G3 |
| Payroll export | v2.5 |

---

## 10. Sign-off checklist

- [ ] Phases 1–6 happy path above: **pass**  
- [ ] `pnpm test:e2e:api` green  
- [ ] No new `build-before-G2` audit rows  
- [ ] One real device tested (iOS or Android)  
- [ ] One real public booking created and seen on owner calendar  

When all checked → declare **Gate 2 candidate** (plus 7-day soak per launch plan).

---

## 11. Report template (for bugs)

```text
What I did:
What I expected:
What happened:
Business slug:
Booking/customer id (if any):
Screenshot:
Severity: blocking | annoying | nice-to-have
```

Submit via in-app **Help** or `support@livia.io`.
