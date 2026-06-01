# Body art vertical — platform program (V4)

**Status:** program complete · **execution:** Phase V2  
**Registry:** V4 · **beta-full** · demo `ink-anchor-galway`  
**Reads with:** [`vertical-playbooks/body-art.md`](./vertical-playbooks/body-art.md)

---

## L0 — What Livia means for body art

Tattoo & piercing: **consult → design → approve → deposit → session → heal**. DM chaos is the enemy.

**One sentence:** *Livia ends the Instagram DM pipeline — proof approval and deposit on one branded thread.*

### Wow — operator

| Moment | Why |
|--------|-----|
| **Design proof desk** | Approve/reject with audit trail |
| **Deposit binds slot** | Industry standard; no Venmo chase |
| **Consult vs session services** | Correct durations in catalog |
| **Pipeline home** | Kanban module — interest → booked |

### Wow — guest

| Moment | Why |
|--------|-----|
| **`/proof/:token`** | Zoom-level approve on phone — competitor wow |
| **Intake uploads** | References attached to booking |
| **Pay deposit once** | Stripe on book |
| **Healing check-in SMS** | Link back — M2/M3 |

*Research:* Tattoo Studio Pro, LVL2, inkStar — deposit+intake+SMS in one flow is table stakes; **Livia differentiator = same OS as salon + medspa with proof surface native.*

---

## L1 — Capability

| Layer | Status |
|-------|--------|
| `/design-proofs` W4 | ✅ |
| Guest proof surface | ✅ `guest-surfaces` |
| Wedge G1-A reference | ✅ clarity standard |
| Booking guards | ✅ consult fields |

**Gaps:** flash day numbered sheet (R2); revision rounds on proof (R1.1 annotations).

---

## L2 — Presentation

Default: **`body-art-studio-dark`** (`studio-dark`). Targets: design-proofs web + proof mobile sample.

---

## L3 — Personas

Artist staff my-day; owner pipeline; guest never sees dashboard.

---

## L4 — Surfaces

| Surface | Route |
|---------|-------|
| Proof approve | `/b/{slug}/proof/:token` |
| Book consult | `/b/{slug}` |
| Pay | `/b/{slug}/pay/:token` |
| W4 proofs | `/design-proofs` |

**Fine details:** session blocks 3–6h; healing disclaimer in SMS; minor age gate in guards; never AI-generate designs.

---

## L5 — Demo

`ink-anchor-galway`: **1 proof awaiting approval** with live token — hero artifact.

Tests: `demo-proof-token.spec.ts` (target).

---

## L6 — CI

`all-verticals-smoke` ink · proof token API

---

## L7 — Dedicated body art (scope)

| Bet | Scope |
|-----|--------|
| Flash day picker | Numbered designs + slot grid (LVL2-style) |
| Multi-session sleeve plan | Linked bookings |
| Annotation on proof | R1.1 |
| Aftercare PDF on visit | Guest |

---

## L8 — Completion

Proof flow demoable in <3 min; owner desk usable daily; wedge interstitial signed.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial program |
