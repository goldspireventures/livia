# Audit log — physical design

**Status:** F8 (2026-05-07). Companion to ADR 0015. Reads with `docs/policy/impersonation-audit.md`.

## The question

Append-only table, event-sourced, EU-resident, retention policy, who-can-read enforcement. The audit log is the spine of the trust-amplification posture (Bet 2). Get this wrong and the category commitment collapses.

## The decision

**Append-only Postgres table, hash-chained per tenant, EU-resident, 7-year retention, Owner-readable + auditor-exportable.** Captured in ADR 0015.

### Schema (sketch)

```sql
create table audit_log (
  id              bigserial primary key,
  business_id     uuid not null,
  occurred_at     timestamptz not null default now(),
  actor_kind      text not null,  -- 'liv' | 'human' | 'system'
  actor_id        uuid not null,  -- user_id or liv-runtime-instance-id
  on_behalf_of_id uuid,           -- if impersonation; the user being acted-as
  action_class    text not null,  -- 'liv.book' | 'liv.refund' | 'human.login' | ...
  resource_kind   text not null,  -- 'booking' | 'refund' | 'staff' | ...
  resource_id     uuid,
  payload         jsonb not null, -- structured detail
  prev_hash       bytea not null, -- hash of previous row for this business_id
  row_hash        bytea not null  -- hash(prev_hash || canonical(payload + meta))
);

create index audit_log_tenant_time on audit_log (business_id, occurred_at desc);
```

### Hash chaining

- Each row's `row_hash` includes the previous row's `row_hash` for the same `business_id`.
- Tampering with any row invalidates every subsequent row's hash for that tenant.
- Daily, the tenant's tip-hash is signed by an HSM-backed key and published to a tamper-evident store (transparency log style).
- This is what makes the audit log a *trust-amplification surface*, not just a logging table.

### Append-only enforcement

- App roles have INSERT only on `audit_log`. UPDATE and DELETE are revoked.
- The DB role with UPDATE/DELETE rights is held by no one in the company; rotation requires two-person + ADR.
- Postgres triggers reject any UPDATE/DELETE attempt on the table at the DB level.

### Retention

- **7 years** by default (covers EU statutory limits for employment, tax, consumer-protection records).
- Tenants can request longer retention (no shorter — the 7-year floor is regulatory).
- Right-to-be-forgotten: customer PII in `payload` is redacted (the row stays for the chain integrity; the PII is replaced with a tombstone). This redaction is itself an audit_log entry.

### Read access

- **Owner**: full read for their tenant.
- **Manager**: read for actions within their scope.
- **Staff**: read for their own actions and actions affecting them.
- **Customer**: read for actions affecting their own bookings/data.
- **Liv**: read-write (write is the only common operation; read is for self-explanation surfaces).
- **Livia platform ops** (us): read only via documented break-glass with disclosure to the Owner. Every break-glass read is itself an audit_log entry.

### EU residency

- Primary: Postgres in Frankfurt.
- Replica: Postgres in Dublin.
- No backup ever leaves the EU.

### Performance posture

- Per-tenant write rate envelope: ≤100/sec sustained (well above any expected load).
- Read latency: ≤500ms for the most recent 30 days; ≤5s for the historical archive.
- Archive partitioning: monthly partitions; cold partitions move to compressed storage.

### Disclosure surface

The Owner cockpit has an `Audit log` tab. The Customer-facing booking confirmation links to "What Liv did with your booking" (a narrowed slice). The Manager dashboard shows "Liv decisions in the last 7 days that affected your team."

This is the trust-amplification posture made visible.

## What this earns us

The audit log isn't a defensive log — it's the product surface that earns trust. Combined with the eval framework (ADR 0016), Liv is the most auditable agent in any appointment-software product.

## Open questions

- How do we expose the daily-signed tip-hash without making it security-theatre? (Leaning: a small cryptographic-receipts page in the Owner cockpit; auditors can verify with a CLI tool we publish.)
