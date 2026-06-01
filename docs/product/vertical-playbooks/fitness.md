# Vertical playbook — Fitness (V7)

**Status:** L2+L3 (2026-05-31)  
**Program (L0–L8):** [`FITNESS-VERTICAL-PROGRAM.md`](../FITNESS-VERTICAL-PROGRAM.md)  
**Registry:** `VERTICAL_COVERAGE_REGISTRY` V5 · demo `peak-fitness-dublin`  
**Category:** People-business — classes, waitlists, PT blocks

---

## 1. Operating reality

- Class capacity + waitlist distinct from 1:1 appointment grid.
- PT intro assessments often free; conversion to block packages.
- Liv handles waitlist notify — no performance guarantees.

---

## 2. Vocabulary

| Term | Value |
|------|-------|
| Customer | member / client |
| Provider | coach / trainer |
| Unit | slot / class |
| Place | studio / gym |

---

## 3. Hero workflows

1. Public book PT vs class branch → [`w5.public.book.mobile.yaml`](../design/screen-cards/w5.public.book.mobile.yaml) (`vertical_overrides.fitness`)
2. Class roster near capacity → [`w4.ops.classes.web.yaml`](../design/screen-cards/w4.ops.classes.web.yaml)
3. Waitlist guest surface → [`w5.public.waitlist.mobile.yaml`](../design/screen-cards/w5.public.waitlist.mobile.yaml)

---

## 4. Guest surfaces (W5)

| Surface | Route | Required |
|---------|-------|----------|
| storefront | `/b/{slug}` | ✅ |
| waitlist | `/b/{slug}/waitlist/:token` | when class full |

---

## 5. UX posture

**Soft:** energetic preset, coach photos  
**Bold:** waitlist join CTA, class countdown  
**Never:** body-shaming or outcome promises

---

## 6. Demo seed

`peak-fitness-dublin`: class session near capacity + waitlist in `demo-vertical-extras.seed.ts`.

---

## 7. Tests

- `all-verticals-smoke.spec.ts` — peak `/classes`

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial fitness vertical playbook |
