# Full testing instructions — web + mobile

**Use this before you sign off a release.** Automated checks are listed first; manual scenarios follow.

---

## 0. One-time environment

Copy `.env` from `.env.example`. Required for live demo:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` or `SUPABASE_DATABASE_URL` | Postgres |
| `CLERK_SECRET_KEY` + publishable keys in dashboard/mobile | Auth |
| `LIVIA_DEMO_PASSWORD` | Demo users (default `LiviaDemo2026!`) |
| `ANTHROPIC_API_KEY` | Liv assist / chat (optional for UI-only) |

---

## 1. Automated gate (run in order)

Open **three terminals** after closing old ones:

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"

# Terminal A — data + provision (no server needed)
pnpm db:migrate:sql
pnpm db:push
pnpm demo:provision

# Terminal B — API (restart after every pull that touches api-server)
pnpm dev:api

# Terminal C — web
pnpm dev:dashboard
```

With API up, from a fourth terminal:

```powershell
pnpm smoke:platform          # health + 7 public slugs + demo status
pnpm --filter @workspace/api-server run test   # unit tests
pnpm run typecheck           # all artifacts + libs
pnpm test:e2e:api            # Playwright API + full-platform-demo
```

Optional visual regression (needs Clerk + Playwright auth file):

```powershell
pnpm e2e:prep
pnpm e2e:founder-checklist
pnpm e2e:visual-capture
pnpm e2e:contextual-web
```

Mobile-only typecheck:

```powershell
pnpm --filter @workspace/livia-mobile run typecheck
```

**Pass bar:** `typecheck`, `api-server test`, `smoke:platform`, and `test:e2e:api` all green.

---

## 2. Web vs mobile — what is the same (verified in code)

| Feature | Web | Mobile |
|---------|-----|--------|
| Liv moments | Dashboard strip | Today tab `LivMomentsCard` |
| Stuck continuity | Dashboard / command hub | Today `StuckContinuityCard` |
| Liv memory | Customer detail panel | Client `LivMemoryCard` |
| Liv tool caps | Settings → Liv catalog (edit) | Settings → capabilities (read + web hint) |
| Inbox Ask Liv | OPEN + HANDED_OFF chips | Same API `/liv-assist` |
| Booking timeline | Booking detail panel | `BookingTimelineCard` |
| Chain / Glance | `/chain` | Glance tab + rollup |
| Demo **live** data | `/demo` → Clerk ticket | **Sign-in** with `demo-*@livia.io` (see below) |

**Intentional web-first (not bugs):** billing, ownership, full policy editor, tool catalog toggles, premises co-tenant editor, medspa clinical hub, design proofs, toolkit page.

**Mobile `/demo` cards:** marketing showcase only — **not** live DB. For real mobile demo use **Sign-in** or **More → Demo guide**.

Canonical parity: [`../product/WEB-MOBILE-PARITY.md`](../product/WEB-MOBILE-PARITY.md).

---

## 3. Provision demo world

```powershell
pnpm demo:provision
```

Expect **18 businesses** including `london-rose-spa`, `berlin-studio-neun`, `paris-belle-vue`.

Web alternative: http://localhost:5173/demo → **Set up full demo world**.

---

## 4. Web manual scenarios

### 4.1 Demo gateway
- [ ] `/demo` — provision, 7 persona cards, live showcase links
- [ ] Public `/b/aurora-studio`, `/b/london-rose-spa` load

### 4.2 Founder — `demo-founder@livia.io`
- [ ] `/chain` — multi-shop pulse
- [ ] `/dashboard` — Liv moments (≥1 card)
- [ ] `/inbox` — HANDED_OFF thread, Ask Liv on OPEN + HANDED_OFF
- [ ] Switch shop → London / Berlin / Paris (business switcher)
- [ ] `/customers` → open client → **Liv memory** add note
- [ ] `/settings?tab=liv` — tool catalog toggle + sync catalog
- [ ] `/bookings` — today + pending labels
- [ ] `/bookings/:id` — continuity timeline panel

### 4.3 Owner — `demo-owner@livia.io`
- [ ] Lands `/dashboard` (not chain)
- [ ] Single shop Conor's Cut only in switcher

### 4.4 Manager — `demo-admin@livia.io`
- [ ] Lands `/inbox`
- [ ] Can confirm pending booking

### 4.5 Staff — `demo-staff-senior@livia.io`
- [ ] Lands `/my-day`
- [ ] Cannot open Settings → Liv catalog (role)

### 4.6 Reception — `demo-frontdesk@livia.io`

**Password:** `LIVIA_DEMO_PASSWORD` in `.env` (default **`LiviaDemo2026!`** — not `LiveDemo2026!`).

**Sign-in:** On `/sign-in`, use the **Demo account (direct sign-in)** form (Clerk ticket — no “extra verification”). Or run `POST /demo/sync-clerk` after provision if an old Clerk user was created via Google/sign-up.
- [ ] Lands `/bookings`

### 4.7 Break / stress (web)
- [ ] Create booking same staff + overlapping time → expect conflict error
- [ ] Rapid refresh dashboard — moments still load, no duplicate crash
- [ ] Sign out → sign in different persona → correct landing route
- [ ] Dismiss a Liv moment → stays dismissed on refresh

---

## 5. Mobile manual scenarios

Start API + mobile:

```powershell
pnpm dev:api
pnpm dev:mobile:device
# or pnpm dev:mobile for simulator
```

**Do not use `/demo` persona cards for live data.** Use sign-in.

### 5.1 Sign-in
- [ ] `demo-founder@livia.io` + password from `.env`
- [ ] More → **Demo guide** — spotlight shops switch context

### 5.2 Founder mobile
- [ ] **Glance** tab — chain cards, tap shop → Today
- [ ] **Today** — briefing, Liv moments, stuck continuity, next booking
- [ ] **Inbox** — thread list, HANDED_OFF badge, Ask Liv chips work (loading state)
- [ ] **Bookings** tab — list + open detail → timeline card
- [ ] **Clients** → open → **Liv memory** view/add
- [ ] **More → Settings** — Liv switch + **capabilities** card
- [ ] Pull-to-refresh Today — no crash

### 5.3 Owner mobile — `demo-owner@livia.io`
- [ ] Today (not Glance-only founder flow)
- [ ] New booking wizard `/booking/new` completes or shows slot conflict

### 5.4 Manager — `demo-admin@livia.io`
- [ ] Opens **Approvals** tab first (auto redirect from Today)
- [ ] Pending booking visible

### 5.5 Staff — `demo-staff-senior@livia.io`
- [ ] **My day** tab only (redirect from Today)
- [ ] Limited More menu (no audit if STAFF)

### 5.6 Break / stress (mobile)
- [ ] Background app → resume — session + business context intact
- [ ] Switch business in More — data refetches, no stale inbox
- [ ] Airplane mode → friendly error on pull-to-refresh (not white screen)
- [ ] Persona override in More (dev only) — does **not** replace Clerk; sign out for real RBAC test

---

## 6. Public / customer paths (no login)

| URL | Check |
|-----|--------|
| `/b/aurora-studio` | Book flow, AI disclosure |
| `/b/clarity-medspa-dublin` | Consent step |
| `/b/london-rose-spa` | GB shop loads |
| `/p/dundrum-house` | Premises picker |

---

## 7. What “production worthy” does not mean yet

Still gated (documented, not launch blockers for design partners):

- Medspa legal copy per country (counsel)
- Voice marketing claims (eval pass)
- SOC2 enterprise marketing
- Mobile: logo URL, full policy edit, billing (web-first by design)

---

## 8. If something fails

| Symptom | Fix |
|---------|-----|
| Empty inbox / no bookings | `pnpm demo:provision` |
| 401 on all API calls | Clerk keys; sign in again |
| Missing London shop | Re-provision; restart API after pull |
| `country` undefined on public API | Restart `pnpm dev:api` after build |
| Mobile “Switch persona” wrong RBAC | Sign out; use demo email sign-in |
| Migration errors | `pnpm db:migrate:sql` then `pnpm db:push` |

---

## 9. Quick reference — demo accounts

| Email | Role | Web landing | Mobile home |
|-------|------|-------------|-------------|
| demo-founder@livia.io | Founder | `/chain` | Glance |
| demo-owner@livia.io | Owner | `/dashboard` | Today |
| demo-admin@livia.io | Manager | `/inbox` | Approvals |
| demo-staff-senior@livia.io | Staff | `/my-day` | My day |
| demo-staff-junior@livia.io | Staff | `/my-day` | My day |
| demo-frontdesk@livia.io | Reception | `/bookings` | Bookings |

Password: `LIVIA_DEMO_PASSWORD` (default `LiviaDemo2026!`).

---

## 10. Docs & repo

- Layout: [`../engineering/REPO-LAYOUT.md`](../engineering/REPO-LAYOUT.md)
- Production structure plan: [`../engineering/PRODUCTION-REPO-STRUCTURE.md`](../engineering/PRODUCTION-REPO-STRUCTURE.md)
- Shorter demo checklist: [`MANUAL-WALKTHROUGH-DEMO.md`](./MANUAL-WALKTHROUGH-DEMO.md)
