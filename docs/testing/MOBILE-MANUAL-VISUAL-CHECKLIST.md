# Mobile manual visual checklist

**When:** Your laptop cannot run the Android emulator reliably. Run this on a **physical device** or TestFlight build while we verify **code + API parity** in CI (`pnpm pls:mobile-parity`).

**Maps to:** PLS Waves 6–10 (web) · Maestro flows in `maestro/flows/` · [`WEB-MOBILE-PARITY.md`](../product/WEB-MOBILE-PARITY.md)

**Demo sign-in:** shared demo password from `.env` / `LIVIA_DEMO_PASSWORD` · owner: `owner-bloom@demo.livia-hq.com` · API `:3000` via `adb reverse` if local.

---

## A. Cold open & gateway (Maestro: `capture-cold-open-gateway.yaml`)

| Step | What to verify | testID / cue |
|------|----------------|--------------|
| A1 | App opens to **Guest / Operator / Demo** gateway | `app-entry-gateway` |
| A2 | **Guest** → My Livia sign-in (phone/email) | `entry-gateway-guest` → `guest-hub-send-code` |
| A3 | Back → **Operator** → email sign-in | `entry-gateway-operator` → `email-input` |
| A4 | **Demo** → wedge grid → beauty story | `entry-gateway-demo` → `mobile-demo-launcher` |
| A5 | Sign in as **owner** → lands on **Today** | Tab label "Today" |

**Pass if:** No dev errors, no "staging demo" copy, gateway matches web G1 intent.

---

## B. Owner tabs (Maestro: `capture-owner-tabs.yaml`)

| Step | Screen | Match web PLS |
|------|--------|---------------|
| B1 | **Today** — briefing, Liv moments, new booking | W7 `/dashboard` |
| B2 | **Bookings** — list + filters | W7 `/bookings` |
| B3 | **Clients** — roster search | W7 `/customers` |
| B4 | **Inbox** — threads, Liv assist FAB | W7 `/inbox` |
| B5 | **More** → Settings | W7 settings tabs (shop, Liv, comms readout) |
| B6 | **More** → Staff, Services | W7 `/staff`, `/services` |
| B7 | **More** → Shared premises / Day packages (if visible) | W8 vertical |
| B8 | **More** → Audit log | W7 `/audit` |
| B9 | Today → **New booking** full screen | W7 `/bookings/new` |

---

## C. Personas (Maestro: `capture-persona-*.yaml`)

| Persona | Home tab | Must see |
|---------|----------|----------|
| Staff | My day | Chair schedule, no admin clutter |
| Receptionist | Bookings | Floor list |
| Manager | Approvals / Inbox | Queue, not owner billing |
| Founder | Glance (shops) + Today | Chain rollup strip |

Switch persona via demo guide or demo sign-in roster (same as web demo).

---

## D. Guest flows (PLS W6 — web parity)

| Step | Flow | Notes |
|------|------|-------|
| D1 | Gateway → Guest → OTP → **vault home** | Same API as web `/my` |
| D2 | Account link → channel preferences | `guest-hub-account` |
| D3 | Open **public book** link (browser) from settings copy | Web `/b/{slug}` — not native |
| D4 | Visit link from SMS/email (browser) | Token visit page |

Native **guest-surface** screens should load pay/proof/intake without raw HTTP errors.

---

## E. Vertical slices (PLS W8 — owner More menu)

Sign in as owner for each demo slug; open **More** and confirm vertical hub appears:

| Vertical | Demo slug | Mobile menu item |
|----------|-----------|------------------|
| Medspa | clarity-medspa-dublin | Clinical hub |
| Body art | ink-anchor-galway | Design proofs |
| Event vendors | atelier-decor-dublin | Enquiries, Quotes, Event website |
| Beauty | bloom-beauty-dublin | Take-home shop |
| Hair host | clipchair-host-dublin | Host floor |
| Wellness | harbour-wellness-cork | Day packages, Shared premises |

---

## F. Onboarding & migration (PLS W4/W10)

| Step | Check |
|------|-------|
| F1 | Fresh onboarding intent visible after sign-up |
| F2 | Migration panel shows **honest limits** (no fake Connect) |
| F3 | Presentation preset readout on Settings |

---

## G. Known acceptable gaps (do not file as P1)

- **Billing / team / full preset editor** — web-first (open in browser CTA is OK)
- **Toolkit / Liv command** — web-only
- **Public book wizard** — mobile browser, not native shell
- **Premium motion** on Today entry — may lag web slightly

---

## H. Sign-off

| Check | You | Date |
|-------|-----|------|
| A Gateway | ☐ | |
| B Owner tabs | ☐ | |
| C Personas | ☐ | |
| D Guest | ☐ | |
| E Verticals | ☐ | |
| F Onboarding | ☐ | |
| CI `pnpm pls:mobile-parity` green | ☐ | |

Log issues in support with `surfaceId: mobile` + screenshot + route (e.g. `/(tabs)/index`).
