# Gateway surface program — demo & sign-in

**Status:** canonical (2026-05-30)  
**Artifact:** `artifacts/livia-dashboard` routes `/demo`, `/sign-in`, `/sign-up`  
**Visual anchor:** [`assets/livia-evolution/northstar/g1-wedge-web.png`](./assets/livia-evolution/northstar/g1-wedge-web.png)  
**Founder lock:** **G1-A Wedge story** — grid → per-wedge interstitial → enter demo  
**Reads with:** [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](./VISUAL-INHERITANCE-AND-BRAND-LOCKS.md) · [`PLATFORM-SURFACES-BUILD-SPEC.md`](./PLATFORM-SURFACES-BUILD-SPEC.md) §2

---

## 1. What the gateway is

**Job:** Bridge **marketing narrative** → **real product** without overwhelming prospects.

| Surface | Who | Job |
|---------|-----|-----|
| **Demo launcher** | Curious prospect | Pick trade → see *their* story → enter seeded tenant |
| **Sign-in / sign-up** | Ready prospect | Clerk auth → legal → onboarding |
| **Exec handoff** | `@livia-hq.com` | Redirect to internal ops (not marketing) |

**Skin:** W2 Gateway aurora — extends W1 marketing tokens; still Livia Inc, not tenant preset.

---

## 2. Visual anchor — northstar wedge grid

The north-star wedge PNG defines for **all gateway pages**:

| Element | Spec |
|---------|------|
| **Layout** | Dark aurora; trade cards with photo/thumbnail halos |
| **Copy** | “Pick your world” — vertical identity first |
| **Density** | Clear grid; no settings, no Liv prompt editor, no internal ops |
| **CTA** | One primary path: select wedge → story → enter demo |

Sign-in/sign-up inherit same ink, serif headlines, aurora wash — centered Clerk, no third theme.

---

## 3. G1-A flow (locked)

```text
/demo
  → tile click → /demo/wedge/:vertical
  → 3–4 beat interstitial (trade-specific)
  → Enter demo → Clerk ticket → pre-seeded tenant (demoSlug)
```

| Step | Route | Content rule |
|------|-------|--------------|
| 1 Grid | `/demo` | Wedges from `VERTICAL_COVERAGE_REGISTRY` (tier ≠ defer) |
| 2 Story | `/demo/wedge/:vertical` | **Interstitial only** — see §4 |
| 3 Enter | action | Policy-driven demo slug + persona hints |

**Reference visual (clarity standard):** [`gateway-demo-a-wedge-story-tattoo.png`](./assets/platform-surfaces/gateway-demo-a-wedge-story-tattoo.png)

**Query shortcuts:** `/demo?vertical=body-art` skips grid if valid. Marketing M5 → `/demo/wedge/:vertical`.

---

## 4. Wedge interstitial rules — all verticals

**Founder direction (2026-05-30):** Each wedge is **unique in story** but **equal in clarity**. Body-art/tattoo is the pacing reference. Do **not** cram a full continuity timeline onto one interstitial (hair regression).

### 4.1 Universal template

| Beat # | Structure | Per vertical |
|--------|-----------|--------------|
| 1 | One sentence + one UI crop | Trade-specific “aha” |
| 2 | One sentence + one UI crop | Second beat |
| 3 | One sentence + one UI crop | Third beat |
| 4 (optional) | One sentence + one UI crop | Day-of or rebook |
| CTA | **Enter demo** | Same placement every wedge |

**Max:** 4 beats. **Never:** full product tour, settings, billing, internal ops.

### 4.2 Per-wedge content (policy)

**Build:** `lib/policy/src/wedge-demo-stories.ts` (Track F3). Source slugs: `vertical-coverage.ts`.

| Vertical | Beat 1 | Beat 2 | Beat 3 | Beat 4 |
|----------|--------|--------|--------|--------|
| **body-art** | Consult lands in **Inbox** | **Design proof** link on booking | **Deposit** holds session | **Today** — session list |
| **hair** | Instagram DM → **Inbox** | Client **books** from your link | **Reminder** SMS before visit | **Today** — who's next |
| **beauty** | Inquiry in **Inbox** | **Book** + patch test note | **Reminder** | **Today** |
| **medspa** | Consult request | **Consent** step on book | **Reminder** | **Today** |
| **wellness** | Guest message | **Book** treatment | **Reminder** | **Today** |
| **fitness** | Class inquiry | **Book** / waitlist | **Reminder** | **Today** |
| **allied-health** | Intake message | **Book** appointment | **Reminder** + prep note | **Today** |
| **pet-grooming** | Pet parent inquiry | **Book** + pet profile | **Reminder** | **Today** |
| **automotive-detailing** | Vehicle / slot inquiry | **Book** detail session | **Reminder** | **Today** |

**Registry:** All `VERTICAL_COVERAGE_REGISTRY` entries with `tier ≠ defer` appear in demo grid. `partner-only` (dental, mental health) uses `nearestPack` + honest preview badge when shown.

Each beat = **one cropped screenshot hint** (inbox row, `/b` hero, SMS notification mock, Today card) — not six features on one panel.

### 4.3 Retired pattern — hair continuity timeline

[`gateway-demo-c-continuity-hair.png`](./assets/platform-surfaces/gateway-demo-c-continuity-hair.png) was an **alternate G1-C timeline concept**. It is **not** the hair wedge interstitial. Hair uses **G1-A interstitial** with the beats above — same **layout shell** as tattoo, different copy/crops.

---

## 5. Gateway page inheritance

| Route | Inherits from wedge anchor |
|-------|----------------------------|
| `/demo` | Grid density, card halos, aurora |
| `/demo/wedge/:vertical` | Interstitial shell (tattoo layout); content from policy |
| `/sign-in`, `/sign-up` | Gateway aurora wash; Aurum logo; link back to marketing |
| `/legal-acceptance` | Same gateway family |

Mobile: [`northstar/g1-wedge-mobile.png`](./assets/livia-evolution/northstar/g1-wedge-mobile.png) — full-bleed cards, same flow.

---

## 6. Programmatic coupling

| Concern | Module |
|---------|--------|
| Wedge list | `VERTICAL_COVERAGE_REGISTRY` |
| Story steps | `wedge-demo-stories.ts` |
| Demo seed | demo provision + `demoSlug` |
| Sign-up vertical | query → `POST /businesses` vertical field |
| API gates | `wedge-api-gate.ts` |

Demo entry must match **same vertical** as story — no bait-and-switch slug.

---

## 7. Release alignment

| Release | Gateway |
|---------|---------|
| **R1** | G1-A grid + interstitial + policy stories; sign-in token pass |
| **R2** | All tier-1 wedge stories; mobile full-bleed |
| **R3** | Marketing ↔ demo ↔ onboard E2E verified headless |

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Gateway program; hair wedge clarity; tattoo as interstitial standard |
