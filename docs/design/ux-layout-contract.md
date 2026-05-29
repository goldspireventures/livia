# Livia UX layout contract

This is how operator surfaces stay beautiful, fluid, and context-aware — not a pile of features on one screen.

## Principles

1. **Context over clutter** — Show what matters for *this moment* (persona, vertical, time of day). Reuse patterns; swap content. Do not fit every module on every page.
2. **Fingertip vs nested** — Primary actions (book, reply, approve proposal, running late) stay one tap. Configuration, exports, and rare tools tuck under Settings, Toolkit, or overflow.
3. **One visual rhythm** — `PageFrame` + `PersonaRitualHeader` + optional `OperationalPageShell` on every operator page. Serif title, muted subtitle, actions top-right.
4. **Motion with purpose** — Page enter (`MOTION.enterPage`), list items fade in. No gratuitous animation; respect `prefers-reduced-motion` via Tailwind/CSS.
5. **Live surfaces** — After any mutation, call `invalidateOperationalState`. Poll operational pages every ~45s (`OPERATIONAL_REFETCH_MS`).
6. **Liv at the edge** — Proposals appear on Home and Inbox when pending; empty state hides the panel. Approve/dismiss is always visible without hunting.

## Screen zones

| Zone | Placement | Contents |
|------|-----------|----------|
| Header | Top | Persona label, page title, one-line Liv/subtitle |
| Fingertip | Header right | 1–3 primary buttons max |
| Work | Center | Lists, timelines, detail |
| Context | Below header or inline | Vertical insights, proposals (only when relevant) |
| Deep | Drawer / secondary route | Audit, billing, integrations |

## Surface-adaptive zones

On **phone**, Work is single column; Context collapses into stack push or bottom sheet.  
On **tablet**, Work + Context may split 50/50 (inbox, proof desk).  
On **desktop**, optional third **rail** for entity detail.

Breakpoints and module morph: [`SURFACE-AND-BREAKPOINTS.md`](./SURFACE-AND-BREAKPOINTS.md).

## Static vs dynamic

- **Static**: nav shell, typography, spacing tokens, brand gradient on Home ritual only.
- **Dynamic**: proposal strip, My Day timeline, inbox thread, vertical modules (`VerticalHomeModules`), persona briefing.

## Vertical tone

Use `verticalToneClass(vertical)` for subtle background accents — calm for medspa/allied-health, warm for pets, studio for body-art.

## Founder / internal

`livia-internal` → **Founder cockpit** tab: platform health, gate status, support queue count. Dashboard does not duplicate full ops — link out when `INTERNAL_OPS_SECRET` is configured locally.

## Definition of done (UX)

- Page uses `OperationalPageShell` or equivalent frame + ritual header.
- Mutations invalidate operational queries.
- No dead buttons (truth audit).
- Primary action obvious within 2 seconds of landing.
