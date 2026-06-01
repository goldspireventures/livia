# Fitness vertical — platform program (V5)

**Status:** program complete · **execution:** Phase V2  
**Registry:** V5 · **beta-full** · demo `peak-fitness-dublin`  
**Reads with:** [`vertical-playbooks/fitness.md`](./vertical-playbooks/fitness.md)

---

## L0 — What Livia means for fitness

Gyms & studios sell **capacity** — classes, waitlists, PT blocks — not 45-min blow-dries.

**One sentence:** *Livia fills classes, drains waitlists, and books PT without three apps.*

### Wow — operator

| Moment | Why |
|--------|-----|
| **Class near capacity** | See fill % on home |
| **Waitlist auto-notify** | Guest accepts offer — slot fills |
| **PT vs class branch** | Correct workflow per service type |
| **Intro assessment** | Free intro → convert to package (R2) |

### Wow — guest

| Moment | Why |
|--------|-----|
| **Join waitlist** | Two taps when class full |
| **Clear PT path** | Not buried in class grid |
| **Remind + cancel policy** | SMS with link |

---

## L1 — Capability

| Layer | Status |
|-------|--------|
| `/classes` W4 | ✅ |
| Waitlist guest surface | ✅ |
| `vertical_overrides.fitness` on book card | ✅ |
| demo-vertical-extras seed | ✅ waitlist |

---

## L2 — Presentation

Default: **`fitness-gym-bold`** (`gym-bold`). Energetic; never body-shaming copy.

---

## L3 — Personas

Manager floor queue; coach my-day; owner class fill briefing.

---

## L4 — Surfaces

| Route | Notes |
|-------|-------|
| `/classes` | Roster |
| `/b/.../waitlist/:token` | Offer accept |
| `/b/{slug}` | PT vs class |

**Fine details:** capacity integer per class instance; no outcome guarantees in Liv copy; waiver optional R1.1.

---

## L5 — Demo

`peak-fitness-dublin`: class near capacity + waitlist in extras seed.

---

## L6 — CI

`all-verticals-smoke` — `/classes`

---

## L7 — Dedicated fitness (scope)

| Bet | Scope |
|-----|--------|
| Membership freeze | R2 |
| Check-in QR | R2 |
| Package session consumption | R2 |
| Coach video intro on `/b` | Brand |

---

## L8 — Completion

Waitlist demo works; classes page loads with seed data; book flow picks correct branch.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial program |
