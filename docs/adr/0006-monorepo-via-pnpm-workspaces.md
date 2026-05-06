# ADR 0006: Monorepo via pnpm workspaces

- **Status:** Accepted (2026-01, pre-rename — re-affirmed 2026-05-06).
- **Deciders:** founder.

## Context

Livia ships as five user-visible artifacts (API server, web dashboard, mobile app, marketing site, mockup sandbox) plus a growing set of shared libraries (DB schema, OpenAPI spec, generated clients, integration wrappers, AI-disclosure copy). All of this lives on Replit, which provides a single working directory per project and a path-based artifact router for live previews.

We needed a structure that lets shared libraries change atomically with the artifacts that consume them, supports a single `pnpm install` and a single `pnpm run typecheck` across the whole graph, and plays nicely with Replit's per-artifact workflow runner.

## Decision

**Single pnpm workspace, two top-level groups:** `artifacts/` (everything user-visible, each with its own workflow) and `lib/` (everything shared, no workflow). TypeScript project references stitch the libraries into the artifacts; one `pnpm run typecheck` at the root walks the entire graph.

`lib/integrations/*` is **nested**: `lib/integrations/anthropic-ai`, `lib/integrations/resend`, `lib/integrations/twilio`. Third-party SDK wrappers cluster under `lib/integrations/` rather than living at the `lib/` top level (cleaner mental map: "all the third-party glue is over there").

## Consequences

- One install, one typecheck, one lockfile. CI is simple.
- A new artifact follows the existing pattern — copy a sibling, set a unique `slug` and `previewPath`, register via the artifacts skill (which writes `artifact.toml` + the workflow). Don't hand-edit `artifact.toml`.
- A new shared library lives under `lib/<name>` for first-party domain code, or `lib/integrations/<vendor>` for third-party SDK glue. Add it to the workspace via the package's own `package.json`; pnpm picks it up automatically.
- Generated code (`lib/api-zod`, `lib/api-client-react`) lives in the repo and is regenerated via `pnpm --filter @workspace/api-spec run codegen`. See ADR 0005.
- Imports cross package boundaries via the `@workspace/*` namespace, never via relative paths into another package.

## Alternatives considered

- **Nx / Turbo.** Rejected — adds a build orchestrator on top of pnpm without solving a problem we have at this scale. Reconsider if cold-build time becomes painful.
- **Separate repos per artifact.** Rejected — atomic changes to the OpenAPI spec or DB schema would become multi-repo PR dances, which is exactly the friction the monorepo removes.
- **Flat `lib/` (no nesting under `integrations/`).** Rejected — the third-party glue is a distinct mental category from first-party domain code; clustering it is worth the one extra path segment.
