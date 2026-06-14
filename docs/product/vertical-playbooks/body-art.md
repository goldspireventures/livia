# Vertical playbook — Body art (V4)

**Status:** L2+L3 (2026-05-31)  
**Program (L0–L8):** [`BODY-ART-VERTICAL-PROGRAM.md`](../BODY-ART-VERTICAL-PROGRAM.md)  
**Registry:** V4 · demo `ink-anchor-galway`  
**Reference wedge:** G1-A interstitial clarity standard

---

## 1. Operating reality

- Consult ≠ session; design proof binds deposit; long session blocks not 30-min slots.
- Pipeline: DM interest → consult → proof → approve → session → healing cadence.

---

## 2. Hero workflows

1. **Design proofs desk** → studio artwork, publish rights, replace/revision → [`BODY-ART-DESIGN-PROOF-PROGRAM.md`](../BODY-ART-DESIGN-PROOF-PROGRAM.md)
2. **Guest proof approve** → Design \| On skin → [`w5.public.proof.mobile.yaml`](../design/screen-cards/w5.public.proof.mobile.yaml)
3. **Owner pipeline home** — kanban module on dashboard (body-art preset)

---

## 3. Guest surfaces

| Surface | Route |
|---------|-------|
| storefront | `/b/{slug}` — CTA "Request consult" |
| proof | `/b/{slug}/proof/:token` |
| deposit-pay | `/b/{slug}/pay/:token` |
| visit | `/b/{slug}/visit/:token` |

---

## 4. UX posture

**Bold:** dark studio chrome, proof hero image, approve/reject  
**Soft:** healing check-in copy (M2/M4 channel links)

---

## 5. Demo seed

1 proof **awaiting approval** with live token URL; consult + session services.

---

## 6. Tests

- `demo-proof-token.spec.ts` (target)
- `all-verticals-smoke` ink-anchor
