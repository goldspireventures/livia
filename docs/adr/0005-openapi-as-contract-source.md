# ADR 0005: OpenAPI as the HTTP contract source of truth

- **Status:** Accepted (2026-02, pre-rename — re-affirmed 2026-05-06).
- **Deciders:** founder.

## Context

The API serves a web dashboard, a mobile app, and (via the public booking page) third-party browsers. We needed a single contract that all three clients consume the same way, with type-safe Zod validation on the server, type-safe React Query hooks on the web, type-safe React Query hooks on mobile, and a CI guard that prevents the contract from drifting silently.

Three families of solutions exist: tRPC (TS-first, no schema file), shared types between server and clients (manual), and an OpenAPI spec with codegen.

## Decision

**`lib/api-spec/openapi.yaml`** is the HTTP contract source of truth. Codegen via Orval produces:

- `lib/api-zod` — Zod schemas used by both the server (for runtime validation) and the clients (for type inference).
- `lib/api-client-react` — React Query hooks consumed by `livia-dashboard` and `livia-mobile`.

The codegen command is `pnpm --filter @workspace/api-spec run codegen`. CI runs `scripts/check-codegen.sh` and fails the build if the working tree drifts from the generated output.

## Consequences

- The OpenAPI YAML is the place to make a contract change. Edit, run codegen, commit both the YAML and the generated files.
- Generated files are not hand-edited. They live in the repo (so we can diff them on PRs and so consumers don't have to run codegen), but they are write-once.
- Conventions enforced through the spec:
  - Staff and Customer use `displayName` (not `name`).
  - Service uses `priceMinor` (integer minor units, never floats).
  - Booking uses `startAt` / `endAt` (ISO 8601, UTC).
  - List responses use `.data[]` envelopes.
  - Generated React Query hooks expose options via `{ query: UseQueryOptions<...> }`.
  - Mobile mutations use a `data` key.
- Server runtime validation reuses the same Zod schemas the clients infer types from — single source.
- We accept the OpenAPI/Orval toolchain footprint and the slight verbosity of YAML in exchange for not having to maintain three parallel contract definitions.

## Alternatives considered

- **tRPC.** Rejected — would have meant our public booking page could not consume the same contract without an HTTP shim, and we lose the language-agnostic spec that future integrators will want.
- **Hand-written shared types in a `lib/types` package.** Rejected — no runtime validation, drift-prone, and forces every contract change to be coordinated by hand across server + two clients.
- **GraphQL.** Rejected for v1 — overkill for the surface area and adds a query language to the things engineers must learn before contributing.
