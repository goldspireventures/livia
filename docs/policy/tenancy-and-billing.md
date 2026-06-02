# Policy — Tenancy & billing

**Status:** v1 (2026-05-06), pricing tiers aligned F9 2026-06-02 — [`PRICING-RECONCILIATION-2026-06-02.md`](../business/PRICING-RECONCILIATION-2026-06-02.md)
**Anchors:** ADR 0002 (`businessId` scoping), ADR 0010 (multi-tenant + persona model), Lane 4 L7 (Stripe Billing).

## The unit of tenancy is the business, not the user

Each row in `businesses` is a tenant. A Clerk user is *not* a tenant. A "founder running three salons" is a Clerk user with three OWNER memberships against three independent tenants.

Consequences:

- Every contract, invoice, DPA, and Stripe subscription attaches to a `businessId`, not a `userId`.
- Deleting a Clerk user does **not** delete the businesses she owns. Ownership is reassigned (per the GDPR data-delete flow); the businesses live on as legal entities of the salon they represent.
- Two tenants under the same founder are still two separate **data controllers** under GDPR. Customer data does not flow between them.

## Billing scope (v1)

One Stripe Customer per `businesses` row. One subscription per business. Pricing tiers follow F9 / `PLAN_CATALOGUE` (Solo €79 · Studio €149 · Chain €249/shop · Host €99 + €19/renter) — picked per business at signup.

A founder running three businesses sees three subscriptions and three invoices each month. We accept this UX cost in v1 because:

- Cleanest legal posture (each salon is its own entity that pays for its own software).
- Cleanest tax handling (Irish VAT applied per invoice; no rollup confusion).
- Avoids building a parent "organisation" entity before we have one customer who needs it.

Consolidated billing for chain customers is **deferred to post-Gate-3**, gated on a real customer asking for it.

### Failure modes spelled out

| Scenario | Behaviour |
|---|---|
| Founder cancels subscription on business A | Business A enters 7-day grace period, then read-only, then archived after 30 days. Businesses B and C are untouched. |
| Stripe charge fails on business B | Business B's OWNER + ADMINs receive email + in-app banner. After 3 retries (7 days), business B goes read-only. |
| Founder deletes business C entirely | Soft-delete; 30-day purge job (per Compliance C4). Stripe subscription cancelled, prorated refund per Stripe defaults. Businesses A and B unaffected. |
| Founder transfers ownership of business A to another Clerk user | OWNER membership reassigns; Stripe Customer's billing email updates; founder's other businesses unaffected. |

## Cross-business data sharing — forbidden

Three rules, no exceptions in v1:

1. **No table joins across `businessId`.** Code review rejects any query that touches more than one tenant's rows in a single statement except for clearly-labelled platform analytics queries (`select count(*) from bookings` for Livia's own dashboard — never exposed to a customer).
2. **No "copy from my other shop"** UX (e.g. "import staff from Aurora Studio into Aurora Mews"). The founder re-enters per business. We accept this UX cost.
3. **No shared customer rows.** A customer who books at Aurora Studio and Aurora Mews is two separate rows in two separate `customers` tables. Each salon controls her record independently. If she invokes GDPR right-to-erasure at Aurora Studio, Aurora Mews is unaffected.

## Subprocessors — per-business contract reality

For each business, the subprocessor list is the same (Clerk, Resend, Twilio, Anthropic, Supabase, Inngest, Sentry — see `docs/policy/data-residency.md`). Each business signs the same DPA template at `livia.io/legal/dpa`. We don't issue per-business subprocessor variations in v1.

## Deletion cascading (the rule)

When a business is deleted (soft-delete + 30-day purge):

1. All `business_memberships` rows for that business are removed.
2. All tenant-scoped tables (`bookings`, `customers`, `staff`, `services`, `availability_rules`, `time_off`, `conversations`, `messages`, `audit_log`) are purged.
3. Stripe subscription is cancelled.
4. Twilio number released.
5. Resend sender domain (if dedicated) released.
6. Object Storage bucket prefix purged.
7. Audit log of the deletion itself retained for 1 year (legal proof).

Sibling businesses owned by the same Clerk user are **never** touched.

## What this policy does NOT yet cover

- **Org-level billing rollup** — deferred post-Gate-3.
- **Cross-business analytics for the founder** ("how is total chain revenue trending") — deferred post-Gate-3, must be a separately-audited surface.
- **Per-staff billing line-items** — out of scope; salon pays for the seat, not the staff member.

## EU/IRE residency

All tenant data, including billing metadata mirrored into our database, is stored in the EU/IRE region of our hosting provider. See `docs/policy/data-residency.md` for the full subprocessor-by-subprocessor breakdown.
