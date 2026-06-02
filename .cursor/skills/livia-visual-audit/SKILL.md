---
name: livia-visual-audit
description: >-
  Run Livia web and mobile visual audits, review screenshots against baselines,
  log findings in VISUAL-AUDIT-LOG.md, fix and re-verify. Use for visual audit,
  screenshot review, examine every screen, Maestro capture, triple check UX, or
  comprehensive UI pass.
---

# Livia visual audit

## Mandatory: log what you did

Append rows to [`docs/testing/VISUAL-AUDIT-LOG.md`](../../docs/testing/VISUAL-AUDIT-LOG.md):

| # | Screenshot / route | What we saw | Severity | Change | Verified |

Do **not** claim a visual pass without updating this log (user expectation from prior sessions).

## Workflow

1. **Stack** — Follow [`docs/testing/FULL-STACK-LOCAL-RUNBOOK.md`](../../docs/testing/FULL-STACK-LOCAL-RUNBOOK.md):
   - `pnpm e2e:prep`
   - `pnpm dev:api` · `pnpm dev:dashboard` · optional marketing :5174 · internal :5175
2. **Demo world** — `pnpm demo:provision` or repair if routes need seeded tenants.
3. **Capture web:**
   ```bash
   pnpm e2e:visual-audit:all:web
   ```
   Or narrower: `pnpm e2e:contextual-web` · `pnpm e2e:founder-checklist`
4. **Capture mobile (when requested):**
   ```bash
   pnpm maestro:visual-capture
   ```
   Windows setup: [`reference.md`](reference.md)
5. **Review** — Open captures under `e2e/visual-captures/` (gitignored). Check: layout order, visible text, broken buttons, scroll-to-top on route change, duplicate briefings, salon-only copy on non-beauty verticals.
6. **Baseline compare** — Gateway/screen cards: `docs/design/assets/**/**/*.target.png` and [`SCREEN-CARD-SCHEMA.md`](../../docs/design/SCREEN-CARD-SCHEMA.md).
7. **Fix P1 first** — a11y (`pnpm a11y:routes`), copy, layout; then P2.
8. **Re-verify** — Re-capture affected routes; mark **Verified** column Y/N.

## Severity guide

| Level | Examples |
|-------|----------|
| **P1** | Broken flow, misleading copy, missing labels, wrong API errors on screen |
| **P2** | Tone, spacing, non-blocking contrast |
| **—** | Expected demo chrome |

## Punch list

After large runs: `pnpm e2e:ux-punch-list` → [`UX-PUNCH-LIST.md`](../../docs/testing/UX-PUNCH-LIST.md) if present.

## Related

[`livia-gateway-parity`](../livia-gateway-parity/SKILL.md) · [`WEB-MOBILE-PARITY.md`](../../docs/product/WEB-MOBILE-PARITY.md)
