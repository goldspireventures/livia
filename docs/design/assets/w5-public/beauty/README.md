# W5 — Public `/b` · beauty & nails

**Route:** `/b/{slug}` (mobile-first, no Clerk)  
**Inherits:** same `presentation_preset_id` + brand as W4 — see [`../../LIVIA-TARGET-VISUALS.md`](../../LIVIA-TARGET-VISUALS.md)

## What `/b` is on Livia

| Job | On screen |
|-----|-----------|
| **Showcase** | Logo, cover, business name — link-in-bio replacement |
| **Convert** | Service menu → slot → details → confirm (no account) |
| **Trust** | Policy footer, Liv disclosure, vertical language |
| **Continuity** | SMS/WhatsApp links land here; same skin as owner picked in Settings |

**Not:** tenant dashboard, not Livia marketing, not demo wedge. **Business brand forward** — Liv is assistant, not hero wordmark.

## Beauty book step (P0 target)

**Surface:** service catalog (step 1) — hero + grid + Liv bar.

| Preset | Target PNG |
|--------|------------|
| noir-dusk | `presets/noir-dusk/book-mobile.target.png` |
| soft-studio | `presets/soft-studio/book-mobile.target.png` |
| editorial | `presets/editorial/book-mobile.target.png` |
| premium-dark | `presets/premium-dark/book-mobile.target.png` |

Sync: `node scripts/organize-beauty-target-visuals.mjs`

## Same IA, four chromes

Layout is identical across presets (services grid, sticky Liv/Book, footer). Only `data-presentation` tokens + owner logo/cover change.
