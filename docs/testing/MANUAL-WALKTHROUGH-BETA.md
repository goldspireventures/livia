# Beta manual walkthrough — founder & design partners

**Purpose:** Step-by-step script after automated E2E passes. If any step fails, note the screen, persona, and the `x-request-id` from the API response (or browser Network tab).

**Automated gate (run first):**

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
node scripts/e2e-prep.mjs
# Terminal 1: pnpm dev:api
# Terminal 2: pnpm dev:dashboard
# Terminal 3 (optional): pnpm dev:marketing   → :5174
# Terminal 4 (optional): pnpm dev:internal   → :5175
pnpm smoke:gate3
pnpm test:e2e:api
pnpm test:e2e
pnpm e2e:founder-checklist
```

**Env (all surfaces):**

| Copy template → `.env` | Surface |
|------------------------|---------|
| [`.env.example`](../../.env.example) | Repo root — DB, Clerk, `INTERNAL_OPS_SECRET`, URLs |
| [`artifacts/livia-dashboard/.env.example`](../../artifacts/livia-dashboard/.env.example) | App cockpit :5173 |
| [`artifacts/livia-marketing/.env.example`](../../artifacts/livia-marketing/.env.example) | **livia.io** :5174 |
| [`artifacts/livia-internal/.env.example`](../../artifacts/livia-internal/.env.example) | **Internal ops** :5175 |
| [`artifacts/livia-mobile/.env.example`](../../artifacts/livia-mobile/.env.example) | Expo (optional) |

Demo password: `LIVIA_DEMO_PASSWORD` (default: `LiviaDemo2026!`). Internal UI: paste same value as `INTERNAL_OPS_SECRET` at http://localhost:5175 (not Clerk).

**Screenshots (after Playwright):**

| Folder | Contents |
|--------|----------|
| `e2e/visual-captures/auth/*.png` | Founder checklist (chain, premises, packages, …) |
| `e2e/visual-captures/auth-*.png` | Full authenticated audit |
| `e2e/visual-captures/p_dundrum-house.png` | Public premises picker |
| `e2e/visual-captures/marketing/*.png` | livia.io pages |
| `e2e/visual-captures/web/<persona>/` | All personas (run `pnpm e2e:contextual-web`) |

---

## 0. Fresh demo world (every session)

1. Open http://localhost:5173/demo  
2. Click **Provision demo world** (or API: `POST http://127.0.0.1:3001/api/demo/provision`).  
3. **Pass:** “Demo world loaded”, 15 businesses listed in API logs (`demo.provision.ok`, `business_count: 15`).  
4. **Pass:** `GET http://127.0.0.1:3001/api/demo/status` → `provisioned: true`.

---

## 1. Founder — multi-shop chain (Aoife)

| Step | Action | Pass criteria |
|------|--------|----------------|
| 1.1 | On `/demo`, click **Founder** card | Lands on `/chain` (not sign-in wall) |
| 1.2 | Chain glance | See Aurora Studio / Mews / Galway + pulse or “shops at a glance” |
| 1.3 | Open **Stoneybatter Cuts** or **Dublin Barber Collective** from chain if listed | Dashboard loads for that shop |
| 1.4 | `/dashboard` | Today / flight plan visible |
| 1.5 | `/inbox` | At least one conversation thread |
| 1.6 | `/bookings` | Calendar or floor view; open **New booking** (`?create=1`) — dialog opens |
| 1.7 | `/premises` | Dundrum House or “shared address” premises list |
| 1.8 | `/day-packages` | “Harbour Day Escape” or empty state (switch business to **Harbour Wellness Cork**) |
| 1.9 | `/settings?tab=policy` | Operational policy / deposit copy |
| 1.10 | `/audit` | Audit log entries |
| 1.11 | Chain → click another shop card “open today” | URL → `/dashboard`, tenant switched |

**Credentials (fallback):** `demo-founder@livia.io` / `LIVIA_DEMO_PASSWORD`

---

## 2. Single-shop owner (Conor)

| Step | Action | Pass criteria |
|------|--------|----------------|
| 2.1 | `/demo` → **Owner** | `/dashboard` for Conor's Cut Co. |
| 2.2 | `/my-day` (if linked staff) or `/bookings` | Today’s appointments |
| 2.3 | `/customers` | Customer list with history |

**Credentials:** `demo-owner@livia.io`

---

## 3. Staff personas

| Persona | Email | Landing | Check |
|---------|-------|---------|-------|
| Manager | demo-admin@livia.io | `/inbox` | Can view inbox, not owner-only billing |
| Senior stylist | demo-staff-senior@livia.io | `/my-day` | Own column / day view |
| Junior (Conor’s) | demo-staff-junior@livia.io | `/my-day` | Conor’s Cut staff |
| Reception | demo-frontdesk@livia.io | `/bookings` | Front-desk booking view |

Use **demo launcher** one-tap sign-in when possible.

---

## 4. Public booking (customer)

| URL | Scenario |
|-----|----------|
| http://localhost:5173/b/aurora-studio | Flagship salon booking |
| http://localhost:5173/b/stoneybatter-cuts | Solo barber |
| http://localhost:5173/b/harbour-wellness-cork | Wellness / massage |
| http://localhost:5173/p/dundrum-house | **Shared premises** — pick Hair vs Spa tenant |

**Pass:** Service list loads, slot picker or chat widget, no 404. Complete a test booking on one slug; confirm it appears under founder **Bookings** for that business.

---

## 5. Vertical showcase (spot-check 3)

Pick any three — each should have staff, services, and bookings/live day:

- `bloom-beauty-dublin` — beauty  
- `paws-parlour-dublin` — pet + pet profile  
- `motion-physio-cork` — **Care series** on a customer (ACL rehab 6 sessions)  
- `clarity-medspa-dublin` — medspa consult flow  
- `ink-anchor-galway` — tattoo consult  

**Founder:** Switch business in header → open **Customers** → select customer with care series → panel shows sessions.

---

## 6. Shared premises & day packages

| Step | Action | Pass |
|------|--------|------|
| 6.1 | `/p/dundrum-house` | Two tenants: Dundrum Hair + Serenity Spa |
| 6.2 | Book via spa tenant slug `/b/dundrum-serenity-spa` | Booking created |
| 6.3 | Founder → Harbour Wellness → `/day-packages` | “Harbour Day Escape” package visible |

---

## 7. livia.io — marketing site (:5174)

**Prep:** `artifacts/livia-marketing/.env.example` → `.env` (demo CTA → dashboard).

| Step | URL | Pass |
|------|-----|------|
| 7.1 | http://localhost:5174/ | Home loads; “Try demo” / CTA points to dashboard demo |
| 7.2 | /pricing | No “dental” positioning; plans readable |
| 7.3 | /for/chair-rental | Chair-rental landing copy |
| 7.4 | /how-it-works | Flow makes sense |
| 7.5 | /status | Page loads (API probe if `VITE_API_BASE_URL` set) |

**Automated:** `pnpm test:e2e:marketing` (with `pnpm dev:marketing` running).

---

## 8. Internal ops — Livia Inc console (:5175)

**Prep:** Same `INTERNAL_OPS_SECRET` in repo `.env` as you paste in the UI.

| Step | Action | Pass |
|------|--------|------|
| 8.1 | http://localhost:5175 | Secret gate → unlock |
| 8.2 | Search `aurora-studio` | Tenant row + detail |
| 8.3 | Platform health | v3 block, tenant count |
| 8.4 | Deep links | Dashboard + public booking links open |

**Automated:** `pnpm test:e2e` includes `internal-gate` project when API + internal dev servers are up.

---

## 9. UX pass (layout, motion, clarity)

Use this checklist while clicking — not a separate session.

| Check | Pass |
|-------|------|
| **One theme** — cyan actions, serif headlines, no random colors per page | |
| **Persona accent** — ritual header shows Founder/Owner stripe + Liv line | |
| **Motion** — pages fade/slide in (not hard cuts); cards lift on hover | |
| **Loading** — skeletons, not blank screens (chain, premises, packages) | |
| **Vertical cues** — `/p/dundrum-house` shows badges (Hair vs Wellness); banner in app chrome | |
| **Day packages** — service **dropdown**, not raw UUID field | |
| **Responsive** — resize to phone width: premises tenants stack; chain cards readable | |
| **Public picker** — tenant cards feel tappable; keyboard Enter works | |

Design contract: [`../design/PRODUCT-UX-SYSTEM.md`](../design/PRODUCT-UX-SYSTEM.md) · Mobile: [`../design/MOBILE-UX-PRINCIPLES.md`](../design/MOBILE-UX-PRINCIPLES.md)

---

## 10. Mobile app (Expo)

**Prep:** Copy [`artifacts/livia-mobile/.env.example`](../../artifacts/livia-mobile/.env.example) → `.env`. API on `:3001`. Physical device: set `EXPO_PUBLIC_API_BASE_URL` to your LAN IP (not `localhost`).

```powershell
# Terminal A — API (if not running)
pnpm dev:api
# Terminal B — Metro (simulator)
pnpm dev:mobile
# Physical iPhone/Android on same Wi‑Fi
pnpm dev:mobile:device
```

| Step | Action | Pass |
|------|--------|------|
| 10.1 | Sign in `demo-founder@livia.io` / `LIVIA_DEMO_PASSWORD` | Lands on Today or redirects per persona |
| 10.2 | **Glance** tab (founder) | Pulse badges OK/Watch/Act; weekly stats; tap shop → **Today** for that location |
| 10.3 | **More** → Shared premises | Dundrum House listed; public link opens browser `/p/dundrum-house` |
| 10.4 | Switch business to **Harbour Wellness Cork** → More → Day packages | Harbour Day Escape (or empty + web CTA) |
| 10.5 | **Bookings** / **Inbox** tabs | Lists load; open booking detail |
| 10.6 | **Settings** (More) | Policy read-only; “Edit on web” opens dashboard |
| 10.7 | Manager persona (dev switcher if enabled) | More → My chair preview → My day screen |

**Automated:** `pnpm --filter @workspace/livia-mobile run typecheck` · `pnpm maestro:visual-capture` (Maestro CLI + booted simulator).

---

## 11. Logging sanity (production-grade)

With API terminal visible:

1. Trigger any failing action intentionally (bad slug) → API logs **warn** with `request_id`, `path`, `status`.  
2. Successful `POST /api/demo/provision` → `event: demo.provision.ok`, `business_count: 15`.  
3. Response JSON errors include `requestId` for support tickets.  
4. Every HTTP line includes `request_id`, `duration_ms`, `status`.

---

## 12. What to file if something breaks

1. Persona + exact URL  
2. Screenshot  
3. `x-request-id` from response header or JSON `requestId`  
4. Last 20 lines from API terminal for that request_id  

---

## Related docs (no duplicate walkthroughs)

| Doc | Use for |
|-----|---------|
| [E2E-RUNBOOK.md](./E2E-RUNBOOK.md) | Terminal commands, port conflicts |
| [FOUNDER-FIRST-LOGIN.md](./FOUNDER-FIRST-LOGIN.md) | First-time Clerk + DB setup |
| [UAT-CERTIFICATION.md](./UAT-CERTIFICATION.md) | Formal certification checklist |

**Older guides** (`REAL-WORLD-E2E-GUIDE.md`, `V2-FULL-E2E-INSTRUCTIONS.md`) are historical — use **this file** for beta cohort walkthroughs.
