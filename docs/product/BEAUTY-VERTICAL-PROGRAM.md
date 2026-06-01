# Beauty vertical — platform program (V2)

**Status:** active completion track (2026-06-01)  
**Registry:** `VERTICAL_COVERAGE_REGISTRY` V2 · **heartland** tier  
**Canonical demo:** `bloom-beauty-dublin` · owner `owner-bloom@demo.livia-hq.com` (legacy `owner-bloom@livia.io`) · default preset **`beauty-noir-dusk`** (P0 dark mock — not flat black; atmospheric charcoal per target)  
**Reads with:** [`vertical-playbooks/beauty.md`](./vertical-playbooks/beauty.md) · [`EXPERIENCE-ARCHITECTURE.md`](../design/EXPERIENCE-ARCHITECTURE.md) · [`assets/w4-tenant/beauty/README.md`](../design/assets/w4-tenant/beauty/README.md)  
**Doc propagation:** [`DOC-PROPAGATION-CASCADE.md`](../engineering/DOC-PROPAGATION-CASCADE.md) — `pnpm vertical:doc-check` must pass when this file or beauty spokes change.

---

## L0 — What Livia means for beauty (category)

Beauty & nails on Livia is a **people-business OS**, not a salon clone or medspa EHR.

| Principle | Beauty expression |
|-----------|-------------------|
| **Category** | Short stacked services, fill cycles, patch-test discipline, retail attach (R2) — see [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md) |
| **Liv's job** | Triage DMs, confirm bookings, reminders, rebook windows — **no** diagnosis or treatment advice |
| **Brand forward** | Client sees **Bloom**, not Livia, on `/b` and SMS |
| **Not** | Clinical consent stack (that's medspa V6); hair colour formulas as first-class objects (that's hair V1) |

**One sentence:** *Livia is the calm back office + link-in-bio booking engine for lash, nail, and brow studios — inbox-first when clients message, `/b` when they're ready to book.*

### Wow — operator

| Moment | Why it lands |
|--------|----------------|
| **Inbox-first home** | DM → thread → book without losing lash context |
| **Four studio skins** | Noir / soft / editorial / premium — real preset morph on web |
| **Patch-test discipline** | Guard on `/b` — policy without paper clipboard |
| **Settings → live `/b` iframe** | What you pick is what guests see |

### Wow — guest (P7)

| Moment | Why it lands |
|--------|----------------|
| **Link-in-bio quality** | Matches 2026 beauty app expectations: fast book, secure pay, reminders |
| **Patch-test question** | Serious studio signal — trust |
| **Visit token** | Tomorrow’s appointment — branded, calm |
| **No account wall** | Book as guest — continuity via SMS |

*Research note:* 2026 beauty clients expect mobile self-serve, deposits, personalized reminders, and real-time availability — Livia delivers via `/b` + continuity, not a bolt-on widget.

**Index:** [`VERTICAL-PROGRAMS-INDEX.md`](./VERTICAL-PROGRAMS-INDEX.md)

---

## L1 — Platform capability (vertical pack)

Policy hub: `lib/policy` · API: `tenant-experience`, guards, vocabulary · Surfaces: thin renderers.

| Layer | Artifact | Beauty status |
|-------|----------|-----------------|
| Enum + defaults | `verticals.ts`, `vertical-onboarding.ts` | ✅ |
| Vocabulary | `vocabulary.ts` — client, therapist, station, studio | ✅ |
| Booking guards | `booking-guards.ts` — `patch_test` select on `/b` + internal book | ✅ |
| Guest surfaces | `guest-surfaces.ts` — storefront + visit | ✅ |
| Continuity SMS | `continuity-templates.ts` (inherits hair-shaped confirm/remind) | ✅ |
| Liv mandate | `liv-mandate.ts` R2 / trust 45 | ✅ |
| Wedge story | `wedge-demo-stories.ts` — inbox → book → SMS → today | ✅ |
| Wedge gate | `wedge-gate.ts` — beauty in G1 set with hair | ✅ |
| Coverage registry | `vertical-coverage.ts` V2 heartland | ✅ |
| Playbook L2+L3 | [`vertical-playbooks/beauty.md`](./vertical-playbooks/beauty.md) | ✅ |
| Public flow doc | [`public-flows/beauty-booking-flow.md`](./public-flows/beauty-booking-flow.md) | ✅ |

**Gaps (L1):**

- [ ] Service-level “requires patch test” flag (guard is vertical-wide today; playbook mentions badge on colour services only)
- [ ] Fill-cycle / rebook window copy in continuity templates (beauty-specific, not hair inheritance)

---

## L2 — Presentation + brand (Track D)

Four native presets + Platform Default (signup lock). Policy: `presentation-presets.ts`.

| Preset id | `cssPreset` | Default? | W4 targets | W5 `/b` target |
|-----------|-------------|----------|------------|----------------|
| `beauty-noir-dusk` | `noir-dusk` | ✅ | owner solo, settings | `book-mobile.target.png` |
| `beauty-soft-studio` | `soft-studio` | | owner + manager, settings | ✅ |
| `beauty-editorial` | `editorial` | | owner + manager, settings | ✅ |
| `beauty-premium-dark` | `premium-dark` | | owner + manager, settings | ✅ |

| Item | Status |
|------|--------|
| `data-presentation` CSS (web) | ✅ `index.css` + `styles/beauty-presentation.css` (noir-dusk atmospheric shell) |
| Single shop skin (W4 + `/b`, no split) | ✅ [`SKIN-BRAND-INHERITANCE-SPEC.md`](../design/SKIN-BRAND-INHERITANCE-SPEC.md) §4.4 |
| Settings picker + live `/b` iframe preview | ✅ `public-appearance-panel.tsx` |
| `/b` reads `experienceSkin.presentation` | ✅ `public.ts` + `public-booking.tsx` |
| Dashboard applies `tenant-experience.presentation` | ✅ `app-layout.tsx` |
| Demo backfill preset on branding | ✅ `demo-public-assets.ts` |
| Adaptive sign-in preview | ✅ `sign-in-appearance-hint` API + panel |
| Mobile preset morph (full) | ✅ owner Today + public `/b` per preset; tenant tabs use preset tint |
| Production preset flag | ⏳ founder Bucket C + `LIVIA_PRESENTATION_PRESETS` |

**Gaps (L2):**

- [ ] Tighten P0 pixel ratios after founder sign-off (`northstar-p0-registry.ts`)
- [ ] `noir-dusk` manager dashboard target (optional; owner solo is P0)
- [ ] Platform Default beauty demo card (D7.2) — only if founder wants Aurora on Bloom

---

## L3 — Persona rituals (owner / manager / staff / reception)

| Persona | Beauty “home” | Status |
|---------|---------------|--------|
| **Owner** | Ritual dashboard — briefing, contextual KPIs, inbox OR pending focus | ✅ `owner-home-ritual.tsx` + `tenant-surface-density.ts` |
| **Manager** | Approvals + floor; preset targets exist | 🟡 UAT uses Luxe (hair); use Bloom for beauty manager pass |
| **Staff** | My day / chair | ✅ shared pack; P0 mobile baseline uses Luxe slug |
| **Receptionist** | Bookings + inbox | ✅ shared |

**Gaps (L3):**

- [ ] Dedicated founder UAT row for **Bloom owner** (was missing; added in `FOUNDER-UAT-CHECKLIST.md`)
- [ ] Manager home density sign-off on `bloom-beauty-dublin` with `beauty-soft-studio` or `editorial`

---

## L4 — Surfaces (W2 → W5)

### W2 Gateway

| Surface | Beauty | Status |
|---------|--------|--------|
| Demo wedge | `/demo/wedge/beauty` | ✅ story + P0 PNG |
| Sign-in | Adaptive hint for owner emails | ✅ |
| Onboarding | Vertical pick includes beauty | ✅ |

### W4 Tenant (web)

| Route / screen | Bloom in P0/P1 | Status |
|----------------|----------------|--------|
| `/dashboard` | P0 northstar | ✅ |
| `/inbox` | P0 | ✅ |
| `/settings` (appearance) | P0 | ✅ |
| `/bookings`, `/bookings/new` | P0 | ✅ |
| `/customers`, `/services`, `/staff` | Capture queue | 🟡 density done; PNG queue |
| `/toolkit` | Shared | ✅ |
| `/franchise` | Queue slug Bloom | ⚠️ only if franchise capability on — verify gate |
| `/medspa`, `/design-proofs` | N/A (wrong vertical) | — |

### W4 Mobile (operator)

| Item | Status |
|------|--------|
| Vertical shortcuts (inbox + Liv) | ✅ `VerticalHomeShortcuts.tsx` |
| Tenant vocabulary via API | ✅ |
| Presentation card + “edit on web” | ✅ |
| Preset color tint from `cssPreset` | ✅ (2026-06-01) |
| Full preset parity with web | ✅ R1 (2026-06-01 build); pixel gates post UAT |

### W5 Public `/b`

| Step | Status |
|------|--------|
| Storefront + service catalog | ✅ |
| Patch-test guard block | ✅ (vertical-level) |
| Visit token | ✅ route; capture queue uses other slugs — add Bloom visit demo |
| Pay / intake | N/A for beauty |

**Gaps (L4):**

- [ ] Screen-card PNGs: customers, services, staff on Bloom
- [ ] `w5.public.visit.mobile` baseline with `bloom-beauty-dublin` token
- [ ] Marketing `/verticals/beauty` copy audit (no hair-only patch-test bleed)

---

## L5 — Demo world + founder test

| Item | Status |
|------|--------|
| Seed shop Bloom | ✅ `demo-vertical-shops.seed.ts` — 5 services, 3 staff |
| Live day + inbox depth | ✅ showcase depth helpers |
| Demo login `owner-bloom@livia.io` | ✅ |
| `DEMO-LOGINS.md` | ✅ (luxe corrected to **hair**) |
| Founder UAT **Bloom beauty** section | ✅ checklist |
| E2E `founder-uat-p0` | 🟡 medspa + luxe only — add bloom project or manual UAT |

**Test path (founder):**

1. Demo launcher → Bloom owner **or** `owner-bloom@livia.io`
2. Confirm default skin **Noir Dusk** (or pick each preset in Settings → Appearance)
3. `/b/bloom-beauty-dublin` on phone — book lash fill, complete patch-test guard
4. Mobile app same tenant — Today + Inbox + accent matches preset

---

## L6 — CI / quality gates

| Gate | Beauty anchor | Status |
|------|---------------|--------|
| `pnpm northstar:check` | Bloom dashboard, inbox, `/b` | ✅ |
| `screen-card-p0-pixel` | Bloom routes | ✅ |
| `all-verticals-smoke` | bloom slug | ✅ |
| Policy tests | presentation + registry | ✅ |
| Axe on P0 | founder-uat | ✅ |

---

## Completion definition (“beauty done” for R1 demo)

Founder can answer **yes** to all:

1. **Meaning:** Playbook + wedge story match how a real lash/nail studio runs.
2. **Look:** Four presets visibly different on **dashboard + `/b`**; Settings preview matches live `/b`.
3. **Operate:** Owner home feels calm (no CRUD wall); inbox + pending modules appear only with signal.
4. **Book:** Guest completes `/b` flow ≤90s with patch-test gate visible.
5. **Mobile:** Operator app shows correct vocabulary, accent, and preset label; web is source of truth for full morph.
6. **Sign-off:** Bloom row in [`FOUNDER-UAT-CHECKLIST.md`](../operations/FOUNDER-UAT-CHECKLIST.md) checked.

---

## Engineering queue (ordered)

| # | Task | Layer |
|---|------|-------|
| 1 | Founder UAT on Bloom (web + mobile) | L5 |
| 2 | Fix any preset/CSS drift found in UAT | L2 |
| 3 | Capture screen-card PNGs (customers, services, visit) | L4/L6 |
| 4 | Mobile preset tint polish if UAT flags mismatch | L4 |
| 5 | Service-level patch-test metadata (optional R1.1) | L1 |
| 6 | Tighten `maxDiffPixelRatio` post sign-off | L6 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial hierarchical program; Bloom UAT path; gap queue |
| 2026-06-01 | Full beauty build: 4 presets W4/W5, settings swatches, mobile owner + `/b` |
