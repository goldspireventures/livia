# Composable monetisation — architectural North Star

**Status:** Accepted (2026-05-07). Companion to ADR 0018. Reads with ADR 0006 (monorepo), ADR 0010 (multi-tenant + persona), ADR 0012 (agent runtime), ADR 0013 (Inngest event bus), ADR 0014 (multi-tenant isolation), ADR 0015 (audit log), ADR 0016 (eval).

## The principle

Livia is not "an app." Livia is a **suite of independently valuable capabilities** that happen to be sold today as one product. Each capability is designed so it could later be:

- sold standalone to a different buyer,
- white-labelled to a partner,
- exposed as a developer API,
- spun out as its own business,
- or kept inside Livia and composed differently for a new tier.

This is not a fantasy. It is the difference between **Stripe** (composed of dozens of products that each could be a company) and **Bookings R Us** (one monolith that can never be decomposed).

## The 12 sellable units

What we design as if each were a future product, even though v1 ships them inside one app:

| # | Unit | Future buyer | Standalone monetisation |
|---|---|---|---|
| 1 | **Liv (the agent runtime)** | Any salon software, any appointment platform | "Bring your own data, get an AI operator" — usage-based |
| 2 | **Voice receptionist** | Independent salons not on Livia; Twilio marketplace | Per-minute + per-booking-outcome |
| 3 | **Booking core** (calendar + services + customers) | Headless commerce; embeddable widgets | Per-business SaaS, classic |
| 4 | **Audit-log-as-a-service** (hash-chained, tamper-evident) | Other ops platforms wanting trust-amplification | Per-event ingest |
| 5 | **Cross-tenant intelligence** (peer-set insights, k≥10) | Franchises, suppliers, market-data subscribers | Subscription + premium reports |
| 6 | **Migration broker network** (Phorest/Booksy/Fresha → standard format) | Consultants, agencies, competitors | Per-migration fee |
| 7 | **Eval framework** (pre-merge + production traces, three-layer) | Other AI agent builders | OSS + paid hosted tier |
| 8 | **Owner cockpit** (web) | Chain HQs, multi-brand operators | White-label + per-shop |
| 9 | **Mobile flagship** | Standalone "salon staff app" for non-Livia salons | Per-staff-seat |
| 10 | **Customer booking surface** (DM + voice + web) | Embeddable for any service business | Per-booking |
| 11 | **Settlement engine** (outcome-bound billing) | Other usage-based-revenue businesses | Licensed |
| 12 | **Vertical packs** (Hair, Beauty, Body-art, Wellness, Fitness, Medspa, Allied health) | Per-vertical communities; consultants | Marketplace fee |

## The 8 architectural patterns

### 1. Contract-first, package-isolated domains

Every domain lives in its own package under `lib/`. Packages **never reach into each other's tables**. They communicate through:

- typed contracts (Zod in `lib/api-zod`),
- the OpenAPI surface (`lib/api-spec`),
- domain events on the bus (Inngest per ADR 0013).

This is the single most important pattern. Without it, decomposition is impossible later.

### 2. Event-driven core

Every state change emits a typed domain event:
`booking.created`, `booking.cancelled`, `voice.call.completed`, `audit.event.recorded`, `peer-set.aggregate.computed`.

New consumers subscribe without modifying the producer. New monetisable surfaces don't require core changes.

### 3. Tenant context as a primitive, not a column

Every operation runs inside an explicit tenant context:
```ts
type TenantContext = {
  businessId: string;
  membershipId: string;
  capabilities: CapabilityToken;
  region: 'fra' | 'dub';
};
```
RLS enforces it at the DB. The query helper enforces it in app code. The same context shape is used by dashboard, mobile, voice-bridge, and (future) third-party API. Region-pinning, schema-per-tenant graduation, and BYO-tenant partner mode become migrations — not rewrites.

### 4. Capability tokens for every action

Instead of "is this user an Owner?", every action carries a signed capability:
```ts
type CapabilityToken = {
  membershipId: string;
  scope: { teams?: string[]; shops?: string[] };
  caps: { refundEurCents?: number; timeoffDays?: number; ... };
  expiresAt: string;
  signature: string; // EdDSA over canonical(payload)
};
```
Three benefits: (a) audit-log entries become rich and self-describing; (b) third-party integrations get scoped tokens cleanly; (c) impersonation, delegation, and owner-on-holiday become "issue a token" — not "patch the role logic".

### 5. Liv runs as its own service, not inline code

The agent runtime is **not** a function call inside the API server. It's a separate process that talks to the rest of Livia via the same contracts as any external client. This means:

- Liv can be sold standalone (unit #1).
- Liv can be replaced or upgraded without touching domain code.
- Liv runtimes can be A/B tested per tenant.
- Liv's per-tenant cost envelope (ADR 0012) is observable independent of the API server's.

### 6. Pricing as composable primitives

**Meters** (`per-booking`, `per-voice-minute`, `per-staff-seat`, `per-WhatsApp-message`) live in `lib/metering`.
**Entitlements** (`canAccessVoice`, `canExceedKBookings`, `canUsePeerSetInsights`) live in `lib/entitlements`.
**Products** (Solo, Studio, Chain, Chair-Host, white-label) are **compositions** of meters + entitlements, declared as data, not code.

Means new products = new rows. Not new sprints.

### 7. Vertical packs as plugins, not branches

Each vertical (`hair`, `beauty`, `body-art`, `wellness`, `fitness`, `medspa`, `allied-health`) is a pack containing:

- service templates,
- intake-form schemas,
- AI knowledge,
- terminology overrides,
- regulatory hooks (GDPR/AI-Act/employment-law specifics per vertical).

Loaded by `business.vertical` at runtime. Adding `medspa` at v3 is a pack — not a fork. We could later sell vertical packs to consultants.

### 8. Two API planes from day 1: tenant + partner

- **`/v1/tenant/*`** — what dashboard, mobile, and voice-bridge call. Bound to the current Clerk session.
- **`/v1/partner/*`** — what third-party integrators, white-label customers, or migration brokers will call. Bound to a partner OAuth client + scoped capability token.

We don't *open* the partner plane to outsiders at v1. But we **build the dashboard against it from day 1** so it exists, is tested, and is shippable the day we want it.

## The package map (target state)

```
lib/
  identity/             # users, businesses, memberships, delegations (the spine)
  tenant-context/       # TenantContext type + middleware + query-helper guard
  capability-tokens/    # signing, verification, scope enforcement
  booking-domain/       # services, customers, bookings, availability, time-off
  audit-log/            # hash-chained ledger; ADR 0015
  event-bus/            # Inngest wrapper + typed event registry; ADR 0013
  agent-runtime/        # Liv's per-tenant runtime; ADR 0012
  voice/                # voice receptionist (Twilio bridge + STT/TTS)
  conversations/        # conversations + messages (modality-agnostic)
  notifications-domain/ # email/SMS/push/WhatsApp transport-agnostic delivery
  payments/             # Stripe Connect + payment_intents + payments + refunds
  metering/             # usage meters (booking, voice-minute, staff-seat, etc.)
  entitlements/         # feature gates + product compositions
  settlement/           # outcome-bound billing engine; voice 4% capped
  intelligence/         # cross-tenant aggregates; ADR 0014; k≥10 enforcement
  eval/                 # ai_interactions, evals_traces; ADR 0016
  migration-broker/     # Phorest/Booksy/Fresha import pipelines
  vertical-packs/       # hair, beauty, body-art, wellness, fitness, medspa, allied-health
  observability/        # OTel wrapper, span helpers; ADR 0017
  api-spec/             # OpenAPI source of truth; ADR 0005
  api-zod/              # Zod schemas generated from / aligned with OpenAPI
  api-client-react/     # generated React client
  ai-disclosure/        # AI Act disclosure surfaces (existing)
  integrations/         # third-party adapter shims (anthropic, twilio, resend, ...)
```

## The pragmatic reorganisation plan (the v1 reality)

The target state above is the **destination**. The path matters too.

We have a working `@workspace/db` package with ~967 lines of schema and ~30 consumers. A naive "rip it apart now" creates a long-tail of import-rewrite churn that delays Phase 1 with zero customer value.

**The honest plan:**

### Now (Phase 0 — ~3 hours, before Phase 1 schema push)

Stand up the genuinely-new packages where there's **no rename cost** because the code doesn't exist yet:

- `lib/tenant-context` — fresh.
- `lib/capability-tokens` — fresh.
- `lib/audit-log` — fresh (the events table is for product analytics; audit-log is a new beast).
- `lib/eval` — fresh.
- `lib/event-bus` — fresh thin Inngest wrapper.
- `lib/entitlements` — extract from `feature-flags` schema with a thin re-export shim.
- `lib/metering` — fresh.

Reorganise `@workspace/db` **internally** by domain folder while keeping the package boundary stable:

- `lib/db/src/schema/identity/` — users, businesses, memberships, delegations.
- `lib/db/src/schema/booking/` — services, customers, bookings, availability, time-off.
- `lib/db/src/schema/conversations/` — conversations, messages.
- `lib/db/src/schema/payments/` — payment_accounts, intents, payments, refunds.
- `lib/db/src/schema/notifications/` — notification_logs, message_logs, device_tokens.
- `lib/db/src/schema/ai/` — ai_interactions (operational; eval lives in lib/eval).
- `lib/db/src/schema/events/` — events (product analytics, not audit log).

Re-export from `lib/db/src/schema/index.ts` so consumers don't break. Add domain-scoped subpath exports (`@workspace/db/identity`, `@workspace/db/booking`, etc.) so new code uses the right boundary from the start.

### Soon (Phase 1.5 — once Phase 1 schema lands)

Stand up the **partner API plane** as an empty namespace under `artifacts/api-server/src/routes/partner/`. One health endpoint. Not exposed publicly. Not documented. Just exists, so future work doesn't pretend it's an afterthought.

### Later (graduation milestones)

Each `lib/db/src/schema/<domain>/` subfolder graduates to `lib/<domain>-domain/` when **any** of these is true:

- A non-Livia consumer wants to embed it.
- It needs its own deployment cadence.
- It needs its own DB role / RLS scope / region pinning.
- A contributor needs to work on it without touching the rest.

Graduation is mechanical because the domain folder already has clean boundaries: a folder-move + a `package.json`. No code rewrite.

### Never (anti-pattern explicitly rejected)

- "Microservice from day one" is rejected. We need one good monolith with **clean internal boundaries**, not seven half-baked services.
- "Database per domain from day one" is rejected. One Postgres, RLS-isolated, with the *option* of sharding later. ADR 0014 already says this.
- "Build the partner API for external use at v1" is rejected. The plane *exists*; it is not *opened*.

## What this earns us

By v1.5 we have the **option** to:

- Sell Liv standalone to a non-Livia salon system (unit #1) without rewriting Liv.
- Open the partner API to migration consultants (unit #6) without retrofitting auth.
- Spin out the audit-log SaaS (unit #4) by adding a thin HTTP front and a separate billing meter.
- Launch a vertical pack marketplace (unit #12) without forking the codebase per vertical.
- Sell peer-set insights (unit #5) as a separate subscription without exposing tenant data.

We do not commit to doing any of these. We commit to **preserving the option**.

## What this costs us

- ~3 hours of structural work at Phase 0 we could have skipped.
- Ongoing discipline at PR-review to enforce the package boundaries.
- A glossary entry per new package (`docs/foundation/glossary.md` updated this commit).

## What this does not change

- v1 ship date (Q4 2026 per `docs/roadmap/v1-scope.md`).
- v1 scope (P2b solo Hair en-IE single-shop).
- The data model entities (per `docs/engineering/data-model.md`).
- The 17 ADRs already accepted.
- Clerk for auth (ADR 0003).
- Inngest for event bus (ADR 0013).
- Postgres on Supabase EU (this commit).

## Open questions

- When does `agent-runtime` get extracted from the API server into its own service? (Leaning: at v1.5 when voice volume justifies independent scaling.)
- Should `vertical-packs` ship as runtime-loaded data (faster) or compile-time tree-shaken bundles (smaller cold-start)? (Leaning: data, with a packaging layer for partner consumption later.)
- Does `metering` live in our DB or stream to a third-party (e.g., Orb, m3ter)? (Leaning: in our DB at v1; consider third-party at v1.5 if usage outgrows.)

## Annual review

This doc is reviewed annually. If at review time we're still not exercising any of the 12 sellable-unit options, we ask: are we paying the optionality tax for nothing? If yes, we collapse boundaries. If no (we used or seriously considered ≥1 option), we keep the discipline.

## EU/IRE residency

All packages that touch tenant data inherit the residency commitment from `docs/policy/data-residency.md`. The package boundary does not weaken the data boundary.
