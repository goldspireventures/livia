---
name: livia-doc-sweep
description: >-
  Turn chat decisions into full Livia documentation with no scaffolding or
  half-written sections. Use when the user asks to document in full, update all
  docs, sync build plans, no scaffolding, or capture everything from this chat.
---

# Livia doc sweep

## Quality bar

- **Full prose** — complete sections, not "TBD" or bullet placeholders.
- **No scaffolding** — if a doc is started, finish it in the same run.
- **Canonical links** — point to hub docs; do not fork vertical lists or salon-only assumptions.

## Workflow

1. **Inventory** — List docs to create/update from chat + [`docs/DOC-CANONICAL-INDEX.md`](../../docs/DOC-CANONICAL-INDEX.md).
2. **Program alignment** — Cross-check [`docs/product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](../../docs/product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md) and [`docs/LIVIA-STATUS.md`](../../docs/LIVIA-STATUS.md).
3. **Category** — People-business, not salon-shaped: [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](../../docs/product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md).
4. **UX authority** — UI copy/layout specs follow [`UI-UX-MASTER-PROGRAM.md`](../../docs/design/UI-UX-MASTER-PROGRAM.md).
5. **Write** — Each doc: purpose, scope, decisions, acceptance criteria, links downstream.
6. **Propagate** — If policy/API changed: note codegen + registry; see [`DOC-PROPAGATION-CASCADE.md`](../../docs/engineering/DOC-PROPAGATION-CASCADE.md).
7. **Registry** — Run `pnpm vertical:doc-check` when vertical docs touched.

## Surfaces checklist (doc sweep)

When docs describe a feature, confirm spokes exist or are updated:

| Surface | Typical doc path |
|---------|------------------|
| Dashboard | `artifacts/livia-dashboard` |
| Mobile | `artifacts/livia-mobile` |
| Marketing | `artifacts/livia-marketing` |
| Internal | `artifacts/livia-internal` |
| Public `/b` | guest surfaces in policy + playbook |
| Gateway G1–G3 | [`GATEWAY-SURFACE-PROGRAM.md`](../../docs/design/GATEWAY-SURFACE-PROGRAM.md) |

## Closeout

- List **files changed** with one-line purpose each.
- Optional: `pnpm exec:hat-work` with hat `cpo` or `ceo` for large sweeps.

## Reference

[`reference.md`](reference.md) — index of common doc hubs.
