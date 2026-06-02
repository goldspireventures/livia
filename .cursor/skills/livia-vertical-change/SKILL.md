---
name: livia-vertical-change
description: >-
  Add or change a Livia business vertical with full policy-to-surface cascade.
  Use for new vertical, vertical pack, Record BusinessVertical, registry row,
  demo slug, or vertical:check failures.
---

# Livia vertical change

## Playbook (follow in order)

1. Read [`docs/engineering/VERTICAL-ADD-PLAYBOOK.md`](../../docs/engineering/VERTICAL-ADD-PLAYBOOK.md).
2. **Policy hub** — `lib/policy`: vertical definition, onboarding, presets, guest surfaces — all `Record<BusinessVertical, …>` complete.
3. **API + services** — createBusiness, tenant-experience, public `/b` routes.
4. **Codegen** — `pnpm codegen` after OpenAPI changes (never hand-edit `lib/api-zod` / `lib/api-client-react`).
5. **Surfaces** — thin renderers in `artifacts/*`; vocabulary via `GET /api/me/tenant-experience` — no hardcoded "salon".
6. **Demo** — seed slug + roster parity; `pnpm demo:provision`.
7. **Registry** — `VERTICAL_COVERAGE_REGISTRY` row.
8. **Docs** — vertical program spoke; `pnpm vertical:doc-check`.

## Verify

```bash
pnpm vertical:check
pnpm vertical:doc-check
pnpm run typecheck
pnpm test:e2e:verticals   # when E2E env up
```

## Doc propagation

[`docs/engineering/DOC-PROPAGATION-CASCADE.md`](../../docs/engineering/DOC-PROPAGATION-CASCADE.md)

## Category guard

Not salon-shaped only — [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](../../docs/product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md).

## Related

[`livia-doc-sweep`](../livia-doc-sweep/SKILL.md) · [`AGENTS.md`](../../AGENTS.md) cascade table
