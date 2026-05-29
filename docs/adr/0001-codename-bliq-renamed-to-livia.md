# ADR 0001: Codename "Bliq" renamed to "Livia"

- **Status:** Accepted (2026-05-06, Task #38).
- **Deciders:** founder.

## Context

The product launched internally under the codename **Bliq**. By April 2026 it was clear the codename would not survive contact with paying shops in Dublin: it was hard to pronounce in mixed English/Irish accents, didn't translate to a memorable wordmark, and competed visually with adjacent SaaS brands ("Bliq" / "Bling" / "Blink"). The founder selected **Livia** — a premium, soft, distinctly EU-leaning name with a natural italic *v* lock-up, and a separable AI character ("Liv") that lets us keep the AI work backstage instead of in the marketing surface.

## Decision

Full repo rename `bliq` → `livia`. Every artifact, package, file path, ENV var, URL scheme, brand asset, and user-facing string was migrated in one task (#38). The product is **Livia**; the AI character is **Liv**; the two are never collapsed in customer-facing copy.

## Consequences

- All `bliq-*` artifact directories, package names, and workflow names became `livia-*`.
- Brand assets, wordmark, logo, and `livia-hq.com` domain consolidated under one identity.
- **May 2026:** final product-code cleanup — no `bliq` strings remain outside this ADR and other historical docs under `docs/`.
- A CI guard (Compliance lane C12) fails the build if the legacy codename is reintroduced in product code.
- A separate CI guard fails the build if "Olivia" is reintroduced anywhere — founder-private naming taboo.
- Stale "Bliq"-era plans (`.local/tasks/RELEASE-PLAN.md` and 12 legacy task files) were folded into `docs/launch-plan.md` v1 and marked CANCELLED — superseded.

## Alternatives considered

- **Keep Bliq.** Rejected — the brand was the friction.
- **Rename incrementally per surface.** Rejected — would have produced months of mixed-name copy and broken cross-references. The atomic rename was cheaper.
- **Pick a name without a separable AI character.** Rejected — keeping Liv backstage is core to the brand decision (see ADR 0004).
