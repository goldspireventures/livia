---
name: livia-gateway-parity
description: >-
  Implement or verify W2 gateway screens (G1 demo grid, G2 wedge story, G3 role
  enter, sign-in) against locked target PNGs and screen-card registry. Use for
  gateway, w2-gateway, demo flow, g1 g2 g3, wedge story, sign-in mock, or
  target.png parity.
---

# Livia gateway parity

## Locked flow

```text
G1  /demo                 → g1-wedge-web.target.png
G2  /demo/wedge/:vertical → g2-wedge-story.target.png
G3  role enter (beat 4)   → g3-demo-enter.target.png
    sign-in web/mobile    → gateway-default*.target.png
```

Authority: [`docs/design/assets/w2-gateway/demo/DEMO-FLOW.md`](../../docs/design/assets/w2-gateway/demo/DEMO-FLOW.md) · [`GATEWAY-SURFACE-PROGRAM.md`](../../docs/design/GATEWAY-SURFACE-PROGRAM.md)

## Parity checklist

| ID | Route | Target | Verify |
|----|-------|--------|--------|
| G-DEMO-1 | `/demo` | `g1-wedge-web.target.png` | Grid "Pick your world"; beauty unlocked |
| G-DEMO-2 | `/demo/wedge/:vertical` | `g2-wedge-story.target.png` | Fused card-stage beats 1–4 |
| G-DEMO-3 | Beat 4 roles | `g3-demo-enter.target.png` | Role grid in card; tap → Clerk ticket (no separate Enter button) |
| G-SIGN-1 | `/sign-in` | `gateway-default.target.png` | Liv colleague split layout |
| G-SIGN-2 | Mobile sign-in | `gateway-default-mobile.target.png` | Stacked story + Clerk |

Beauty program tasks: [`BEAUTY-VERTICAL-PROGRAM.md`](../../docs/product/BEAUTY-VERTICAL-PROGRAM.md) § G-DEMO / G-SIGN.

## Screen cards (do not duplicate PNGs)

Registry YAML under `docs/design/screen-cards/w2.gateway.*.yaml` — `northstarRealPath` points at `docs/design/assets/w2-gateway/`.

## Implementation rules (G2/G3)

- **Do** carry vertical label + beat hook from G1 card click.
- **Do** inherit left gateway rail + aurora wash per DEMO-FLOW inheritance table.
- **Do not** show settings, billing, Liv editor, or full product tour on G2/G3.

## Verify

1. Side-by-side: implementation vs `.target.png`.
2. `pnpm screen-cards:status` for registry drift.
3. Playwright screen-card tests when updating baselines: `pnpm screen-cards:update` (only when founder locks new PNG).

## Reference

[`reference.md`](reference.md) — asset paths and component hints.
