# Internal support ticket lifecycle

## Intake (tenant)

Dashboard → **Report issue** → `POST /businesses/:id/support/tickets`

| Field | Values |
|-------|--------|
| Category | `bug`, `liv_error`, `billing`, `feature`, `other` |
| Severity | `blocking`, `annoying`, `nice_to_have` |
| Status (initial) | `open` |

## Auto-triage (create-time)

Rule engine (`support-ticket-triage.service.ts`) attaches to `context.triage`:

- **priority:** `urgent` | `normal` | `low`
- **tags:** e.g. `liv`, `billing`, `booking`
- **suggestedReply:** operator doc snippet

`liv_error` also emits Inngest `support/liv_error.reported` → `liv-was-wrong` workflow logs `INCIDENT_CREATED`.

## Internal lifecycle

| Status | Meaning | Who moves here |
|--------|---------|----------------|
| `open` | New / reopened | Tenant create; ops reopen |
| `triaged` | Owned, investigating | `support_l1+` |
| `resolved` | Fix or answer sent | `support_l2+` |
| `closed` | Archived | `support_l2+` |

**Portal:** http://localhost:5175 → **Support** tab → click ticket → actions.

**API:** `PATCH /api/internal/ops/support-tickets/:id` with headers:

- `X-Internal-Ops-Secret`
- `X-Internal-Ops-Operator` (email)
- `X-Internal-Ops-Role` (`founder` | `engineer` | `support_l2` | `support_l1` | `finance_read`)

Body: `{ status?, assignedTo?, note?, reTriage? }`

All patches append to `internal_notes` and emit `INTERNAL_SUPPORT_TICKET` tenant events.

## Liv-specific tickets

Category `liv_error` or tag `liv` → **Liv incident bundle** on ticket detail:

- Conversation + last messages (if `conversationId` in context)
- `requestId` → Sentry hint
- Continuity hints for tenant
- Suggested operator actions

Internal Liv assist (read-only) can summarize tenant health; it does not close tickets.

## RBAC (v1)

| Action | Minimum role |
|--------|----------------|
| View queue | Any valid secret |
| Triage, assign, note | `support_l1` |
| Resolve / close | `support_l2` |
| Kill switch Liv (future) | `founder` / on-call |

Production: operator headers required; dev defaults to `dev-operator@livia.io` + `engineer` if omitted.

## What is not built yet

- Workforce SSO (second Clerk app)
- Linear/Intercom sync
- Impersonation from internal UI
- Fleet analytics tab
- Finance roll-ups

See `docs/company/livia-internal-portal-spec.md` phasing.
