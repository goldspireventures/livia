---
name: livia-liv-platform
description: >-
  Keep Liv AI and tenant copy policy-driven across web and mobile: no hardcoded
  salon wording, no duplicate briefings, no empty mobile tabs that only redirect
  to web. Use for Liv, Jarvis, tenant experience, vocabulary, briefing, open in
  web, or platform-wide copy tone.
---

# Livia Liv & platform copy

## Liv is not hardcoded

- Resolve nouns, hints, and surfaces from **`@workspace/policy`** and **`GET /api/me/tenant-experience`**.
- Do not duplicate vertical lists in UI; do not default UI to "salon" unless tenant is beauty/salon vocabulary.
- Same thread/context must not show **identical Liv messages** in multiple places (briefing top + Liv panel) without product reason.

## Copy tone

- Plain English, self-explanatory labels — not robotic ("not another report to decode").
- Concise briefing cards — avoid stacking duplicate "brief" blocks on one page.
- Accessible to non-native English readers without being childish.

## Mobile parity

| Anti-pattern | Do instead |
|--------------|------------|
| Whole tab = "Open in web" | Implement mobile slice **or** remove tab / inline link in context |
| "v1" placeholders in v3 product | Ship real flow or hide until ready |
| Static walls of text | Progressive disclosure, screen-native layout |

Audit: `pnpm mobile:parity-audit` · [`WEB-MOBILE-PARITY.md`](../../docs/product/WEB-MOBILE-PARITY.md)

## Premium motion (when styling)

[`PREMIUM-MOTION-LAYER.md`](../../docs/design/PREMIUM-MOTION-LAYER.md) — subtle pulse/glow; restraint per [`UI-UX-MASTER-PROGRAM.md`](../../docs/design/UI-UX-MASTER-PROGRAM.md).

## Code clarity

[`CODE-CLARITY-STANDARDS.md`](../../docs/engineering/CODE-CLARITY-STANDARDS.md) — naming, one-home modules for future internal dev + Atlas.

## Verify

- Grep changed surfaces for hardcoded vertical strings.
- Test owner + staff on **web and mobile** for the same tenant.
