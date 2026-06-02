# Platform Default — Constellation skin (locked)

**Preset id:** `platform-default` (`PLATFORM_DEFAULT_PRESET_ID`)  
**Inherits from:** W1 M4 Constellation marketing (`docs/design/assets/w1-marketing/home/`)

## Locked targets

| Surface | File |
|---------|------|
| Owner dashboard | `web/owner-dashboard.target.png` |
| Inbox thread | `web/inbox-thread.target.png` |

## Inheritance rules (marketing → product)

| Marketing (full) | Product (ambient) |
|------------------|-------------------|
| Orbital hero diagram | Watermark SVG ~10% opacity behind main |
| Starfield | Sparse 1px dots in shell background |
| Nebula | Top-right corner haze only |
| Champagne `#d9c39a` | Primary token, Liv briefing edge, active nav star |
| Ink `#0a0a10` | Shell background |

## Code

| Layer | Path |
|-------|------|
| Policy preset | `lib/policy/src/presentation-presets.ts` |
| CSS bundle | `artifacts/livia-dashboard/src/styles/platform-default-constellation.css` |
| Ambient layer | `artifacts/livia-dashboard/src/components/layout/platform-default-ambient.tsx` |
| Shell wiring | `artifacts/livia-dashboard/src/components/layout/app-layout.tsx` |

Vertical-native presets (Noir Dusk, Warm Chair, etc.) are unchanged — only **Platform Default** uses Constellation.
