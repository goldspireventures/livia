# ADR 0020: v2 engineering close — scope boundary

**Status:** Accepted (2026-05-22)  
**Deciders:** Engineering (founder-aligned)  
**Relates to:** [`../product/V2-EXECUTION-PROGRAM.md`](../product/V2-EXECUTION-PROGRAM.md), [`../roadmap/v2-scope.md`](../roadmap/v2-scope.md), ADR 0004 (marketing brand bible)

## Context

v2 expanded scope (UK + Nordics policy, fitness/body-art/wellness verticals, C8/C11/C12, livia.io, internal ops tabs, heartland v1.5 merge) shipped as **kernel + web + marketing + scaffolds**. The surface matrix still showed partial/open rows because **full depth** (live OAuth, Nordic voice production, native mobile parity, internal portal SOC module, public API GA) was conflated with **v2 engineering exit**.

Founder lane items (legal, Stripe prod, stores, tenant proof) must **not** block declaring in-repo engineering complete.

## Decision

**v2 engineering is closed** when all of the following hold:

1. **Delivered in-repo (v2):** Web routes and APIs for heartland + v2 verticals/configurations; policy packs SE/DK/NO/FI + GB depth; Inngest workflow registrations (scaffold + key paths); integration broker registry + docs; livia.io Block J; internal portal tabs + platform-health; automated verification (`typecheck`, API tests, E2E/gate3/marketing-gate).
2. **Explicitly not v2 engineering (v3 or founder):** Live Fresha/Square/GCal OAuth; Klarna/Trustly/DocuSign production; public API alpha GA; Nordic voice casts in production; healing-followup / waitlist / intake **workflow depth** beyond scaffold; internal flags/incidents/impersonation; native mobile screens for rota/hiring/classes/franchise (web remains source of truth); marketing legal pages at GA; paying-tenant proof counts.
3. **Honesty:** No marketing claim without `marketing-vs-reality.md` row; deferred claims stay deferred.

## Consequences

- [`V2-EXECUTION-PROGRAM.md`](../product/V2-EXECUTION-PROGRAM.md) status → **Engineering closed**.
- New work on deferred items opens under **v3** (or founder lane), not as “v2 still open.”
- Mobile org/v2 surfaces: **open dashboard in browser** is acceptable v2 parity until v3 native screens.

## Verification record (2026-05-22)

- `pnpm run typecheck` — pass
- `pnpm smoke:gate3` — pass (with API + dashboard + marketing when running)
- `pnpm test:e2e:marketing` — 6 passed (marketing dev up)
- API `brand-wall.test.ts` in server test chain
