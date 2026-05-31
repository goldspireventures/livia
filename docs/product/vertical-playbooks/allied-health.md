# Vertical playbook — Allied health (V8)

**Status:** L2+L3 (2026-05-31)  
**Registry:** `VERTICAL_COVERAGE_REGISTRY` V8 · demo `motion-physio-cork`  
**Category:** People-business — care plans, rebook cadence, not EHR

---

## 1. Operating reality

- Initial assessment + follow-up cadence; insurer references optional.
- Liv schedules and reminds — **never** diagnoses or prescribes.
- Strong audit expectation for who changed appointment notes.

---

## 2. Vocabulary

| Term | Value |
|------|-------|
| Customer | patient / client |
| Provider | practitioner |
| Unit | treatment room |
| Place | practice / clinic |

---

## 3. Hero workflows

1. Public book assessment → [`w5.public.book.mobile.yaml`](../design/screen-cards/w5.public.book.mobile.yaml)
2. Customer continuity / plan rebook → [`w4.ops.customers.detail.web.yaml`](../design/screen-cards/w4.ops.customers.detail.web.yaml)
3. Staff day with back-to-back sessions → [`w4.staff.my-day.mobile.yaml`](../design/screen-cards/w4.staff.my-day.mobile.yaml)

---

## 4. Guest surfaces (W5)

| Surface | Route | Required |
|---------|-------|----------|
| storefront | `/b/{slug}` | ✅ |
| visit | `/b/{slug}/visit/:token` | ✅ |
| intake | `/b/{slug}/intake/:token` | optional health questionnaire |

---

## 5. UX posture

**Soft:** professional, accessible typography, plain language  
**Bold:** assessment vs follow-up service clarity  
**Never:** medical advice in Liv copy

---

## 6. Demo seed

`motion-physio-cork`: ≥5 services, plan-style follow-up bookings in expanded seed.

---

## 7. Tests

- `all-verticals-smoke.spec.ts` — motion owner dashboard

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial allied-health vertical playbook |
