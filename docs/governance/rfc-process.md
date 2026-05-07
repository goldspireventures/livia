# RFC process

**Status:** v1 (2026-05-07).

## When you write an RFC

You write an RFC for any decision that:
- Adds or changes an architectural commitment (would justify a new ADR).
- Adds or changes a brand-of-Liv commitment (Liv-mouth voice; refusal posture; persona).
- Adds, changes, or cancels a roadmap commitment (v1 / v1.5 / v2 / v3 scope).
- Adds, changes, or removes a policy in `docs/policy/`.
- Adds, changes, or removes a permanent feature flag.
- Changes pricing or packaging.
- Changes hiring plan order or composition.
- Cancels a planned version.
- Anything that would force you to update `docs/foundation/cross-cutting-commitments.md`.

You **do not** need an RFC for:
- Tactical bug fixes.
- Tactical features within an existing committed scope.
- Refactors that preserve external contracts.
- Documentation typo fixes.
- Test additions.

When in doubt: RFC. Cheaper to write a short RFC than to discover a missing commitment later.

## RFC format

```markdown
# RFC: <title>

**Status:** Draft | Under review | Accepted | Rejected | Withdrawn | Superseded
**Author:** <name>
**Reviewers:** <names>
**Decision-makers:** <names per decision-rights.md>
**Date proposed:** YYYY-MM-DD
**Date decided:** YYYY-MM-DD

## Summary

(2-3 sentences. The decision being proposed.)

## Motivation

(Why now. What problem this solves. Which commitment in the foundation it serves or modifies.)

## Detailed proposal

(The actual proposal. Be specific. Include code shape, doc changes, schema changes, brand surface impact, hiring impact, cost impact, version impact.)

## Alternatives considered

(At least 2. Including "do nothing.")

## What this changes

- ADRs added or superseded: ...
- Foundation docs updated: ...
- Roadmap commitments changed: ...
- Policy/governance docs updated: ...
- Hiring plan impact: ...
- Pricing impact: ...
- Customer-visible impact: ...

## Open questions

- ...

## Decision

(Filled at decision time.)
```

## Where RFCs live

- **Drafts:** `docs/rfcs/<YYYY-MM-DD>-<slug>.md` (or as a PR comment for very small RFCs).
- **Accepted:** stays in `docs/rfcs/` for the historical record. Resulting ADR/changes land in their proper homes.
- **Rejected/withdrawn:** stays in `docs/rfcs/` with status updated; the historical record matters.

## Process

1. **Draft.** Author writes RFC into a PR.
2. **Review window.** Minimum 3 business days for non-urgent; minimum 24h for urgent (with explicit "urgent" justification).
3. **Comment.** Async on the PR. In-person discussion summarised back into the PR comments.
4. **Decide.** Decision-makers per `decision-rights.md` ack on the PR with one of: `Accepted`, `Rejected`, `Needs more time`, `Withdrawn`.
5. **Land.** Author merges the RFC and lands the consequent changes (ADR, doc updates, code) in follow-up PRs that link back to the RFC.

## Decision modes

- **Single decision-maker mode** (default for area-scoped decisions): one person from `decision-rights.md` says yes.
- **Consensus mode** (cross-cutting decisions; brand decisions): multiple decision-makers must all agree.
- **Founder-override mode** (rare; reserved for strategic shifts): founder may decide unilaterally; decision must be RFC'd post-hoc with reasoning.

## Urgency

Urgent RFCs (24h window) are reserved for:
- Live incident requiring an architectural choice.
- Time-sensitive customer commitment (e.g., a design partner's deadline).
- External regulatory deadline.

Urgent ≠ "I'm in a hurry." Urgent is justified in writing.

## What an RFC is NOT

- A meeting agenda.
- A spec document.
- A business plan.

It's a proposed decision + the reasoning + the alternatives. Crisp, specific, decidable.

## Examples

A good RFC might be: "Move the eval suite from in-CI to a separate eval service." A bad RFC: "Improve the codebase."

## After acceptance

Within 5 business days of an accepted RFC:
- ADR(s) created if applicable.
- `docs/foundation/cross-cutting-commitments.md` updated if applicable.
- Roadmap docs updated if applicable.
- Customer-visible commitments cascaded into changelog or marketing.

If the cascade doesn't happen in 5 days, the RFC is reverted and re-proposed when the cascade can happen.
