# Surface density — platform pattern

**Status:** canonical (2026-05-31)  
**Applies to:** all tenant personas and verticals — not one-off page tweaks.

---

## Principle

A surface answers **one job** first. Everything else is **deferred**: another route, a disclosure, or a contextual strip that **only mounts when a signal exists**.

This is stronger than “make boxes smaller”: empty modules must not reserve height; veteran tenants must not see onboarding chrome; duplicate timelines stay off home.

---

## Three tiers

| Tier | When | Examples |
|------|------|----------|
| **Primary** | Always for that surface’s job | Owner greeting, Liv briefing, KPI chips, the one module with signal |
| **Contextual** | Mount when policy signal | Pending queue, inbox preview, activation checklist, running-late |
| **Deferred** | Collapsed or linked | Vertical shortcuts, Liv mandate (when R3+), full timeline → `/bookings` |

Rules live in **`lib/policy/src/tenant-surface-density.ts`** so web and mobile can share the same gates.

---

## Owner `/dashboard` (reference)

- Module layout: `resolveOwnerHomeModuleLayout` — one panel, two, or compact “all clear” (no twin 220px empty cards).
- Guardrails: `shouldShowOwnerLivGuardrails` — not a permanent strip.
- Chrome: activation / maturity / running-late gated by onboarding %, steps pending, bookings today.
- Shortcuts: `VERTICAL_HOME_SHORTCUTS_VISIBLE` then disclosure.

Other P0 surfaces should adopt the same tier model in their screen cards over R∞.

| Surface | Status |
|---------|--------|
| Owner `/dashboard` | Reference implementation |
| `/inbox` | Context rail gated |
| Staff `/my-day` | Timeline gated via `shouldShowStaffMyDayTimeline` |
| `/settings` shop tab | Compact link strip + disclosure for secondary fields |
| `/settings` comms tab | Notifications primary; channels in disclosure |
| `/settings` liv tab | Mandate in disclosure; prompts/tools deferred |
| `/toolkit` | `LivCommandHub` focused density; exports + settings links deferred |
| `/chain` | `chainShopsVisibleSlice` — attention shops first |
| `/medspa` | `resolveMedspaHubDefaultTab` + compact queue rows |
| `/design-proofs` | Queue primary; submit form disclosure |
| `/lifecycle` | Program cards behind disclosure |
| `/customers` | Merge panel omitted when no suggestions; compact roster rows |
| `/staff` | Compact roster + scroll cap |
| `/onboarding` | Portal shell; demo seed card only when demo login enabled |
| `/services` | Compact list rows (not 3-col cards) |
| `/customers/:id` | Merge channel in disclosure; care series vertical-gated; compact history |
| `/bookings` | Compact list rows; shorter empty state |
| `/bookings/:id` | Merged client/service card; notes in disclosure |
| `/bookings/new` | Tighter wizard rhythm |

---

## UI primitive

Dashboard uses native `<details>` via `SettingsDisclosure` / surface disclosures — no new dependency. Prefer **disclosure + route** over infinite scroll on home.
