# Medspa vertical — platform program (V6)

**Status:** program complete · **execution:** Phase V2 (founder UAT active)  
**Registry:** V6 · **beta-full** · demo `clarity-medspa-dublin`  
**Reads with:** [`vertical-playbooks/medspa.md`](./vertical-playbooks/medspa.md)

---

## L0 — What Livia means for medspa

High-consideration aesthetics: **consent, deposit, practitioner time** — not an EHR.

**One sentence:** *Livia protects clinical time — consent and deposit before the room, mandate queue on the hub.*

### Wow — operator

| Moment | Why |
|--------|-----|
| **Consent queue** | Today’s procedures missing sign-off — visible first |
| **Medspa hub** | Mandate + intakes + waitlist — busiest work surface |
| **Deposit before chair** | Reduces no-show on expensive treatments |
| **Audit trail** | Who changed notes — support-ready |

### Wow — guest

| Moment | Why |
|--------|-----|
| **Consent on `/b`** | Sign before confirm — mobile-friendly |
| **Calm clinic brand** | Not salon neon |
| **Visit + prep** | Honest EU disclosure in SMS |
| **Pay deposit** | `/pay/:token` |

**Fine line:** Liv never recommends procedures or diagnoses — copy reviewed for G3.

---

## L1 — Capability

| Layer | Status |
|-------|--------|
| `/medspa` hub | ✅ |
| Intake guest surface | ✅ |
| Medspa guards | ✅ |
| Procedures list API | ✅ |

---

## L2 — Presentation

Default: **`medspa-clinical-calm`** (`clinical-calm`). Luxury-serif alt.

---

## L3 — Personas

Owner hub-first; practitioner my-day; front desk inbox + bookings.

---

## L4 — Surfaces

| Surface | Route |
|---------|-------|
| Hub | `/medspa` |
| Intake | `/b/{slug}/intake/:token` |
| Book | `/b/clarity-medspa-dublin` |
| Pay / visit | ✅ |

**Fine details:** separate medspa vocabulary from beauty; waitlist for consult requests; incident logging for adverse events (R2).

---

## L5 — Demo & UAT

Clarity: consent template + 1 pending consent booking.  
Founder UAT: 10 paths — [`FOUNDER-UAT-CHECKLIST.md`](../operations/FOUNDER-UAT-CHECKLIST.md).

---

## L6 — CI

`founder-uat-p0` medspa · P0 northstar medspa hub

---

## L7 — Dedicated medspa (scope)

| Bet | Scope |
|-----|--------|
| Before/after photos | Consent-gated storage R2 |
| Treatment plan series | Linked bookings |
| Physician oversight queue | Partner |
| HIPA-like retention policy | Ops program |

**Out of scope:** full EHR, prescribing, AI skin analysis claims.

---

## L8 — Completion

Founder medspa UAT signed + consent step on `/b` + hub queue non-empty in demo.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial program |
