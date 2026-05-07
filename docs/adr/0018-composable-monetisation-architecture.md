# ADR 0018 — Composable monetisation as architectural North Star

**Status:** Accepted (2026-05-07).
**Context:** Pre-Phase-1 build kickoff.

## Context

Before any v1 code lands, we need a stance on architecture optionality. The question: do we build Livia as a single product, or as a suite of capabilities composed into one product?

The naive answer ("a single product") risks painting ourselves into a corner where future monetisation paths (selling Liv standalone, opening a partner API, spinning out the audit-log SaaS, launching a vertical-pack marketplace) become rewrites, not feature work.

The opposite extreme ("a suite of microservices from day one") risks delaying v1 ship for an audience that doesn't exist yet.

## Decision

**Composable monetisation.** Livia is designed as 12 independently valuable capabilities (the "sellable units" — see companion doc `docs/engineering/composable-monetisation-architecture.md`) that ship as one product at v1.

We adopt 8 architectural patterns from day one:

1. Contract-first, package-isolated domains.
2. Event-driven core (typed domain events on Inngest per ADR 0013).
3. Tenant context as a first-class primitive.
4. Capability tokens for every privileged action.
5. Liv as its own runtime/service, not inline code.
6. Pricing as composable primitives (meters + entitlements + product compositions as data).
7. Vertical packs as plugins, not branches.
8. Two API planes from day one (tenant + partner; partner not opened at v1).

The pragmatic reorganisation plan acknowledges that we have a working `@workspace/db` package with ~30 consumers. Existing schema is reorganised **internally** by domain folder + subpath exports; truly new infrastructure packages (`tenant-context`, `capability-tokens`, `audit-log`, `eval`, `event-bus`, `entitlements`, `metering`) are stood up as separate packages now (zero rename cost).

Future graduation of internal domains to standalone packages is mechanical (folder-move + `package.json`), triggered by concrete need (non-Livia consumer, independent deployment cadence, separate region pinning, isolated contributor surface).

## Consequences

**Positive:**
- v1.5+ monetisation paths (sell Liv standalone, open partner API, spin out audit-log SaaS, launch vertical-pack marketplace) become feature work, not rewrites.
- Domain boundaries become a culture-of-engineering anchor; PR-review can enforce "did you respect the boundary?".
- Replacement of any single capability (e.g., model upgrade in `agent-runtime`, audit-log moves to a write-optimised store, entitlements become third-party) becomes localised.

**Negative:**
- ~3 hours of structural work at Phase 0 with no immediate customer value.
- Ongoing discipline cost at code review.
- Higher cognitive surface area for new hires (but offset by `docs/foundation/README.md` index + the explicit doc).

**Deferred:**
- Microservice extraction of any domain (rejected at v1; mechanical when triggered).
- Database-per-domain (rejected at v1; one Postgres + RLS per ADR 0014).
- Public partner API (plane exists; not opened until v1.5+ commercial demand).

## Alternatives considered

- **"One Big App."** Rejected: locks us out of every future monetisation path; consistent with how most SaaS competitors are built; loses the optionality that compounds over years.
- **"Microservice from day one."** Rejected: delays v1; over-invests in scale we don't have; produces seven half-baked services instead of one good monolith with clean internal boundaries.
- **"Defer the question to v1.5."** Rejected: by v1.5 we have ~30 consumers across `@workspace/db` plus more downstream code on top; reorganisation cost compounds quadratically with code volume.

## Companion document

`docs/engineering/composable-monetisation-architecture.md` — the full pattern catalogue, the 12 sellable units, the package map, the pragmatic reorganisation plan.

## Review trigger

Annual, OR sooner if at any review we have not exercised (or seriously considered exercising) at least one sellable-unit option. If we're paying the optionality tax for nothing, we collapse boundaries.
