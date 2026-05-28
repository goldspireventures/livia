# Livia lifecycle map

**Status:** Product spine (2026-05-21). Implements planning from persona + graduation docs.

## One sentence

Salons change shape; Livia changes keys — same building (one design system), different homes and authority per role.

## Personas → home routes

| Persona | Role signal | Home |
|---------|-------------|------|
| Founder | OWNER + ≥2 businesses | `/chain` |
| Owner | OWNER, 1 business | `/dashboard` |
| Manager | ADMIN, deskRole=manager | `/inbox` |
| Reception | ADMIN, deskRole=reception | `/bookings` |
| Staff | STAFF | `/my-day` |
| Customer | Public | `/b/:slug` |

## Graduations (G1–G8)

| ID | Trigger | Product surface |
|----|---------|-----------------|
| G1 | First hire on solo tier | Studio billing nudge; team invite |
| G2 | First ADMIN (manager) | Inbox + cap ladder; owner rung often lowers |
| G3 | Second shop owned | Chain glance; per-shop billing; `/lifecycle#chain` |
| G4 | Chain grows (6+ shops) | Volume pricing (future) |
| G5 | Chair-rental host | Host plan; renter isolation |
| G6 | Multi-brand | Brand portfolio (C13) |
| G7 | Partnership split | Ownership transfer variant |
| **G8** | **Ownership succession** | **Settings → Ownership; audit `tenant.ownership_transferred`** |

## G8 flow (built)

1. Outgoing OWNER opens Settings → Ownership.
2. Picks team member (must already be ADMIN or STAFF).
3. Chooses own disposition: stay STAFF, stay ADMIN, or revoke.
4. API updates `businesses.owner_id`, memberships, Stripe customer email (if configured).
5. Incoming owner sees **Keys changed** ritual on next sign-in (audit-driven, 30-day window).

## API

- `GET /api/me/lifecycle` — suggestions + pending rituals
- `GET /api/businesses/:id/lifecycle` — per-shop suggestions
- `GET /api/businesses/:id/ownership-candidates`
- `POST /api/businesses/:id/transfer-ownership`

## Invitations

ADMIN invites include `deskRole`: `manager` | `reception` (stored in `business_memberships.scope`).

## Not in v1 (deferred)

- Dual-signatory pending transfer table
- Org-level consolidated billing
- Copy settings across owned shops
- REC enum in DB (reception uses ADMIN + scope today)

## References

- `docs/journeys/configuration-graduation.md`
- `docs/personas.md`
- `docs/policy/tenancy-and-billing.md`
- ADR 0009, ADR 0010
