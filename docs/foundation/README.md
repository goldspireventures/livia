# Foundation index

**Status:** F10 (2026-05-07). The foundation map. New hires read this on day 1.

## What "the foundation" is

The foundation is the set of strategic + architectural + brand + operating commitments that everything else (product, marketing, hiring, sales) is built on. It's organised by phase (F1–F10).

When in doubt, read in this order: F7 → F3 → F1 → F4 → F5 → F6 → F8 → F9 → F10. F7 is the strongest narrative; F3 anchors the personas; everything else extends from those.

## Phase index

### F1 — World map (the populated cells)
- [`docs/verticals.md`](../verticals.md) — 11 verticals, 3 waves.
- [`docs/configurations.md`](../configurations.md) — 13 configurations.
- [`docs/persona-vertical-configuration-matrix.md`](../persona-vertical-configuration-matrix.md) — the cells.
- [`docs/customer-typology-skeleton.md`](../customer-typology-skeleton.md) — CT1–CT6.
- [`docs/modality-and-locale-overview.md`](../modality-and-locale-overview.md) — 4 modalities, EN-IE wedge.

### F2 — Discovery (evidence base)
- [`.local/discovery-notes/README.md`](../../.local/discovery-notes/README.md) — index.
- `.local/discovery-notes/web-research.md`
- `.local/discovery-notes/competitors/` — 10 competitors.
- `.local/discovery-notes/interview-bank.md`
- `.local/discovery-notes/tuesday-walks.md` — `[INFERRED]` until design-partner walks land.

### F3 — Strategic spine
- [`docs/livia-as-service.md`](../livia-as-service.md) — the four characters of Liv.
- [`docs/hierarchy-and-delegation.md`](../hierarchy-and-delegation.md) — the role hierarchy.
- [`docs/customer-typologies.md`](../customer-typologies.md) — CT1–CT6 in depth.
- [`docs/modality-and-locale.md`](../modality-and-locale.md) — modality × locale gate.
- [`docs/personas.md`](../personas.md) — **v2 rewrite, the anchor doc.**
- [`docs/experience-matrix.md`](../experience-matrix.md) — rung commitments per cell.

### F4 — Workflows + features
- [`docs/workflows/`](../workflows/) — 7 representative workflows.
- [`docs/features/`](../features/) — 5 representative features.
- [`docs/workflows-features-cross-index.md`](../workflows-features-cross-index.md).

### F5 — Journeys
- [`docs/journeys/`](../journeys/) — 6 representative cell journeys + 4 cross-cutting docs.

### F6 — Competitive + economics + switching
- [`docs/competitive-landscape.md`](../competitive-landscape.md) — 10 competitors; feature × competitor matrix; configuration × competitor coverage.
- [`docs/persona-economics-and-switching.md`](../persona-economics-and-switching.md) — per-cell euros + switching costs + switching aids + failure modes.

### F7 — Positioning, bets, manifesto (already merged pre-F8)
- [`docs/livia-positioning.md`](../livia-positioning.md).
- [`docs/livia-bets.md`](../livia-bets.md).
- [`docs/livia-manifesto.md`](../livia-manifesto.md).

### F8 — Engineering + design system
- [`docs/engineering/README.md`](../engineering/README.md).
- [`docs/engineering/principles.md`](../engineering/principles.md).
- [`docs/engineering/code-organization.md`](../engineering/code-organization.md).
- [`docs/engineering/agent-runtime.md`](../engineering/agent-runtime.md) — ADR 0012.
- [`docs/engineering/event-bus-and-workflows.md`](../engineering/event-bus-and-workflows.md) — ADR 0013.
- [`docs/engineering/multi-tenant-isolation.md`](../engineering/multi-tenant-isolation.md) — ADR 0014.
- [`docs/engineering/audit-log-physical-design.md`](../engineering/audit-log-physical-design.md) — ADR 0015.
- [`docs/engineering/ai-eval-and-guardrails.md`](../engineering/ai-eval-and-guardrails.md) — ADR 0016.
- [`docs/engineering/observability-and-on-call.md`](../engineering/observability-and-on-call.md) — ADR 0017.
- [`docs/engineering/design-system.md`](../engineering/design-system.md).

### F9 — Business, pricing, GTM
- [`docs/business/pricing-and-packaging.md`](../business/pricing-and-packaging.md).
- [`docs/business/sales-motion.md`](../business/sales-motion.md).
- [`docs/business/design-partner-programme.md`](../business/design-partner-programme.md).
- [`docs/business/geographic-expansion.md`](../business/geographic-expansion.md).
- [`docs/business/regulatory-and-legal.md`](../business/regulatory-and-legal.md).
- [`docs/business/competitive-response-wargame.md`](../business/competitive-response-wargame.md).

### F10 — Company, hiring, brand
- [`docs/company/brand-of-livia-and-liv.md`](../company/brand-of-livia-and-liv.md).
- [`docs/company/hiring-plan.md`](../company/hiring-plan.md).
- [`docs/company/operating-principles.md`](../company/operating-principles.md).
- [`docs/company/founding-story.md`](../company/founding-story.md).
- [`docs/company/exit-and-acquirer-thesis.md`](../company/exit-and-acquirer-thesis.md).

## ADRs (the technical commitments)

- ADR 0001 — Codename Bliq renamed to Livia.
- ADR 0002 — Multi-tenant via business_id scoping.
- ADR 0003 — Clerk for auth.
- ADR 0004 — Marketing site as brand bible.
- ADR 0005 — OpenAPI as contract source.
- ADR 0006 — Monorepo via pnpm workspaces.
- ADR 0007 — Aurora tokens + gradient discipline.
- ADR 0008 — Mobile motion + materiality.
- ADR 0009 — Roles and personas.
- ADR 0010 — Multi-tenant + persona model.
- ADR 0011 — Mobile flagship.
- ADR 0012 — Agent runtime: per-tenant.
- ADR 0013 — Workflow engine: Inngest.
- ADR 0014 — Multi-tenant isolation: hybrid.
- ADR 0015 — Audit log: append-only hash-chained.
- ADR 0016 — AI eval: three layers.
- ADR 0017 — Observability: OTel + Grafana Cloud.

## How to use this index

- **Day 1 hire:** read F7 + F3 + F10/founding-story top to bottom. ~2 hours.
- **Engineering hire:** add F8 + ADRs 0012–0017. ~3 more hours.
- **Sales hire:** add F6 + F9. ~2 more hours.
- **Design hire:** add F5 + F8/design-system + F10/brand-of-livia-and-liv. ~2 more hours.

## Foundation audit cadence

Quarterly. The whole team re-reads. Stale claims retire (RFC). New claims land (RFC). The foundation is a living set of commitments; commitments age; we keep them honest.

## Status of foundation phases

| Phase | Status | Notes |
|---|---|---|
| F1 World map | ✅ Complete | All 5 docs landed. |
| F2 Discovery | ✅ Complete | Tuesday walks `[INFERRED]` until design-partner programme launch. |
| F3 Strategic spine | ✅ Complete | Personas v2 = anchor for downstream. |
| F4 Workflows + features | ✅ Complete | 7 workflow + 5 feature representative docs + cross-index. |
| F5 Journeys | ✅ Complete | 6 representative + 4 cross-cutting. |
| F6 Competitive + economics + switching | ✅ Complete | Two docs. |
| F7 Positioning + bets + manifesto | ✅ Complete | Merged pre-F8. |
| F8 Engineering + design system | ✅ Complete | 9 docs + 6 new ADRs. |
| F9 Business + pricing + GTM | ✅ Complete | 6 docs. |
| F10 Company + hiring + brand | ✅ Complete | 5 docs + this index. |
