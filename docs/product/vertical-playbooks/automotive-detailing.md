# Vertical playbook — Automotive detailing (V10)

**Status:** L2+L3 (2026-05-31)  
**Registry:** `VERTICAL_COVERAGE_REGISTRY` V10 · demo `shine-studio-belfast`  
**Category:** People-business — vehicle continuity, long bays, package tiers

---

## 1. Operating reality

- Jobs run 2–5 hours; bay capacity not chair slots.
- Vehicle notes (colour, prior damage) attach to customer continuity.
- GBP pricing on UK demo shop; mobile valet variant optional later.

---

## 2. Vocabulary

| Term | Value |
|------|-------|
| Customer | client |
| Subject | vehicle |
| Provider | detailer |
| Unit | bay |
| Place | studio |

---

## 3. Hero workflows

1. Public book package tier → [`w5.public.book.mobile.yaml`](../design/screen-cards/w5.public.book.mobile.yaml) (`vertical_overrides.automotive-detailing`)
2. Booking detail with vehicle note → [`w4.ops.bookings.detail.web.yaml`](../design/screen-cards/w4.ops.bookings.detail.web.yaml)
3. Owner dashboard utilisation signal → [`w4.owner.dashboard.web.yaml`](../design/screen-cards/w4.owner.dashboard.web.yaml)

---

## 4. Guest surfaces (W5)

| Surface | Route | Required |
|---------|-------|----------|
| storefront | `/b/{slug}` | ✅ package picker |
| visit | `/b/{slug}/visit/:token` | ✅ drop-off instructions |

---

## 5. UX posture

**Soft:** dark premium preset, vehicle silhouette icons  
**Bold:** package comparison on book step  
**Never:** fake before/after guarantees

---

## 6. Demo seed

`shine-studio-belfast`: ≥5 services, GB locale, vehicle note on continuity seed.

---

## 7. Tests

- `all-verticals-smoke.spec.ts` — shine owner routes

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial automotive-detailing vertical playbook |
