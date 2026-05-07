# Roadmap — release scope and sequencing

**Status:** v1 lock (2026-05-07). The bridge between F3/F7 strategic commitments, F4 features, F8 engineering capacity, F9 commercial promises, and F10 hiring plan. Every promise we make on the marketing site or in a sales call must trace to a row in here.

## Version philosophy

We ship in numbered versions, not in continuous date-based releases. Each version is a **named promise** with explicit scope, target persona/cell, and measurable acceptance criteria. Versions exist for clarity of commitment, not for marketing cadence.

| Version | Theme | Target ship | Cell focus | Doc |
|---|---|---|---|---|
| **v1** | The wedge. | 2026 H2 (Gate 3 of `launch-plan.md`) | P2b solo Hair English-IE; P2a single-shop with Manager Hair-IE; first 10 design partners | [`v1-scope.md`](./v1-scope.md) |
| **v1.5** | Heartland + chair-rental + multi-brand | 2027 H1 | + P2b host C10; + P1 small chain C7; + P2a + P4 sr-w-admin C6; + multi-brand C13 | [`v1.5-scope.md`](./v1.5-scope.md) |
| **v2** | Verticals + UK + Nordics open | 2027 H2 → 2028 H1 | + Beauty + Body art + Fitness verticals; + UK; + Nordics; class-booking; tattoo proof workflow | [`v2-scope.md`](./v2-scope.md) |
| **v3** | DACH + medspa + allied health | 2028–2029 | + DACH locale + voice; + medspa informed-consent; + allied-health adjacency; enterprise tier | [`v3-scope.md`](./v3-scope.md) |

## Versions are gated, not scheduled

A version ships when its acceptance criteria hold, not on a date. The dates above are *targets*, not commitments. Slipping is acknowledged in the foundation audit (quarterly); marketing claims cannot run ahead of what has shipped (anchored by `docs/audits/marketing-vs-reality.md`).

## How a feature gets into a version

Every feature in `docs/features/` and every workflow in `docs/workflows/` carries a `Version: v1 | v1.5 | v2 | v3 | not-on-roadmap` tag in its front matter (back-filled in the next housekeeping pass). The version tag is the only source of truth for "is this in the roadmap." Marketing copy citing a feature must check the version tag.

## What's deliberately not on the roadmap

The "no" list per F7 narrowing reflection is durable. Re-stated in `v3-scope.md` § "Beyond v3 — explicit nots." Includes: US expansion, marketplace booking, restaurant/hospitality vertical, generic horizontal scheduling, on-prem deployment, B2C white-label.

## Read order for new hires

1. `v1-scope.md` — what we are actually shipping right now.
2. `release-calendar.md` — when, with confidence ratings.
3. `feature-flags-and-rollout.md` — how features land per tenant.
4. v1.5 → v2 → v3 — increasingly speculative.

## Change control

Roadmap changes require an RFC (per `docs/governance/rfc-process.md`) signed by founder + head of engineering + head of CS. The roadmap is *the commitment surface*; we don't drift it quietly.
