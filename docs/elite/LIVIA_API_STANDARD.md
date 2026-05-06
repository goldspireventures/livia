# Livia API Standard

## Purpose

This document is the binding API standard for Livia. Cursor must follow it for all new or modified API routes.

Livia is a web + iOS + Android platform. APIs must be stable, predictable, mobile-friendly, and tenant-safe.

---

## 1. Route Style

Livia uses tenant-nested API routes.

Required pattern:

```text
/api/businesses/[businessId]/...
```

Examples:

```text
GET    /api/businesses/[businessId]/staff
POST   /api/businesses/[businessId]/staff
GET    /api/businesses/[businessId]/services
POST   /api/businesses/[businessId]/services
GET    /api/businesses/[businessId]/availability
POST   /api/businesses/[businessId]/availability
GET    /api/businesses/[businessId]/slots
POST   /api/businesses/[businessId]/bookings
GET    /api/businesses/[businessId]/customers
```

Do not create duplicate flat routes such as:

```text
/api/staff
/api/services
/api/bookings
```

Exceptions:
- platform-level routes may exist under `/api/platform/...`
- auth provider routes may follow provider requirements
- external webhooks may exist under `/api/webhooks/...` or `/api/integrations/...`
- public routes may exist where no businessId is available in path, but must resolve tenant safely by slug or provider payload

---

## 2. API Handler Responsibility

Route handlers must be thin.

A route handler may:
- parse params
- parse query
- parse body
- validate with Zod
- get authenticated user/session where applicable
- call service layer
- map result to response
- map known errors to HTTP response

A route handler must not:
- contain booking logic
- contain availability logic
- contain payment logic
- contain tenant access logic except through membership/auth helpers
- call Prisma directly unless explicitly justified
- contain hardcoded business assumptions

Business logic belongs in `src/services/*`.

---

## 3. Response Shape

All Livia APIs must use a predictable JSON response shape.

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Failure:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Optional diagnostic fields may be included only when safe:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {}
  }
}
```

Never return raw stack traces to clients.

---

## 4. HTTP Status Codes

Use these consistently:

| Status | Meaning |
|---:|---|
| 200 | Successful read/update |
| 201 | Successful create |
| 204 | Successful delete/deactivate with no body, if used |
| 400 | Invalid request / validation error |
| 401 | Not authenticated |
| 403 | Authenticated but not allowed |
| 404 | Resource not found within tenant |
| 409 | Conflict, duplicate, invalid state transition, slot unavailable |
| 422 | Semantically invalid request |
| 500 | Unexpected server error |

---

## 5. Standard Error Codes

Use stable machine-readable error codes.

General:
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_ERROR`

Tenant/access:
- `BUSINESS_NOT_FOUND`
- `BUSINESS_ACCESS_DENIED`
- `ROLE_NOT_ALLOWED`
- `TENANT_SCOPE_REQUIRED`

Staff:
- `STAFF_NOT_FOUND`
- `STAFF_INACTIVE`
- `STAFF_EMAIL_ALREADY_EXISTS`
- `STAFF_NOT_ASSIGNED_TO_SERVICE`

Services:
- `SERVICE_NOT_FOUND`
- `SERVICE_INACTIVE`
- `INVALID_SERVICE_DURATION`
- `INVALID_SERVICE_PRICE`
- `SERVICE_ASSIGNMENT_EXISTS`
- `SERVICE_ASSIGNMENT_NOT_FOUND`

Availability:
- `INVALID_WEEKDAY`
- `INVALID_TIME_WINDOW`
- `AVAILABILITY_RULE_NOT_FOUND`
- `TIME_OFF_NOT_FOUND`
- `TIME_OFF_OVERLAP_INVALID`

Slots/bookings:
- `NO_AVAILABLE_SLOTS`
- `SLOT_UNAVAILABLE`
- `BOOKING_NOT_FOUND`
- `BOOKING_CONFLICT`
- `INVALID_BOOKING_STATUS_TRANSITION`
- `BOOKING_IN_PAST`

Customers:
- `CUSTOMER_NOT_FOUND`
- `CUSTOMER_BLOCKED`
- `CHANNEL_IDENTITY_EXISTS`

Payments:
- `PAYMENT_PROVIDER_NOT_CONFIGURED`
- `PAYMENT_PROVIDER_ERROR`
- `PAYMENT_INTENT_NOT_FOUND`
- `PAYMENT_FAILED`
- `WEBHOOK_SIGNATURE_INVALID`

External integrations:
- `INTEGRATION_NOT_CONFIGURED`
- `WEBHOOK_VERIFICATION_FAILED`
- `INVALID_WEBHOOK_PAYLOAD`

---

## 6. Validation Rules

Use Zod for:
- request body
- query params
- route params where useful

Services must also validate critical logic. Do not rely only on API validation.

Example pattern:

```ts
const schema = z.object({
  actorUserId: z.string().min(1),
  firstName: z.string().min(1),
  email: z.string().email().optional()
});
```

---

## 7. Pagination

List routes should support pagination once results may grow.

Preferred cursor pagination:

```text
GET /api/businesses/[businessId]/customers?limit=25&cursor=...
```

Response:

```json
{
  "ok": true,
  "data": {
    "items": [],
    "nextCursor": null
  }
}
```

Rules:
- default limit: 25
- max limit: 100
- order by stable key, usually `createdAt desc` or domain-specific timestamp
- never return unbounded lists for large data types

---

## 8. Filtering and Sorting

Use explicit query params.

Examples:

```text
GET /api/businesses/[businessId]/bookings?from=2026-05-01&to=2026-05-31&status=CONFIRMED&staffId=...
GET /api/businesses/[businessId]/customers?search=ola
GET /api/businesses/[businessId]/events?type=BOOKING_CREATED&level=ERROR
```

Do not overload unclear params like `q` unless documented.

---

## 9. Public APIs

Public APIs include:
- public business lookup by slug
- public storefront pages
- public booking slots
- public booking creation

Rules:
- public does not mean unvalidated
- public does not mean tenant-unsafe
- public endpoints must resolve business context safely
- public endpoints should be rate-limit ready
- public booking creation must still validate availability server-side

---

## 10. Protected APIs

Protected APIs include:
- dashboard data
- staff management
- service management
- availability management
- booking management
- customer management
- payments
- feature flags
- platform operations

Rules:
- require authenticated user after Auth phase
- use `BusinessMembership`
- enforce role permissions
- temporary `actorUserId`/`userId` may only exist before Auth phase and must be clearly marked

---

## 11. Mobile Compatibility

Every API must work for:
- browser web app
- iOS wrapper
- Android wrapper

Rules:
- return JSON, not HTML
- use stable response shapes
- use mobile-friendly error messages
- avoid sending massive nested payloads
- avoid requiring desktop browser-only flows
- do not depend on hover or desktop UI assumptions

---

## 12. Webhook APIs

Webhook routes may live outside tenant routes.

Examples:

```text
POST /api/webhooks/stripe
POST /api/integrations/whatsapp/webhook
POST /api/integrations/instagram/webhook
```

Rules:
- verify signature/token where provider supports it
- do not trust provider payload blindly
- parse and normalize payload in integration service
- log inbound webhook events
- never fake successful processing if required secrets are missing

---

## 13. Versioning

Do not introduce `/v1` until necessary.

For now:
- keep internal service APIs stable
- document breaking changes in release notes
- avoid route churn
- do not create duplicate legacy route styles

---

## 14. API Completion Checklist

Before marking any API complete:

- route is tenant-nested where applicable
- Zod validation exists
- route is thin
- service layer owns logic
- businessId scoping enforced
- membership/auth check applied where protected
- consistent response shape
- meaningful error codes
- events emitted for mutations
- build passes
- test examples documented