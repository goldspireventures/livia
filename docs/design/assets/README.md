# Design assets — folder map

**Start here.** Every PNG has a **world**, **role**, and **suffix** so paths stay predictable when we add more verticals.

---

## Top-level layout

```
docs/design/assets/
├── README.md                 ← you are here
├── w1-marketing/             W1 — livia-hq.com (platform, fixed)
├── w2-gateway/               W2 — sign-in, sign-up, /demo (platform, fixed)
├── w3-internal/              W3 — ops support + exec (platform, fixed)
├── w4-tenant/                W4 — operator cockpit per vertical + preset
├── w5-public/                W5 — guest /b per vertical
├── evolution/                Mood boards by release tier (northstar | now | v3)
├── captures/                 Automated screenshots (Playwright), not design targets
├── explorations/             Discarded or alternate concepts — not build targets
└── livia-evolution/          Legacy path — mirrored to evolution/; do not add new files here
```

| Folder | World | Skin feeds other routes? |
|--------|-------|---------------------------|
| `w2-gateway/demo/` | W2 | **No** — `/demo` only (`g1-wedge-web`) |
| `w2-gateway/sign-in/` | W2 | **No** — gateway shell; may *preview* tenant preset after identify (see below) |
| `w4-tenant/{vertical}/presets/` | W4 | **Yes** — entire tenant app + W5 `/b` via same preset + brand |
| `w5-public/{vertical}/presets/` | W5 `/b` guest book | Same preset + brand as W4 (see `w5-public/beauty/`) |
| `evolution/` | Reference | Composition/density targets — **not** tenant-selectable skins |
| `screen-cards/` (→ `captures/` later) | QA | Playwright baselines today at `assets/screen-cards/` |

---

## File naming convention

```
{world}-{context}-{surface}-{persona?}.{kind}.png
```

| Part | Examples |
|------|----------|
| **world** | `w2-gateway`, `w4-beauty`, `w5-beauty` |
| **context** | `demo`, `preset-soft-studio`, `preset-premium-dark` |
| **surface** | `dashboard`, `inbox`, `book`, `g1-wedge` |
| **persona** | `owner-solo`, `manager`, `staff` (omit if N/A) |
| **kind** | `.target` = founder-approved build goal · `.sample` = pick one · `.capture` = automated |

**Examples**

| File | Meaning |
|------|---------|
| `w2-gateway/demo/g1-wedge-web.target.png` | `/demo` launcher — platform Aurora gateway |
| `w4-tenant/beauty/presets/soft-studio/web/dashboard-owner-solo.target.png` | (legacy: may be flat path without `web/`) |

Screen-card YAML ids (`w4.ops.inbox.web`) still map 1:1 — targets live under `w4-tenant/{vertical}/targets/` or preset folders as we migrate.

---

## All verticals — target mocks (in progress)

**Program:** [`VERTICAL-TARGET-MOCK-PROGRAM.md`](../VERTICAL-TARGET-MOCK-PROGRAM.md)

```
w4-tenant/{vertical}/presets/{cssPreset}/
  web/*.sample.png          ← desktop 1440
  mobile/*.sample.png       ← phone 390

w5-public/{vertical}/presets/{cssPreset}/
  mobile/book-mobile.sample.png
  mobile/{intake|proof|visit}-mobile.sample.png   ← when vertical needs it
```

After review: delete rejects → rename `*.sample.png` → `*.target.png`

`node scripts/organize-vertical-target-mocks.mjs` — scaffold + copy from Cursor `assets/`

---

## Beauty & nails — approved targets (founder)

| Preset | Mode | Status | Path |
|--------|------|--------|------|
| **Soft Studio** | Light | ✅ approved | `w4-tenant/beauty/presets/soft-studio/` |
| **Editorial** | Light | ✅ approved | `w4-tenant/beauty/presets/editorial/` |
| **Premium Dark** (Bloom) | Dark | ✅ approved | `w4-tenant/beauty/presets/premium-dark/` |
| **4th dark** | Dark | 🔄 pick 1 of 3 | `w4-tenant/beauty/presets/_candidates/` |

Drop founder-approved PNGs into preset folders as:

- `dashboard-owner-solo.target.png`
- `dashboard-manager.target.png`

(Same layout applies to inbox, bookings, etc. — add files as we lock each surface.)

**Policy ids:** `beauty-noir-dusk` (default), `beauty-soft-studio`, `beauty-editorial`, `beauty-premium-dark`, plus `platform-default`.

---

## What is NOT mixed

- **`g1-wedge-web`** → **`/demo` only** — does not skin `/dashboard`, `/sign-in`, or `/b`.
- **Evolution `northstar/`** → guidance for composition — tenant build uses **preset targets** under `w4-tenant/`.
- **`captures/screen-cards/`** → current app pixels — replace with `.target` files when built.

---

## Commands

```bash
node scripts/organize-design-assets.mjs   # create folders, sync evolution mirror, copy candidates
pnpm screen-cards:status                  # YAML vs capture PNGs
```

---

## Docs

- [`LIVIA-TARGET-VISUALS.md`](../LIVIA-TARGET-VISUALS.md) — skin flow, adaptive sign-in, demo → tenant handoff
- [`SKIN-BRAND-INHERITANCE-SPEC.md`](../SKIN-BRAND-INHERITANCE-SPEC.md) — W1–W6 rules
- [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](../VISUAL-INHERITANCE-AND-BRAND-LOCKS.md) — anchors per family
