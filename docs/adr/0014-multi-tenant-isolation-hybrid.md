# ADR 0014 — Multi-tenant isolation: hybrid (row-level v1, schema-per-tenant v1.5)

**Status:** Accepted (2026-05-07).
**Context:** F8 engineering blueprint. Reads with ADR 0002, ADR 0010.

## Context

Beyond row-level by `business_id`. Schema-per-tenant for big chains? Hybrid? Cross-tenant intelligence privacy posture?

## Decision

**Hybrid.**

- **Row-level scoping by `business_id` for v1.** Every table has `business_id NOT NULL`; tenant-scoped query helper enforces filter; raw SQL forbidden in app code; Postgres RLS as second line of defence; per-artifact DB roles scoped minimally.
- **Schema-per-tenant graduation at v1.5** for chains ≥10 shops, OR enterprise SOC2 contract, OR Owner request + ability to pay.
- **Cross-tenant intelligence: default OPT-IN, k≥10 differential privacy, published computation specs.** Customer/staff PII never leaves the tenant; tenant-identifiable booking details never leave; only categorical aggregates over peer-sets of ≥10.

## Consequences

**Positive:** Cross-tenant leakage is structurally hard; cross-tenant intelligence is a privacy-defining feature, not a privacy compromise; auditors can verify computation specs.

**Negative:** Schema-per-tenant migration is one-way (reverse-graduation supported but discouraged); k≥10 means small peer-sets see no insights initially (mitigation: explicit "peer-set forming" UI).

**Deferred:** BYOK (tenant-managed encryption keys) — v2; cross-region tenant pinning — v2.

## References

- `docs/engineering/multi-tenant-isolation.md`
- ADR 0002 (multi-tenant via business_id scoping)
- ADR 0010 (multi-tenant + persona model)
