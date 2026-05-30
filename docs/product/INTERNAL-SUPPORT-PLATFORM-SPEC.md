# Internal support platform — full specification

**Status:** canonical (2026-05-30)  
**Artifact:** `artifacts/livia-internal` — `/support/*` and related ops routes  
**Visual anchor:** [`northstar/i4-thread-web.png`](../design/assets/livia-evolution/northstar/i4-thread-web.png)  
**Founder lock:** **I4-A The Thread** primary; I4-B Board + I4-C Radar as **separate routes** (depth, not cramped toggles)  
**Supersedes depth:** [`INTERNAL-SUPPORT-SYSTEM-DESIGN.md`](../operations/INTERNAL-SUPPORT-SYSTEM-DESIGN.md) (v1 workflow — still valid for lifecycle; this doc is the **platform** spec)

**Reads with:** [`SUPPORT-POINTS-AND-INVESTIGATION.md`](../operations/SUPPORT-POINTS-AND-INVESTIGATION.md) · [`INTERNAL-SUPPORT-LIFECYCLE.md`](../operations/INTERNAL-SUPPORT-LIFECYCLE.md) · [`CUSTOMER-SUPPORT-OPERATING-MODEL.md`](../operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md) · [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](../design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md)

---

## 0. Executive summary

**Internal support is not a ticket list.** It is a **sophisticated operator platform** — a product Livia Inc uses to run multi-tenant SaaS at scale. It must support:

- High **breadth** (billing, Liv errors, onboarding, guest tokens, vertical modules)
- High **depth** (thread history, traces, tenant health, runbooks, prevention)
- High **width** (many concurrent tenants, many surfaces, many hats on a small team)

**Design stance:** Give support **room to breathe** — multi-route, multi-column, dedicated screens. Do **not** cram queue + thread + tenant dossier + investigate + kanban into one viewport.

**Programmatic stance:** Every tenant/guest surface registers a stable `surfaceId`; tickets auto-enrich; releases ship support registry + UI together ([`PLATFORM-RELEASE-PROGRAM.md`](./PLATFORM-RELEASE-PROGRAM.md) R2).

---

## 1. What is internal support at Livia?

### 1.1 Definition

The **internal support platform (ISP)** is how Livia Inc:

1. **Captures** tenant/staff pain (in-app, email, proactive monitors)
2. **Triages** impact and ownership (L1 → L2 → engineering)
3. **Investigates** with identifiers (`requestId`, `surfaceId`, booking/conversation ids)
4. **Resolves** with auditable actions and customer-facing replies
5. **Learns** — runbooks, registry gaps, product fixes, prevention

It sits in **W3b** (internal support skin) — amber ops chrome, never shown to salon owners.

### 1.2 What it is not

| Not | Why |
|-----|-----|
| Tenant inbox | Owners talk to *their* customers; support talks to *tenants* |
| Exec cockpit | Exec answers “can we ship?”; support answers “why is this shop broken?” |
| Grafana | Metrics dashboards ≠ conversational triage |
| Zendesk clone | We need **tenant-native context** and **surfaceId → code** in one product |

---

## 2. What’s broken in modern internal support

| Industry failure | Livia response |
|------------------|----------------|
| **Tickets devoid of context** | Auto-attach businessId, vertical, plan, route, requestId, recent events |
| **Free-text archaeology** | Stable `surfaceId` registry → file list, runbook, Sentry tag |
| **Tool sprawl** | Thread + Board + Radar + Investigate in **one** internal app |
| **Cramped single-page UIs** | **Separate routes** per workflow mode; columns within Thread, not everything at once |
| **No link to product surface** | Ticket knows `/b/proof`, `design-proofs` desk, `liv_error` category |
| **Closure without learning** | Postmortem-lite: root cause + prevention checkbox |
| **Engineers re-triage same bug** | Timeline unifies messages, workflows, audit, traces |

---

## 3. Personas & hats

| Hat | Primary UI | Job |
|-----|------------|-----|
| **support_l1** | Thread queue, Board | Acknowledge, gather ids, runbook L0 fixes |
| **support_l2** | Thread + Context + Investigate | Deep trace, impersonation (future), coordinate eng |
| **engineer** | Investigate, ticket timeline | Fix code/infra; update registry + runbooks |
| **finance_read** | Billing-filtered views | Read-only tenant billing context |
| **founder** | All routes + Radar | Override priority; proactive tenant health |

Same humans rotate hats — UI must not assume dedicated Zendesk agents.

---

## 4. Platform modules (the “massive app” map)

Support is composed of **modules**. Each module owns routes and may share data — not one mega-page.

### 4.1 Core — The Thread (I4-A) ✅ locked primary

**Job:** Conversational resolution — “read, understand, reply, close.”

| Column / state | Width | Content |
|----------------|-------|---------|
| **Queue** | ~240px | Open tickets sorted by SLA; filters: category, vertical, assignee |
| **Thread** | flex | Messages (tenant + internal notes); reply composer |
| **Context** | ~320px | Tenant health, plan, copyable ids, `surfaceId`, runbook links, Sentry |

**Routes:**

| Route | Purpose |
|-------|---------|
| `/support/queue` | Default landing — overview + selected ticket |
| `/support/tickets/:id` | Deep link to ticket; column focus states on tablet |

**Visual ref:** `internal-support-a-*.png` in platform-surfaces assets.

### 4.2 Workflow — Triage Board (I4-B)

**Job:** **Status motion** when L1 needs to move cards, not read long threads first.

| Route | `/support/board` |
| Columns | Open → Triaged → Waiting on customer → Resolved |
| Card | Priority, assignee, SLA timer, tags (`liv_error`, `billing`) |
| Drill | Double-click → opens **Thread** for that ticket |

**When to use:** Monday standup, backlog grooming, handoffs.

### 4.3 Proactive — Tenant Radar (I4-C)

**Job:** **Tenant-first** when one shop has many tickets or health is degrading.

| Route | `/support/radar` |
| Views | Health grid → tenant drill-down → ticket peek (assign without leaving grid) |

**When to use:** Post-incident sweeps, beta cohort monitoring, Gate 2 evidence weeks.

### 4.4 Forensics — Investigate (I5)

**Job:** Paste **`requestId`** → correlated log hints, Sentry, registry surface, recent tickets.

| Route | `/support/investigate` |
| Builds on | [`SUPPORT-POINTS-AND-INVESTIGATION.md`](../operations/SUPPORT-POINTS-AND-INVESTIGATION.md) |

**When to use:** Engineering join; L2 escalation; proactive trace from alert.

### 4.5 Knowledge — Runbooks & registry (cross-cutting)

| Asset | Location |
|-------|----------|
| Runbooks | `docs/operations/support-runbook.md` + dynamic surfacing by tag/`surfaceId` |
| Surface registry | `lib/policy` support points — **source of truth** for “where in product” |
| Category taxonomy | bug · liv_error · billing · feature · other |

Runbooks appear in **Context column** and **Investigate** — not a separate wiki hunt.

### 4.6 Intake — Capture (API + channels)

| Channel | Flow |
|---------|------|
| In-app Help | `help-support-dialog.tsx` → structured ticket + auto context |
| Email/SMS (future) | Ingest → ticket with parsed fields |
| Internal manual | Ops creates proactive ticket from monitor |

**Auto-attach (required):** businessId, slug, vertical, plan, user role, route, device, requestId, conversation/booking ids when present.

### 4.7 SLA & reporting (ops)

| Tier | Target (beta) |
|------|----------------|
| Urgent | Ack < 30 min; mitigation same day |
| Normal | Ack < 24 h |
| Low | Weekly batch |

Weekly: open urgent count, mean time to hypothesis, repeat `surfaceId` hotspots → **exec Exceptions** feed.

---

## 5. Information architecture — full route map

```text
livia-internal (W3)
├── /support
│   ├── /queue          ← Thread default (I4-A)
│   ├── /tickets/:id    ← Thread deep link
│   ├── /board          ← Kanban (I4-B)
│   ├── /radar          ← Tenant grid (I4-C)
│   └── /investigate    ← requestId forensics (I5)
├── /tenants            ← directory (health, plan) — links into Radar/Thread
├── /platform           ← flags, smoke — not support core
└── exec cockpit        ← separate spec — feeds Exceptions into support
```

**Nav rule:** Top-level support nav: `Thread | Board | Radar | Investigate` — clean, not nested hamburger of death.

---

## 6. Ticket lifecycle (source of truth)

Statuses: **open → triaged → resolved → closed**

| Transition | Required metadata |
|------------|-------------------|
| open | category, severity, description, reporter, businessId |
| triaged | priority, tags, assignee, hypothesis note |
| resolved | resolution summary, customer message, optional PR ref |
| closed | root cause, prevention action |

Full detail: [`INTERNAL-SUPPORT-LIFECYCLE.md`](../operations/INTERNAL-SUPPORT-LIFECYCLE.md).

---

## 7. Connection to the rest of Livia

| External surface | Support link |
|------------------|--------------|
| Tenant `/help` | Creates ticket with `surfaceId` of current route |
| Guest `/b/proof/{token}` | Tickets tag `guest-proof`; registry maps to Track G routes |
| API errors | `requestId` in JSON → Investigate |
| Sentry | `surface` tag aligns with registry |
| Exec Exceptions | ≤5 items when support SLA breaches or repeat incidents |
| Releases | R2 ships registry + Thread context pane together |

**Platform-wide rule:** Adding a new tenant or guest route without registry entry is **incomplete** — same bar as OpenAPI for API routes.

---

## 8. Spatial design philosophy — why not cramped

| Principle | Implementation |
|-----------|----------------|
| **One job per route** | Board for motion; Thread for reading; Radar for tenant sweep |
| **Columns, not modals** | Thread uses 3 columns on desktop; tablet collapses with explicit focus |
| **Depth over density** | Ticket peek in Radar ≠ full thread — escalate explicitly |
| **Room for future** | Attachments, impersonation, live traces get Context pane real estate |
| **Same skin** | I0 internal shell — amber INTERNAL banner on all support routes |

North-star density: [`northstar/i4-thread-web.png`](../design/assets/livia-evolution/northstar/i4-thread-web.png). R1 `now/` may ship fewer Context widgets — layout shell still 3-column.

---

## 9. Data model (conceptual)

| Entity | Key relations |
|--------|---------------|
| `support_tickets` | businessId, category, status, assignee, surfaceId?, requestId? |
| `support_messages` | ticketId, author, internal flag |
| `businesses` | vertical, plan, slug — joined in Context |
| Audit / events | Timeline feed via event-bus where applicable |

Implementation paths: `routes/support.ts`, internal API, future timeline aggregator.

---

## 10. Build phases (aligned to platform releases)

### R1 (with F6 shell)

- Thread queue + ticket detail 3-column **layout shell**
- Auto-attach context from Help dialog (existing)
- `requestId` visible in Context
- Board/Radar routes stub or read-only

### R2 (Track B/C)

- `surfaceId` registry in policy; Context pane runbook links
- Board kanban mutations; Radar grid from tenant health API
- Investigate panel wired to logs/Sentry hints
- Timeline v1: messages + audit

### R3

- Proactive tickets from monitors
- Impersonation (policy-gated) for L2
- Postmortem-lite on close; weekly support → exec feed
- Full E2E: tenant error → ticket → investigate → fix → verify on `surfaceId`

**Do not** scaffold all routes empty in one PR — ship **Thread usable** first, then Board/Radar depth per release program.

---

## 11. Acceptance questions (design review)

Before marking support “designed”:

1. Can L1 ack a ticket in < 60s with business + requestId visible?
2. Can L2 jump from ticket → Investigate without copy-paste hunt?
3. Can founder see which **tenant** is hot without opening five tickets?
4. Does every new guest surface (e.g. proof token) have registry + runbook row?
5. Is any workflow forced into a modal that should be its own route?

---

## 12. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Full internal support platform spec — modules, IA, releases, anti-cramp philosophy |
