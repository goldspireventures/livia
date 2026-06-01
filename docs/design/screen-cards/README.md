# Screen cards — L3 visual specifications

**Schema:** [`SCREEN-CARD-SCHEMA.md`](../SCREEN-CARD-SCHEMA.md)  
**Inventory:** [`VISUAL-SCREEN-MASTER-INVENTORY.md`](../VISUAL-SCREEN-MASTER-INVENTORY.md)  
**Figma:** [`FIGMA-SCREEN-MANIFEST.md`](../FIGMA-SCREEN-MANIFEST.md)

| Priority | Count | Status |
|----------|-------|--------|
| **P0** | 24 | ✅ complete (rich YAML) |
| **P1** | 48 | ✅ generated via `scripts/generate-p1-screen-cards.mjs` |
| **P2** | 60+ | 📋 backlog |

Regenerate P1: `node scripts/generate-p1-screen-cards.mjs`

## Per-screen northstar (PNG)

When there is no separate Figma northstar for a route, the **PNG under** [`assets/screen-cards/`](../assets/screen-cards/) **is** the visual baseline for that screen.

| Command | Purpose |
|---------|---------|
| `pnpm screen-cards:status` | YAML specs vs PNG baselines |
| `pnpm screen-cards:update` | Refresh P0 PNGs (API + dashboard + Clerk) |
| `pnpm northstar:check` | CI gate — registry PNGs exist |
| `pnpm --filter @workspace/e2e run test:screen-card-p0` | Pixel diff vs baselines |

Registry: `lib/policy/src/northstar-p0-registry.ts` (`SCREEN_CARD_P0`, `SCREEN_CARD_CAPTURE_QUEUE`).
