# Vertical playbook — Beauty (V2)

**Status:** L2+L3 (2026-05-31) · **program (L0–L8):** [`BEAUTY-VERTICAL-PROGRAM.md`](../BEAUTY-VERTICAL-PROGRAM.md)  
**Registry:** `VERTICAL_COVERAGE_REGISTRY` V2 · demo `bloom-beauty-dublin`  
**Category:** People-business — lash cycles, patch tests, retail attach

---

## 1. Operating reality

- Short services stacked; patch-test gates for colour/lash.
- Liv tracks fill cycles and rebook windows — no medical claims.
- Often colocated with hair; shares booking shell, different service taxonomy.

---

## 2. Vocabulary

| Term | Value |
|------|-------|
| Customer | client |
| Provider | therapist / nail tech |
| Unit | station |
| Place | studio |

---

## 3. Hero workflows

1. Public book lash/nail menu → [`w5.public.book.mobile.yaml`](../design/screen-cards/w5.public.book.mobile.yaml)
2. Inbox reschedule with fill timing → [`w4.ops.inbox.web.yaml`](../design/screen-cards/w4.ops.inbox.web.yaml)
3. Services catalog with categories → [`w4.ops.services.web.yaml`](../design/screen-cards/w4.ops.services.web.yaml)

---

## 4. Guest surfaces (W5)

| Surface | Route | Required |
|---------|-------|----------|
| storefront | `/b/{slug}` | ✅ |
| visit | `/b/{slug}/visit/:token` | ✅ |

---

## 5. UX posture

**Soft:** pastel preset option, treatment names precise  
**Bold:** patch-test reminder on relevant services  
**Never:** clinical language unless medspa pack

---

## 6. Demo seed

`bloom-beauty-dublin`: ≥5 services (lash, nails, brows), ≥3 staff, live inbox threads.

---

## 7. Tests

- `all-verticals-smoke.spec.ts` — bloom owner routes

---

## 8. Completion checklist (R1)

See [`BEAUTY-VERTICAL-PROGRAM.md`](../BEAUTY-VERTICAL-PROGRAM.md) § Completion definition — founder UAT: [`FOUNDER-UAT-CHECKLIST.md`](../../operations/FOUNDER-UAT-CHECKLIST.md) Bloom section.

---

## 9. Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Linked hierarchical program + Bloom UAT |
| 2026-05-31 | Initial beauty vertical playbook |
