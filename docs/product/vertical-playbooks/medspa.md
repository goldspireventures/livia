# Vertical playbook — Medspa (V6)

**Status:** L2+L3 (2026-05-31)  
**Program (L0–L8):** [`MEDSPA-VERTICAL-PROGRAM.md`](../MEDSPA-VERTICAL-PROGRAM.md)  
**Registry:** `VERTICAL_COVERAGE_REGISTRY` V6 · demo `clarity-medspa-dublin`  
**Category:** People-business — consent-first, not EHR

---

## 1. Operating reality

- Practitioner-led treatments; high consideration; deposit + informed consent norm.
- Liv **never** diagnoses or recommends procedures.
- Partner counsel required for clinical claims (G3).

---

## 2. Vocabulary

| Term | Value |
|------|-------|
| Customer | patient / client (tenant choice in vocabulary pack) |
| Provider | practitioner |
| Unit | treatment room |
| Place | clinic |

---

## 3. Hero workflows

1. Public book with **consent gate** → [`w5.public.intake.mobile.yaml`](../design/screen-cards/w5.public.intake.mobile.yaml)
2. Owner **medspa hub** mandate queue → [`w4.ops.medspa.hub.web.yaml`](../design/screen-cards/w4.ops.medspa.hub.web.yaml)
3. Deposit via [`w5.public.pay.mobile.yaml`](../design/screen-cards/w5.public.pay.mobile.yaml)

---

## 4. Guest surfaces (W5)

| Surface | Route | Required |
|---------|-------|----------|
| storefront | `/b/{slug}` | ✅ |
| consent | `/b/{slug}/intake/:token` | ✅ |
| deposit-pay | `/b/{slug}/pay/:token` | ✅ |
| visit | `/b/{slug}/visit/:token` | ✅ |

---

## 5. UX posture

**Soft:** consent copy, procedure explanations, calm whitespace  
**Bold:** deposit CTA, missing-consent alerts on owner hub  
**Never:** before/after promises, AI treatment advice

---

## 6. Demo seed (Clarity)

Per [`DEMO-WORLD-LIVE-SPEC.md`](../DEMO-WORLD-LIVE-SPEC.md): consent template, 1 today procedure missing consent, medspa services ≥5.

---

## 7. Tests

- `public-booking-quality.spec.ts` — medspa consent step
- `all-verticals-smoke.spec.ts` — clarity owner `/medspa`

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial medspa vertical playbook |
