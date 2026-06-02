# Business rules & platform rules — registry

**Status:** v1.0 (2026-05-21)  
**Purpose:** Single index for “where is this rule defined?” — avoids hunting scattered docs at build time.

---

## Platform rules (invariant across tenants)

| Rule | Canonical source | Enforced in code |
|------|------------------|------------------|
| Every query scoped by `businessId` | ADR 0002, `multi-tenant-isolation.md` | Drizzle queries, `tenantContext` |
| RBAC: OWNER > ADMIN > MANAGER > STAFF > RECEPTION | ADR 0009, `access-control.md` | `auth.ts` `requireRole` |
| No cross-tenant PII reads (v1) | ADR 0014, `cross-tenant-intelligence.md` | API + DB |
| Entitlement before premium feature | ADR 0018 | `entitlements-gate.ts` |
| Meter before billable outcome | ADR 0018 | `metering-recorder.ts` |
| Audit on human mutations | ADR 0015 | `appendHumanAudit` |
| Domain events on state change | ADR 0013 | `domain-events.ts`, Inngest |
| Liv disclosure first message | EU AI Act | `ai-disclosure`, chat/voice/email |
| Public chat rate limit | `public-chat-rate-limit.ts` | DB-backed |
| Impersonation time-boxed | `impersonation-audit.md` | Internal only (spec) |
| OpenAPI is HTTP SSOT | ADR 0005 | Orval clients |

**Change process:** RFC → ADR → code + policy if customer-visible.

---

## Business rules (tenant domain)

### Bookings

| Rule | Spec | Code |
|------|------|------|
| States: PENDING → CONFIRMED → COMPLETED / CANCELLED / NO_SHOW | Experience Bible | `bookings.service.ts` |
| Staff must be assigned to service | Complete Spec | `STAFF_NOT_ASSIGNED_TO_SERVICE` |
| Slot conflict → 409 | data-model | advisory lock / overlap check |
| Reminder T-24h | `workflows/booking-reminder` | Inngest `booking-reminder-t24` |
| Cancel policy window | vertical pack + business policy | policies.service |

### Money

| Rule | Spec | Code |
|------|------|------|
| Livia sub via Stripe Billing | pricing doc | `billing.service.ts` |
| Shop deposits via Connect only | Complete Spec §6 | partial |
| Refund ladder caps | `workflows/refund-request.md` | partial |
| Voice outcome 4% monthly cap per plan | pricing doc + `PLAN_CATALOGUE` | settlement scaffold |

### Clients & staff

| Rule | Spec | Code |
|------|------|------|
| Client belongs to business | personas Bet 5 | `customers` table |
| Staff multi-employment | `staff-multi-employment.md` | membership per business |
| Deactivate staff hides future slots | — | `staff.service.ts` |

### Liv (agent)

| Rule | Spec | Code |
|------|------|------|
| Tool allow-list per plan | `agent-runtime.md` | liv runtime deps |
| No booking without slot validation | eval guardrails | tool handlers |
| Auto-rollback class | `liv-was-wrong.md` | workflow (partial) |
| Workflow pause on eval fail | — | `workflow-pause.ts` |

### Lifecycle & onboarding

| Rule | Spec | Code |
|------|------|------|
| Location naming: same brand family as primary shop | `UX-AUDIT-2026-05-21.md` | **Planned** — validate on create/PATCH `name` |
| Second location = new `business` row, not replay first onboarding | `UX-AUDIT-2026-05-21.md` | `onboarding.tsx` `?intent=second-shop` |
| Onboarding vertical seed | Complete Spec §3 | `onboarding.service.ts` |
| EU timezone from jurisdiction | `lib/policy/jurisdictions` | `resolveOnboardingDefaults` |
| Tier nudges Solo → Studio | `lifecycle.ts` | partial |
| Ownership transfer irreversible | [`TENANT-AUTHORITY-AND-SUCCESSION.md`](./TENANT-AUTHORITY-AND-SUCCESSION.md) G8 | `ownership-transfer.service` + `ownership-succession.ts` |
| Staff roster ≠ Livia login | Same | `staff.user_id` optional; transfer requires `business_memberships` |

### Channels

| Rule | Spec | Code |
|------|------|------|
| SMS live | v1-scope | Twilio routes |
| Voice gated by entitlement | v1-scope | `voice.ts` |
| WhatsApp / IG | **deferred** | marketing audit row 1 |

---

## Vertical overrides (pack)

Defined in `@workspace/policy` `verticals.ts` — consumed by onboarding seed; **target:** booking labels, required fields, settings hints (Phase 3.3).

| Vertical | Example rule override |
|----------|----------------------|
| Hair | Standard deposit optional |
| Beauty | Patch test flag (v1.5) |
| Tattoo | Consult-before-session (v1.5) |
| Medspa | Consent artifacts (partner) |

---

## How to add a new rule

1. Write behaviour in **workflow doc** or **Complete Spec** (L2).  
2. Add to **OpenAPI** if HTTP-visible (L4).  
3. Implement in **service** (L5).  
4. Add **unit test** or **eval case** (L6).  
5. If support-facing, add row to **`docs/operations/support-runbook.md`** (L7).
