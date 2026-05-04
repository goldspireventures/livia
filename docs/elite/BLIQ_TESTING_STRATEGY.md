# Bliq Testing Strategy

## Purpose

Bliq must be reliable where failures would destroy trust:
- bookings
- availability
- payments
- tenant isolation
- customer identity
- webhooks

This document defines what must be tested and when.

---

## 1. Testing Philosophy

Do not chase 100% coverage early.

Prioritize:
- business-critical logic
- deterministic services
- edge cases
- tenant isolation
- payment safety

Test services before UI where possible.

---

## 2. Recommended Test Layers

### Unit tests
For pure utilities and deterministic logic:
- interval overlap
- date/time helpers
- status transition validator
- amount/currency helpers

### Service tests
For core business flows:
- slot generation
- booking creation
- membership checks
- customer resolution
- payment abstraction

### API smoke tests
For route behavior:
- validation errors
- protected access
- response shapes

### Provider mock tests
For external integrations:
- Stripe provider mocked
- email provider mocked
- AI provider mocked
- webhooks fixture-based

---

## 3. Critical Slot Engine Tests

Must test:
- closed day returns no slots
- missing availability returns no slots
- service duration respected
- 15-minute interval generation
- existing booking blocks overlapping slots
- non-overlapping booking does not block slots
- time off blocks overlapping slots
- inactive service rejected/ignored
- inactive staff ignored
- staff not assigned to service excluded
- past slots not returned

Overlap formula:

```text
slotStart < existingEnd AND slotEnd > existingStart
```

Test partial overlaps:
- slot starts before booking and ends inside booking
- slot starts inside booking and ends after booking
- slot fully contains booking
- booking fully contains slot
- exact end/start touching should not overlap

---

## 4. Booking Tests

Must test:
- valid booking succeeds
- booking creates customer if needed
- booking reuses customer by phone within business
- booking reuses customer by email within business
- same phone in different business does not cross-link
- double booking rejected
- inactive service rejected
- inactive staff rejected
- staff not assigned to service rejected
- invalid startAt rejected
- booking in past rejected
- booking emits events

Status transition tests:
- PENDING -> CONFIRMED allowed
- PENDING -> CANCELLED allowed
- CONFIRMED -> COMPLETED allowed
- CONFIRMED -> CANCELLED allowed
- CONFIRMED -> NO_SHOW allowed
- CANCELLED -> COMPLETED rejected
- NO_SHOW -> CONFIRMED rejected
- COMPLETED -> CANCELLED rejected unless later supported

---

## 5. Membership/Tenant Tests

Must test:
- owner can access business
- non-member rejected
- role assertion allows permitted role
- role assertion rejects unpermitted role
- user cannot access staff/service/bookings from another business
- list APIs never return cross-tenant data

---

## 6. Staff/Service Tests

Must test:
- create staff
- update staff
- deactivate staff
- deactivated staff not bookable
- create service
- update service
- deactivate service
- inactive service not bookable
- assign service to staff
- duplicate assignment rejected
- unassign service
- assignment across businesses rejected

---

## 7. Payment Tests

Must test:
- Stripe provider is isolated
- missing Stripe env fails clearly
- Mulah provider throws not implemented
- payment service creates PaymentIntentRecord
- webhook success creates Payment
- webhook failure records failure
- no card data stored
- booking service does not import Stripe

---

## 8. Notification Tests

Must test:
- booking confirmation attempt creates NotificationLog
- notification failure does not roll back booking
- provider missing env handled safely
- notification events emitted

---

## 9. Messaging Tests

Must test:
- channel identity creation
- duplicate channel identity prevented
- identity linked to customer
- inbound message logged
- outbound message logged
- missing provider secrets fail safely

---

## 10. AI Tests

Must test:
- missing AI key fails safely
- AI calls go through shared client
- AIInteraction/log event created where possible
- AI does not execute destructive action
- no direct OpenAI calls outside shared AI client

---

## 11. API Response Tests

Must test:
- success shape `{ ok: true, data }`
- failure shape `{ ok: false, error }`
- validation errors are 400
- forbidden access is 403
- not found is 404
- conflict is 409

---

## 12. Test Data Strategy

Avoid relying on production Supabase.

Preferred:
- isolated test database
- seeded test data
- provider mocks

If test DB is not available yet:
- write pure unit tests first
- write service tests with mocked Prisma only where maintainable
- document gaps clearly

---

## 13. Phase Testing Requirements

Before completing Phase 4:
- slot engine tests should exist or be planned immediately

Before completing Phase 5:
- booking conflict tests should exist

Before completing Phase 8:
- payment abstraction tests should exist

Before soft launch:
- critical path tests must pass:
  - signup/business setup
  - create staff/service
  - set availability
  - get slots
  - create booking
  - block double booking

---

## 14. Cursor Testing Checklist

When Cursor implements tests:
- add package.json test script
- choose simple test framework
- avoid overengineering
- mock external providers
- run tests
- run build
- summarize coverage and gaps