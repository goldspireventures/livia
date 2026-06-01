# Vertical target mock program

**Beauty:** ✅ founder review complete — `w4-tenant/beauty/`, `w5-public/beauty/`

**Other verticals:** generate `.sample.png` → founder deletes rejects → rename survivors to `.target.png`

## Folder layout (all verticals)

```
w4-tenant/{vertical}/presets/{cssPreset}/
  web/dashboard-owner-solo.sample.png
  web/settings-appearance-owner.sample.png
  mobile/dashboard-owner-solo.sample.png          # 390×844
  web/{extra}.sample.png                          # vertical-specific only

w5-public/{vertical}/presets/{cssPreset}/
  mobile/book-mobile.sample.png                   # /b service catalog
  mobile/{extra}.sample.png                       # intake, proof, visit…
```

| Platform | Viewport | Use |
|----------|----------|-----|
| `web` | 1440×900 | Operator cockpit desktop |
| `mobile` | 390×844 | Operator + guest phone |

## Per vertical — presets (policy) + extra surfaces

| Vertical | Default preset | Alt presets | W4 extras (default preset) | W5 extras |
|----------|----------------|-------------|----------------------------|-----------|
| hair | `warm-chair` | clean-salon, barber-bold | — | book |
| beauty | `noir-dusk` | soft-studio, editorial, premium-dark | (done) | (done) |
| body-art | `studio-dark` | flash-light, minimal-mono | **design-proofs** | **proof** (guest approve) |
| wellness | `spa-calm` | zen-light, retreat-dark | — | book, **visit** |
| fitness | `gym-bold` | studio-clean, coach-compact | **classes** | book |
| medspa | `clinical-calm` | luxury-serif, minimal-consent | **medspa-hub** | book, **intake** |
| allied-health | `allied-clinic-standard` | rehab-focused, telehealth | — | book |
| pet-grooming | `playful-paw` | clean-groom, mobile-van | — | book |
| automotive-detailing | `bay-industrial` | showroom-light, compact-mobile | — | book |

Sync script: `node scripts/organize-vertical-target-mocks.mjs`
