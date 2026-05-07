# Engineering principles

**Status:** F8 (2026-05-07).

## The eight principles

### 1. Documentation-first

Every non-trivial change starts with an RFC or ADR. The doc lands in `docs/` before the code lands in `src/`. The reviewer reads the doc; the code is verification, not specification. New hires read `docs/foundation/` on day 1.

### 2. Async-first

We are EU-anchored, remote-friendly, and we hire across time zones. Decisions get made in writing. Standups are written, not synchronous. Synchronous meetings are reserved for: design-partner interviews, eng demos (weekly), roadmap reviews (monthly), foundation audits (quarterly).

### 3. Kill-switch culture

Every feature ships with a documented retire-condition. We retire features, not just ship them. The bar to ship is the same as the bar to retire — both require an RFC.

### 4. The bar for new features

Before building, the proposing engineer answers six questions in writing:
1. Which cell(s) does this serve? (persona × configuration)
2. What's the target rung impact?
3. What's the year-1 economic value to the cell? (cite F6)
4. What's the closest competitor parity? (cite F6)
5. What's the retire-condition?
6. What's the eval signal that says "this works"?

Without all six, the RFC is rejected.

### 5. Eval-driven AI development

Every Liv decision class (book, refund, escalate, draft, suggest) has a golden dataset. Every PR that touches Liv runs the eval suite. PRs that regress evals don't ship without explicit override + ADR. This is non-negotiable.

### 6. Trust-amplification by default

Audit log is the spine, not a feature. Every Liv action writes to the audit log. Every Owner can read every Liv action. Impersonation is logged and disclosed. There is no "Liv took an action that doesn't appear anywhere." (See `docs/policy/impersonation-audit.md`.)

### 7. Cost-conscious from day 1

Cost-per-tenant-per-month is a measured number, tracked weekly, reviewed monthly. Each persona × configuration cell has a cost envelope (P1 chain Founder: ≤€40/shop/mo unit cost; P2b solo: ≤€8/mo unit cost; P7 Customer: ≤€0.20/customer-touch). Engineering proposals that bust the envelope require business-case override.

### 8. EU-anchored, no exceptions

Data residency: EU. Vendor selection: EU-friendly (US vendors only with binding-corporate-rules + DPA + data-residency rider). Default deployment: Frankfurt + Dublin. Default fallback: London.

## What these principles mean operationally

- **PR review.** No PR merges without: ADR/RFC link if non-trivial, eval pass if Liv-touching, retire-condition note if new feature, cost note if runtime-touching.
- **Weekly demo.** Each engineer demos one thing they shipped or learned. 30 minutes. Recorded.
- **Quarterly foundation audit.** The docs in `docs/` (foundation, engineering, business, company) get re-read top-to-bottom. Stale claims get retired. New claims get RFC'd.
- **On-call rotation.** Every engineer is on call ~1 week in 6. No siloed ops team in year 1; ops competence is a whole-team competence.
