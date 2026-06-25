# UX / visual punch list

**Generated:** 2026-06-24
**Sources:** `ux-quality-gate.spec.ts`, `e2e:full-visual-audit:web`, founder-checklist captures

## Summary

| Automated findings | 1 |
| Visual captures | Review `e2e/visual-captures/` |
| Founder backlog | [`FOUNDER-BACKLOG.md`](../company/FOUNDER-BACKLOG.md) |

## P0 — fix before partners

| Route | Kind | Owner hat | Detail |
|-------|------|-----------|--------|
| `/b/luxe-salon-spa` | axe | Design + Engineering | aria-prohibited-attr (serious): Elements must only use permitted ARIA attributes — <div class="min-h |

## P1 — wedge polish (human review checklist)

- [ ] **Owner Today:** briefing → moments → incidents order; no vertical scroll cliff
- [ ] **Manager Queue:** lens counts match list; empty lens copy clear
- [ ] **Inbox thread:** reply box visible without zoom; Liv assist not clipped
- [ ] **Settings → Comms:** session-expired vs connected states obvious
- [ ] **Public book:** service grid on mobile width; AI disclosure visible
- [ ] **Error surfaces:** toast vs inline; no raw stack traces

## P2 — forward-looking layout

- [ ] Long booking lists: virtualise or paginate (inbox, bookings, customers)
- [ ] Sticky headers on thread + floor views
- [ ] `min-h-0` / flex children on split panes (inbox master-detail)

## Re-run

```bash
pnpm dev:api & pnpm dev:dashboard &
pnpm e2e:full-visual-audit:web
pnpm --filter @workspace/e2e exec playwright test tests/ux-quality-gate.spec.ts
node scripts/ux-punch-list-from-findings.mjs
```
