# ADR 0004: `livia.io` marketing site is the brand bible

- **Status:** Accepted (2026-05-06, Task #40).
- **Deciders:** founder.
- **Supersedes:** the implicit "dashboard owns the brand" pattern that existed before May 2026.

## Context

Through April 2026 the dashboard and marketing surfaces drifted independently. The dashboard accumulated aurora-gradient-text on headlines, dual aurora-glow corner halos on every page, and a centred wordmark above the sign-in card; meanwhile, `artifacts/livia-marketing` shipped a much more restrained visual language (serif Cormorant Garamond hero, single soft halo, top-left wordmark, gradient reserved for accent moments). At Demo Day rehearsal it was obvious that a customer following a link from `livia.io` to `app.livia.io` would feel like they had landed on a different product.

## Decision

**`artifacts/livia-marketing` is the brand bible.** When marketing and product disagree, marketing wins. Product surfaces (dashboard, mobile, public booking page) rebase onto marketing's visual language — they do not establish their own.

Concretely:

- The aurora gradient is an **accent**, not a headline treatment. Permitted: primary CTA buttons, AI/automation chips ("Liv replied", "Liv booked"), the wordmark badge. Forbidden: page or sign-in headlines, section H2s, settings copy, empty-state heroes, persistent page-chrome glows.
- Headlines use `font-serif` (Cormorant Garamond, regular weight, tight tracking) with a muted italic continuation for the second line — the exact pattern marketing's hero uses ("…and every appointment in between.").
- Page lighting is restrained: a single soft cyan radial halo, never the dual violet+cyan corner glow.
- The wordmark sits in the top-left of page chrome, matching marketing nav rhythm.

This discipline is codified as a comment block in `artifacts/livia-dashboard/src/index.css` directly above the `.aurora-gradient` utility, and the one-page extracted spec lives at `.local/audits/brand-bible.md`.

## Consequences

- Type tokens are unified: `--app-font-{sans,display,serif,mono}` declared identically in marketing and dashboard.
- `LiviaMark` and `LiviaWordmark` are shared components between marketing and dashboard.
- Mobile (`livia-mobile/constants/colors.ts`) mirrors the same semantics — cyan = primary action, violet = AI accent, aurum = brand-only.
- Dashboard sign-in / sign-up rebuilt to match (Task #40 evidence: `.local/audits/brand-realignment-2026-05-06.md`).
- Future dashboard work that introduces new visual treatments must check against marketing first; if marketing doesn't have a precedent, the precedent gets set in marketing.

## Alternatives considered

- **Dashboard as the brand bible.** Rejected — marketing is the surface customers see first, and product surfaces should feel downstream of it, not the other way round.
- **A separate design-system package as the bible.** Deferred (Engineering E7 in the launch plan). Will eventually extract the shared tokens into `lib/design-system`; until then, marketing's `index.css` is the source.
