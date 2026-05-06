# Livia phase status (elite pack — reconciled with repo)

## Purpose

This file is part of the **elite docs** pack. The original pack used a **different phase numbering** than this repository.

**Canonical implementation phases:** [../LIVIA_BUILD_PLAN.md](../LIVIA_BUILD_PLAN.md) **Part D** (Phase **0–7**).

**Delivery slices after the core API:** [../TRANCHES.md](../TRANCHES.md) (T0–T6).

Cursor should use **LIVIA_BUILD_PLAN Part D** for “what phase are we in?” and this file for **crosswalk + release-oriented gaps**.

---

## Global build state (this repo)

Livia is **API-first** with a thin web shell. Foundation through **Phase 7 (Stripe PaymentIntent + webhook + `Payment` on success)** is implemented per Part D; see [../LIVIA_STATUS_SUMMARY.md](../LIVIA_STATUS_SUMMARY.md).

---

## Canonical status — LIVIA_BUILD_PLAN Part D

| Phase | Name | Status | Notes |
|---:|---|---|---|
| 0 | Project foundation | Complete | `src/`, Prisma, build, CI, docs spine |
| 1 | Business + membership | Complete | Tenant root, `membershipService`, events |
| 2 | Staff + services + assignments | Complete | Tenant-nested APIs |
| 3 | Customers + channel identities | Complete | |
| 4 | Bookings | Complete | Overlap rules; **slot listing engine** still a product gap |
| 5 | Availability rules + time off | Complete | Staff-scoped routes |
| 6 | Feature flags + payment intent **records** | Complete | DB + APIs; outbound Stripe in Phase 7 |
| 7 | Stripe adapter + webhooks | Complete | `src/services/payments/*`, `POST /api/webhooks/stripe` |

**Next product/engineering work** (not necessarily “Phase 8” in Part D yet — add there when you lock scope):

- Real **auth** (replace temp `userId` / `actorUserId`) — [../TRANCHES.md](../TRANCHES.md) **T1**
- **Slot engine + public booking** — **T2**
- **Owner dashboard UI** — **T3**
- **Notifications** — **T4**
- **AI spine** — **T5**
- **Messaging scaffolds** — **T6**
- Stripe **Connect** / `PaymentAccount` onboarding — follow-up after core payments stable

---

## Crosswalk — old elite phase table → canonical

The zip’s original table numbered phases differently. Use this mapping when reading old notes only:

| Elite (historical) | Topic | Maps to |
|---:|---|---|
| 0 | Foundation | BLIQ **Phase 0** |
| 1 | Business + membership | BLIQ **Phase 1** |
| 2 | Staff + services | BLIQ **Phase 2** |
| 3 | Availability + time off | BLIQ **Phase 5** (same work; different number) |
| 4 | Slot engine | **Not shipped** — tranche **T2** |
| 5 | Customer + booking | BLIQ **Phases 3–4** |
| 6 | Public booking flow | **Not shipped** — tranche **T2** |
| 7 | Dashboard MVP | **Partial** (minimal UI) — tranche **T3** |
| 8 | Payments + deposits | BLIQ **Phases 6–7** (+ future Connect) |
| 9 | Notifications | **Not shipped** — tranche **T4** |
| 10 | Auth | **Temporary auth only** — tranche **T1** |
| 11 | Storefront | **Not shipped** |
| 12 | Messaging | **Not shipped** — tranche **T6** scaffold |
| 13 | AI + ops | **Not shipped** — tranche **T5** |
| 14 | Platform ops | **Partial** (events, feature flags; no admin console) |
| 15 | Testing + hardening | **Partial** (CI build/lint/typecheck; limited automated tests) |

---

## Current priority (product)

1. **Auth (T1)** — unblock production trust path.  
2. **Slot engine + public booking (T2)** — complete the customer booking loop.  
3. **Dashboard (T3)** — owner runs day without Postman.

Do not derail into storefronts, full messaging, or heavy AI until **T2** is credible — see [LIVIA_SOURCE_OF_TRUTH.md](./LIVIA_SOURCE_OF_TRUTH.md) §8 and [../TRANCHES.md](../TRANCHES.md).

---

## Phase completion standard

A slice is “done” when:

- `npm run build` (and CI) pass  
- Tenant scoping and role checks hold  
- Important mutations emit `logEvent` where applicable  
- Assumptions/TODOs documented  

---

## Cursor instruction

```text
Read docs/LIVIA_BUILD_PLAN.md (Part A + Part D), docs/elite/README.md, docs/elite/LIVIA_PHASE_STATUS.md (this file),
docs/elite/LIVIA_API_STANDARD.md for API shape, and prisma/schema.prisma. Then implement the requested work.
```
