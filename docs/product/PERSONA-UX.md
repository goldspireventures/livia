# Livia persona UX — one building, different keys

**Status:** Product design spine (2026-05-20)

## Design answer in one sentence

**One Aurora design system** (typography, components, tokens) — **six distinct rituals** (information hierarchy, nav labels, home surfaces, Liv voice) enforced by membership + persona derivation, not by mock toggles.

## Same vs different

| Layer | Shared | Per persona |
|-------|--------|-------------|
| Visual system | Colors, type, cards, buttons | Accent emphasis on ritual header |
| Data model | Businesses, bookings, customers | What rows you can read/write (API) |
| Navigation structure | Same routes exist | **Order, labels, visibility** |
| Home surface | — | **Where you land** and **what Liv says first** |
| Copy voice | Professional, Irish-EU friendly | Job-to-be-done framing |

## Home routes (production intent)

| Persona | Home | Job |
|---------|------|-----|
| Founder | `/chain` | Cross-shop glance, drill into one shop |
| Owner | `/dashboard` | Today + approvals + flight plan |
| Manager | `/inbox` | Queue Liv handled / needs sign-off |
| Staff | `/my-day` | Chair, next client, my regulars |
| Reception | `/bookings` | Floor calendar, walk-ins, messages |
| Customer | `/b/:slug` | Book + chat, no login |

**Surface morph:** same routes reshape on phone / tablet / desktop — [`design/SURFACE-AND-BREAKPOINTS.md`](../design/SURFACE-AND-BREAKPOINTS.md). Native mobile uses phone-class layouts; reception/proof workflows target tablet split where available.

## Implementation map

- Ritual config: `artifacts/livia-dashboard/src/lib/persona-rituals.ts`
- Live Liv line: `artifacts/livia-dashboard/src/hooks/use-persona-briefing.ts`
- Ritual header: `artifacts/livia-dashboard/src/components/ritual/persona-ritual-header.tsx`
- Shell nav: `artifacts/livia-dashboard/src/components/layout/app-layout.tsx`
- Customer public: `artifacts/livia-dashboard/src/components/ritual/public-customer-ritual.tsx`

## v3 experience layer

Motion, emotional beats, booking continuity, per-surface contracts: [`V3-EXPERIENCE-SPEC.md`](./V3-EXPERIENCE-SPEC.md). Real-world pains → build blocks: [`V3-REAL-WORLD-SCENARIOS.md`](./V3-REAL-WORLD-SCENARIOS.md).

## What “prod-close” still needs

- Density of seeded story (conversations, alerts) per `docs/demo-gateway.md`
- Mobile ritual parity (nav labels + home on each tab)
- Internal ops RBAC roles (support, success, eng) — separate artifact
- Marketing site handoff copy aligned to public ritual
