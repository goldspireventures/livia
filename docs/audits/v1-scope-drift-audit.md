# v1-scope drift audit — repo vs wedge ledger

**Status:** 2026-05-26 (Phase 0 A-04)  
**Owner:** founder (CEO decision on cuts)  
**Reads with:** [`../roadmap/v1-scope.md`](../roadmap/v1-scope.md) · [`EXECUTIVE-ACTION-PLAN.md`](../company/EXECUTIVE-ACTION-PLAN.md) (scope moratorium)

## Verdict

**Kernel and API breadth exceed v1-scope.** That is acceptable **if** GTM, Support, and engineering treat **Hair · English-IE · C2/C4/C5** as the only default build target until Gate 2 passes. Everything else is **sales-led** or **frozen**.

---

## In v1-scope (protect and finish)

| Area | Repo signal | Surface priority |
|------|-------------|------------------|
| Bookings CRUD + continuity | `booking-continuity.*`, public nextSteps | P0 mobile + web |
| Voice receptionist | voice routes, Twilio | P0 prod keys |
| SMS | Twilio, sms-webhook | P0 |
| Inbox | conversations | P0 Manager queue |
| Audit | audit-log | P0 demo |
| Refund ladder / roles | policy, delegations | P0 demo |
| Onboarding wizard | onboarding routes | P0 partners |
| Support tickets | support.ts, internal queue | P0 ack email |
| Reminders | booking-reminder workflow | P0 prod Inngest |
| Liv was wrong | liv-was-wrong workflow | P1 partners |

---

## Built but v1-scope says NOT (freeze marketing & default config)

| Area | Routes / modules | Risk if marketed early |
|------|------------------|------------------------|
| Medspa | `medspa.ts`, procedures pack | Regulatory |
| Fitness classes | `class-sessions.ts` | v1 NOT |
| Enterprise SSO | `enterprise.ts` | Gate 3+ narrative |
| Partner API | `partner-api.ts` | Eval + support burden |
| Franchise rollup | franchise services | P8 proof only |
| Payroll export | `payroll.ts`, rfcs | v1.5 |
| Design proofs (tattoo) | `design-proofs.ts` | v2 body-art |
| Peer insights | `peer-insights.ts` | v1.5 k≥10 |
| DACH / DE packs | v3 Block I/J | Locale + counsel |
| Chair-rental / multi-brand | chair-rental, brand-wall | **v1.5 wedge** — OK for partners 7–10 only |

**CEO action:** Do not delete code; **feature-flag or doc-defer** customer-facing entry points until partner signed for that cell.

---

## v3 program vs moratorium (90 days)

| v3 block | Align with moratorium? |
|----------|------------------------|
| **N** booking continuity | ✅ Phase 1 soul |
| **M** alive UX / nextSteps | ✅ |
| **F** no-show, waitlist depth | ✅ if partner-driven |
| **I/J** DE + medspa | ❌ defer |
| **L** enterprise | ❌ defer |
| **B/C** internal + Liv OS | Partial — support facilities only |

---

## Support / ops implications of drift

More surface area = more ticket categories. Until Support L1 hired, **triage tags** (`support-ticket-triage.service.ts`) and runbook must cover only wedge paths; defer medspa/enterprise tickets to “not in v1 — roadmap” macro.

---

## Recommended cuts (product, not code)

1. Hide nav links to medspa, enterprise, peer insights for default Hair tenants.
2. Default demo vertical = Hair; `/demo` does not showcase C10 until partner 7 live.
3. Internal portal: tag tickets by vertical; report volume — if medspa >10% without partners, scope leak in sales.

---

## Changelog

| Date | Note |
|------|------|
| 2026-05-26 | Initial drift audit for executive Phase 0 |
| 2026-05-26 | Wedge UI gate: `lib/policy/wedge-gate.ts`, dashboard route guard, peer insights + enterprise exports hidden for hair |
