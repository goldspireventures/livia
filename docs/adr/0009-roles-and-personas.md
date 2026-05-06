# ADR 0009 — Roles, personas, and the STAFF surface

**Status:** Accepted — 2026-05-06
**Context:** Task #48 (split STAFF persona from OWNER on web + mobile)

> ADR numbering note: 0008 was already taken by the mobile-motion ADR.
> The original task brief referenced this ADR as 0008, but since 0008
> exists this becomes 0009.

## Context

Until Task #48, every authenticated dashboard user implicitly behaved
as an OWNER for the business they were inside. Practically, this meant:

- A new staff member couldn't be onboarded without giving them the keys
  to AI configuration, communications, dashboard revenue numbers, and
  the customer roster of every colleague.
- The mobile app had no surface designed for the person who actually
  *runs* an appointment — it duplicated the owner cockpit.
- The codebase had no concept of "this request is being made by
  someone whose authority is bounded to their own slate."

This is unacceptable for the Closed Beta target customer (10-shop
Dublin design partners), where the modal team shape is one owner +
two-to-five chair-renting staff.

## Decision

We ship three roles and one impersonation primitive.

### Roles

| Role  | Capabilities                                                                 |
|-------|------------------------------------------------------------------------------|
| OWNER | Everything. There is exactly one OWNER row per business at creation time.    |
| ADMIN | Everything except billing / business-deletion / inviting other admins.       |
| STAFF | Read-only access to their own slate; can create/update bookings assigned to themselves; can view customers they have personally served. |

Roles are stored in `business_memberships(role)` with the existing
enum `OWNER | ADMIN | STAFF`. The `business.ownerId` column remains
the canonical OWNER pointer; we treat it as an OWNER membership even
if the row is somehow missing (defensive).

### Authorisation primitive

`requireRole(min)` is the single middleware that gates business-scoped
routes. Every route declares its minimum role inline. Cross-tenant
isolation returns **404** (not 403) so we never reveal the existence
of a business to a non-member. Role-too-low returns **403** with
`code: "INSUFFICIENT_ROLE"`.

A `RoleContext` is attached to the request: `{ role, effectiveRole,
actingStaffId }`. Services that want to filter by staff (bookings,
customers, my-day) read `effectiveRole` and `actingStaffId` to enforce
data scoping at the query level — UI hiding is **never** the only
defence.

### Persona switcher (`?as=staff:<id>`)

OWNER/ADMIN can opt into a STAFF read view via `?as=staff:<staffId>`
on the URL. This sets `effectiveRole=STAFF` + `actingStaffId=<id>`
but **cannot** be used to escalate permissions — the underlying
authorisation check still uses the user's real role. This is the
single concession we make to "let owners see what their staff sees,
without sharing accounts."

Persona is a UI concern: the dashboard persists it to localStorage
keyed `livia.viewingAsStaffId` and clears it whenever the active
business changes.

### My Day surface

A new endpoint `GET /businesses/:bid/my-day` returns:

- `today[]` — bookings for today, scoped to staffId
- `next` — the next upcoming booking
- `myCustomers[]` — customers I have served
- `todayCount`, `weekCount`

When `staffId === null` (e.g. a STAFF user whose Clerk row isn't yet
linked to a `staff` row) we return an **empty** payload — never the
full slate. Failing closed > leaking siblings' work.

### Invitation flow

Owners/admins POST `/businesses/:bid/invitations` with `{ email,
role }`. We call Clerk's `createInvitation` and stash
`publicMetadata.livia = { businessId, role }`. On the invited user's
first authenticated request the dashboard calls
`POST /me/accept-invitations`, which reads the metadata, creates the
membership row, and clears the marker.

We deliberately **do not** maintain a parallel "pending invitation"
table. Clerk is the source of truth for invitation state; doubling
that data doubles the failure modes. If `CLERK_SECRET_KEY` is unset,
the endpoint returns `503` so the UI can show a clean
"invitations need server config" empty state.

## Consequences

**Wins**

- Staff can be onboarded without giving them the keys to the kingdom.
- Owners can preview their staff's view without account-sharing.
- Cross-tenant data leaks are prevented at the query layer, not just
  the UI.
- Future per-role pricing or feature gating has a clean foundation.

**Costs**

- Every business-scoped route had to be re-tagged. We accept the
  bulk diff because the alternative (sprinkling ad-hoc checks) was
  the original sin.
- The persona switcher adds a small mental model the founder will
  have to onboard design partners on.
- Invitation acceptance happens on first sign-in, which means a user
  who completes Clerk signup but never visits the dashboard will not
  have their membership materialised. Acceptable for v1; if it bites
  in production we'll add a Clerk webhook.

**Things explicitly NOT in scope**

- Per-staff role customisation (beyond OWNER/ADMIN/STAFF).
- STAFF editing their own availability rules — gated until post-Closed-Beta.
- STAFF inbox visibility — they don't see customer SMS/email threads in v1.
- Billing/quota separation between OWNER and ADMIN (treated identically for now).

## References

- `artifacts/api-server/src/lib/auth.ts` — `requireRole` middleware.
- `artifacts/api-server/src/services/my-day.service.ts` — staff-scoped slice.
- `artifacts/api-server/src/services/invitations.service.ts` — Clerk metadata flow.
- `artifacts/livia-dashboard/src/lib/membership-context.tsx` — persona state.
- `docs/launch-plan.md` — Gate-2 acceptance now includes "STAFF login lands on My Day."
