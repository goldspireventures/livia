# Policy

**Status:** v1 (2026-05-07).

## What lives here

Internal-facing policies — the rules Livia follows in operating the product. Reads alongside `docs/governance/` (who decides) and `docs/legal/` (customer-facing legal terms).

## The set

| Doc | What it covers |
|---|---|
| [`data-residency.md`](./data-residency.md) | EU/IRE residency commitment + subprocessor map + transfers + EU AI Act Art. 50 surfaces. |
| [`tenancy-and-billing.md`](./tenancy-and-billing.md) | Multi-tenant + Stripe billing operational rules. |
| [`impersonation-audit.md`](./impersonation-audit.md) | Owner / staff impersonation + audit trail commitments. |
| [`staff-multi-employment.md`](./staff-multi-employment.md) | How staff with memberships at multiple businesses are handled. |
| [`access-control.md`](./access-control.md) | RBAC / ABAC posture; secrets; key rotation; break-glass. |
| [`data-retention.md`](./data-retention.md) | Retention schedules per data class; purge process. |
| [`security-policy.md`](./security-policy.md) | High-level security posture; threat model; incident-response anchor. |
| [`acceptable-use.md`](./acceptable-use.md) | What customers may and may not do with Livia. |
| [`vulnerability-disclosure.md`](./vulnerability-disclosure.md) | Security researcher disclosure process; safe-harbour. |
| [`cross-tenant-intelligence.md`](./cross-tenant-intelligence.md) | Differential-privacy + opt-in posture for peer-set insights. |
| [`dpia-template.md`](./dpia-template.md) | Data Protection Impact Assessment template (per GDPR Art. 35). |

## Relationship to legal docs

| Internal policy | Customer-facing legal artifact |
|---|---|
| `data-residency.md` | `docs/legal/sub-processors.md` + `docs/legal/dpa-template.md` |
| `tenancy-and-billing.md` | `docs/legal/terms-of-service.md` |
| `impersonation-audit.md` | `docs/legal/dpa-template.md` § Customer rights |
| `data-retention.md` | `docs/legal/privacy-policy.md` |
| `security-policy.md` | `docs/legal/dpa-template.md` § Annex II Security |
| `acceptable-use.md` | `docs/legal/terms-of-service.md` § Restrictions |

Internal policy is the operational truth; the customer-facing legal artifact is the contractual surface. Drift between the two is a process bug.

## Cadence

- Annual review of every doc at foundation audit (last week of Q4).
- Interim updates per RFC.
- Counsel review every 2 years (or on substantive change).

## Discipline

- Every policy ends with `## EU/IRE residency` reaffirmation.
- Every policy carries `Status:` + `Anchors:` (the ADRs/legal references it ties to).
- Every policy ends with `## Annual review` + `## Open questions`.
