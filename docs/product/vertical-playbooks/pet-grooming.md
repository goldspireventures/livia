# Vertical playbook — Pet grooming (V9)

**Status:** L2+L3 (2026-05-31)  
**Registry:** `VERTICAL_COVERAGE_REGISTRY` V9 · demo `paws-parlour-dublin`  
**Category:** People-business — pet profiles, temperament, multi-pet households

---

## 1. Operating reality

- Booking is **pet-scoped**, not just owner-scoped.
- Temperament and handling notes drive staff assignment.
- Multi-pet households book sequential slots.

---

## 2. Vocabulary

| Term | Value |
|------|-------|
| Customer | owner |
| Subject | pet |
| Provider | groomer |
| Unit | table |
| Place | parlour |

---

## 3. Hero workflows

1. Public book with pet picker → [`w5.public.book.mobile.yaml`](../design/screen-cards/w5.public.book.mobile.yaml) (`vertical_overrides.pet-grooming`)
2. Customer detail with pet cards → [`w4.ops.customers.detail.web.yaml`](../design/screen-cards/w4.ops.customers.detail.web.yaml)
3. Mobile customer + pet view → [`w4m.customer.detail.mobile.yaml`](../design/screen-cards/w4m.customer.detail.mobile.yaml)

---

## 4. Guest surfaces (W5)

| Surface | Route | Required |
|---------|-------|----------|
| storefront | `/b/{slug}` | ✅ pet step |
| visit | `/b/{slug}/visit/:token` | ✅ |

---

## 5. UX posture

**Soft:** friendly pet photography, breed labels  
**Bold:** temperament callouts on confirm  
**Never:** anthropomorphic Liv jokes that trivialize handling risk

---

## 6. Demo seed

`paws-parlour-dublin`: **2 pets** (Biscuit + Mochi) on demo customers per [`DEMO-WORLD-LIVE-SPEC.md`](../DEMO-WORLD-LIVE-SPEC.md).

---

## 7. Tests

- `public-booking-quality.spec.ts` — paws slug

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial pet-grooming vertical playbook |
