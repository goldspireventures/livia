# Engineering scope moratorium (Gate 2)

**Status:** Active (2026-05-26)  
**Owner:** founder  
**Until:** Gate 2 declared (see [`../company/EXECUTIVE-ACTION-PLAN.md`](../company/EXECUTIVE-ACTION-PLAN.md))

## Rule

All engineering and customer-facing work serves **one wedge** until Gate 2:

| Dimension | In scope |
|-----------|--------|
| Vertical | **Hair** (beauty cross-vertical only for signed design partners) |
| Locale | **English-IE** (+ English-UK text surfaces) |
| Configurations | **C2, C4, C5** primary; C7/C10 only with signed partner |
| v3 blocks | **N** (booking continuity), **M** (alive UX / nextSteps) |

## Explicitly frozen (no new customer-facing work without CEO RFC + signed partner)

- DACH / DE campaigns and locale packs (v3 Block I/J)
- Medspa consent and clinical flows
- Enterprise SSO / partner API / franchise marketing
- Peer insights panel (k≥10)
- New vertical route modules unless a design partner contract names that cell

## Allowed without RFC

- Bug fixes on wedge paths
- Support facilities (tickets, ack email, internal portal)
- Tests, observability, docs, honest marketing copy
- Code that exists but **hide nav** for non-wedge tenants (see [`../audits/v1-scope-drift-audit.md`](../audits/v1-scope-drift-audit.md))

## Exceptions process

1. Written note: partner name + configuration cell + deadline.
2. `marketing-vs-reality.md` row in same PR if user-visible.
3. Surface matrix row updated.
