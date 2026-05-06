# Livia Data and Security Rules

## Purpose

This document defines Livia’s data safety, tenant isolation, privacy, and security rules.

Livia is multi-tenant and will eventually handle payments, customer data, messages, and AI-driven insights. Data safety must be designed from the start.

---

## 1. Tenant Isolation

Business is the tenant root.

All tenant-owned data must be scoped by `businessId`.

Tenant-owned entities include:
- Staff
- Service
- StaffServiceAssignment
- Customer
- ChannelIdentity
- Booking
- AvailabilityRule
- TimeOff
- PaymentIntentRecord
- Payment
- NotificationLog
- MessageLog
- Storefront
- Event
- FeatureFlag
- AIObservation
- Incident
- RemediationAction

Rules:
- Never query tenant-owned records without `businessId` unless there is a documented platform-admin use case.
- Never return data from another business.
- Always verify membership/role before protected tenant operations.
- Public routes must resolve tenant via safe identifiers such as slug.

---

## 2. Access Control

Access control uses:
- authenticated user
- BusinessMembership
- role checks

Until Auth phase is complete:
- temporary `actorUserId` / `userId` may exist only with TODO comments
- protected route design must be ready for real session replacement

Required protected operations:
- create/update/deactivate staff
- create/update/deactivate services
- manage availability
- view/manage bookings
- view/manage customers
- manage payments
- manage storefront
- manage feature flags
- view operational events

Public operations:
- view public booking page
- view public storefront
- request slots
- create public booking
- payment checkout callback/webhook flows where appropriate

---

## 3. Soft Delete Rules

Do not hard delete operational records that may be referenced historically.

Soft deactivate:
- Staff
- Services
- Businesses where possible
- Customers where retention rules require history preservation

Bookings should not be deleted casually. Use statuses:
- CANCELLED
- COMPLETED
- NO_SHOW

Hard delete may only be used for:
- temporary setup data
- truly orphaned records
- legal deletion workflows after careful design
- test data in dev

---

## 4. PII Handling

PII includes:
- names
- phone numbers
- email addresses
- addresses
- message contents
- social handles
- booking notes
- customer notes

Rules:
- collect only what is needed
- do not log sensitive PII in events
- do not expose customer info across tenants
- avoid storing unnecessary raw provider payloads
- customer notes may contain sensitive content; treat carefully
- future export/delete workflows must be possible

---

## 5. Payment Security

Livia must never store:
- raw card numbers
- CVC
- full payment credentials
- raw bank account credentials
- provider secrets

Stripe or other PSP handles sensitive card data.

Livia may store:
- provider payment intent ID
- provider charge ID
- provider account ID
- amount
- currency
- status
- safe failure reason
- safe webhook event ID

Rules:
- payment provider calls live behind `src/services/payments/*`
- no Stripe SDK calls outside provider layer
- webhook signatures must be verified when configured
- never fake payment success
- payment events must be auditable

---

## 6. Secrets

Secrets must only live in:
- `.env`
- host secret manager
- CI secret manager

Never commit:
- API keys
- database passwords
- Stripe secrets
- webhook secrets
- OpenAI keys
- OAuth secrets

`.env.example` may contain variable names, never real values.

---

## 7. External Integrations

External integrations include:
- Stripe
- WhatsApp/Meta
- SMS provider
- Instagram
- Snapchat
- Email provider
- OpenAI

Rules:
- integration code must be isolated under provider/service modules
- do not fake external success
- if credentials missing, fail safely
- webhook payloads must be validated
- provider errors must be normalized before returning/logging

---

## 8. AI Safety and Privacy

AI must not:
- validate bookings
- validate payments
- validate permissions
- execute destructive actions without policy
- receive secrets
- receive unnecessary PII
- silently modify business-critical data

AI may:
- summarize
- classify
- recommend
- create observations
- draft insights
- suggest remediation

All AI calls must:
- go through shared AI client
- log AIInteraction where supported
- emit AI events
- fail safely

---

## 9. Rate Limiting and Abuse Readiness

Public endpoints must be rate-limit ready:
- public slots
- public booking creation
- storefront pages
- lead capture
- messaging webhooks

Future rate-limit dimensions:
- IP
- businessId
- customer phone/email
- channel identity
- route type

Do not build public endpoints in a way that assumes unlimited traffic.

---

## 10. Auditability

Important mutations should be traceable through:
- Events
- updatedAt fields
- actorUserId where available
- status history where needed later

Examples:
- staff deactivation
- service deactivation
- booking status change
- payment state changes
- refund actions
- feature flag changes

---

## 11. GDPR-Style Future Requirements

Livia should be architected to later support:
- customer data export
- customer data deletion/anonymization
- business data export
- retention policies
- consent tracking for messaging
- privacy policy enforcement

Do not build schema choices that make this impossible.

---

## 12. Security Checklist for Cursor

Before marking a phase complete:

- all tenant queries scoped by businessId
- protected routes check membership/auth
- no secrets logged
- no raw card data stored
- no cross-tenant leakage
- no fake external success
- Zod validation exists
- service-level validation exists
- events do not contain sensitive data
- build passes