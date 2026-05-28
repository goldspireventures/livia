# ADR 0019 — Multi-surface architecture (tenant / public / internal)

**Status:** accepted (implementation in progress)  
**Date:** 2026-05-20  
**Supersedes / complements:** ADR 0006 (monorepo), ADR 0010 (persona model), ADR 0011 (mobile flagship), internal portal notes in `docs/company/livia-internal-portal-spec.md`.

## Context

Livia ships more than one authenticated product:

| Surface | Audience | Primary artifacts |
|--------|----------|-------------------|
| **Tenant web** | Owners, managers, reception (`livia-dashboard`) | Clerk tenant org, `/api/businesses/:id/*` |
| **Tenant mobile** | Same roles, phone-first (`livia-mobile`) | Same API contract |
| **Public** | End clients booking / messaging | Public routes + marketing site |
| **Internal** | Livia Inc ops / support / eng | Separate identity boundary, internal-only API |

Conflating internal tools with the tenant dashboard increases the risk of mistaken cross-tenant actions and weakens audit story.

## Decision

1. **Name and isolate** the internal operator UI as `@workspace/livia-internal` (Vite/React shell today; dedicated auth later).
2. **Do not** reuse tenant Clerk sessions or tenant JWTs for internal write paths; follow `livia-internal-portal-spec.md` (second Clerk app or workforce IdP + internal API host or `/internal/*` with strict RBAC).
3. **Keep OpenAPI** (`lib/api-spec`) the contract for **tenant** and **public** surfaces; internal routes may extend with a separate document or tagged paths once implemented.
4. **Mobile parity** (ADR 0011 Gate 2) is tracked against **tenant** APIs only — internal tooling is out of scope for that gate.

## Consequences

- New packages and deploy targets must be provisioned for internal (staging + prod).
- CI should typecheck/build `livia-internal` alongside other artifacts when it grows beyond a shell.
- Product copy and chrome (e.g. amber “INTERNAL” stripe) must never ship inside tenant apps as a “god mode”.

## Links

- `docs/product/BUILD-BACKLOG.md` — Internal (P0) + Parity sections
- `docs/company/livia-internal-portal-spec.md`
