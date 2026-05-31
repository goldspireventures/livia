# Empty, error, and loading states catalog

**Status:** canonical (2026-05-31) — **P0 complete**  
**Purpose:** No screen ships with a generic spinner or blank page — every route has designed states.

**Parent:** [`UI-UX-MASTER-PROGRAM.md`](./UI-UX-MASTER-PROGRAM.md) · P0 routes in [`VISUAL-SCREEN-MASTER-INVENTORY.md`](./VISUAL-SCREEN-MASTER-INVENTORY.md)

---

## 1. Global patterns

| State | Web | Mobile | Copy tone |
|-------|-----|--------|-----------|
| **Loading** | Skeleton matching layout | Same | No text or subtle "Loading…" |
| **Empty** | Illustration optional + one action CTA | Icon + CTA | Encouraging, not guilty |
| **Error** | Banner + retry + requestId | Toast + retry | Human, not stack trace |
| **Offline** | Offline banner sticky | NetInfo banner | "You're offline — showing cached" |
| **Permission** | Persona explanation | Same | "Ask your manager for access" |

---

## 2. P0 routes (24)

Each row: **Loading** → skeleton shape · **Empty** → copy + CTA · **Error** → copy + retry.

### W5 — Public guest

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| **w5.public.book** | Hero + 3 service rows | "Online booking opens soon" → message CTA | "Something went wrong" + retry |
| **w5.public.proof** | Image frame skeleton | "No proof to review" | "This link expired" + contact shop |
| **w5.public.visit** | Visit card skeleton | — (token required) | "We couldn't find this visit" |
| **w5.public.intake** | Form skeleton | — | "Form unavailable" + retry |
| **w5.public.pay** | Amount + method skeleton | — | "Payment link expired" + contact |

### W4 — Tenant web

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| **w4.owner.dashboard** | KPI strip + briefing skeleton | "Let's set up your first service" → `/services` | "Briefing unavailable" amber strip |
| **w4.owner.chain** | Shop cards skeleton | "Add your first location" → onboarding | "Couldn't load portfolio" |
| **w4.ops.inbox** | Thread list skeleton | "Inbox clear — Liv is watching channels" | "Messages couldn't load" |
| **w4.ops.settings** | Section skeleton | — | "Settings couldn't save" + retry |
| **w4.ops.bookings.list** | Table skeleton | "No bookings yet" → `/bookings/new` | "Couldn't load bookings" |
| **w4.ops.bookings.new** | Wizard step skeleton | — | Step-level inline error |
| **w4.ops.design-proofs** | Grid skeleton | "No proofs yet" → upload CTA | "Proofs couldn't load" |
| **w4.ops.medspa.hub** | Queue skeleton | "All clear — no pending consents" | "Hub unavailable" |

### W4 — Tenant mobile

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| **w4.staff.my-day** | Hero + 2 booking cards | "Your day is open" | Pull to refresh |
| **w4m.notifications** | List skeleton | "No notifications" | Toast + retry |
| **w4m.founder.shops** | Shop list skeleton | "No shops in portfolio" | Retry |

### W2 — Gateway

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| **w2.gateway.sign-in** | Form skeleton | — | Clerk error inline |
| **w2.gateway.onboarding** | Step skeleton | — | "Complete {step} to continue" |
| **w2.gateway.legal-accept** | Doc skeleton | — | Accept blocked banner |
| **w2.gateway.demo.launcher** | Persona grid skeleton | Demo disabled message | Provision failed + retry |
| **w2.gateway.demo.wedge** | Vertical story skeleton | — | Unknown vertical 404 |

### W1 — Marketing

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| **w1.marketing.home** | Hero skeleton | — | Static fallback copy |
| **w1.marketing.pricing** | Tier skeleton | — | "Pricing unavailable" |

### W3 — Internal

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| **w3.support.thread** | 3-column shell skeleton | "Select a ticket" | requestId banner |
| **w3.internal.exec.cockpit** | Module grid skeleton | "No work events yet" | Shiplane degraded banner |

---

## 3. Motion on state change

- Empty → content: `enter-page` token
- Error appear: `alert-in` — no shake animation
- Loading → content: crossfade 200ms — no layout shift

---

## 4. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | P0 empty/error/loading catalog started |
| 2026-05-31 | All 24 P0 routes documented |
