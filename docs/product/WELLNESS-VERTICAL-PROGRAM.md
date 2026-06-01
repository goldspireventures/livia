# Wellness vertical — platform program (V3)

**Status:** program complete · **execution:** Phase V2  
**Registry:** V3 · **beta-full** · demo `harbour-wellness-cork` · market `copenhagen-havn-wellness`  
**Reads with:** [`vertical-playbooks/wellness.md`](./vertical-playbooks/wellness.md)

---

## L0 — What Livia means for wellness

Wellness & spa trades **speed** for **calm** — rooms, therapists, packages, gift economics.

**One sentence:** *Livia is the quiet scheduler for massage and holistic studios — rooms, vouchers, and gentle SMS, never clinical medspa fear.*

### Wow — operator

| Moment | Why |
|--------|-----|
| **Room utilisation** | See which rooms free vs double-book risk |
| **Voucher liability** | Packages sold vs redeemed (R2 depth) |
| **Multi-location glance** | Harbour + Havn pattern for DK flagship |
| **Calm inbox** | DM requests without alarm-red UI |

### Wow — guest

| Moment | Why |
|--------|-----|
| **Pick session length** | 60 vs 90 vs couples — clear grid |
| **Gift-ready confirm** | Copy suitable for “buy for someone” |
| **Visit prep** | Hydration, arrival, parking — on visit token |
| **Premises picker** | `/p/{slug}` when multi-site |

---

## L1 — Capability

| Layer | Status |
|-------|--------|
| Vocabulary guest/therapist/room | ✅ |
| Day packages route | ✅ owner |
| Guest surfaces storefront + visit | ✅ |
| premises public | ✅ when enabled |

**Gaps:** voucher ledger UI; quiet-hours locale (DK) copy pack.

---

## L2 — Presentation

Default: **`wellness-spa-calm`** (`spa-calm`). Alt: zen-light, retreat-dark.

| Item | Status |
|------|--------|
| Web CSS presets | 🟡 partial vs beauty |
| Target mocks | [`VERTICAL-TARGET-MOCK-PROGRAM.md`](../design/VERTICAL-TARGET-MOCK-PROGRAM.md) — visit extra |

---

## L3 — Personas

Owner calm briefing; therapist my-day; reception books rooms not chairs.

---

## L4 — Surfaces

| Route | Notes |
|-------|-------|
| `/b/harbour-wellness-cork` | Book flow |
| `/b/.../visit/:token` | Day-of |
| `/p/...` | Multi-premises optional |
| W4 day-packages | Owner |

**Fine details:** never use medspa consent UI; couples room = service variant; cancellation window in policy footer on `/b`.

---

## L5 — Demo

| Slug | Role |
|------|------|
| `harbour-wellness-cork` | IE showcase |
| `copenhagen-havn-wellness` | DK locale, DKK, market seed |

---

## L6 — CI

`public-booking-quality` · `all-verticals-smoke`

---

## L7 — Dedicated wellness (scope)

| Bet | Scope |
|-----|--------|
| Gift voucher purchase on `/b` | R2 |
| Membership minutes bank | R2 |
| Therapist preference + gender request | R1.1 guard fields |
| Sound-bath / event series | Classes pattern borrow |

---

## L8 — Completion

5-path founder smoke + spa-calm preset on web + demo depth per seed spec.

---

## Market — Denmark (V-DK)

`copenhagen-havn-wellness`: locale `da-DK`, currency display, EU SMS disclosure — same pack, different market ribbon.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial program |
