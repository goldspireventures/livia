# AI eval framework + guardrails

**Status:** F8 (2026-05-07). Companion to ADR 0016. Reads with principle 5 in `principles.md`.

## The question

How do we know Liv is getting better, not worse? How do we prevent her from doing the wrong thing? How do we roll back when she does?

## The decision

**Three layers: golden datasets per persona; online evals from production traces; auto-rollback class.** Captured in ADR 0016.

### Layer 1 — Golden datasets per persona

Each persona has a curated golden dataset of (input, expected behaviour) pairs covering the canonical decisions Liv makes for that persona.

| Persona | Golden dataset size (v1) | Coverage |
|---|---|---|
| P1 Founder | 200 cases | Cross-shop reporting, escalation, holiday-handoff, hiring |
| P2a Owner-with-Mgr | 250 cases | Refund-ladder, weekly digest, drift recovery, "Liv was wrong" |
| P2b Owner-no-Mgr | 300 cases | Voice receptionist, cash close, late-evening DM, solo-mode briefing |
| P3 Manager | 200 cases | Re-rota, scoped time-off, refund-cap, late-evening cover |
| P4 Senior-w-admin | 100 cases | Scoped refunds, scoped time-off-approval, team coverage |
| P5 Staff | 150 cases | Schedule view, time-off submit, customer prefs |
| P6 Receptionist | 150 cases | Voice routing, walk-in handling, deposit collection |
| P7 Customer | 200 cases | Booking, reschedule, refund-request, drift-recovery DM |

Datasets grow weekly from production traces (with PII scrubbed).

### Eval cadence

- **Pre-merge:** PRs that touch Liv code or prompts run the affected persona's eval suite. Regressions block merge unless the override RFC is approved.
- **Nightly:** Full eval suite across all personas. Regression alert pages on-call.
- **Weekly:** Eval review meeting. Failed cases get triaged; new cases get added from production traces.

### Layer 2 — Online evals from production traces

Every production decision is sampled (10% in v1, declining as confidence grows) and run through:
- **Heuristic checks.** Did Liv obey the refund cap? Did Liv stay within scope? Did Liv log the action? Did Liv use the right voice register?
- **LLM-judge.** A separate model evaluates whether Liv's response was correct, on-brand, and on-tone. Disagreement triggers human review.
- **Owner feedback signals.** "Liv was wrong" surfaces add their target to the failed-cases queue automatically.

### Layer 3 — Auto-rollback class vs human-approved rollback class

**Auto-rollback class (Liv un-does without asking):**
- Booking on a slot the customer didn't ask for (within 5 minutes of booking).
- Sending a draft DM that contained a redacted-PII placeholder Liv didn't fill in correctly.
- Triggering a workflow that immediately failed pre-condition checks.

**Human-approved rollback class (Liv flags; Owner/Manager confirms):**
- Refund issued (cap-bound or above).
- Customer-facing apology sent.
- Staff schedule change communicated.
- Voice call routed to wrong endpoint.
- Anything affecting customer relationships or staff scheduling.

The "Liv was wrong" UI surfaces both classes and gives the Owner one-tap remedy + reason logging.

## Guardrails

The guardrail layer sits between the LLM and any side-effect:

1. **PII redaction.** Inputs to the LLM strip PII; the LLM works with handles; the redaction layer rehydrates on output.
2. **Refund-cap enforcement.** No refund above cap, ever, regardless of LLM output. Hard limit at the runtime layer.
3. **Do-not-contact enforcement.** Customers who opted out of marketing never receive marketing-class messages. Hard limit.
4. **Refusal taxonomy.** Liv has a written taxonomy of things she refuses (see `docs/company/brand-of-livia-and-liv.md` "no-fly list"): inflammatory comments, fear-based marketing, ageist/sexist/racist comments, anything outside the salon's stated services. Refusals are logged (audit_log) and surfaced to the Owner weekly.
5. **Scope enforcement.** Liv-for-Manager-Niamh cannot take Owner-only actions; Liv-for-Senior-Sarah cannot take actions outside Sarah's ADM-D scope. Enforced at runtime, double-checked at audit-log write.

## What this earns us

The most-auditable AI in any appointment-software product. Owners trust Liv because she's wrong less than they would be, and when she's wrong, they see it immediately and can roll it back.

## Open questions

- LLM-judge cost at scale. (Mitigation: sample rate adjusts per-tenant based on confidence + recent failure rate.)
- Golden dataset maintenance overhead. (Mitigation: weekly eval-review meeting is the costed cadence; if it grows beyond 1 hour/week, we hire an eval-curator.)
