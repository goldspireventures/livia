# ADR 0015 — Audit log: append-only Postgres, hash-chained, EU-resident, 7-year retention

**Status:** Accepted (2026-05-07).
**Context:** F8 engineering blueprint. Reads with `docs/policy/impersonation-audit.md`, Bet 2 (trust-amplification by default).

## Context

The audit log is the spine of the trust-amplification posture. Every Liv action, every human action, every impersonation, every break-glass read must be logged tamper-evidently and exposed to Owners + auditors.

## Decision

- **Append-only Postgres table** with INSERT-only app roles; UPDATE/DELETE revoked at the role level and rejected by triggers.
- **Hash-chained per tenant.** Each row's `row_hash` includes `prev_hash` for the same `business_id`. Daily tip-hashes signed by HSM-backed key, published to tamper-evident store.
- **EU-resident.** Primary Frankfurt; replica Dublin; backups never leave EU.
- **7-year retention** floor (regulatory). Longer on tenant request.
- **Right-to-be-forgotten:** PII redacted to tombstone in `payload`; row remains for chain integrity; redaction itself is an audit_log entry.
- **Read access:** Owner full; Manager scoped; Staff scoped to own + affecting; Customer scoped to own; Liv read+write; Replit-Livia ops via documented break-glass with Owner disclosure.

## Consequences

**Positive:** Tampering is cryptographically detectable; the audit log becomes a product surface (the trust-amplification surface), not a defensive log; impersonation disclosure (`docs/policy/impersonation-audit.md`) has structural backing.

**Negative:** Hash chain complicates schema migrations (mitigation: chain repair tool + ADR-gated process); break-glass is operationally heavy (acceptable; the bar should be high).

**Deferred:** Public-verifiable transparency-log integration (v2); per-tenant signing keys (v3).

## References

- `docs/engineering/audit-log-physical-design.md`
- `docs/policy/impersonation-audit.md`
- `docs/livia-bets.md` (Bet 2)
