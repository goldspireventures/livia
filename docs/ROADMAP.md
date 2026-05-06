# Livia roadmap — how the pieces fit

This file ties together **in-repo execution** and **longer product spec** so there is a single mental model.

## Two layers (one product)

| Layer | Where it lives | What it is |
|--------|------------------|------------|
| **Execution law** | [LIVIA_BUILD_PLAN.md](./LIVIA_BUILD_PLAN.md) | Product principles (Part A), stack (Part B), HTTP surface (Part C), **Phases 0–7+** (Part D). Agents read this first. |
| **North-star / master spec** | [MASTER_SPINE.md](./MASTER_SPINE.md) + appendices in `docs/` | Messaging-first vision; satellites: schema target, screens, AI, events ([index](./MASTER_SPINE.md#documentation-map-satellites)). |

**Precedence:** If something conflicts on *implementation* (routes, tenancy, service layer), **LIVIA_BUILD_PLAN wins** until the master spec is merged into the repo as an updated doc.

## Phases in this repo (not “phase 15”)

Part D of [LIVIA_BUILD_PLAN.md](./LIVIA_BUILD_PLAN.md) uses **Phase 0 … Phase 7 (next)**. There is **no Phase 15** in the build plan; larger external specs often use **section numbers** (e.g. §14 AI) — those are **not** the same as Part D phases.

Rough mapping (conceptual):

- **Phases 0–7:** Foundation through **Stripe PaymentIntent create + global webhook + `Payment` on success** (see Part D Phase 7). Tenant payment intent APIs remain under `/api/businesses/[businessId]/...`.
- **After Part D:** Stripe Connect / `PaymentAccount` onboarding, slot generation + public booking-by-slug, real auth, notifications, Capacitor, messaging webhooks, AI tables — align with master spec **tranches** ([TRANCHES.md](./TRANCHES.md)).

## Repo tidy / prod prep (Cursor plan)

Work like README, `.env.example`, CI, Prisma seed, `.gitignore` for env example + local MCP, and [REPO_DELTA.md](./REPO_DELTA.md) is **orthogonal** to phase numbers: it cleans the tree so Phase 7+ and tranches are easier to ship.

## One “master plan” going forward

Recommended shape:

1. Keep **[LIVIA_BUILD_PLAN.md](./LIVIA_BUILD_PLAN.md)** as the **canonical execution + philosophy** doc in git.
2. Use appendices: [MASTER_APPENDIX_SCHEMA_TARGET.md](./MASTER_APPENDIX_SCHEMA_TARGET.md), [MASTER_APPENDIX_SCREENS.md](./MASTER_APPENDIX_SCREENS.md), [MASTER_APPENDIX_AI.md](./MASTER_APPENDIX_AI.md), [MASTER_APPENDIX_EVENTS.md](./MASTER_APPENDIX_EVENTS.md), plus [TRANCHES.md](./TRANCHES.md) and [MASTER_LIVIA_INDEX.md](./MASTER_LIVIA_INDEX.md).
3. Use **[REPO_DELTA.md](./REPO_DELTA.md)** to track **master spec vs current schema/API** until gaps close.

That is the **single master plan**: one spine (`LIVIA_BUILD_PLAN` + this roadmap) + short linked satellites, not duplicate competing bibles.

**Imported standards:** [elite/README.md](./elite/README.md) (API, security, events, UX, releases, testing) — subordinate to Livia for phase numbering and built state.
