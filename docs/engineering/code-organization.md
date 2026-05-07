# Code organization

**Status:** F8 (2026-05-07). Documents the *why* of where things live in the pnpm monorepo.

## Top-level layout

```
artifacts/
  livia-marketing/      # public marketing site (livia.io)
  livia-dashboard/      # owner/manager web cockpit
  livia-mobile/         # Expo — flagship mobile app for owner/manager/staff/customer
  api-server/           # OpenAPI-first API server
  mockup-sandbox/       # canvas component preview server
packages/               # shared libraries (cross-artifact)
  design-tokens/        # Aurora-Midnight tokens (colours, type scale, motion)
  ui/                   # cross-platform component library (web + RN where possible)
  api-client/           # typed client generated from OpenAPI
  schema/               # Zod schemas + DB types (Drizzle)
  liv-runtime/          # the agent runtime — see ADR 0012
  liv-evals/            # golden datasets + eval harness
  workflows/            # durable workflow definitions (Inngest functions) — ADR 0013
  audit-log/            # append-only audit log writer + reader — ADR 0015
docs/                   # foundation, engineering, business, company, ADR
```

## Package boundary principles

### What's shared vs local

**Shared in `packages/`:**
- Anything used by ≥2 artifacts.
- Domain-pure logic (business rules, validation, schema).
- Liv's brain (runtime, evals, character config).
- Design tokens + foundational UI primitives.

**Local in `artifacts/<name>/src/`:**
- Routing, layouts, surface-specific composition.
- Surface-specific UX state.
- Anything that depends on a single platform (Next.js routing, Expo navigation).

### The boundary test

When in doubt: "Would I be embarrassed if a second artifact had its own divergent copy of this?" If yes → `packages/`. If no → local.

## Why this layout

### Why an OpenAPI-first API server

`packages/api-client/` is generated from the OpenAPI spec. Changing an endpoint means: (1) update spec; (2) regen client; (3) all artifacts get the type-safe client update. This is ADR 0005.

### Why a separate `liv-runtime` package

The agent runtime is the most reused, most-tested piece of code we own. It's consumed by the API server (sync requests) and the workflow engine (async durable executions). It has its own eval suite (`liv-evals`). Coupling it to any single artifact would be a mistake.

### Why a separate `audit-log` package

Per principle 6 (trust-amplification by default), every action goes through audit-log. Centralising the writer and the reader in one package makes the surface area auditable, makes hash-chaining + signing one implementation, and makes "did we forget to log this?" a lint check.

### Why `workflows/` separate from `liv-runtime/`

Workflows are durable and outlive a single LLM call. They live longer (sometimes days), have retry semantics, and need replay-ability. The runtime is request-scoped; the workflow is process-scoped. Different lifetimes → different packages.

## Naming conventions

- Files: `kebab-case.ts`.
- Components: `PascalCase.tsx`.
- Schemas: `<Entity>Schema` (Zod).
- DB tables: `snake_case`.
- API routes: `/v1/<resource>/<action>` (REST-like; OpenAPI-first).
- Liv decisions classes: `liv.<verb>` (`liv.book`, `liv.refund`, `liv.escalate`, `liv.draft`, `liv.suggest`).

## Cross-artifact dependency rules

- `artifacts/` may depend on `packages/`. Never the reverse.
- `packages/` may depend on other `packages/` (one-directional; we maintain an internal dependency graph).
- No artifact may depend on another artifact directly. Cross-artifact data flows through the API server.

## Migration strategy when boundaries are wrong

When we discover a `packages/` boundary is wrong, we file an ADR before refactoring. We don't quietly move code. The boundaries are the architecture.
