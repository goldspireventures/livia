# Vertical playbook — Hair (V1)

**Status:** L2+L3 (2026-05-31)  
**Program (L0–L8):** [`HAIR-VERTICAL-PROGRAM.md`](../HAIR-VERTICAL-PROGRAM.md)  
**Registry:** `VERTICAL_COVERAGE_REGISTRY` V1 · demo `luxe-salon-spa`, `aurora-studio`, `conors-cut-co`  
**Category:** People-business — colour cycles, chair utilisation, regulars memory

---

## 1. Operating reality

- Mixed walk-in + appointment; colour services block long slots.
- Liv remembers client preferences (colour line, stylist) — never invents formulas.
- Chair-rental org shape common; host must not see renter client PII.

---

## 2. Vocabulary

| Term | Value |
|------|-------|
| Customer | client |
| Provider | stylist / barber |
| Unit | chair / station |
| Place | shop / salon (tenant-facing OK in hair pack) |

---

## 3. Hero workflows

1. Public book with stylist preference → [`w5.public.book.mobile.yaml`](../design/screen-cards/w5.public.book.mobile.yaml)
2. Owner morning briefing + colour-heavy day → [`w4.owner.dashboard.web.yaml`](../design/screen-cards/w4.owner.dashboard.web.yaml)
3. Staff My Day ritual → [`w4.staff.my-day.mobile.yaml`](../design/screen-cards/w4.staff.my-day.mobile.yaml)

---

## 4. Guest surfaces (W5)

| Surface | Route | Required |
|---------|-------|----------|
| storefront | `/b/{slug}` | ✅ |
| visit | `/b/{slug}/visit/:token` | ✅ |
| pay | `/b/{slug}/pay/:token` | deposit where enabled |

---

## 5. UX posture

**Soft:** warm photography, stylist names, regulars copy  
**Bold:** next-available CTA, deposit on long colour  
**Never:** generic “salon software” dashboard tone in tenant UI

---

## 6. Demo seed

Per [`DEMO-WORLD-LIVE-SPEC.md`](../DEMO-WORLD-LIVE-SPEC.md): ≥5 services, ≥3 staff, ≥20 customers, ≥4 today bookings on `luxe-salon-spa`.

---

## 7. Tests

- `public-booking-quality.spec.ts` — hair slug
- `demo-live-day.spec.ts` — luxe-salon-spa services visible

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial hair vertical playbook |
