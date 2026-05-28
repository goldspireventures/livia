# Livia — Resilience, operations & trust (multi-angle)

**Status:** v1.0 (2026-05-21)  
**Audience:** founder, engineering, future ops — **not** a substitute for counsel on breach notification  
**Reads with:** [`LIVIA-COMPLETE-SYSTEM-SPEC.md`](./LIVIA-COMPLETE-SYSTEM-SPEC.md) · [`LIVIA-DOCUMENTATION-READINESS.md`](./LIVIA-DOCUMENTATION-READINESS.md) · [`../engineering/incident-response.md`](../engineering/incident-response.md) · [`../engineering/observability-and-on-call.md`](../engineering/observability-and-on-call.md) · [`../policy/access-control.md`](../policy/access-control.md) · [`../operations/support-runbook.md`](../operations/support-runbook.md)

**Does this invalidate Phase 0?** No. Phase 0–2 product work stays valid. This doc adds **L7 operational maturity** requirements that run **in parallel** (Track C — Reliability) so we do not ship a brilliant product on a fragile floor.

---

## 0. The question behind the question

You are asking: *when anything fails — a booking, a payment, Liv, Postgres, Twilio, our deploy, or a human mistake — do we know what happened, who is affected, how we recover, and can we prove it later?*

For a platform this shape (multi-tenant OS + agent + money + EU trust), that is as important as onboarding UX.

---

## 1. Layers of failure (map the blast radius)

```text
┌─────────────────────────────────────────────────────────────────┐
│ L0  Prospect / marketing (livia.io down, wrong claim)           │
├─────────────────────────────────────────────────────────────────┤
│ L1  Identity (Clerk outage, session hijack)                     │
├─────────────────────────────────────────────────────────────────┤
│ L2  API + app tier (api-server crash, bad deploy)               │
├─────────────────────────────────────────────────────────────────┤
│ L3  Data (Postgres unavailable, corrupt row, migration fail)    │
├─────────────────────────────────────────────────────────────────┤
│ L4  Async (Inngest stuck, double email, missed reminder)        │
├─────────────────────────────────────────────────────────────────┤
│ L5  Channels (Twilio SMS/voice, Resend email)                   │
├─────────────────────────────────────────────────────────────────┤
│ L6  Agent (Liv wrong book, tool loop, model outage)           │
├─────────────────────────────────────────────────────────────────┤
│ L7  Money (Stripe Billing/Connect webhook delay, double charge) │
├─────────────────────────────────────────────────────────────────┤
│ L8  Tenant product flows (cancel, refund, no-show, time-off)  │
├─────────────────────────────────────────────────────────────────┤
│ L9  Livia Inc (internal portal, support, on-call)               │
└─────────────────────────────────────────────────────────────────┘
```

**Rule:** Every SEV classification names **which layer(s)** broke. A single customer complaint often spans L6 + L8.

---

## 2. What happens when something breaks (by class)

### 2.1 Customer-visible product flows (L8)

| Flow breaks | User sees | System should do | Human fallback | Spec / code |
|-------------|-----------|------------------|----------------|-------------|
| **Book slot** | “No times” / error | 409 overlap, clear message | Staff books manually | ✅ booking service |
| **Liv double-books** | Two confirmations | Auto-cancel duplicate if policy allows | Manager cancels one | ✅ triage workflow + Report Liv |
| **Reminder not sent** | No SMS/email | Inngest retry + cron fallback | Resend manual | ✅ reminder workflow; prod cron must be on |
| **Refund stuck** | Money not back | Connect refund status polled | Stripe dashboard | ⚠️ UI partial |
| **Cancel late** | Policy dispute | Ladder + inbox approval | Owner decides | ✅ workflow doc |
| **Time-off conflict** | Booking on PTO day | Block slot or flag manager | Manager moves booking | ✅ time-off workflow |
| **Public page down** | 404 / 500 | Status page + SEV1 | — | ✅ `/status` + healthz probe |

**Product promise:** Never silent failure on **money** or **booking state**. If automation cannot complete, surface **inbox task** + audit entry.

### 2.2 Liv / agent failures (L6)

| Failure | Detection | Auto response | Human response |
|---------|-----------|---------------|----------------|
| Tool call wrong slot | Eval + overlap check | Block write | Report Liv error → ticket |
| Hallucinated price | Policy + service catalog | Refuse quote outside catalog | Correct in settings |
| Model provider outage | Latency / 5xx from Anthropic | Graceful “Liv unavailable”; queue | Disable Liv per tenant kill switch |
| PII in wrong channel | Redaction rules | Strip before send | SEV-SEC if leak |

**Record:** `ai_interactions` + audit `liv.*` + optional eval trace (ADR 0016).

### 2.3 Platform / infra (L2–L5)

| Failure | Mitigation today | Target |
|---------|------------------|--------|
| **api-server pod crash** | Process restart (hosting dependent) | Healthz + auto-restart; multi-instance G3 |
| **Bad deploy** | Rollback per `release-pipeline.md` | <5 min rollback drill quarterly |
| **Postgres primary down** | **Supabase** HA / failover (provider) | Document RPO/RTO from Supabase SLA; annual restore drill |
| **Inngest unavailable** | Cron fallbacks for critical paths (reminders) | Idempotent steps; alert on backlog |
| **Twilio regional issue** | Fail to inbox; show “SMS delayed” | Multi-region numbers v2 |
| **Stripe webhook miss** | Reconcile job + dashboard “billing stale” | Webhook replay + idempotency keys ✅ |

### 2.4 Security & trust (L1, L9)

| Event | Clock | Playbook |
|-------|-------|----------|
| Suspected breach | GDPR 72h awareness | `incident-response.md` SEV-SEC |
| Credential leak | Immediate rotate | All service tokens quarterly |
| Break-glass abuse | Owner notify 24h | `access-control.md` |

---

## 3. Failover, backups, disaster recovery

### 3.1 What “backup” means for Livia

| Asset | Who backs up | RPO (target) | RTO (target) | Our job |
|-------|--------------|--------------|--------------|---------|
| **Postgres (tenant data)** | Supabase automated backups | Provider-defined (document in `.local/ops-runbook`) | Hours → minutes per tier | Annual **restore to staging** drill |
| **Object storage** (logos, exports) | Provider | Same | Same | Include in DR drill |
| **Audit log** | Same DB; 7y retention policy | Near-zero on primary | Restore with chain verify | Hash chain validation post-restore |
| **Inngest state** | Inngest cloud | Event replay | Replay from domain events | Don’t rely on Inngest as SOLE truth |
| **Stripe** | Stripe | N/A | Stripe Dashboard | Reconcile subscriptions nightly |
| **Clerk** | Clerk | N/A | Clerk | No tenant passwords in our DB |

**Honest gap:** We do not yet have a **written RPO/RTO** in repo ops runbook (SOC2 checklist flags this). **Action:** `docs/operations/disaster-recovery.md` (Phase R1).

### 3.2 Failover patterns (not all built)

| Pattern | Status | Notes |
|---------|--------|-------|
| Multi-AZ DB (Supabase) | **Provider** | EU region pin still G3 blocker (#57) |
| API horizontal scale | **Deploy-dependent** | Stateless api-server ✅ |
| Read replica for reporting | **v2** | Chain rollup heavy |
| Queue failover (Inngest → cron) | **Partial** | Booking reminders |
| Liv model fallback (secondary model) | **Specified** | RFC before prod reliance |
| Kill switch per tenant | **Partial** | Feature flags + disable `aiEnabled` |
| Global kill switch all Liv | **Specified** | Internal portal Phase R2 |

### 3.3 Restore playbook (summary)

1. Declare SEV1 if customer booking or pay broken.  
2. IC chooses: **rollback deploy** vs **failover DB** vs **vendor incident**.  
3. If DB restore: restore to **staging first**; verify audit chain tip; run re-purge for any erasure conflicts (`data-retention.md`).  
4. Communicate on status page; per-tenant email if scoped.  
5. Post-mortem within 5 business days.

---

## 4. Logging & record-keeping — three different systems

**Do not conflate these.** Confusion here is how big platforms become un-debuggable.

### 4.1 Three records

| System | Purpose | Retention | Who reads |
|--------|---------|-----------|-----------|
| **A. Request logs** (pino → Grafana/Loki) | Debug ops, latency, 5xx | ~30–90d hot | Engineers, on-call |
| **B. Product events** (`events` table) | Analytics, funnels | Per `data-retention` | Product, aggregate |
| **C. Audit log** (hash-chained) | Trust, disputes, compliance | 7 years | Owner, auditor, legal |

**Plus:** **D. Sentry** — errors with stack traces (90d).  
**Plus:** **E. Support tickets** — human narrative (`support_tickets`, new).  
**Plus:** **F. Eval traces** — Liv quality (ADR 0016).

### 4.2 Log identity contract (how to find “what is what”)

Every **api-server** request log should carry (implemented in `app.ts`):

| Field | Meaning | Example |
|-------|---------|---------|
| `request_id` | One HTTP request | UUID v4 |
| `tenant_id` | `businessId` when scoped | From path `/businesses/{uuid}` |
| `user_id` | Clerk user | When authenticated |
| `plan_tier` | Entitlement context | From `resolvedTenant` |
| `method` / `path` | Route | `PATCH /api/businesses/.../bookings/...` |
| `status` / `duration_ms` | Outcome | `409` 42ms |

**Correlation recipe for on-call:**

```text
Customer says "booking failed at 14:03"
  → support ticket context.bookingId
  → audit log search businessId + bookingId
  → request logs filter tenant_id + time window
  → Sentry issue if 5xx (same request_id in breadcrumb — target state)
```

**Gaps today:**

| Gap | Impact | Phase |
|-----|--------|-------|
| Sentry ↔ `request_id` link not universal | Harder trace 5xx → log line | R1 |
| No standard `conversation_id` in HTTP logs for chat | Inbox bugs slower | R1 |
| Grafana/Loki not fully wired (ADR 0017) | Logs live in host stdout | Launch E3 |
| Internal portal “open trace” | Click from tenant card | R2 |

### 4.3 Liv-specific logging

| Event | Where |
|-------|-------|
| Tool call start/end | `ai_interactions` / eval trace |
| Message sent | `conversations` + audit `liv.message.sent` |
| Booking from Liv | `bookings.sourceConversationId` + audit `liv.booking.create` |
| Eval failure | Workflow pause + incident optional |

**Question to keep asking:** *Can we reconstruct one customer thread from logs alone in <10 minutes?*

---

## 5. RBAC — how solid is it really?

### 5.1 Defence layers

| Layer | Mechanism | Maturity |
|-------|-----------|----------|
| **HTTP** | Clerk JWT | ✅ |
| **Membership** | `business_memberships` | ✅ |
| **Route gate** | `requireRole(OWNER/ADMIN/STAFF)` | ✅ widespread |
| **Tenant context** | ALS `tenantContextStore` | ✅ on `:businessId` routes |
| **404 not 403** | Cross-tenant isolation | ✅ |
| **Persona read-only** | `?as=staff:` blocks mutations | ✅ |
| **DB RLS** | Postgres policies | ⚠️ migration `001-rls` — verify coverage per table |
| **ADR 0009 roleV2** | OWN/ADM/STA/REC | ⚠️ **dual enum** — legacy `role` + `roleV2`; not all routes use caps (`cap_refund_eur_cents`) |
| **Entitlements** | `requireEntitlement` | ⚠️ partial (voice, etc.) |
| **Internal RBAC** | Separate Clerk / workforce IdP | ❌ portal shell only |

### 5.2 Honest weaknesses (fix in Track C)

1. **Legacy vs v2 roles** — some code paths still check `OWNER|ADMIN|STAFF` only; ADM-D scope not enforced everywhere.  
2. **Service-layer checks** — UI can hide buttons but **server must re-validate** every mutation (ongoing audit).  
3. **Public routes** — rate-limited but unauthenticated; separate threat model.  
4. **Partner API** — API keys with scopes; must not become backdoor to tenant data.  
5. **Internal ops routes** — header secret; not SOC2-shaped until portal + MFA.

**Question to keep asking:** *If a STAFF user crafts a curl against an ADMIN-only endpoint, do we always get 403?*

**Action:** RBAC matrix test suite — one test per sensitive route (Phase R1).

---

## 6. Internal environments — sophistication today

| Environment | Purpose | Data | Auth | Maturity |
|-------------|---------|------|------|----------|
| **Local** | Dev | Seed / demo | Clerk dev | ✅ `LOCAL_DEV.md` |
| **Staging** | Pre-prod integration | Anonymised or synthetic | Clerk staging | ⚠️ not fully documented |
| **Production** | Customers | Real PII | Clerk prod | ✅ |
| **Internal portal** | Livia Inc ops | Cross-tenant **read** | Separate IdP | ❌ **shell** (`livia-internal`) |
| **Demo gateway** | Sales | Rich seed | Demo auth | ✅ |

**Gaps:**

- No documented **promotion path** staging → prod (release-pipeline exists; env matrix incomplete).  
- No **synthetic tenant** generator for load tests.  
- Internal portal lacks: tenant health, ticket queue, trace replay, kill switches (all spec’d).

**Target internal env (G2):**

```text
internal.livia.io  →  workforce SSO  →  read-only tenant dir  →  deep links Stripe/Clerk/Sentry
                     →  support tickets  →  impersonation workflow (L2 only)
```

---

## 7. Livia Inc internal onboarding (our team, not salon owners)

**Tenant onboarding** = Acts A1–A12 (product).  
**Internal onboarding** = how a new Livia employee gets safe access.

| Day | Access | Training |
|-----|--------|----------|
| 0 | Google Workspace, Slack, Notion/docs | Read: governance, code-of-conduct, data-residency |
| 1 | Clerk **staging** only | `LOCAL_DEV.md`, monorepo tour |
| 3 | Grafana read, Sentry read | `observability-and-on-call.md`, log field contract §4.2 |
| 5 | Support runbook L1 | `support-runbook.md`, no prod PII |
| 10 | On-call shadow | `incident-response.md`, status page practice |
| 30 | Break-glass **theory** | `access-control.md`, impersonation policy |
| 90 | On-call primary (if eng) | Quarterly drills |

**Artifacts to add (Phase R2):**

- `docs/operations/internal-onboarding.md` — checklist above expanded  
- `docs/operations/engineer-week-one.md` — repo, ADRs, how to open RFC  

**Question to keep asking:** *Can a new hire fix a production booking bug without founder handing them SQL?*

---

## 8. Questions to keep asking (multi-angle checklist)

Use in design reviews, sprint planning, and founder weekly. Not exhaustive — **habit**.

### Product & customer

- What does the owner see when this fails at 9pm on a Saturday?  
- Does the customer get a correction message if Liv already sent the wrong one?  
- Is this flow reversible? Who approves?  
- Does marketing still claim this before code + audit row agree?

### Platform & engineering

- Is this route behind `requireRole` + `businessId` filter?  
- Does a retry double-charge, double-book, or double-email?  
- What is the idempotency key?  
- If Inngest is down, what is the fallback?  
- Will logs include `tenant_id` and `request_id`?

### Data & compliance

- Where does PII land? EU only?  
- Does erasure purge backups within 30d?  
- Is this action audit-logged with actor kind?

### Operations & business

- Which SEV is this? Who gets paged?  
- Is there a runbook row?  
- Do design partners hear from us first or from their customers first?  
- What is the € impact if this is down for 1 hour?

### Internal / company

- Does CS have a tool or only Stripe/Clerk dashboards?  
- Can we find this tenant in <60s?  
- Are we building theatre (portal UI) before kernel truth (tickets API)? — *tickets API now exists; portal UI next.*

---

## 9. Impact on build plan (Track C — Reliability)

Runs **parallel** to product Phases 1–6. Does **not** rewind Phase 0.

| Phase | Work | Exit |
|-------|------|------|
| **R0** (now) | This doc + support runbook + log contract documented | Signed |
| **R1** (2 wk) | `disaster-recovery.md` RPO/RTO; Sentry `request_id`; RBAC route tests; staging env doc | Drill scheduled |
| **R2** (4 wk) | Internal portal: tenant dir + health + ticket queue; kill switch API | CS uses portal weekly |
| **R3** (G2) | Grafana dashboards per tenant_id; status page live; quarterly rollback drill logged | Gate 2 ops row |

Update [`LIVIA-DETAILED-BUILD-PLAN.md`](./LIVIA-DETAILED-BUILD-PLAN.md) §Track C when R1 starts.

---

## 10. Status matrix (honest)

| Capability | Documented | Implemented | Verified |
|------------|------------|-------------|----------|
| Incident playbooks | ✅ | N/A | Drills ❌ |
| SLOs per surface | ✅ | N/A | Monitoring partial |
| Structured HTTP logs | ✅ | ✅ pino | Grafana ❌ |
| Sentry | ✅ | ✅ api-server | Mobile/dashboard partial |
| Audit log chain | ✅ ADR 0015 | ⚠️ partial invoke | Chain verify tests ⚠️ |
| Backup/restore | ⚠️ policy only | Supabase provider | Drill ❌ |
| RBAC route coverage | ✅ policy | ⚠️ dual role system | Automated tests ❌ |
| Liv failure recovery | ✅ liv-was-wrong | ⚠️ | E2E ❌ |
| Internal portal | ✅ spec | ❌ shell | — |
| Internal staff onboarding | ✅ §7 | ❌ standalone doc | — |
| Support tickets | ✅ | ✅ API | UI ❌ |

---

## 11. Relationship to documentation levels

| Level | This doc |
|-------|----------|
| L2 | ✅ Failure modes, logging contract, RBAC honesty |
| L7 | ⚠️ DR runbook + internal onboarding still to extract |
| L5–L6 | Track C closes gaps |

---

*Keep asking the questions in §8 until the status matrix rows flip to Verified for everything you stake the company on.*
