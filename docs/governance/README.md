# Governance

**Status:** v1 (2026-05-07).

Governance at Livia is the rules-of-the-road for how decisions get made, written down, and revisited. Three documents, plus the ADR + RFC machinery.

## What lives here

- [`rfc-process.md`](./rfc-process.md) — when to write an RFC; format; who signs; how it lands in the codebase.
- [`decision-rights.md`](./decision-rights.md) — who decides what (founder, head of eng, head of CS, brand stewards, design partners, customers).
- [`code-of-conduct.md`](./code-of-conduct.md) — how we treat each other; how we treat customers; how we treat data.
- [`ip-and-contribution.md`](./ip-and-contribution.md) — IP assignment; contributor agreement; OSS-into-codebase rules.

## What's NOT here

- **ADRs** live in `docs/adr/`. ADRs record an architectural decision after it's been made; RFCs precede + propose the decision.
- **Roadmap** lives in `docs/roadmap/`. Governance defines *how* roadmap changes; roadmap defines *what* is committed.
- **Policy** lives in `docs/policy/`. Governance defines who-decides; policy defines the rules.

## Relationship to ADRs

| Stage | Where it lives |
|---|---|
| Proposing a category-shaping decision | RFC in `docs/rfcs/<draft-slug>.md` (or PR'd to `docs/adr/` directly for smaller-but-architectural choices) |
| Decided + locked | ADR in `docs/adr/NNNN-slug.md` |
| Operationalised | Reflected in roadmap, engineering docs, policy as needed |
| Revisited | New ADR with `Supersedes ADR NNNN`; old ADR marked superseded but not deleted |

## Governance is small

We are a small company. Governance is not theatre. The rules in this directory exist so:
- New hires can read 4 short docs and know how decisions get made.
- Founders aren't bottlenecked on every choice.
- Customers can trust that decisions about their data follow a known process.
- We don't accidentally drift from foundation commitments through unrecorded micro-decisions.

When a rule in this directory becomes a tax rather than an aid, RFC to change it.
