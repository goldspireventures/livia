# Legal

**Status:** v1 (2026-05-07).

Customer-facing legal artefacts. Drafted by Livia + reviewed by external counsel before publication. Reads alongside `docs/policy/` (internal policy) and `docs/governance/` (decision rights).

## What lives here

| Doc | What it is | Published at | Counsel-reviewed |
|---|---|---|---|
| [`terms-of-service.md`](./terms-of-service.md) | The agreement between Livia and the salon (tenant). | `livia.io/legal/tos` | Required before publication |
| [`privacy-policy.md`](./privacy-policy.md) | How Livia handles data (tenant + customer-of-tenant + visitor). | `livia.io/legal/privacy` | Required |
| [`dpa-template.md`](./dpa-template.md) | GDPR Art. 28 Data Processing Agreement template; signable per tenant. | `livia.io/legal/dpa` | Required |
| [`sub-processors.md`](./sub-processors.md) | List of subprocessors + their purposes. | `livia.io/legal/sub-processors` | Required |
| [`cookie-policy.md`](./cookie-policy.md) | Cookies + similar tech used on `livia.io`, dashboard, public booking widget. | `livia.io/legal/cookies` | Required |
| [`customer-data-rights.md`](./customer-data-rights.md) | How a salon's customer (P7) exercises GDPR rights. | `livia.io/legal/customer-rights` | Required |

## Status of these documents

- All v1 drafts are **scaffolds**, written by Livia for counsel review.
- They reflect operational truth from `docs/policy/` and architectural truth from ADRs.
- They MUST be reviewed by counsel + signed off before publication on `livia.io/legal/*`.
- They WILL be revised based on counsel input; the published version may differ from the scaffold.
- Major revisions track here + on `livia.io/legal/changelog`.

## Drafting principles

- **Plain language wherever possible.** Salons are not lawyers.
- **No dark patterns.** Cancellation is one click. Opt-out is honoured immediately. No manufactured urgency.
- **Honest scope.** Where we don't know, we say so (e.g., DPIA process for new high-risk features).
- **Versioned.** Every change versioned + dated; previous versions retained.
- **EU-anchored.** Default reading is GDPR + Irish/EU contract law; per-market adjustments at v1.5 (UK) and v2 (Nordics).

## Cadence

- Annual review at foundation audit (last week of Q4).
- Interim review on:
  - Substantive policy/operational change (`docs/policy/`).
  - Subprocessor change (`sub-processors.md` updated immediately).
  - Regulatory guidance change (DPC IE; EDPB; EU AI Act).
  - Per-market expansion (new market = new per-market addendum).

## What we don't put here

- Internal policy details (those go to `docs/policy/`).
- Engineering implementation (those go to `docs/engineering/`).
- Pricing (the pricing page is a marketing surface, not legal; ToS references pricing page by URL).
- Marketing language (legal is honest, not promotional).

## Drafting → publication flow

1. Livia drafts (this directory).
2. Founder + head of CS read.
3. Counsel reviews (engagement letter; turnaround target 14 days).
4. Counsel revisions integrated.
5. Counsel sign-off in writing.
6. Published on `livia.io/legal/<surface>`.
7. Changelog row.
8. Existing customers notified (email; 30-day notice for material changes).
