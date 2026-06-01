# Vertical playbook — Wellness (V3)

**Status:** L2+L3 (2026-05-31)  
**Program (L0–L8):** [`WELLNESS-VERTICAL-PROGRAM.md`](../WELLNESS-VERTICAL-PROGRAM.md)  
**Registry:** `VERTICAL_COVERAGE_REGISTRY` V3 · demo `harbour-wellness-cork`, `copenhagen-havn-wellness`  
**Category:** People-business — rooms, vouchers, quiet hours

---

## 1. Operating reality

- Room-based capacity (not chair-minute hair model).
- Gift vouchers and packages common; locale affects quiet hours.
- Liv uses calm register; no diagnosis language.

---

## 2. Vocabulary

| Term | Value |
|------|-------|
| Customer | guest |
| Provider | therapist |
| Unit | room |
| Place | studio / spa |

---

## 3. Hero workflows

1. Public book by session length → [`w5.public.book.mobile.yaml`](../design/screen-cards/w5.public.book.mobile.yaml)
2. Day packages / vouchers (owner) → [`w4.ops.day-packages.web.yaml`](../design/screen-cards/w4.ops.day-packages.web.yaml)
3. Multi-premises public landing (when enabled) → [`w5.public.premises.mobile.yaml`](../design/screen-cards/w5.public.premises.mobile.yaml)

---

## 4. Guest surfaces (W5)

| Surface | Route | Required |
|---------|-------|----------|
| storefront | `/b/{slug}` | ✅ |
| visit | `/b/{slug}/visit/:token` | ✅ |
| premises | `/p/{slug}` | multi-location only |

---

## 5. UX posture

**Soft:** generous whitespace, nature imagery, slow motion  
**Bold:** package upsell on confirm beat  
**Never:** clinical medspa copy on wellness tenants

---

## 6. Demo seed

Harbour + Havn: ≥5 services, voucher data stub, DK locale on `copenhagen-havn-wellness` (market seed).

---

## 7. Tests

- `public-booking-quality.spec.ts` — wellness slugs where provisioned

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial wellness vertical playbook |
