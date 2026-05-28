# Contextual UX review — web first, mobile second

**Date:** 2026-05-22  
**Method:** For each surface ask — *What is Livia here? Who is looking? What do they want right now?*  
**Evidence:** `pnpm e2e:contextual-web` (82 PNGs under `e2e/visual-captures/web/`), code walk of `persona-rituals.ts`, mobile `(tabs)/_layout.tsx`.

**Companion:** [`WEB-MOBILE-PARITY.md`](./WEB-MOBILE-PARITY.md)

---

## Cross-cutting (all personas)

| Finding | Severity | Recommendation | Status |
|---------|----------|----------------|--------|
| **Onboarding banner** (“Setup 8%…”) on most signed-in pages in demo | Info | Expected until onboarding complete; dismiss or hide when `onboardingComplete` | Documented |
| **Persona headers** (greeting, ritual title, Liv line) match persona job | Pass | Keep in sync when adding surfaces | OK |
| **Demo override** in sidebar/footer aids review | Info | Dev-only; hidden in production | OK |
| **Audit log empty** in fresh demo | Info | Seed demo actions or document “search human.persona.view” tip | OK |
| **Public booking** `/b/luxe-salon-spa` loads without auth | Pass | — | OK |
| **Second-shop onboarding** `?intent=second-shop` | Pass (web) | Verify same on mobile | Partial |

---

## Founder (multi-shop owner)

**Job:** See all shops, drill into one, trust + inbox + growth.

| Surface | What is Livia? | Pass / issue | Action |
|---------|----------------|--------------|--------|
| Glance `/chain` | Portfolio pulse; open shop | Pass — cards, week signal | — |
| Today `/dashboard` | Shop-scoped day after drill-in | Pass — no Cross-shop badge when scoped | — |
| Inbox | Cross-shop or shop queue | Pass — summary previews, takeover | — |
| Bookings + `?create=1` | Dialog create | Pass | — |
| Customers / Staff | Roster + CRM | Pass | — |
| Lifecycle | Sell/transfer guidance | Pass (content) | Mobile explainer P1 |
| Audit | Trust trail | Pass UI; empty data in demo | Mobile audit list shipped |
| Settings (all tabs) | Full ops config | Pass | Mobile: policy/billing/team tabs gap |
| Second-shop onboarding | Add location | Pass | Mobile parity TBD |

---

## Owner (single salon)

**Job:** Run today — inbox, floor, team, billing.

| Surface | What is Livia? | Pass / issue | Action |
|---------|----------------|--------------|--------|
| Today | Owner home — refunds, DMs, Saturday fill | Pass | — |
| Inbox | Approve / reply | Pass | — |
| Bookings | Floor + new booking dialog | Pass | Mobile: `pendingReason` labels ✅ |
| Team / customers | Ops data | Pass | — |
| Audit / lifecycle | Owner trust | Pass web | Mobile audit ✅; lifecycle gap |
| Settings | Shop, policy, Liv, comms, billing | Pass web | Mobile read-only comms OK; policy editor web-only |

---

## Manager

**Job:** Queue first — approvals, floor, view-as staff.

| Surface | What is Livia? | Pass / issue | Action |
|---------|----------------|--------------|--------|
| Queue `/inbox` | Home = what needs sign-off | Pass | — |
| Today | Secondary pulse | Pass | — |
| Bookings / customers / staff | Run the floor | Pass | — |
| Settings | Liv + comms + team (no billing) | Pass | — |
| View-as staff → `/my-day` | Audit preview | Pass web | Mobile: no view-as link P2 |

---

## Staff (senior / junior → `staff` on mobile)

**Job:** My chair — next client, today’s list, my regulars.

| Surface | What is Livia? | Pass / issue | Action |
|---------|----------------|--------------|--------|
| My chair `/my-day` | Focused schedule + Liv line | Pass — Mo, 1 appt, confirmed badge | Minor: sidebar title clip on narrow layout P2 |
| Bookings | Full list + filters | Pass | — |
| Customers | My clients | Pass | — |
| Settings | Shop view-only + legal | Pass | — |

---

## Receptionist (front desk)

**Job:** Calendar first, messages, walk-ins.

| Surface | What is Livia? | Pass / issue | Action |
|---------|----------------|--------------|--------|
| The floor `/bookings` | Home = who's in / due | Pass — Siobhan greeting, Liv “4 on floor” | — |
| Inbox | Messages | Pass | — |
| Customers | Lookup / add | Pass | — |
| Settings | Comms + legal | Pass | — |

---

## Public (customer)

| Surface | What is Livia? | Pass / issue | Action |
|---------|----------------|--------------|--------|
| `/b/:slug` | Book without account | Pass — service/slot flow | Vanity `/{slug}` = CDN rewrite only |

---

## Broader improvements (not persona-specific)

1. **Reduce onboarding banner noise** for demo reviewers who only want product surfaces — collapse to settings after first dismiss.
2. ~~**Seed audit events**~~ — `demo-audit.seed.ts` on provision.
3. **Morning briefing** on mobile Today tab (web dashboard widget).
4. ~~**Policy read-only on mobile**~~ — `OperationalPolicyBlock` + edit on web.
5. ~~**Lifecycle on mobile**~~ — shipped `/lifecycle`.
6. ~~**Maestro**~~ — `pnpm maestro:visual-capture` (requires CLI + simulator).
7. **WhatsApp / channel merge** — inbox v1.5 per `UX-AUDIT-2026-05-21.md`.

---

## Mobile manual checklist

Run on device with `pnpm dev:mobile:device` after API + Clerk env set.

| Persona | Check |
|---------|-------|
| Founder | Shops tab, switch business, More → Lifecycle, Audit (filters + load more), inbox reply |
| Owner | Today, bookings pending reason, settings policy block + Liv toggle |
| Manager | Approvals queue, settings policy read-only |
| Staff | My day, booking detail |
| Receptionist | Bookings filter, inbox |

---

## Automation

| Command | Output |
|---------|--------|
| `pnpm e2e:contextual-web` | `e2e/visual-captures/web/<persona>/*.png` |
| `pnpm e2e:founder-checklist` | `e2e/visual-captures/auth/*.png` |
| `pnpm maestro:visual-capture` | `e2e/visual-captures/mobile/*.png` — see [`maestro/README.md`](../../maestro/README.md) |

Re-run after UX fixes; add failing persona/route to the spec if a new surface ships.

---

## Change log

**2026-05-22 (initial)** — `contextual-audit-web`, review docs, mobile audit + pendingReason.

**2026-05-22 (parity pass 2)**

- Mobile `/lifecycle` + More menu; web deep links for ownership
- Mobile settings **Booking policy** read-only (`OperationalPolicyBlock`) + edit on web
- Mobile audit: action class, date range, load more
- Demo provision seeds ~9 audit rows per flagship shops (`demo-audit.seed.ts`)
- Maestro flows: `capture-owner-tabs`, `capture-founder-more`
