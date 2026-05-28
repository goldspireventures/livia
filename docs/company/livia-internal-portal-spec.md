# Livia Internal Portal — company operator surface

**Status:** specification v0.1 (2026-05-20), support queue v1 2026-05-26 (filter, assign, lifecycle, Liv incident bundle).  
**Tenant collateral:** point businesses to [`../business/OPERATOR-READY-PACK.md`](../business/OPERATOR-READY-PACK.md) — not in-product HR/hiring.  
**Audience:** founder, future Livia Inc ops/engineering/support with **cross-tenant** responsibilities.  
**Not:** tenant owners (they use `livia-dashboard` + `livia-mobile`).  
**Reads with:** `docs/policy/impersonation-audit.md`, `docs/policy/access-control.md`, `docs/engineering/incident-response.md`, ADR 0014/0015.

---

## 1. Why this exists

Running Livia Inc requires:

- Helping a salon when Liv misbehaves or the integration breaks.
- Seeing **health** of tenants (API errors, queue depth, billing status) without guessing.
- Executing **controlled** support actions with **immutable audit** (who touched which tenant, why).
- Managing **feature flags**, **kill switches**, and **AI model/version** rollout.
- Coordinating **incidents** (SEV1 playbook) and **postmortems**.

Today this work might happen in ad-hoc SQL, Clerk dashboard, Stripe dashboard, and logs. **That does not scale and is not SOC2-shaped.**

The **Internal Portal** is the productisation of that work — same brand discipline, different chrome (e.g. **slate / warning stripe** so you never confuse it with a tenant session).

---

## 2. Identity and access (hard requirements)

| Requirement | Implementation pattern |
|-------------|-------------------------|
| Separate from tenant Clerk org | **Second Clerk application** or workforce IdP (Google Workspace + SSO) |
| No shared JWT with tenant API | Dedicated `api.livia.internal` routes or `/internal/*` with **mTLS** or **service-to-service** + human SSO |
| RBAC inside Livia Inc | Roles: `founder`, `engineer`, `support_l1`, `support_l2`, `finance_read`, `finance_write`, `legal_read` |
| MFA mandatory | Enforced at IdP |
| Session banner | “INTERNAL — actions are audited” |
| Impersonate tenant | Only `support_l2+` + ticket ID + time box; log per `impersonation-audit.md` |

**Never:** “God mode” toggle inside tenant mobile app.

---

## 3. Module inventory (what the portal must do)

### 3.1 Tenant directory

- Search: business name, slug, owner email, Stripe customer id, Clerk org id.
- **Health card:** last API 5xx rate, last successful booking, last inbound SMS, voice provisioned y/n, subscription tier, past-due invoices.
- **Links out:** Stripe Customer Portal (deep link), Clerk user, Sentry project filtered by tenant id.

### 3.2 Support actions (with approval workflow)

| Action | Risk | Approval |
|--------|------|----------|
| View anonymised error stack | Low | L1 |
| View PII sample (last 4 of phone) | Med | L2 + reason code |
| Replay webhook / re-send notification | Med | L2 + ticket |
| Disable Liv AI for tenant (kill switch) | High | Founder or on-call |
| Force logout all sessions | High | Founder |
| Data export on behalf (DSR) | Legal | Legal checklist |

### 3.3 Incidents & status

- Link to status page update flow.
- SEV1/2/3 timeline from `docs/engineering/incident-response.md`.
- Postmortem template linkage `docs/postmortems/`.

### 3.4 Feature flags & config

- Read/write feature flags per tenant or global % rollout (`docs/roadmap/feature-flags-and-rollout.md`).
- Model version pinning (which Claude revision; prompt pack id).

### 3.5 Finance (read-first)

- MRR roll-up (from Stripe), outstanding invoices, Connect onboarding status.
- **No** in-portal money movement without second approval and full audit.

### 3.6 Product analytics (aggregate)

- Funnel: signup → first booking → retained week 4.
- Strict **no cross-tenant PII** in charts; use hashed ids.

### 3.7 Content & legal ops

- Publish changelog entry (drives `livia.io/changelog`).
- Draft legal doc version (counsel workflow stays outside; portal tracks status).

### 3.8 Engineering ops

- View deploy version (git SHA) per service.
- Trigger **read-only** maintenance banner (if productised).

### 3.9 Partner & payroll connectors (ecosystem)

Per [`../product/LIVIA-COMPLETE-SYSTEM-SPEC.md`](../product/LIVIA-COMPLETE-SYSTEM-SPEC.md) §7 — Livia does not calculate tax.

- Per-tenant: payroll provider linked (y/n), last export_at, last error, staff map completeness %.
- Fleet: count of tenants on BrightPay vs manual CSV vs none.
- Support action: re-queue export (L2 + ticket) — no in-portal wage edit.

### 3.10 Success metrics and claim integrity

- **Activation:** signup → first booking → week-4 retained (aggregate).
- **Claim drift:** rows from [`../audits/marketing-vs-reality.md`](../audits/marketing-vs-reality.md) with owner + due date.
- **Liv quality:** clustered `liv-was-wrong` tags + eval fail rate by vertical pack.

Breadth/depth/width for internal roles: [`../product/LIVIA-GLOBAL-PRODUCT-SYSTEM.md`](../product/LIVIA-GLOBAL-PRODUCT-SYSTEM.md) Part X (internal).

---

## 4. UX principles (internal still gets Aurora discipline)

- Same typography tokens where possible; **distinct** colour strip (e.g. deep violet border) for internal.
- Dense tables OK; still accessible.
- Every mutation: **reason code** + **ticket URL** optional but encouraged.

---

## 5. Build phasing

| Phase | Deliverable |
|-------|-------------|
| P0 | Tenant search read-only + links to Stripe/Clerk/Sentry |
| P1 | Kill switches + feature flags + audit log viewer |
| P2 | Impersonation flow with policy + time limit |
| P3 | Finance roll-ups + DSR tooling integration |

Ship **P0** before hiring first support person.

---

## 6. Engineering placement

Preferred: new artifact `artifacts/livia-internal/` (Vite + React) deployed to `internal.livia.io` (or VPN-only pre-launch).

Alternative (smaller): route group in dashboard behind separate Clerk — **only** if route isolation is provably non-leakable (harder).

---

## 7. Open questions

- EU data residency for internal logs (same region as tenant DB?).
- Customer support CRM (Linear, Intercom) vs all-in-portal — integrate via API.

---

## Document control

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-05-20 | Initial spec from founder requirements |
