# API conventions

**Status:** v1 (2026-05-07). Reads with ADR 0005 (OpenAPI as contract source).

## Posture

OpenAPI spec is **the source of truth.** Server code generated from spec; client (`packages/api-client/`) generated from spec; tests pinned to spec.

## URL shape

`/v<major>/<resource>(/<id>)?(/<action>)?`

Examples:
- `/v1/bookings`
- `/v1/bookings/{id}`
- `/v1/bookings/{id}/cancel`
- `/v1/businesses/{businessId}/refunds`
- `/v1/me`

### Tenancy

Every authenticated request resolves a `business_id` from one of:
1. The `X-Business-Id` header (preferred for explicit tenant context).
2. The user's default membership if no header (the user's "current business" per `currentBusinessId` selector).
3. A path parameter (`/v1/businesses/{businessId}/…`) for cross-tenant operations.

Multi-tenant users (Founders with multiple businesses; staff with multiple memberships) MUST send `X-Business-Id`. Single-membership users may omit it.

### Versioning

`/v1/` for v1 ship. Breaking changes within v1 are not permitted; use `/v2/` for the next major. Additive changes (new fields, new endpoints, new optional parameters) ship within `v1`.

## Response shape

All successful responses:

```json
{
  "data": { ... } | [ ... ],
  "meta": {
    "request_id": "req_...",
    "next_cursor": null
  }
}
```

All error responses:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Human-readable message",
    "details": [
      { "field": "start_at", "issue": "must be in the future" }
    ],
    "request_id": "req_..."
  }
}
```

### Error codes (taxonomy)

- `validation_failed` — input doesn't match schema.
- `not_found` — resource doesn't exist or isn't visible to this tenant.
- `forbidden` — the membership/role/scope doesn't permit this action.
- `conflict` — state-transition not permitted (e.g., cancelling an already-cancelled booking).
- `rate_limited` — too many requests.
- `dependency_failure` — downstream (Stripe, Twilio, LLM) error; retry-after where applicable.
- `liv_unavailable` — agent runtime degraded; fallback path engaged.
- `internal_error` — unexpected; logged with full stack to Sentry.

HTTP status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorised, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests, 500 Internal Error, 503 Service Unavailable.

## Authentication

- Clerk JWT in `Authorization: Bearer <token>` per ADR 0003.
- Customer-facing public booking endpoints use signed-URL or per-tenant slug + (where session-required) short-lived booking-session token.
- Public API (v3+) uses OAuth2 client-credentials per partner.

## Pagination

Cursor-based by default. `limit` (default 50, max 200) + `cursor` (opaque string from previous response's `meta.next_cursor`). No offset pagination.

## Filtering + sorting

- Filters: `?filter[<field>]=<value>` — supports equality + IN (`field=a,b,c`).
- Sort: `?sort=<field>` (asc) or `?sort=-<field>` (desc); composite via comma.

## Idempotency

Mutating endpoints (POST, PATCH, DELETE) accept `Idempotency-Key` header. Replays within 24h return the original response. Required for payment-touching endpoints; recommended elsewhere.

## Rate limiting

Per-tenant + per-user envelopes. Default: 600 req/min/tenant; 100 req/min/user. Per-endpoint overrides for high-cost endpoints (e.g., voice receptionist call initiation: 30/min/tenant).

429 includes `Retry-After` header.

## Webhooks (v3+)

- POST to tenant-configured URL.
- Signed with HMAC-SHA256 per-tenant secret.
- At-least-once delivery; idempotency via `event.id` (UUID).
- Retry schedule: immediate, 1m, 5m, 30m, 2h, 12h, 24h. Then dead-letter.

## Liv-touching endpoints

Endpoints that may invoke Liv (booking via voice, draft refund, summarise conversation) may take longer. Conventions:
- `Liv-Latency-Budget-Ms` request header (caller's max wait); server respects.
- Sync responses for budgets ≤2s; async + webhook callback for larger.
- `liv_action_id` in response body for any Liv decision; references audit log.

## Schema evolution

- Additive: any time.
- Field deprecation: 90-day window via `Deprecation` + `Sunset` HTTP headers per RFC 8594.
- Breaking: only at major version bump (v1 → v2).

## OpenAPI tooling

- Spec lives in `packages/api-spec/openapi.yaml`.
- `pnpm codegen` regenerates server stubs + client.
- CI fails if spec changes without running codegen.
- Spec is the brand-of-API; reviewed in PR like product copy.

## Open questions

- Should we expose a GraphQL layer for the dashboard given how relational our reads are? (Currently no — REST + careful endpoint design has been adequate; revisit if pagination patterns become painful.)
- Webhooks for v3 vs earlier — design partners have asked; pending demand signal.
