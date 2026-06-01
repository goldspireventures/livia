# Pet grooming vertical — platform program (V9)

**Status:** program complete · **execution:** Phase V2  
**Registry:** V9 · **beta-full** · demo `paws-parlour-dublin`  
**Reads with:** [`vertical-playbooks/pet-grooming.md`](./vertical-playbooks/pet-grooming.md)

---

## L0 — What Livia means for pet grooming

The customer is the **owner**; the subject is the **pet**. Temperament is safety-critical.

**One sentence:** *Livia schedules pets, not people-names on a calendar — Biscuit’s notes follow Biscuit.*

### Wow — operator

| Moment | Why |
|--------|-----|
| **Pet cards on customer** | Multi-pet households visible |
| **Temperament at chair** | Groomer sees handling notes before table |
| **Sequential multi-pet book** | One owner, two slots |
| **Playful but professional UI** | Pet photography presets |

### Wow — guest

| Moment | Why |
|--------|-----|
| **Pet picker on `/b`** | Book the dog, not ambiguous |
| **Breed/size in intake** | Groomer prepared |
| **Visit: which pet** | Clear day-of |
| **SMS uses pet name** | “Biscuit’s groom tomorrow” |

---

## L1 — Capability

| Layer | Status |
|-------|--------|
| `petsTable` + demo pets | ✅ 2 pets on seed |
| Book vertical override pet step | ✅ |
| Customer detail pet cards | ✅ |

---

## L2 — Presentation

Default: **`pet-grooming-playful-paw`** (`playful-paw`).

---

## L3 — Personas

Groomer my-day; owner table utilisation; reception pet-aware book.

---

## L4 — Surfaces

`/b` pet step · visit token · mobile customer detail pets.

**Fine details:** aggressive handling flags; vaccine note field R1.1; never trivialize bites in Liv jokes.

---

## L5 — Demo

`paws-parlour-dublin`: Biscuit + Mochi seeded.

---

## L6 — CI

`public-booking-quality` paws

---

## L7 — Dedicated pet (scope)

| Bet | Scope |
|-----|--------|
| Mobile van route | Ring 2 — geo buffer |
| Vaccination expiry alert | R2 |
| Kennel day packages | day-packages pattern |
| Vet referral link | URL field |

---

## L8 — Completion

Public book requires pet selection; groomer sees temperament on day view.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial program |
