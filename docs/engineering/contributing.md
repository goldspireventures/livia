# Contributing

**Status:** v1 (2026-05-07). Reads with `docs/engineering/principles.md`, `docs/engineering/release-pipeline.md`, `docs/governance/rfc-process.md`.

## Who this is for

- New engineers joining Livia.
- External contributors at v3+ when partner programme + open tooling exists.

## Before you write code

1. **Read the foundation.** Start with `docs/foundation/README.md`. Day 1 reading list: F7 + F3 + `docs/company/founding-story.md`. Day 2: relevant F8 docs + ADRs.
2. **Find or file the RFC/issue.** Non-trivial work has an RFC. See `docs/governance/rfc-process.md`.
3. **Confirm the version.** Is this v1, v1.5, v2, v3? See `docs/roadmap/`.
4. **Confirm the cell.** Which persona × configuration × vertical does this serve? Without that answer, the work isn't ready to start.

## Branching + PR

Per `docs/engineering/release-pipeline.md`:
- Branch from `main`; short-lived (≤3 days).
- PR title: `<type>: <short description>` where type ∈ {`feat`, `fix`, `chore`, `docs`, `rfc`}.
- PR body: link to issue/RFC; what changed; how tested; cost-impact note if any; eval-pass screenshot if Liv-touching; feature-flag note if applicable.

## The six questions for a new feature PR

Per `docs/engineering/principles.md` principle 4 — answer these in the PR description:

1. Which cell(s) does this serve?
2. What's the target rung impact?
3. What's the year-1 economic value to the cell?
4. What's the closest competitor parity?
5. What's the retire-condition?
6. What's the eval signal that says "this works"?

## Code style

- TypeScript strict.
- Prettier (no debate). Configured in `.prettierrc`.
- ESLint + custom rules. Lint must pass.
- File naming + structure per `docs/engineering/code-organization.md`.
- Comments only when non-obvious; prefer self-documenting code.

## Testing requirements

| Code type | Test requirement |
|---|---|
| Pure logic (validators, calculators) | Unit test required; ≥80% coverage. |
| API endpoints | Integration test required; covers happy-path + key error paths. |
| Liv-touching | Eval pass required (per ADR 0016). |
| UI components | Storybook entry required; visual regression in CI; accessibility check. |
| Workflows (Inngest functions) | Integration test required; replay-from-event test required. |
| Schema migrations | Tested in staging before main merge. |

## Voice + brand discipline

Per `docs/company/brand-of-livia-and-liv.md`:
- Liv-mouth copy goes through voice register check.
- Banned-vocabulary lint enforced (`game-changer`, `10x`, `rockstar`, etc.).
- Sentence-length cap lint for Liv-mouth copy (Owner: ≤14 words).
- "As an AI..." refusal guard at runtime + lint.

## Documentation requirements

- New endpoint → OpenAPI spec update + regen.
- New ADR → `docs/adr/<NNNN>-<slug>.md` per ADR template.
- New permanent feature flag → entry in `docs/roadmap/feature-flags-and-rollout.md`.
- Schema change → update `docs/engineering/data-model.md`.
- Breaking-ish change → entry in `docs/changelog.md`.

## Review

| Change kind | Reviewers required |
|---|---|
| Tactical (bug fix, small feature) | 1 reviewer (peer). |
| Architectural / new package / cross-cutting | 2 reviewers (one being head of area). |
| ADR | 2 reviewers + founder for category-shaping ADRs. |
| Customer-facing copy / brand surface | Brand stewards (founder + design lead + content lead). |
| Schema migration | 2 reviewers + DB-migration-tested-in-staging note. |
| Workflow definition (Inngest) | 1 reviewer + integration test pass. |

## Merging

- Squash-and-merge. Commit messages rewritten to convention: `<type>: <description> (#PR)`.
- No merge commits.
- CI must be green.
- Author merges (not reviewer); discourages "approval = merge mandate."

## After merge

- Auto-deploy to staging (per `release-pipeline.md`).
- Author monitors for 30 min in case of immediate alarm.
- Author updates Linear/issue tracker.
- Author writes weekly demo entry if user-visible.

## Mistakes

- Reverts are normal; not a failure.
- Post-mortem only for SEV1/SEV2 (per `incident-response.md`).
- Repeat mistakes of same class → process change RFC.

## What we don't do

- "LGTM with comment" merges. Read or don't review.
- Long-running branches.
- Merge commits.
- Rewriting `main` history.
- Force-push to shared branches.
- Skipping eval-pass on Liv-touching changes (this is the one rule with no override).
- Skipping the foundation read on day 1 of a new hire.

## Open questions

- Pair programming cadence — currently encouraged but not scheduled; should we ritualise?
- Conventional commits enforced via lint vs convention — currently convention; lint at v1.5.
