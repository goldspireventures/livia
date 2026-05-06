# ADR 0007: Aurora tokens and gradient discipline

- **Status:** Accepted (2026-05-06, Task #40).
- **Deciders:** founder.
- **Related:** ADR 0004 (marketing as brand bible).

## Context

The product brand has two layers — **Aurora** (the product surface) and **Aurum** (the wordmark accent). Through April 2026 the dashboard treated the aurora gradient as a headline-decoration feature: it appeared on sign-in headlines, on cockpit hero strings, and as dual violet+cyan corner glows on every page. The result was a product that felt loud and unfocused, contradicting the calm/precise voice that the marketing site established.

## Decision

The colour vocabulary and the discipline that governs how it's used are codified together so they don't drift apart.

**Aurora (product surface) — `--color-aurora-*`:**

- `aurora-violet` `#8b5cf6` — automated/Liv moments.
- `aurora-cyan` `#06b6d4` — primary action colour. The only colour that lives on a "do this now" button.
- `aurora-mint` `#10b981` — success.

**Aurum (wordmark accent) — `--color-aurum-*`:**

- `aurum-champagne` `#d9c39a`, `aurum-cream` `#f6f3ec`, `aurum-bronze` `#8a7549`, `aurum-ink` `#0a0a10`.
- Reserved for the Livia wordmark + the italic *v* + the celebrate-shimmer on booking confirmation. **Never on action buttons.**

**Type tokens:**

- `--app-font-display` Plus Jakarta Sans · `--app-font-sans` Geist · `--app-font-serif` Cormorant Garamond · `--app-font-mono` JetBrains Mono. Identical across marketing, dashboard, and mobile.

**The aurora gradient is an accent, not a headline treatment.** Permitted: primary CTA buttons, AI/automation chips, the wordmark badge. Forbidden: headlines, page chrome glows, section H2s, settings copy, empty-state heroes. The discipline lives as a comment block above `.aurora-gradient` in `artifacts/livia-dashboard/src/index.css`.

## Consequences

- Sign-in / sign-up headlines use `font-serif` Cormorant + muted italic continuation, not `aurora-gradient-text`.
- Page lighting uses a single soft cyan halo (`bg-aurora-cyan/10` + `blur-[140px]`), not dual corner glows.
- The Liv-moment surfaces (chat suggestions, "Liv replied" badges) keep the gradient — that is the single place where the gradient is *expected* and not jarring.
- The shared component for the wordmark is `LiviaWordmark` (in `artifacts/livia-marketing/src/components/brand/LiviaMark.tsx`, mirrored in the dashboard). It is the only sanctioned way to render the wordmark.
- Mobile aurora exports (`artifacts/livia-mobile/constants/colors.ts`) mirror the same semantics. Per-component review enforces accent-only usage.
- Future contributors who reach for a gradient on a non-AI surface should treat that as a code smell — the gradient is loud on purpose, and loud belongs in three places only.

## Alternatives considered

- **Drop the aurora gradient entirely.** Rejected — it is the brand signal for AI moments, which is core to the product. Removing it would make Liv invisible on the surfaces where she should feel present.
- **Allow the gradient on hero headlines, with restraint.** Rejected — "with restraint" doesn't survive a year of contributor turnover. A hard rule is the only one that holds.
