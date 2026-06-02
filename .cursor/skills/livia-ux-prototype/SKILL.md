---
name: livia-ux-prototype
description: >-
  Explore Livia UI ideas in Cursor Canvas or localhost previews before
  implementing in product code. Use when the user wants to see what it looks
  like, drop a visual, mockup, fade, concept A/B, or vision before building.
---

# Livia UX prototype

## Default order

1. **Understand intent** — one sentence back to user (layout, motion, density).
2. **Prototype** — prefer **Cursor Canvas** (`.canvas.tsx`) for interactive before/after (toggle fade, variants).
3. **Optional** — localhost preview routes under `artifacts/livia-dashboard` (e.g. `/experience/platform-surfaces`) when comparing to existing northstar gallery.
4. **User picks** A/B/C — only then implement in production components.

## Do not

- Ship large visual changes without explicit approval after prototype.
- Generate non-reproducible "hero" art that cannot be built with design tokens + existing components.
- Break [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](../../docs/design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md).

## Buildable scope

- CSS masks, gradients, layout, motion via tokens.
- Reuse `@workspace/ui` / dashboard primitives — match repo stack (React, not random Tailwind dumps from other projects).

## After approval

1. Implement minimal diff in correct artifact.
2. Update screen card or `*.target.png` only when founder locks visual.
3. `pnpm run typecheck`.

## Canvas skill

Load Cursor **canvas** skill when authoring `.canvas.tsx` files.

## Related

[`livia-gateway-parity`](../livia-gateway-parity/SKILL.md) for locked gateway PNGs.
