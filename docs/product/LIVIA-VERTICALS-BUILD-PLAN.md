# Livia verticals — final build plan (cross-vertical)

**Status:** canonical execution plan (2026-06-01)  
**Supersedes:** ad-hoc vertical notes in chat; **does not** replace [`LIVIA-FINAL-BUILD-PLAN.md`](./LIVIA-FINAL-BUILD-PLAN.md) platform locks.  
**Index:** [`VERTICAL-PROGRAMS-INDEX.md`](./VERTICAL-PROGRAMS-INDEX.md)  
**Progress:** [`LIVIA-STATUS.md`](../LIVIA-STATUS.md)

---

## 1. Objective

Every **code vertical** reaches the same bar: founder can demo **web + mobile** with honest tier labels, preset parity (web-first), live demo world, and doc propagation that **fails CI** when spokes drift.

---

## 2. Definition of done (all code verticals)

| # | Criterion | Verify |
|---|-----------|--------|
| 1 | Program doc L0–L8 complete | Per-vertical `*-VERTICAL-PROGRAM.md` |
| 2 | Playbook links program | `vertical-playbooks/{v}.md` |
| 3 | Demo slug live + depth | `POST /demo/sync-vertical-showcase` |
| 4 | Wedge interstitial | `/demo/wedge/{vertical}` |
| 5 | `/b` book ≤90s | Founder UAT or `public-booking-quality` |
| 6 | Owner ritual home density | Contextual modules only |
| 7 | Presets: 4 natives + platform-default in policy | `pnpm vertical:check` |
| 8 | W4 preset CSS + settings iframe | Staging visual |
| 9 | Mobile: vocabulary + accent/preset tint | Mobile owner path |
| 10 | Doc propagation | `pnpm vertical:doc-check` |
| 11 | P0 PNGs captured or queued honestly | `pnpm screen-cards:status` |

**Heartland (hair, beauty)** also require: founder sign-off row in [`FOUNDER-UAT-CHECKLIST.md`](../operations/FOUNDER-UAT-CHECKLIST.md).

---

## 3. Phased execution

### Phase V0 — Documentation spine ✅ (2026-06-01)

- [x] `VERTICAL-PROGRAMS-INDEX.md`
- [x] Nine `*-VERTICAL-PROGRAM.md` files
- [x] `PARTNER-AND-ADJACENT-VERTICALS.md`
- [x] `DOC-PROPAGATION-CASCADE.md` + `vertical:doc-check`
- [x] This build plan

### Phase V1 — Heartland proof (current)

| Vertical | Priority tasks |
|----------|----------------|
| **Beauty** | Founder Bloom UAT; preset CSS polish; capture queue PNGs |
| **Hair** | Registry `demoSlug`; warm-chair targets; Luxe UAT sign-off |

**Exit:** Both heartland rows checked in founder UAT.

### Phase V2 — Beta-full vertical parity

For: wellness, body-art, fitness, medspa, allied-health, pet-grooming, automotive-detailing.

| Workstream | Deliverable |
|------------|-------------|
| Presets | `.target.png` per [`VERTICAL-TARGET-MOCK-PROGRAM.md`](../design/VERTICAL-TARGET-MOCK-PROGRAM.md) |
| Demo depth | Hero artifact per [`PER-VERTICAL-DEMO-SEED.md`](./PER-VERTICAL-DEMO-SEED.md) |
| Vertical routes | `/medspa`, `/design-proofs`, `/classes` where applicable |
| Founder smoke | 5-path mini UAT per program doc |
| E2E | Slug in `all-verticals-smoke` + vertical-specific spec |

**Exit:** Each beta-full program doc gaps § marked ✅ or explicitly deferred to R2 with date.

### Phase V3 — Partner honesty

- Dental, mental health: sales one-pagers only — no demo grid tile pretending full product.
- V11 adjacent: Calendly-parity messaging until Gate 2.

### Phase V4 — Ring 2 expansion (doc-first)

Mobile operator, event vendors, corporate wellness — spec in manifesto; **no enum** until V2 exits.

### Phase V5 — Production gates

- `LIVIA_PRESENTATION_PRESETS` prod flag
- Tighten `maxDiffPixelRatio` post sign-off
- Gate 2 field evidence (`pnpm smoke:gate2`)

---

## 4. Per-vertical priority (engineering queue)

| Order | Vertical | Why now |
|-------|----------|---------|
| 1 | beauty | Active founder test |
| 2 | hair | Heartland + IE wedge |
| 3 | medspa | Consent complexity template for clinical-adjacent |
| 4 | body-art | Proof guest surface differentiator |
| 5 | fitness | Waitlist + classes |
| 6 | pet-grooming | Pet-scoped model |
| 7 | wellness | Packages + DK market |
| 8 | allied-health | Plan cadence |
| 9 | automotive-detailing | Vehicle continuity |

---

## 5. What we are not doing in V1–V2

- Full mobile light-mode preset morph (web is source of truth)
- Dental / mental health code verticals without partner
- Marketplace discovery (Bet 6) — separate program
- Custom domain on `/b` — R∞
- AI treatment / design generation — prohibited category-wide

---

## 6. Agent instruction

When assigned a vertical task:

1. Open that vertical’s **program doc** — not build-plan v2 alone.  
2. Implement smallest hub-ward diff.  
3. Update program § gaps + changelog.  
4. Run `pnpm vertical:check` and `pnpm vertical:doc-check`.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial cross-vertical build plan |
