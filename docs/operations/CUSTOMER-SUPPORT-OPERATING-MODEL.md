# Customer Support operating model — Livia Inc

**Status:** Canonical (2026-05-26)  
**Audience:** Founder, Support L1/L2, Customer Success (handoff rules), engineering  
**Reads with:** [`support-runbook.md`](./support-runbook.md) · [`INTERNAL-SUPPORT-LIFECYCLE.md`](./INTERNAL-SUPPORT-LIFECYCLE.md) · [`../company/livia-internal-portal-spec.md`](../company/livia-internal-portal-spec.md) · [`../company/EXECUTIVE-MULTI-HAT-REVIEW.md`](../company/EXECUTIVE-MULTI-HAT-REVIEW.md) §10

---

## 1. Purpose

Livia sells **Liv as a colleague**. When the product or Liv fails, **Customer Support** is how operators learn that Livia Inc is still trustworthy. Support is not optional infrastructure — it is part of the product promise for design partners and paying tenants.

**Customer Success** (onboarding, habit, retention) and **Customer Support** (break/fix, SLAs) are separate functions. See handoff rules in §8.

---

## 2. Who we support

| Actor | Examples | Primary channel |
|-------|----------|-----------------|
| Owner / Founder (P1–P2) | Roisín, Aoife | Report issue, email |
| Manager (P3) | Niamh | Report issue |
| Staff / Receptionist (P4–P6) | Floor team | Report issue, mobile Help |
| **Not direct:** End customer (P7) | Mary booking online | Salon + Liv on public surfaces; salon opens ticket if needed |

**Published support hours (until 24/7 staffed):** Monday–Friday, **09:00–17:00** Europe/Dublin. Outside hours: Liv automated surfaces + email queue; **blocking** issues triaged next business morning.

---

## 3. Service level objectives (SLOs)

| Severity | Definition | First response | Resolution target |
|----------|------------|----------------|-------------------|
| **blocking** | Cannot run the business (no bookings, Liv down, billing blocked) | **4 hours** business | 2 business days or workaround |
| **annoying** | Degraded but workable | **2 business days** | 5 business days |
| **nice_to_have** | Feature ask, cosmetic | **5 business days** | Roadmap / defer |

**Design partners:** same SLOs, plus direct founder escalation path for **blocking** only if Support L1 has not responded within 2 hours.

**Measurement (v1):** spreadsheet or internal portal notes until SLA clocks ship in portal (see executive plan E-10+).

---

## 4. Intake channels

### 4.1 In-app (preferred)

| Surface | Component | API |
|---------|-----------|-----|
| Web dashboard | **Report issue** (`HelpSupportDialog`) | `POST /businesses/:id/support/tickets` |
| Mobile | **Help** sheet | Same API |

**Auto-attached context:** route, userAgent, optional bookingId/conversationId, requestId, triage (`support-ticket-triage.service.ts`).

**Categories:** `bug` · `liv_error` · `billing` · `feature` · `other`

### 4.2 Email

- **support@livia.io** — shared inbox for Livia Inc Support.
- Tenants should reference **ticket id** if they already submitted in-app.
- Every in-app create should trigger **ack email** with ticket id + SLO (engineering: E-10).

### 4.3 Internal (Livia Inc only)

- Portal: `pnpm dev:internal` → http://localhost:5175 → **Support** tab.
- API: `GET/PATCH /api/internal/ops/support-tickets` (see lifecycle doc).

---

## 5. Triage and lifecycle

Full state machine: [`INTERNAL-SUPPORT-LIFECYCLE.md`](./INTERNAL-SUPPORT-LIFECYCLE.md).

```text
Tenant creates ticket (open)
    → auto-triage (priority, tags, suggestedReply)
    → Support L1 assigns (triaged)
    → resolution email / fix deployed (resolved)
    → archive (closed)
```

**Liv errors (`liv_error`):** Inngest `support/liv_error.reported` → incident workflow. Always open **Liv incident bundle** on ticket before replying.

---

## 6. Escalation tree

| Level | Role | Handles |
|-------|------|---------|
| **L1** | Support L1 | Triage, assign, canned replies, billing status checks, runbook issues |
| **L2** | Founder / senior support | Refund disputes, policy exceptions, angry partner, PR risk |
| **Engineering** | On-call engineer | Reproducible bugs, outages, data integrity |
| **Legal** | Counsel | DSR, regulatory letter, employment-law edge case |
| **Kill switch** | Founder / on-call only | Disable Liv for tenant (not self-serve in UI yet) |

**Escalate to engineering when:** reproducible on demo tenant, Sentry stack, or workflow failure in logs.

**Never escalate to Success for:** ticket backlog — Success owns relationship, not queue depth.

---

## 7. Facilities and resources (inventory)

### 7.1 Built today

| Resource | Location |
|----------|----------|
| Ticket API + DB | `support-tickets` schema, `support.ts` routes |
| Auto-triage | `support-ticket-triage.service.ts` |
| Tenant Help UI | dashboard + mobile |
| Internal queue UI | `artifacts/livia-internal` SupportQueueView |
| Tenant health + Liv incident bundle | internal-ops routes |
| Operator self-serve | `OPERATOR-READY-PACK.md`, `docs/business/templates/*` |
| Triage runbook | `support-runbook.md` |
| Knowledge browser (read-only) | internal portal KnowledgeView |

### 7.2 Phase 0–1 (executive plan)

| Resource | Owner | ID |
|----------|-------|-----|
| This operating model | Founder review | SUP-01 |
| Canned replies (10) | §9 below | SUP-03 |
| support@ inbox | Founder | O-05 |
| Ticket ack email | Engineering | E-10 / SUP-05 |
| Support L1 hire | Founder | O-03b |

### 7.3 Later (P1–P2)

- Tenant-visible ticket status in Settings → Help
- SLA clocks on internal ticket rows
- Canned reply library in portal (editable)
- Workforce SSO on internal.livia.io
- Linear sync for `liv_error` urgent
- Impersonation (spec P2) with audit

---

## 8. Success ↔ Support handoff

| Situation | Owner |
|-----------|-------|
| Partner onboarding, week-zero checklist | **Success** |
| Weekly partner interview (product feedback) | **Success** |
| “Liv booked wrong appointment” break/fix | **Support** |
| “How do I set leave policy?” | **Support** (template) or docs |
| Feature roadmap wish | **Support** logs `feature`; Success aggregates monthly |
| Churn threat | **Success** leads; Support provides ticket history |

**Rule:** Success does not debug in private WhatsApp — ask partner to use **Report issue** so context attaches.

---

## 9. Canned replies (macros v1)

Copy-paste; personalize with tenant name and ticket id.

**ACK — blocking**

> Thanks — we have your message (ticket **{id}**). This is marked **blocking**. We aim to respond within **4 business hours**. Reference: {id}

**ACK — annoying**

> Thanks — ticket **{id}** is in our queue. We aim to respond within **2 business days**.

**Liv error — investigating**

> We're looking at Liv's side for ticket **{id}**. We've pulled the conversation trace. We'll update you within our blocking SLA if this stops bookings.

**Billing — check Settings**

> Please open **Settings → Billing** for subscription status. If Stripe shows past-due, use the portal link there. Ticket **{id}** — tell us if that doesn't match what you see.

**Running late**

> See **Today** or **Floor** for running-late broadcast. Template: `docs/business/templates/running-late-procedure.md`. Ticket **{id}**.

**Leave / rota**

> Managers approve under **Approvals**. Staff guide: `docs/business/templates/leave-and-rota.md`. Ticket **{id}**.

**Vertical wording**

> Check **Settings** → business vertical. Hair uses “shop”; allied-health uses “practice”. If wrong, tell us the correct vertical on ticket **{id}**.

**Hiring removed**

> Team changes use **Team → Invite** (Clerk). Livia does not run hiring/job boards. Ticket **{id}**.

**Resolved — generic**

> We believe this is resolved for ticket **{id}** — {one-line summary}. Reply to reopen if not.

**Escalated to engineering**

> Ticket **{id}** is with engineering (ref {requestId}). We'll update you when deployed or with a workaround.

---

## 10. Daily and weekly rituals

| Cadence | Action | Owner |
|---------|--------|-------|
| **Daily** 09:15 | Open queue review (15 min): blocking age, assign, Liv incidents | Support L1 |
| **Monday** | Add support metrics to exec scorecard (`EXECUTIVE-ACTION-PLAN.md` §10) | Support L1 |
| **Weekly** | Top 3 ticket themes → product Slack/doc (no PII) | Support L1 + Founder |
| **Monthly** | Update `support-runbook.md` common issues table | Support L2 |

---

## 11. Training checklist (Support L1 day 1)

- [ ] Read this doc + `support-runbook.md` + `INTERNAL-SUPPORT-LIFECYCLE.md`
- [ ] `pnpm dev:internal` — open demo tenant ticket, assign, resolve
- [ ] `pnpm dev:dashboard` — submit Report issue, confirm ack email
- [ ] Walk through Liv incident bundle on a `liv_error` demo ticket
- [ ] Read `OPERATOR-READY-PACK.md` §6
- [ ] Know escalation: when to ping founder (<2h blocking breach)

---

## 12. Document control

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-05-26 | Initial model; split from CS in executive review |
