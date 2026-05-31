# Internal exec cockpit — full specification

**Status:** canonical (2026-05-30)  
**Artifact:** `artifacts/livia-internal` — `FounderCockpitView` and exec module routes  
**Visual anchor:** [`northstar/i2-shiplane-web.png`](../design/assets/livia-evolution/northstar/i2-shiplane-web.png)  
**Founder lock:** **I2** — Ship Lane collapse/expand + Hats River + Exceptions; one internal skin  
**Reads with:** [`EXEC-COMMAND-CENTER.md`](../operations/EXEC-COMMAND-CENTER.md) · [`NORTH-STAR-DASHBOARD.md`](../company/NORTH-STAR-DASHBOARD.md) · [`INTERNAL-SUPPORT-PLATFORM-SPEC.md`](./INTERNAL-SUPPORT-PLATFORM-SPEC.md) · [`PLATFORM-RELEASE-PROGRAM.md`](./PLATFORM-RELEASE-PROGRAM.md)

---

## 0. Executive summary

The **exec cockpit** is the founder/operator home for **Livia Inc** — not for salon owners. It answers:

> **“Can we invite customers? What blocks ship? What hat am I wearing today?”**

It is **not** a generic SaaS dashboard, not a duplicate of Grafana, and not the tenant “chain rollup.” It is a **decision surface** tied to gates, evidence, workforce access, and company-level exceptions.

**Design stance:** Tabs with **breathing room** — Ship Lane summary vs expanded detail, Hats for planning, Exceptions for daily fire. Workforce/automation admin lives on **`/access`** and **`/platform`**, not crammed on exec home.

---

## 1. Why we wanted this

### 1.1 Founder context

Livia is built by a **multi-hat** operator (founder + eng + support + GTM). The cockpit must:

| Need | Cockpit answer |
|------|----------------|
| **Ship confidence** | Gate 2 / Gate 3 evidence — not vanity metrics |
| **Daily focus** | ≤5 Exceptions — what actually needs a human today |
| **Planning mode** | Hats River — mandates swimlanes without a separate Notion |
| **Pre-invite checklist** | Ship Lane — lanes block external beta |
| **Workforce** | Goldspire grants — who can sign up, at what tier |

### 1.2 What triggered the original design

- Tenant dashboard mockups were wrongly applied to **platform exec** (rejected “control room” cards)
- Need **one internal skin** shared with support — amber ops, ADR 0019 boundary
- Need **collapse/expand** Ship Lane — summary for standup, detail for drill-down **without route change**

---

## 2. What it could become (beyond v1 thought)

The cockpit is the **company operating system UI** — expandable modules:

| Module | Today | North star |
|--------|-------|------------|
| **Ship Lane** | G2/G3 checklist rows | Auto-pull from CI smoke, Gate evidence pack, marketing-vs-reality |
| **Exceptions** | Manual ≤5 list | Feed from support SLA breaches, Sentry P0, stuck onboarding |
| **Hats River** | `FounderCockpitSnapshot.hats` (metrics today) | **Programmatic workforce** — employed roles + work ledger + active duty |
| **Evidence** | Links to docs | Embedded pass/fail from `pnpm smoke:gate2`, partner table |
| **Release train** | — | R1/R2/R3 status from [`PLATFORM-RELEASE-PROGRAM.md`](./PLATFORM-RELEASE-PROGRAM.md) |
| **Workforce** | Panel on cockpit → moves to `/access` | Full grant audit, beta tier, revoke trail |
| **Market** | — | IE wedge “10 shops” progress vs [`NORTH-STAR-DASHBOARD.md`](../company/NORTH-STAR-DASHBOARD.md) |

**Principle:** Cockpit **surfaces** programmatic truth — it does not become the source of truth. Policy + scripts + evidence packs remain SSOT; UI reflects them.

---

## 3. Core questions the cockpit must answer

| Question | Primary UI | Secondary |
|----------|------------|-----------|
| Can we invite more beta users? | Ship Lane — G2 row | Workforce grants |
| What shipped this week vs plan? | Ship Lane lanes | Release train (R3) |
| What’s on fire right now? | Exceptions tab | Support urgent queue link |
| Which hat am I in? | Hats River | — |
| Are we honest in market? | Ship Lane — marketing-vs-reality | M1/M2 live diff |
| Do we have 10 shops evidence? | Gate 2 embed | NORTH-STAR-DASHBOARD |
| Who can access beta? | `/access` workforce | Grant audit |

---

## 4. Module specifications

### 4.1 Ship Lane (I2) ✅ locked

**Metaphor:** Shipping lanes at a port — each lane is a **gate or workstream** that must clear before scale.

| State | Visual | Interaction |
|-------|--------|-------------|
| **Collapsed summary** | Compact rows + chevrons + status chips | Default exec view |
| **Expanded detail** | Inline checklist per lane | Click chevron — **same tab**, no theme swap |
| **Tabbed alt** | Lane tabs across top | Reference layout only |

**Lanes (examples):**

| Lane | Contents |
|------|----------|
| Product evidence | E2E vertical smoke, mobile device proof |
| Commercial | Gate 2 criteria, partner bookings |
| Trust | Legal, AI disclosure QA, support L1 ready |
| Infra | Resend, Twilio, Inngest prod, Sentry P0 |

**Not in Ship Lane:** tenant support threads, individual salon KPIs.

### 4.2 Hats River (I2)

**Metaphor:** Swimlanes for **company roles** — not costume labels on metrics, but **employed mandates** with output history.

| Element | Spec |
|---------|------|
| Columns | One per exec hat (CEO, COO, CPO, CTO, CS, CRO) — see `ExecHatId` |
| Card | Role title, **current mandate**, exit criteria, **last 3 work events**, live metric badges |
| Active duty | Optional “on duty” hat for today — founder or agent declares once per session |
| Source | Policy mandates (`lib/policy`) + **`exec_work_events`** table + derived platform metrics |

**Today (R1):** Hats are **derived panels** from live ops metrics (`founder-cockpit-hats.service.ts`) — useful but not a work ledger.

**Target (R2 — Track H):** Each hat is a **persistent role** with mandate SSOT, inbox/backlog (optional), and append-only **work events**. Cockpit answers “what did CTO ship this week?” not only “is DB healthy?”.

**When:** Weekly planning, quarterly review — not daily default tab (Exceptions stays default).

### 4.2b Programmatic workforce — employed hats (Track H)

**Principle:** If work happens in Cursor, git, or support — it should **report to a hat** programmatically. UI reflects the ledger; it does not invent progress.

#### Role model

| Layer | SSOT | Notes |
|-------|------|-------|
| **Role catalog** | `lib/policy/src/exec-hats.ts` | `ExecHatId`, display name, default mandate, focus line |
| **Mandate overrides** | DB `exec_hat_mandates` (optional R2+) | Time-boxed mandate + exit criteria per quarter |
| **Work ledger** | DB `exec_work_events` | Append-only; who (human/agent), which hat, summary, links |
| **Live signals** | Existing snapshot metrics | Merged into hat card badges — not replaced |

**Distinct from support RBAC:** Support hats (`support_l1`, `engineer`, …) in [`INTERNAL-SUPPORT-SYSTEM-DESIGN.md`](../operations/INTERNAL-SUPPORT-SYSTEM-DESIGN.md) gate **ticket permissions**. Exec hats (`ceo`, `cto`, …) track **company function output** — same human may wear both; different API.

#### Work event shape (API contract)

```typescript
// POST /internal/ops/exec/work-events  (exec auth + INTERNAL_OPS_SECRET)
{
  hatId: ExecHatId;           // required — which role this work belongs to
  summary: string;            // required — one line, ≤280 chars
  actor: "human" | "agent";   // required
  actorLabel?: string;        // e.g. "eamon", "cursor-agent"
  links?: { label: string; href: string }[];  // doc, PR, ticket
  sessionId?: string;         // Cursor / agent transcript id
  source?: "cursor" | "cli" | "manual" | "git" | "support";
}
```

**Read path:** `GET /internal/ops/exec/snapshot` merges `buildExecHatPanels()` + recent events per hat + optional `activeHatId`.

#### Cursor / agent bridge (H4)

Work in chat does not auto-sync. Emit events via:

1. **Cursor hook or skill** — end of meaningful task: `pnpm exec:hat-work --hat cto --summary "…" [--link …]`
2. **Agent instruction** — `AGENTS.md` + skill: declare hat at session start; log work event before close when Track H ships
3. **Optional enrichers (R3)** — map conventional commits / PR labels → hat; batch-import agent transcripts

**Non-goals:** Perfect inference from every token; six autonomous AI employees; replacing Linear/Notion for full backlog.

#### North-star (R∞)

Hats become **delegates**: human now (founder switching), agent later (Liv or dedicated agent wearing a hat under policy guardrails). Same `exec_work_events` API either way.

### 4.3 Exceptions (I2)

**Metaphor:** **Today’s fire list** — max 5 items or calm empty.

| Item type | Example |
|-----------|---------|
| Support SLA breach | Urgent ticket > 30 min unacked |
| Gate blocker | Smoke red for 3 days |
| Workforce | Pending Goldspire grant |
| Product | Repeat `surfaceId` in tickets |

**Default tab on open:** Exceptions (daily) → Ship Lane (pre-invite) → Hats (planning).

### 4.4 Workforce access (related — `/access`)

Goldspire `@goldspireventures.com` grants — **cockpit initiated**, **`/access` maintained**.

See [`WORKFORCE-ONBOARDING.md`](../operations/WORKFORCE-ONBOARDING.md).

---

## 5. Relationship to internal support

| Cockpit | Support |
|---------|---------|
| **Exceptions** may link to support urgent queue | **Thread** owns resolution |
| **Ship Lane** “support L1 ready” | Support model doc + hire status |
| **Not** duplicate ticket UI | Deep link `/support/tickets/:id` |

Support is **tenant-facing ops**; cockpit is **company-facing ops**. Intersect at exceptions and gates only.

---

## 6. Relationship to marketing & gateway

| Link | Direction |
|------|-----------|
| Ship Lane “marketing honest” | Diff livia-hq.com claims vs shipped |
| Gate 2 | Demo wedge E2E must pass before invite scale |
| M1/M2 locks | Exec does not pick marketing visuals — verifies **ship readiness** |

Visual anchors: marketing [`m1-home-web`](../design/assets/livia-evolution/northstar/m1-home-web.png), gateway [`g1-wedge-web`](../design/assets/livia-evolution/northstar/g1-wedge-web.png).

---

## 7. Access & security

| Rule | Detail |
|------|--------|
| Audience | `@livia-hq.com` exec emails, `LIVIA_PLATFORM_EXEC_EMAILS` |
| Not in tenant app | No `/cockpit` on app.livia-hq.com production |
| Ops secret | `INTERNAL_OPS_SECRET` on API |
| Goldspire | Grant-only via cockpit/access — no auto access |

Full runbook: [`EXEC-COMMAND-CENTER.md`](../operations/EXEC-COMMAND-CENTER.md).

---

## 8. Spatial design

| Principle | Implementation |
|-----------|----------------|
| Same shell as support | `InternalShell`, amber INTERNAL stripe |
| Collapse ≠ navigate | Ship Lane expand in place |
| No tenant chrome | Never preset picker, never `/b` preview as hero |
| Room for evidence embeds | Expanded lane rows accept CI status widgets (R2+) |

---

## 9. Build phases

### R1

- Ship Lane collapsed/expanded UI wired to snapshot
- Exceptions manual list
- Hats read-only from snapshot (metrics-derived panels only)
- Workforce panel → `/access` route split

### R2 — Track H (programmatic workforce)

- ✅ `exec-hats.ts` policy catalog + `exec_work_events` migration (`031-exec-work-events.sql`)
- ✅ `POST/GET` work-events API; snapshot merge in `internal-founder-cockpit.service.ts`
- 🔨 Hats River UI: mandate + last 3 events + metric badges (internal app)
- ✅ `pnpm exec:hat-work` CLI
- 🔨 Cursor skill stub + `AGENTS.md` hat logging discipline

### R2 (cockpit — other)

- Exceptions feed from support SLA + smoke
- Ship Lane rows pull from gate2-evidence script output
- Link to release program R1 checklist

### R3

- Embedded north-star dashboard metrics
- Release train widget (R1/R2/R3)
- Auto exceptions from monitors
- Optional git/PR enrichers → work events; agent-delegate prototype (one hat)

---

## 10. Anti-patterns

- Grafana-style chart wall as exec home
- Tenant P1 “chain rollup” widgets
- Cramming support Thread into cockpit
- Building cockpit before **programmatic** gate scripts exist (UI reflects lies)

---

## 11. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Full exec cockpit spec — purpose, modules, expansion, platform links |
| 2026-05-30 | §4.2b programmatic workforce (employed hats) + Track H build phases |
