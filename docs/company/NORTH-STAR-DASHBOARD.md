# North star dashboard

**Purpose:** One screen for Monday ops — map the [multi-hat review](./EXECUTIVE-MULTI-HAT-REVIEW.md) north star to **pass/fail** with evidence links.  
**OKRs:** [`EXECUTIVE-ACTION-PLAN.md`](./EXECUTIVE-ACTION-PLAN.md) §1 · **Win definition:** §12  
**Founder-only work:** [`FOUNDER-BACKLOG.md`](./FOUNDER-BACKLOG.md)

**Last updated:** 2026-05-26

---

## The north star (one line)

> **Ten Dublin shops that would miss Liv if you turned her off** — measurable recovered revenue, **>60% “Liv-by-name”** in unprompted speech, **Gate 2 declared**.

---

## OKR scoreboard

| OKR | Target | Evidence | Status | Notes |
|-----|--------|----------|--------|-------|
| **O1** Wedge proof | 10 partners, ≥1 **real** booking/week each | [`GATE-2-EVIDENCE-PACK.md`](../operations/GATE-2-EVIDENCE-PACK.md) partner table | ⬜ | Off-repo — CRM / booking IDs |
| **O2** Liv is real | ≥40% interviews say “Liv” unprompted | `.local/research/design-partners/` transcripts | ⬜ | Qualitative — weekly % |
| **O3** Commercial truth | Gate 2 for **7 consecutive days** | [`launch-plan.md`](../launch-plan.md) Gate 2 checklist | ⬜ | See gate table below |
| **O4** Wedge product | Tuesday ritual on **mobile** + voice in digest | Mobile device demo · `weekly-digest` workflow | 🟡 | In-repo built; **device proof pending** |
| **O5** Promise integrity | 0× `build-before-G2` | `node scripts/gate2-evidence-status.mjs` | ✅ | 0 open rows (2026-05-26) |
| **O6** Support ready | L1, blocking &lt;4h, ack email | [`CUSTOMER-SUPPORT-OPERATING-MODEL.md`](../operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md) | 🟡 | Ack in code; hire + support@ pending |

**Legend:** ✅ met · 🟡 partial · ⬜ not met

---

## Gate 2 declaration (O3 detail)

All must hold **7 consecutive days** before declare. Update weekly.

| Criterion | Evidence location | Pass? |
|-----------|-------------------|-------|
| 7 days zero P0 (Sentry) | Sentry dashboard | ⬜ |
| TestFlight accepted | App Store Connect | ⬜ |
| Play internal testing | Play Console | ⬜ |
| Resend sending (confirm/reminder) | Message IDs / Resend logs | ⬜ |
| Twilio SMS &lt;10s reply (pilot) | Twilio logs | ⬜ |
| **10 shops, ≥1 real booking each** | Evidence pack partner table | ⬜ |
| Partner transcripts | `.local/research/design-partners/` | ⬜ |
| marketing-vs-reality G2 clear | `pnpm smoke:gate2` | ✅ |
| AI disclosure QA | Manual QA notes | 🟡 |
| Inngest reminders prod | Workflow run IDs | ⬜ |

**Declare when:** every row ✅ for 7 days → sign [`GATE-2-EVIDENCE-PACK.md`](../operations/GATE-2-EVIDENCE-PACK.md).

---

## In-repo vs field (progress split)

| Track | ~% to north star | What’s done | What’s left |
|-------|------------------|-------------|-------------|
| **Engineering / product (in-repo)** | **~55% → target 95%** | API kernel, 12 jurisdiction packs, partial Liv presence, smoke harness | **[`OPERATION-SOLIDIFY.md`](../product/OPERATION-SOLIDIFY.md)** — mobile flagship, WA/IG UX, all-vertical data path, internal cockpit |
| **Company / field** | **~30%** | Docs, battlecard, support model, evidence templates | 10 shops, prod keys, legal, first paid, Support L1 |

**Active build:** [`OPERATION-SOLIDIFY.md`](../product/OPERATION-SOLIDIFY.md) · **Markets:** [`MARKET-COUNTRY-PLAYBOOKS.md`](../business/MARKET-COUNTRY-PLAYBOOKS.md)

---

## Product verification (automated)

Run when stack is up (`pnpm dev:api` + `pnpm dev:dashboard`):

```powershell
pnpm demo:provision          # once per DB
pnpm test:e2e:verticals      # 9 verticals smoke + UX gate
pnpm test:e2e:verticals:full # + screenshot capture per route
```

| Check | Command | Last known |
|-------|---------|------------|
| All verticals + **livia.io** smoke | `pnpm test:e2e:verticals` | Marketing 24/24 + app verticals 2026-05-26 |
| Full stack one command | `pnpm start:platform:test` | API + dashboard + marketing + internal |
| UX quality (hair wedge) | part of above | 0 axe violations |
| Visual audit log | [`VISUAL-AUDIT-LOG.md`](../testing/VISUAL-AUDIT-LOG.md) | Screenshot review ongoing |
| Typecheck + API tests | `pnpm typecheck` · `pnpm --filter @workspace/api-server test` | In CI / prep |

---

## Weekly scorecard (copy to ops note)

```text
Week of: ___________

Partners live (real bookings): __ / 10
Partners signed not live: __
Gate 2 blockers open: __
marketing-vs-reality reds: __
P0 incidents (7d): __
Liv-by-name (interviews this week): __ %
Recovered bookings (total): __
Founder hours on sales: __
Founder hours on CS: __
E2E all-verticals last run: pass / fail (date: __)
Support: open __ | blocking __ | SLA breaches __
Top partner quote:
Top risk:
One decision made:
```

---

## Explicitly NOT north star (days 1–90)

Do not count progress here: DACH launch, medspa consent depth, enterprise SSO, Product Hunt, SOC 2 Type 2, franchise P8–P9, 250 tenants.

---

## Quick links

| Doc | Use |
|-----|-----|
| [EXECUTIVE-MULTI-HAT-REVIEW.md](./EXECUTIVE-MULTI-HAT-REVIEW.md) | Why — 13 hats |
| [EXECUTIVE-ACTION-PLAN.md](./EXECUTIVE-ACTION-PLAN.md) | What to do — phased |
| [EXECUTION-PHASE-PROGRESS.md](./EXECUTION-PHASE-PROGRESS.md) | In-repo program status |
| [FOUNDER-BACKLOG.md](./FOUNDER-BACKLOG.md) | Your checklist |
| [E2E-RUNBOOK.md](../testing/E2E-RUNBOOK.md) | How to test all verticals |
| [TEST-EVERY-BUSINESS.md](../testing/TEST-EVERY-BUSINESS.md) | Manual `/demo` tour |
