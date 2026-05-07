# ADR 0016 — AI eval framework: golden datasets + online evals + auto-rollback

**Status:** Accepted (2026-05-07).
**Context:** F8 engineering blueprint. Reads with principle 5 in `docs/engineering/principles.md`.

## Context

Liv must get better, not worse, week over week. Regressions must be caught pre-merge. Production failures must be rolled back automatically where safe and human-confirmed otherwise.

## Decision

**Three layers.**

1. **Golden datasets per persona** (P1: 200; P2a: 250; P2b: 300; P3: 200; P4: 100; P5: 150; P6: 150; P7: 200 cases at v1). Grow weekly from production traces with PII scrubbed.
2. **Online evals from production traces.** 10% sample (declining as confidence grows). Heuristic checks + LLM-judge + Owner feedback signals.
3. **Auto-rollback class** (Liv un-does without asking: wrong-slot booking within 5min; redaction-failed draft; failed pre-condition trigger) **vs human-approved rollback class** (refund issued, customer apology sent, schedule change, voice routing).

PRs touching Liv code/prompts run affected persona's eval suite pre-merge; regressions block unless override RFC approved. Nightly full suite. Weekly eval review meeting.

Guardrail layer between LLM and side-effects: PII redaction, refund-cap enforcement, do-not-contact enforcement, refusal taxonomy, scope enforcement. All hard limits at runtime; double-checked at audit-log write.

## Consequences

**Positive:** Most-auditable AI in any appointment-software product; "Liv was wrong" becomes a feature, not a failure mode; regressions caught before customers see them.

**Negative:** Eval cadence requires team discipline (mitigation: weekly meeting is the governance); LLM-judge cost at scale (mitigation: sample rate adjusts per-tenant by confidence + recent failure rate).

**Deferred:** Self-improving eval curation (v2); cross-tenant eval insight sharing (v2, opt-in).

## References

- `docs/engineering/ai-eval-and-guardrails.md`
- `docs/engineering/principles.md`
- `docs/features/audit-log-search.md`
