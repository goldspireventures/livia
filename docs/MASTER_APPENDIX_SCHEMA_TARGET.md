# Appendix — target schema (master spec vs direction)

**Purpose:** Capture the **north-star data model** from the master product spec without implying every table exists today. **Live schema:** `prisma/schema.prisma`. **Gaps:** [REPO_DELTA.md](./REPO_DELTA.md).

## Core booking OS (largely present)

- `User`, `Business`, `BusinessMembership` — tenancy root.
- `Staff`, `Service`, `StaffServiceAssignment` — catalog + who can perform what.
- `Customer`, `ChannelIdentity` — CRM + channel links (shape may evolve: more `ChannelType` values, optional `Booking.channel`).
- `Booking` — lifecycle + overlap rules; extend with `channelType`, buffers via `Service` when product requires.
- `AvailabilityRule`, `TimeOff` — staff-scoped windows and blocks.
- `Event` — audit trail via `logEvent` ([events appendix](./MASTER_APPENDIX_EVENTS.md)).
- `FeatureFlag` — per-tenant `(businessId, key)` (differs from a hypothetical global flag store; document if product changes).

## Payments (partial)

- `PaymentIntentRecord`, `Payment`, `PaymentAccount` — present; Stripe adapter (Phase 7) stays under `src/services/payments/*`.

## Platform extensions (target / not built yet)

Add when the matching **tranche** ships ([TRANCHES.md](./TRANCHES.md)):

- **Notifications:** `NotificationLog`, provider abstraction, device registration.
- **Messaging:** `MessageLog`, inbound webhooks, channel adapters (WhatsApp, SMS, …).
- **AI / ops memory:** `AIInteraction`, `AIObservation`, `Incident`, `RemediationAction`, `KnowledgeEntry`, `WorkflowRun` — only with retention and PII policy.

## Indexing & constraints

- Prefer **soft lifecycle** (`active`, status enums) over hard deletes for staff, services, customers, bookings — see LIVIA_BUILD_PLAN Part A §5.4.
- Add indexes and uniques at migration time with a short comment in `schema.prisma` when new models land.
