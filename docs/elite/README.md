# Elite documentation pack

These files were added from **`bliq_elite_docs.zip`** as **binding standards** alongside the in-repo build plan.

## How to use them (precedence)

1. **Execution phases and HTTP table:** [../BLIQ_BUILD_PLAN.md](../BLIQ_BUILD_PLAN.md) Part **C–D** — canonical **Phase 0–7** numbering and what is implemented in *this* repo.
2. **Product constitution:** [BLIQ_SOURCE_OF_TRUTH.md](./BLIQ_SOURCE_OF_TRUTH.md) — high-level vision and principles (aligns with BLIQ Part A; use BLIQ for repo-specific rules).
3. **Aligned status:** [BLIQ_PHASE_STATUS.md](./BLIQ_PHASE_STATUS.md) — **reconciled** with the repo; do not use the old elite-only phase table without reading the crosswalk.
4. **API contract:** [BLIQ_API_STANDARD.md](./BLIQ_API_STANDARD.md) — response shapes, errors, webhooks outside tenant path, pagination (implement gradually where gaps exist).
5. **Security / data:** [BLIQ_DATA_AND_SECURITY_RULES.md](./BLIQ_DATA_AND_SECURITY_RULES.md).
6. **Events (target catalog):** [BLIQ_EVENT_CATALOG.md](./BLIQ_EVENT_CATALOG.md) — aspirational types vs `src/lib/events.ts`; grow the code toward this catalog.
7. **UX:** [BLIQ_MOBILE_WEB_UX_RULES.md](./BLIQ_MOBILE_WEB_UX_RULES.md).
8. **Releases:** [BLIQ_RELEASE_PLAN.md](./BLIQ_RELEASE_PLAN.md).
9. **Testing:** [BLIQ_TESTING_STRATEGY.md](./BLIQ_TESTING_STRATEGY.md).

If anything conflicts on **routes, tenancy, or what is already built**, **[BLIQ_BUILD_PLAN.md](../BLIQ_BUILD_PLAN.md)** wins.
