# Bliq Event Catalog

## Purpose

Bliq is event-aware from the beginning. Events support observability, support, analytics, AI learning, auditability, and future automation.

Every important action must emit a structured event using `logEvent(...)`.

Events must never crash the main user flow.

---

## 1. Event Principles

Events must be:
- structured
- concise
- safe
- machine-readable
- business-scoped when tenant-related
- useful for debugging and future AI analysis

Events must not:
- contain secrets
- contain raw payment card data
- contain auth tokens
- contain full provider webhook payloads unless sanitized
- crash user flows if logging fails

---

## 2. Event Shape

Use the current Event model fields.

Recommended conceptual shape:

```ts
logEvent({
  type: "BOOKING_CREATED",
  source: "bookingService",
  level: "INFO",
  businessId,
  actorUserId,
  subjectType: "Booking",
  subjectId: booking.id,
  payload: {
    serviceId,
    staffId,
    customerId,
    channelType,
    startsAt,
    endsAt
  }
});
```

---

## 3. Event Levels

| Level | Use |
|---|---|
| INFO | Normal successful operation |
| WARN | Recoverable issue or suspicious condition |
| ERROR | Failed operation needing investigation |

Do not overuse ERROR for expected validation failures unless operationally useful.

---

## 4. Event Sources

Use consistent source names:

- `businessService`
- `membershipService`
- `staffService`
- `serviceCatalogService`
- `availabilityService`
- `timeOffService`
- `slotService`
- `customerService`
- `bookingService`
- `paymentService`
- `stripeProvider`
- `notificationService`
- `channelIdentityService`
- `messageLogService`
- `storefrontService`
- `aiClient`
- `incidentService`
- `featureFlagService`
- `api`

---

## 5. Business and Membership Events

### BUSINESS_CREATED
Emit when a new business is created.

Required payload:
- `name`
- `slug`
- `ownerUserId`

Do not include:
- secrets
- raw auth provider tokens

### BUSINESS_UPDATED
Emit when business profile/settings update.

Payload:
- changed field names
- actorUserId

Do not include full before/after PII unless necessary.

### MEMBERSHIP_CREATED
Emit when user is linked to business.

Payload:
- userId
- role

### BUSINESS_ACCESS_CHECKED
Optional; emit when useful for sensitive access checks.

### BUSINESS_ACCESS_DENIED
Emit when access check fails and is operationally useful.

Payload:
- requestedBusinessId
- actorUserId if available
- reason

---

## 6. Staff Events

### STAFF_CREATED
Payload:
- staffId
- displayName
- role

### STAFF_UPDATED
Payload:
- staffId
- changedFields

### STAFF_DEACTIVATED
Payload:
- staffId
- actorUserId

### STAFF_SERVICE_ASSIGNED
Payload:
- staffId
- serviceId

### STAFF_SERVICE_UNASSIGNED
Payload:
- staffId
- serviceId

---

## 7. Service/Catalog Events

### SERVICE_CREATED
Payload:
- serviceId
- name
- durationMinutes
- basePriceMinorUnits if available
- currency if available

### SERVICE_UPDATED
Payload:
- serviceId
- changedFields

### SERVICE_DEACTIVATED
Payload:
- serviceId

---

## 8. Availability Events

### AVAILABILITY_RULE_CREATED
Payload:
- ruleId
- staffId
- weekday
- startMinutes
- endMinutes
- timezone

### AVAILABILITY_RULE_UPDATED
Payload:
- ruleId
- changedFields

### AVAILABILITY_RULE_DELETED
Payload:
- ruleId
- staffId

### TIME_OFF_CREATED
Payload:
- timeOffId
- staffId
- startsAt
- endsAt
- reason category if safe

### TIME_OFF_UPDATED
Payload:
- timeOffId
- changedFields

### TIME_OFF_DELETED
Payload:
- timeOffId
- staffId

---

## 9. Slot Events

### SLOTS_REQUESTED
Emit when available slots are requested.

Payload:
- businessId
- serviceId
- staffId optional
- date
- resultCount

Level:
- INFO normally
- WARN if no eligible staff/service/availability and useful for debugging

Do not emit too noisily if route becomes high traffic; analytics aggregation can replace later.

---

## 10. Customer Events

### CUSTOMER_CREATED
Payload:
- customerId
- source
- hasEmail
- hasPhone

### CUSTOMER_UPDATED
Payload:
- customerId
- changedFields

### CHANNEL_IDENTITY_CREATED
Payload:
- channelIdentityId
- channelType
- customerId optional

### CHANNEL_IDENTITY_LINKED
Payload:
- channelIdentityId
- customerId
- channelType

---

## 11. Booking Events

### BOOKING_ATTEMPTED
Emit at the start of booking creation.

Payload:
- serviceId
- staffId
- channelType
- requestedStartAt

### BOOKING_CREATED
Emit after successful booking creation.

Payload:
- bookingId
- serviceId
- staffId
- customerId
- channelType
- startsAt
- endsAt
- status

### BOOKING_FAILED
Emit when booking creation fails for operationally useful reasons.

Payload:
- serviceId
- staffId optional
- requestedStartAt
- failureCode
- failureMessage safe summary

### BOOKING_STATUS_UPDATED
Payload:
- bookingId
- oldStatus
- newStatus

### BOOKING_CANCELLED
Payload:
- bookingId
- cancellationReason if safe

### BOOKING_COMPLETED
Payload:
- bookingId

### BOOKING_NO_SHOW
Payload:
- bookingId

---

## 12. Payment Events

### PAYMENT_STARTED
Payload:
- paymentIntentRecordId
- bookingId optional
- amountMinor
- currency
- purpose
- provider

### PAYMENT_SUCCEEDED
Payload:
- paymentId
- paymentIntentRecordId optional
- bookingId optional
- amountMinor
- currency
- provider

### PAYMENT_FAILED
Payload:
- paymentIntentRecordId optional
- bookingId optional
- provider
- failureCode safe
- failureReason safe

### DEPOSIT_PAID
Payload:
- bookingId
- paymentId
- amountMinor
- currency

### REFUND_CREATED
Payload:
- refundId
- paymentId
- amountMinor
- currency
- reason safe

### WEBHOOK_RECEIVED
Payload:
- provider
- eventType
- providerEventId

### WEBHOOK_FAILED
Payload:
- provider
- eventType optional
- failureCode
- safe reason

---

## 13. Notification Events

### NOTIFICATION_SENT
Payload:
- notificationLogId
- channel
- templateKey
- bookingId optional
- customerId optional

### NOTIFICATION_FAILED
Payload:
- notificationLogId optional
- channel
- templateKey optional
- bookingId optional
- failureCode
- failureReason safe

---

## 14. Storefront Events

### STOREFRONT_CREATED
Payload:
- storefrontId
- businessId

### STOREFRONT_UPDATED
Payload:
- storefrontId
- changedFields

### STOREFRONT_PUBLISHED
Payload:
- storefrontId
- slug

### STOREFRONT_UNPUBLISHED
Payload:
- storefrontId

### STOREFRONT_VIEWED
Payload:
- storefrontId
- slug
- source optional

### STOREFRONT_CTA_CLICKED
Payload:
- storefrontId
- ctaType
- target

---

## 15. Messaging Events

### MESSAGE_RECEIVED
Payload:
- messageLogId
- channelType
- customerId optional
- externalMessageId optional

### MESSAGE_SENT
Payload:
- messageLogId
- channelType
- customerId optional
- externalMessageId optional

---

## 16. AI/Ops Events

### AI_REQUESTED
Payload:
- module
- purpose
- entityType optional
- entityId optional

### AI_RESPONSE
Payload:
- module
- purpose
- aiInteractionId
- latencyMs optional
- confidence optional

### AI_ERROR
Payload:
- module
- purpose
- errorCode
- safe error summary

### AI_OBSERVATION_CREATED
Payload:
- observationId
- category
- severity
- confidence optional

### INCIDENT_CREATED
Payload:
- incidentId
- category
- severity

### REMEDIATION_ACTION_CREATED
Payload:
- remediationActionId
- actionType
- requiresApproval

### KNOWLEDGE_ENTRY_CREATED
Payload:
- knowledgeEntryId
- scope
- sourceType

---

## 17. Platform Ops Events

### FEATURE_FLAG_UPDATED
Payload:
- key
- oldValue
- newValue
- actorUserId

### KILL_SWITCH_TRIGGERED
Future event for emergency controls.

Payload:
- switchKey
- actorUserId or system
- reason

---

## 18. Event Safety Checklist

Before adding an event:
- Is the event useful?
- Is it business-scoped if needed?
- Is the payload safe?
- Are secrets excluded?
- Is PII minimized?
- Would this help support/ops/AI later?
- Can the event fail without breaking the user flow?