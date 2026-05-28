# Release pipeline — CI/CD, branching, environments

**Status:** v1 (2026-05-07). Reads with `docs/engineering/principles.md`, `docs/engineering/observability-and-on-call.md`, `docs/roadmap/feature-flags-and-rollout.md`.

## Branching model

**Trunk-based development.** Single long-lived branch `main`. Short-lived feature branches (≤3 days). No long-running branches. No release branches. Release semantics handled by tags + feature flags, not branches.

### Branch naming

- `feat/<short-slug>` — feature branch.
- `fix/<short-slug>` — bug fix.
- `chore/<short-slug>` — non-functional change.
- `docs/<short-slug>` — documentation-only.
- `rfc/<short-slug>` — RFC change to `docs/`.

### PR rules

Every PR requires:
- Linear / GitHub issue link (or RFC link for substantial changes).
- Eval pass for any `packages/liv-runtime/`, `packages/liv-evals/`, or prompt change (per ADR 0016).
- Type-check + lint + unit tests pass in CI.
- E2E smoke pass for any artifact-touching change.
- Reviewer sign-off (1 reviewer for tactical; 2 for ADR/architectural).
- ADR/RFC link if the change introduces a new architectural commitment.
- Feature-flag note if the change ships behind a flag.
- Cost-impact note if the change affects per-tenant runtime cost.

## Environments

| Environment | Purpose | Data | Access |
|---|---|---|---|
| **`local`** | Developer laptops (`docs/LOCAL_DEV.md`). | Synthetic seed; never real customer data. | Engineers. |
| **`preview`** | Per-PR ephemeral preview deployment. | Synthetic seed + the PR's branch code. | Engineers + design partners with link. |
| **`staging`** | Integration testing. Long-lived. | Synthetic seed + selected anonymised production samples. | Engineers + CS + ops. |
| **`production`** | Live customer environment (Supabase EU + EU app hosting). | Real customer data. EU-resident. | Customers + read-only Livia platform ops with break-glass + audit log. |

Production has **no direct dev access.** Changes flow only through the deploy pipeline. Break-glass is documented + audit-logged per ADR 0015.

## CI pipeline (per PR)

| Stage | What | Required to merge |
|---|---|---|
| 1 | Type-check (TypeScript) | Yes |
| 2 | Lint (ESLint + custom rules: voice register, banned vocabulary, schema-only-via-helper) | Yes |
| 3 | Unit tests (per package) | Yes |
| 4 | OpenAPI codegen no-diff (ADR 0005) | Yes |
| 5 | Eval suite (per persona; touched PRs only) | Yes |
| 6 | E2E smoke (artifact-touched PRs only) | Yes |
| 7 | Bundle size check (mobile + web; alarm if >10% growth) | Warning only |
| 8 | Lighthouse audit (web artifacts) | Warning only |
| 9 | Visual regression (Percy or Chromatic; Storybook'd components) | Warning; PR-author triages |
| 10 | Preview deploy + smoke ping | Yes (artifact PRs) |

## CD pipeline (post-merge)

On merge to `main`:

1. Build artifacts (api-server, dashboard, marketing, mobile, mockup-sandbox).
2. Tag image + bundle with commit hash + semver.
3. Run staging deploy + smoke pass.
4. Auto-deploy to production for non-mobile artifacts (canary 5% → 50% → 100% over 60 minutes; rollback on SLO breach per ADR 0017).
5. Mobile (Expo): EAS build → submit to TestFlight + Play Store internal track. Promotion to public requires manual founder approval per release.

## Deploy frequency targets

- **Web artifacts (api, dashboard, marketing):** ≥10 deploys/day at v1; 24/7 deployable.
- **Mobile (App Store + Play Store):** weekly cadence (subject to review timeline). OTA updates for non-binary fixes via EAS Update (≤24h cycle for OTA-eligible changes).
- **Database migrations:** runs as part of api-server deploy with backwards-compatible policy: every migration must be safe to run with old code AND new code (forward + backward compatible for one release; clean-up next release).

## Rollback

- **Web artifacts:** rollback in <5 minutes via redeploy of previous image. Automated on SEV1 SLO breach.
- **Mobile:** OTA rollback in <60 minutes via EAS Update revert. Native binary issues require new App Store / Play Store build (subject to review).
- **Database migrations:** never auto-rollback. Forward-fix only. Backwards-compatible policy keeps old code working during forward-fix.
- **Liv decisions** rollback per ADR 0016 (auto-rollback class + human-approved rollback class).

## Whole-product release rule

**Policy (v3+):** Livia is one product. Every **production** semver release must account for **all** customer-facing surfaces — not only the artifact the PR author touched.

### Surface sweep (required before tag)

| Surface | Artifact | If no code change |
|---------|----------|-------------------|
| API + DB | `artifacts/api-server`, `lib/db` | State “N/A” + confirm migrations backward-compatible |
| Tenant web | `artifacts/livia-dashboard` | Smoke or E2E note |
| Tenant mobile | `artifacts/livia-mobile` | OTA eligibility note |
| Marketing | `artifacts/livia-marketing` | Changelog / claim check if API or copy-relevant |
| Public booking | `/b/{slug}` on dashboard | Quick Liv/disclosure smoke if kernel/Liv changed |
| Internal ops | `artifacts/livia-internal` | Version string or N/A |
| Policy / Liv | `lib/policy`, `lib/liv-runtime` | Pack version bump if behaviour changed |

### Release artifacts (every tag)

1. Entry in [`docs/changelog.md`](../changelog.md) (customer-facing summary).
2. Row in [`docs/product/V3-SURFACE-MATRIX.md`](../product/V3-SURFACE-MATRIX.md) or release notes in PR.
3. If any new customer claim: row in [`docs/audits/marketing-vs-reality.md`](../audits/marketing-vs-reality.md).
4. Program reference: [`docs/product/V3-EXECUTION-PROGRAM.md`](../product/V3-EXECUTION-PROGRAM.md) Block R.

**Hotfixes:** may narrow scope to failing surface only; post-mortem must record sweep debt if skipped.

---

## Versioning

- **Product version (v1, v1.5, v2, v3):** marketing-facing; gated by `docs/roadmap/`.
- **Internal semver (`major.minor.patch`):** engineering-facing; tagged on every production deploy.
- **Build hash:** commit SHA tagged into Sentry releases for crash attribution.

Major version bumps (1.x → 2.x) coincide with marketing-facing version transitions where feasible. Minor and patch bump per deploy.

## Hotfix path

For SEV1 production issues:
1. Create `hotfix/<slug>` branch from production tag.
2. Minimal fix + targeted eval.
3. Expedited review (one reviewer, founder ack).
4. Direct production deploy bypassing canary if SEV1 (with founder + on-call ack).
5. Backport to `main` immediately.
6. Post-mortem RFC within 5 business days.

## Secrets management

- Secrets in environment variables; managed via the production secret manager (never committed to git).
- No secret in git. Pre-commit hook + CI scan (truffleHog or equivalent) enforces.
- Rotation per `docs/policy/access-control.md`.

## Database migration policy

- Every migration tested in staging first.
- Backwards-compatible for one release (rolling deploys must be safe).
- Destructive changes (drop column, drop table) require ADR + 3-release deprecation window.
- Audit-log table changes require additional ADR per ADR 0015.

## Open questions

- Canary at 5% → 50% → 100% — should the steps be more granular (5/25/50/100)?
- Mobile OTA cadence — weekly or per-incident? (Currently per-incident; revisit at scale.)
