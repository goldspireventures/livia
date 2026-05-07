# Data model — entities and relationships

**Status:** v1 (2026-05-07). Reads with ADR 0002 (multi-tenant), ADR 0009 (roles), ADR 0010 (multi-tenant + persona), ADR 0014 (isolation), ADR 0015 (audit log).

## Posture

- Postgres primary. Drizzle ORM. Schema-per-tenant graduation reserved for v1.5+.
- Every entity has `business_id` (the tenant boundary). Universal-ish entities (people who exist across tenants — staff with multiple memberships, customers shared across tenant brands) use `memberships` to bridge.
- Audit-log writes happen via the `audit-log` package, never raw inserts.

## Core entities (v1)

### `businesses`
The tenant. One per legal-entity-shaped salon.
- `id uuid pk`
- `name text`
- `slug text unique`
- `vertical enum` (hair, beauty, body-art, wellness, fitness, medspa, allied-health)
- `configuration_id fk` → `configurations`
- `tier enum` (solo, studio, chain, host, multi-brand, enterprise)
- `locale text` (e.g., `en-IE`, `en-UK`, `de-DE`)
- `eu_region text` (`fra` primary, `dub` replica)
- `created_at timestamptz`
- `metadata jsonb`

### `users`
Person-level identity. Cross-tenant.
- `id uuid pk`
- `clerk_id text unique` (per ADR 0003)
- `email_canonical text unique`
- `display_name text`
- `default_locale text`
- `created_at timestamptz`

### `memberships`
A user's relationship to a business with a role (per ADR 0009 + ADR 0010). First-class.
- `id uuid pk`
- `user_id fk` → `users`
- `business_id fk` → `businesses`
- `role enum` (`OWN`, `ADM`, `ADM-D`, `STA`, `REC`, `OWNER_HOST` for chair-rental hosts)
- `scope jsonb` — for `ADM-D`: which team/teams; for chain: which shops; for multi-brand: which brand-shells
- `cap_refund_eur integer` — refund authority cap in cents (null = unlimited for OWN)
- `cap_timeoff_days integer` — time-off approval cap in days (null = unlimited for OWN)
- `reports_to fk` → `memberships` (nullable; the supervisor relationship for `STA` and `ADM-D`)
- `status enum` (active, suspended, departed)
- `started_at timestamptz`
- `ended_at timestamptz`

### `delegations`
First-class delegation grants (per ADR 0010 — owner-on-holiday, manager-on-leave handoffs).
- `id uuid pk`
- `from_membership_id fk` → `memberships`
- `to_membership_id fk` → `memberships`
- `scope jsonb` — capabilities delegated (refund-cap-uplift, time-off-approve, etc.)
- `effective_from timestamptz`
- `effective_to timestamptz`
- `granted_at timestamptz`
- `revoked_at timestamptz`
- `revoked_by fk` → `memberships`

### `customers`
End-customer of a salon. Belongs to a business (per Bet 5 — customer-belongs-to-salon).
- `id uuid pk`
- `business_id fk` → `businesses`
- `name text`
- `email_canonical text`
- `phone_canonical text`
- `preferred_modality enum` (whatsapp, sms, email, voice)
- `preferred_staff_id fk nullable` → `memberships`
- `customer_typology enum` (CT1 anonymous, CT2 regular, CT3 new, CT4 drift-target, CT5 power-customer, CT6 problem-customer)
- `consent jsonb` — per-channel marketing consent + intake-form consent
- `created_at timestamptz`
- `metadata jsonb`

### `services`
Bookable services per business.
- `id uuid pk`
- `business_id fk`
- `name text`
- `duration_minutes integer`
- `price_eur_cents integer`
- `vertical_template_id fk` (per-vertical template; v1 = hair only)
- `staff_required jsonb` (which staff can perform; can be a role or specific membership)
- `metadata jsonb`

### `bookings`
The core transactional entity.
- `id uuid pk`
- `business_id fk`
- `customer_id fk`
- `service_id fk`
- `staff_membership_id fk` → `memberships` (the staff member booked)
- `start_at timestamptz`
- `end_at timestamptz`
- `state enum` (pending, confirmed, started, completed, cancelled, no-show)
- `source enum` (voice, whatsapp, sms, web, walk-in, owner-manual)
- `source_conversation_id fk nullable` → `conversations` (Liv-attribution per Bet 1)
- `deposit_paid_eur_cents integer`
- `total_paid_eur_cents integer`
- `created_at timestamptz`

### `conversations`
Liv's conversational context with a person (customer or staff). Lives across modalities.
- `id uuid pk`
- `business_id fk`
- `participant_kind enum` (customer, staff)
- `participant_id fk` (polymorphic)
- `modality enum` (whatsapp, sms, voice, web-chat)
- `started_at timestamptz`
- `last_message_at timestamptz`
- `state enum` (active, dormant, archived)

### `conversation_messages`
- `id bigserial pk`
- `conversation_id fk`
- `direction enum` (inbound, outbound)
- `actor_kind enum` (liv, human)
- `actor_id uuid` (membership_id if human)
- `content text` — PII-redacted at rest where applicable
- `metadata jsonb`
- `occurred_at timestamptz`

### `refunds`
- `id uuid pk`
- `business_id fk`
- `booking_id fk nullable`
- `customer_id fk`
- `amount_eur_cents integer`
- `reason text`
- `state enum` (proposed, approved, escalated, issued, denied)
- `proposed_by enum` (liv, human)
- `proposed_by_membership_id fk nullable`
- `approver_membership_id fk nullable`
- `approval_chain jsonb` — the cap-bound ladder trace
- `issued_at timestamptz`

### `time_off_requests`
- `id uuid pk`
- `business_id fk`
- `requester_membership_id fk`
- `start_at timestamptz`
- `end_at timestamptz`
- `state enum` (proposed, approved, denied, cancelled)
- `approver_membership_id fk nullable`
- `liv_drafted boolean` — whether Liv generated the request from a conversation

### `audit_log`
Per ADR 0015. (Schema in `docs/engineering/audit-log-physical-design.md`.)

### `evals_traces`
- Per ADR 0016. Production traces sampled for online eval; PII-scrubbed.

### `flags`
Feature-flag table per `docs/roadmap/feature-flags-and-rollout.md`.
- `key text pk`
- `kind enum` (release, permission, locale, vertical, experiment, killswitch)
- `default_state boolean`
- `tenant_overrides jsonb`
- `metadata jsonb`

## Entities added at v1.5

- `chair_rentals` — host-renter relationship, rent terms, period.
- `rent_invoices` — auto-generated rent ledger.
- `brand_shells` — multi-brand portfolio scope.
- `peer_set_aggregates` — cross-tenant intelligence rollups (per ADR 0014; never tenant-identifiable).

## Entities added at v2

- `class_capacities` — fitness class capacity + waitlist.
- `package_credits` — multi-session package ledger.
- `consent_artifacts` — body-art/medspa-style intake/consent forms.

## Entities added at v3

- `enterprise_contracts` — enterprise-tier specific.
- `byok_keys` — tenant-managed encryption key references.
- `regulatory_exports` — per-market regulatory export ledger.

## Cross-cutting rules

- **Soft-delete by default** (state enums include `archived` / `cancelled` / `departed`). Hard-delete via 30-day purge job (per `docs/policy/data-retention.md`).
- **Foreign keys** always; never application-level joins where DB constraints work.
- **Indexes** on `(business_id, *)` for any read pattern that filters by tenant.
- **Constraints** for tenant-scoped uniqueness (e.g., service slug unique within business, not globally).
- **Tenant filter** enforced at query-helper level; raw SQL forbidden in app code; Postgres RLS as second line of defence.

## Open questions

- Should `customers` carry a global `email_canonical_hash` for opt-out propagation across tenants the same person uses? (Privacy implication; deferred to v1.5 RFC.)
- `conversations.participant_id` polymorphic — would explicit `customer_conversations` + `staff_conversations` be cleaner?
