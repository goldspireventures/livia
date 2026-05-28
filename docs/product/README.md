# Product design spine (paper before pixels)

**Status:** living (2026-05-22). **Owner:** founder + product.

**Start:** [`../LIVIA-ALIGNMENT.md`](../LIVIA-ALIGNMENT.md) · **Handoff (engineering done):** [`ENGINEERING-HANDOFF.md`](./ENGINEERING-HANDOFF.md) · **Your go-live:** [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md)

This directory holds **integrated product architecture** for the **global appointment-business OS** (not salon-only). Foundation F1–F10 remains in [`../foundation/README.md`](../foundation/README.md).

**Founder “done” (revised):** P0 kernel + **P1 surfaces** (CRUD, mobile parity, UX program) in-repo; **P3** go-live ops per [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md). See [`LIVIA-IDEA-TO-REALITY.md`](./LIVIA-IDEA-TO-REALITY.md) Part I for honest API vs UI gaps.

## Read order (new hire / design sprint)

0. **[`../LIVIA-ALIGNMENT.md`](../LIVIA-ALIGNMENT.md)** — company + product spine.
0. **[`SYSTEM-REALIGNMENT-PROGRAM.md`](./SYSTEM-REALIGNMENT-PROGRAM.md)** — what we are doing now.
0. **[`LIVIA-PRODUCTION-READY.md`](./LIVIA-PRODUCTION-READY.md)** — what live users get today + off-platform blockers.
0. **[`APPOINTMENT-BUSINESS-PLATFORM.md`](./APPOINTMENT-BUSINESS-PLATFORM.md)** — **vertical-neutral product framing** (not salon-only).
0a. **[`LIVIA-DOCUMENTATION-READINESS.md`](./LIVIA-DOCUMENTATION-READINESS.md)** — doc readiness (L2/L4 complete; G2/G3 = deferred).
0b. **[`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md)** — **only** external/G2/G3 items still open (everything else closed in-repo).
0c. **[`UX-AUDIT-2026-05-21.md`](./UX-AUDIT-2026-05-21.md)** — founder walkthrough — **closed in code**.
0c2. **[`UX-CONTEXTUAL-REVIEW.md`](./UX-CONTEXTUAL-REVIEW.md)** — per-persona intent review (web captures + mobile checklist).
0c3. **[`WEB-MOBILE-PARITY.md`](./WEB-MOBILE-PARITY.md)** — web vs mobile surface matrix.
0b2. **[`CHANNELS-EU-MESSAGING.md`](./CHANNELS-EU-MESSAGING.md)** — WhatsApp, Instagram, Messenger, SMS, voice, EU roadmap.
0a. **[`LIVIA-COMPLETE-SYSTEM-SPEC.md`](./LIVIA-COMPLETE-SYSTEM-SPEC.md)** — **EU complete spec** (L2 product truth).  
0a2. **[`LIVIA-RESILIENCE-OPS-AND-TRUST.md`](./LIVIA-RESILIENCE-OPS-AND-TRUST.md)** — **failures, backups, logs, RBAC, internal ops** (multi-angle; parallel Track C).
0b. **[`LIVIA-DETAILED-BUILD-PLAN.md`](./LIVIA-DETAILED-BUILD-PLAN.md)** — **canonical build sequence** (doc-gated phases, tasks).
0c. **[`LIVIA-FINAL-EXECUTION-PLAN.md`](./LIVIA-FINAL-EXECUTION-PLAN.md)** — phase summary (see detailed plan for tasks).
0d. **[`BUSINESS-RULES-REGISTRY.md`](./BUSINESS-RULES-REGISTRY.md)** — where platform + business rules live.
0e. **[`LIV-OPERATING-SYSTEM.md`](./LIV-OPERATING-SYSTEM.md)** — **Liv as OS intelligence** (all verticals, public, staff, Livia Inc).
0f. **[`LIV-EXECUTION-PLAN.md`](./LIV-EXECUTION-PLAN.md)** — phased build plan + Phase A file map.

1. **[`LIVIA-GLOBAL-PRODUCT-SYSTEM.md`](./LIVIA-GLOBAL-PRODUCT-SYSTEM.md)** — **global product + company**: every vertical, internal/external ops, pain & eagle-eye, Liv clears muddy water, Livia Inc internal env.
2. **[`LIVIA-EXPERIENCE-DESIGN-BIBLE.md`](./LIVIA-EXPERIENCE-DESIGN-BIBLE.md)** — **screens & packs** (purpose per screen, access paths, gaps).
3. **[`LIVIA-IDEA-TO-REALITY.md`](./LIVIA-IDEA-TO-REALITY.md)** — build tracks, Platform-Ready, sprints.
4. **[`LIVIA-MASTER-PLAN.md`](./LIVIA-MASTER-PLAN.md)** — commercial bow: gates, waves, monetization.
5. [`LIVIA_MASTER_DESIGN.md`](./LIVIA_MASTER_DESIGN.md) — constituencies, surfaces, app split.
6. [`TARGET-STATE-VS-SHIP-SCOPE.md`](./TARGET-STATE-VS-SHIP-SCOPE.md) — vision vs **first ship** scope.
7. **[`LIVIA-MASTER-BUILD-PLAN.md`](./LIVIA-MASTER-BUILD-PLAN.md)** — engineering — after screen cards **Designed**.
8. [`BUILD-BACKLOG.md`](./BUILD-BACKLOG.md) — checklist (**closed** for in-repo scope).
9. [`screens/`](./screens/) — screen cards (YAML).
10. [`../company/livia-internal-portal-spec.md`](../company/livia-internal-portal-spec.md) — internal portal (see Global System Part VI).
11. [`SCREEN-INVENTORY.md`](./SCREEN-INVENTORY.md) — generated routes.
12. [`../foundation/README.md`](../foundation/README.md), [`../roadmap/v1-scope.md`](../roadmap/v1-scope.md).

## Relationship to existing docs

| Topic | Canonical depth doc | This folder’s role |
|-------|---------------------|-------------------|
| Personas P1–P7 | `docs/personas.md` | Align **surfaces** (who gets which app) |
| Verticals V1–V11 | `docs/verticals.md` | Align **phase gates** (hair ≠ whole category) |
| Workflows | `docs/workflows/` | Map to **capabilities** + release phase |
| Engineering | `docs/engineering/`, `docs/adr/` | Implementation after paper sign-off |
| Roadmap v1 | `docs/roadmap/v1-scope.md` | **Ship contract** until RFC supersedes |

## Governance rule

Any change that widens **v1** verticals, locales, or modalities (e.g. “full sector at Gate 3”) is a **material roadmap change**: RFC → ADR supersedes or new `v1-scope` revision → update `docs/audits/marketing-vs-reality.md`. Do not imply scope in UI/marketing that the ledger does not support.

## Build sequencing (after paper sign-off)

1. **Experience Bible** — vertical + screen depth signed.  
2. **Screen cards** — `screens/{vertical}.{locale}/*.yaml` marked Designed.  
3. **Vertical/locale packs** in `lib/policy` + demo seeds (visible login diff).  
4. **[`LIVIA-MASTER-BUILD-PLAN.md`](./LIVIA-MASTER-BUILD-PLAN.md)** — implement against cards, not ad hoc CRUD.

## Next documents to add (backlog)

- `LIV-CAPABILITY-MATRIX.md` — rung (R1–R5) × modality × vertical × workflow (extends `docs/experience-matrix.md`).
- `DATA-SUBJECT-MAP.md` — GDPR Article 30 style map (controller/processor/subject flows).

When those land, link them from this README.
