# Livia platform release program

**Status:** canonical (2026-05-30)  
**Purpose:** Platform-wide release cadence — surfaces, policy, API, and ops evolve **together**, not patch-by-patch.  
**Gallery:** http://localhost:5173/experience/livia-evolution  
**Reads with:** [`LIVIA-FINAL-BUILD-PLAN.md`](./LIVIA-FINAL-BUILD-PLAN.md) · [`LIVIA-BUILD-PLAN-V2.md`](./LIVIA-BUILD-PLAN-V2.md) (post–G-DOC sequencing) · [`LIVIA-MASTER-BUILD-PLAN.md`](./LIVIA-MASTER-BUILD-PLAN.md) · [`PLATFORM-BACKLOG.md`](../operations/PLATFORM-BACKLOG.md) · [`LIVIA-PLATFORM-LIFECYCLE.md`](./LIVIA-PLATFORM-LIFECYCLE.md) · [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](../design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md)

**Surface programs (design before build):**

| World | Spec |
|-------|------|
| Marketing W1 | [`MARKETING-SURFACE-PROGRAM.md`](../design/MARKETING-SURFACE-PROGRAM.md) |
| Gateway W2 | [`GATEWAY-SURFACE-PROGRAM.md`](../design/GATEWAY-SURFACE-PROGRAM.md) |
| Internal support W3b | [`INTERNAL-SUPPORT-PLATFORM-SPEC.md`](./INTERNAL-SUPPORT-PLATFORM-SPEC.md) |
| Internal exec W3a | [`INTERNAL-EXEC-COCKPIT-SPEC.md`](./INTERNAL-EXEC-COCKPIT-SPEC.md) |
| Public guest W5 | [`PUBLIC-B-SURFACE-SPEC.md`](./PUBLIC-B-SURFACE-SPEC.md) |

---

## 1. Why programmatic releases

Livia is a **stack of skins** connected by **policy + API**. Shipping marketing without guest tokens, or mobile without preset resolver, creates drift.

**Release rule:** A platform release (R) ships a **vertical slice** across layers that share one verification script.

```text
R1 (now)     →  F+G foundation + D2 preset column + smoke E2E wedge
R2           →  Guest surfaces complete + tenant ritual homes + support registry
R3 (v3)      →  Platform coherence + mobile parity + internal ops unified
R∞ (northstar) →  Continuous — UI catches policy; never the reverse
```

---

## 2. Release definitions

### R1 — **Now** (~8–12 weeks)

**Theme:** Locked visuals become real routes; programmatic signup→guest path works for **every shippable vertical** (`VERTICAL_COVERAGE_REGISTRY` where `tier ≠ defer`).

**Vertical rule (founder lock 2026-05-30):** **All** code verticals get wedge interstitial (G1-A clarity) + `/b` book path + demo seed to the **best of current pack depth** — not hair/body-art only. Tier honesty: `partner-only` / `nearestPack` verticals use nearest pack UI with honest labels; `defer` (V11) stays out of demo grid.

| Layer | Ships together |
|-------|----------------|
| **Policy** | `guest-surfaces.ts`, signup `platform-default`, wedge gate |
| **API** | Proof guest token, visit token, `/me/tenant-experience` preset column |
| **Marketing F** | M0 shell, M1-R2 home, M2 pricing, G1 wedge story routes |
| **Tenant D** | Preset resolver, appearance panel stub, Platform Default polish |
| **Guest G** | Proof page, link-first SMS templates, public book mobile pass |
| **Internal F** | Ship Lane collapse/expand, Thread primary shell, Hats metrics panels |
| **Internal H** | (R2) Work-event ledger + Hats River v2 + Cursor bridge |
| **Verify** | `pnpm test:e2e:verticals` — **all 9 code verticals** + manual: marketing → demo wedge (each) → onboard → `/b` book → guest token where applicable |

**Exit:** Founder can demo **any registry vertical** end-to-end without manual DB edits; body-art proof flow is the **reference** collab depth, not the only shipped vertical.

### R2 — (~6 months)

**Theme:** Guest hub (W6) · all P7 guest surface types · support `surfaceId` registry · mobile inbox parity.

**Spec:** [`GUEST-CONTINUITY-HUB-SPEC.md`](./GUEST-CONTINUITY-HUB-SPEC.md) · [`GUEST-CUSTOMER-IDENTITY.md`](./GUEST-CUSTOMER-IDENTITY.md)

| Layer | Ships together |
|-------|----------------|
| **Guest G** | visit, consent, pay, waitlist accept surfaces |
| **Guest W6** | `my.livia-hq.com` hub — OTP, favorites, book-again, Liv orchestrator (web) |
| **Tenant** | Ritual homes per vertical, proofs desk wired |
| **Support B/C** | Investigate panel + API, Thread tabs populated |
| **Mobile** | Today ritual v2, guest deep links |
| **Verify** | CI guest-token suite; support opens tenant context from thread |

### R3 — **Livia v3** (~12–18 months)

**Theme:** Platform coherence — one programmatic lifecycle, preset rollout, ops scale.

| Layer | Ships together |
|-------|----------------|
| **Presets D** | 4× vertical presets × staging→prod promotion |
| **Mobile** | ~95% ADR 0011 parity |
| **Internal** | Exec + support + modules unified amber shell; **Track H** employed hats |
| **Ops** | Workforce access, founder cockpit data live |
| **Markets** | IE wedge proof → 10 shops Gate 2 |
| **Verify** | Headless lifecycle script: prospect → tenant → P7 → support ticket |

### R∞ — **North star**

Not a date — **design target** in [`LIVIA-EVOLUTION-SCREENS.md`](../design/LIVIA-EVOLUTION-SCREENS.md). Each R(n) moves `now/` visuals toward `northstar/` without re-architecting.

---

## 3. What never ships alone

| ❌ Avoid | ✅ Instead |
|----------|-----------|
| Marketing page without API backing | F track + honest empty states |
| Guest UI without token policy | G0 policy module first |
| Preset picker without DB column | D2 migration in same release |
| Internal mock without `surfaceId` | B1 registry same sprint |
| Mobile screen without timezone/booking API | Contract-first per master plan |

---

## 4. Visual ↔ release mapping

| Gallery tier | Release | Doc |
|--------------|---------|-----|
| `now/` | R1 | This doc §2 R1 |
| `v3/` | R3 | This doc §2 R3 |
| `northstar/` | R∞ target | [`LIVIA-EVOLUTION-SCREENS.md`](../design/LIVIA-EVOLUTION-SCREENS.md) |
| `platform-surfaces/` locks | Constraints for all tiers | [`PLATFORM-SURFACES-FINAL-CATALOG.md`](../design/PLATFORM-SURFACES-FINAL-CATALOG.md) |

---

## 5. Cadence

- **R releases** — quarterly ambition; R1 is the only hard near-term commit.
- **Patch** — hotfix only; no partial feature across surfaces.
- **Weekly** — `pnpm typecheck`, vertical smoke, north-star dashboard review.
- **Pre-release** — diff `now/` vs shipped routes; update evolution PNGs if drift > 1 sprint.

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | W6 guest hub; cross-link FINAL-BUILD-PLAN; R2 hub detail |
| 2026-05-30 | All-vertical R1; surface program cross-links; evolution gallery |
