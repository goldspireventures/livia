# Full Livia experience — your personal E2E playbook

This is the end-to-end script for experiencing **all of Livia** like a real company: separate logins per role, real data, tailored landing routes, public customer flow, and internal ops.

Phases 0–10 built backend and incremental UI. **Persona rituals** (see `docs/product/PERSONA-UX.md`) tailor nav, home, and Liv copy per role — same design system, different keys. **This playbook** is how you *feel* the whole product locally.

---

## Prerequisites (once)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run codegen
pnpm run db:push
```

Root `.env` (minimum):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres |
| `CLERK_SECRET_KEY` | API + demo user provisioning |
| `CLERK_PUBLISHABLE_KEY` | Also in dashboard/mobile `.env` |
| `LIVIA_DEMO_PASSWORD` | Shared password for `demo-*@livia.io` (default dev: `LiviaDemo2026!`) |
| `INTERNAL_OPS_SECRET` | Internal console at :5175 |

Optional: `DASHBOARD_PUBLIC_URL=http://localhost:5173`

---

## Terminals

| # | Command | URL |
|---|---------|-----|
| 1 | `pnpm dev:api` | API :3001 |
| 2 | `pnpm dev:dashboard` | Web :5173 |
| 3 | `pnpm dev:internal` | Internal :5175 |
| 4 | `pnpm dev:mobile:device` | Expo (phone) |

---

## Step 1 — Provision the demo world (one click)

Open **http://localhost:5173/demo** (no login required).

Click **Set up full demo world**. This:

- Creates **6 Clerk users** (`demo-founder@livia.io`, …)
- Seeds **11 demo businesses**: Aurora chain (3), Conor's Cut, plus vertical showcases (beauty, wellness, tattoo, pet grooming, medspa, allied health, fitness). See `docs/testing/DEMO-FULL-SHOWCASE.md` for all `/b/*` URLs.
- Links **memberships + staff rows** (Lara, Mo, Niamh, …)
- Adds customers, bookings, availability

Re-run anytime to reset.

---

## Step 2 — Sign in as each persona

Still on **/demo**, click a door. Each issues a **Clerk ticket** and lands on the right screen:

| Door | Email | Lands on | What to verify |
|------|-------|----------|----------------|
| **Founder** | `demo-founder@livia.io` | `/chain` | Aurora chain + switcher for all showcase shops (Paws, Clarity, Motion, Peak, …) |
| **Owner** | `demo-owner@livia.io` | `/dashboard` | Single shop, billing |
| **Manager** | `demo-admin@livia.io` | `/inbox` | Approvals, conversations |
| **Senior staff** | `demo-staff-senior@livia.io` | `/my-day` | Lara's chair, today's bookings |
| **Junior staff** | `demo-staff-junior@livia.io` | `/my-day` | Mo at Conor's Cut |
| **Reception** | `demo-frontdesk@livia.io` | `/bookings` | Calendar-first |
| **Customer** | (no login) | `/b/aurora-studio` | Public booking + chat |

**Switch persona** chip (bottom-right) returns to `/demo` without losing provisioned data.

### Manual password sign-in (web or mobile)

On **/sign-in**, use any `demo-*@livia.io` email + `LIVIA_DEMO_PASSWORD` (or default `LiviaDemo2026!` in dev).

Mobile: same emails on the sign-in screen after provision.

---

## Step 3 — Three onboarding tracks

### A · Public / customer

1. Incognito → **http://localhost:5173/b/aurora-studio**
2. Pick service, staff, slot; book as Mary would.
3. Optional: use public chat if enabled for the shop.

### B · Business users

1. `/demo` → provision → enter each door above.
2. Founder: switch Aurora Studio / Mews / Galway; open **Chain**.
3. Owner/Manager: **View as** staff in sidebar (audited preview).
4. Settings → Integrations, AI, billing (owner only).

### C · Livia internal

1. **http://localhost:5175**
2. Paste `INTERNAL_OPS_SECRET`
3. Search `aurora` → health card → deep links (Stripe, Clerk, tenant dashboard, public booking).

Internal staff **do not** use tenant Clerk sessions (see `docs/policy/impersonation-audit.md`).

---

## Web surfaces map

| Route | Who |
|-------|-----|
| `/demo` | Persona launcher (live sign-in) |
| `/portal` | Signed-in hub (setup + links) |
| `/guides` | In-app E2E summary |
| `/b/:slug` | Public customer |
| `/my-day` | Staff |
| `/dashboard`, `/inbox`, `/bookings` | Admin/owner |
| `/chain` | Multi-shop owner |
| `/audit` | Owner transparency |
| `/onboarding` | New real signup (not demo) |

---

## Mobile

1. Same Clerk app; provision from web `/demo` first (Clerk users are shared).
2. **More → Experience hub** — seed shortcut + doors (subset of web).
3. Password sign-in as `demo-staff-senior@livia.io` etc.

Web-only today: Audit, Integrations, Chain rollup.

---

## What “full Livia” still means honestly

| Included now | Not yet “production complete” |
|--------------|-------------------------------|
| 6 real Clerk logins + 4 seeded businesses | 200 customers / 25 conversations per shop (gateway spec target) |
| Role-based nav + landing redirects | Full visual redesign / marketing parity |
| Public booking + tenant app + internal ops | Gate 3 (App Store, paid Stripe, legal) |
| Demo audit on persona switch | Nightly prod demo reset cron |
| E2E docs + in-app guides | Separate Clerk *instances* per environment beyond dev |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Demo world not provisioned” | Run **Set up full demo world** on `/demo` |
| “CLERK_NOT_CONFIGURED” | Set `CLERK_SECRET_KEY` on API, restart `pnpm dev:api` |
| Empty after sign-in | Re-provision; pick door again |
| `businesses.map is not a function` | Hard refresh; ensure API running |
| Mobile can’t reach API | LAN IP in `EXPO_PUBLIC_API_URL` + `CLERK_PUBLISHABLE_KEY` |

---

## Quick smoke

```powershell
pnpm smoke:gate3
pnpm test:e2e:api
```

---

## Related docs

- `docs/demo-gateway.md` — spec (now implemented for local dev)
- `docs/personas.md` — hotel principle
- `docs/testing/QUICKSTART.md` — short terminal copy-paste
