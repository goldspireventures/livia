# Target state vs ship scope — the honesty contract

**Status:** canonical clarification (2026-05-20). **Reads with:** `docs/roadmap/v1-scope.md`, `docs/livia-positioning.md`, `docs/launch-plan.md`.

## Two different questions (do not conflate them)

| Question | Answer lives in |
|----------|-----------------|
| **What is Livia for the world?** (category, 10-year shape, all verticals) | Positioning, `verticals.md`, personas, this folder’s master design |
| **What do we ship on day X?** (legal, eval, voice, compliance surface) | `docs/roadmap/v1-scope.md`, Gate 2/3 criteria, marketing-vs-reality audit |

**Product vision** can be *appointment-based service businesses in Europe* (and beyond) with Liv as the named colleague across modalities.

**v1 ship ledger** (locked 2026-05-07) commits to **Hair vertical, English-IE voice, specific configurations**, with explicit NOTs (medspa consent, fitness class capacity, etc.).

Both can be true **if language is precise**:

- **Livia** = the company and the long-horizon product.
- **v1 / L1 launch** = the first **defensible revenue ship** with a wedge deep enough to win trust and economics.

## Why the wedge exists (research-backed, not cowardice)

Industry reports cluster “salon & spa booking / scheduling” as a large, growing SaaS segment (multi-billion to 2030s depending on definition), with **scheduling + CRM + payments** as core modules and **AI** as a rising driver. Medspa and wellness segments carry **additional regulatory and clinical burden** (HIPAA-like, consent, prescriber rules) that change build cost and liability — `verticals.md` already marks V6/V7/V8/V9 as v3 or **never** without partners.

Shipping **one binary** that claims “every vertical, every modality, every locale” on day 1 produces:

- Unbounded eval surface for Liv (ADR 0016).
- Unbounded legal review (EU AI Act + vertical-specific health law).
- Voice and SMS compliance that is **per-country**, not generic.

So: **ambition is maximal; ship scope is gated.**

## If the founder mandate is “full Livia at first public launch”

That is a **strategic reprioritisation**, not a documentation task. Required steps:

1. **RFC** — title e.g. `rfc-widen-v1-verticals` — enumerate added verticals, locales, voice, compliance owners, timeline slip, pricing impact.
2. **Revise `v1-scope.md`** or introduce **`v1-wide.md`** as the new ledger; old ledger archived with `Supersedes` note.
3. **Update `docs/audits/marketing-vs-reality.md`** — every new promise gets a row until green.
4. **Update Gate 3 acceptance** in `launch-plan.md` — eval suite, counsel review, SOC2 scope.
5. **Engineering** — vertical modules in API (policy packs, slot rules, consent flows) must exist **before** UI claims them.

Until those complete, marketing and in-product copy must **not** claim broader scope than the ledger.

## Recommended framing (external)

- **Category:** “Livia serves appointment-based businesses — starting where we can go deepest: European salons.”
- **Product:** “Liv is your colleague for bookings, inbox, voice, and the day’s chaos — more verticals open as we earn the right.”

## Recommended framing (internal)

- **Target state:** full capability catalog + multi-surface architecture (`LIVIA_MASTER_DESIGN.md`).
- **Current ship:** v1 ledger + gates.
- **Delta:** phased releases (v1, v1.5, v2, v3 per `docs/roadmap/`).
- **Ecosystem OS:** own appointment graph + Liv; hand off payroll/accounting/contracts to partners ([`LIVIA-COMPLETE-SYSTEM-SPEC.md`](./LIVIA-COMPLETE-SYSTEM-SPEC.md) §7). Value by actor: [`LIVIA-GLOBAL-PRODUCT-SYSTEM.md`](./LIVIA-GLOBAL-PRODUCT-SYSTEM.md) Part X.

This document exists so no one builds “full sector” UI on a hair-only contract — or silently shrinks vision to match a thin MVP.
