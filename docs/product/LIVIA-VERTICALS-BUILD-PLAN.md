# Livia verticals — final build plan (cross-vertical)

**Status:** canonical execution plan (2026-06-05)  
**GTM lock:** [`GTM-VERTICAL-DEPTH-PROGRAM.md`](./GTM-VERTICAL-DEPTH-PROGRAM.md) — all nine verticals, one exit checklist  
**Innovation:** [`VERTICAL-INNOVATION-PROGRAM.md`](./VERTICAL-INNOVATION-PROGRAM.md)  
**Index:** [`VERTICAL-PROGRAMS-INDEX.md`](./VERTICAL-PROGRAMS-INDEX.md)  
**Progress:** [`LIVIA-STATUS.md`](../LIVIA-STATUS.md)

---

## 1. Objective

Every **code vertical** reaches the **GTM Wave 1 package** ([`GTM-VERTICAL-DEPTH-PROGRAM.md`](./GTM-VERTICAL-DEPTH-PROGRAM.md) §4): sub-segment onboarding, subdomain book, `/my` relationship, innovation P0, demo depth, founder smoke, doc propagation.

---

## 2. Definition of done (all code verticals)

| # | Criterion | Verify |
|---|-----------|--------|
| 1 | Program doc L0–L8 complete | Per-vertical `*-VERTICAL-PROGRAM.md` |
| 2 | Playbook links program | `vertical-playbooks/{v}.md` |
| 3 | Demo slug live + depth | `POST /demo/sync-vertical-showcase` |
| 4 | Wedge interstitial | `/demo/wedge/{vertical}` |
| 5 | Subdomain book ≤90s | Founder UAT or `public-booking-quality` |
| 5b | `/my` relationship artifact | Guest hub seed + vertical visit shell |
| 5c | Innovation P0 | [`VERTICAL-INNOVATION-PROGRAM.md`](./VERTICAL-INNOVATION-PROGRAM.md) |
| 6 | Owner ritual home density | Contextual modules only |
| 7 | Presets: 4 natives + platform-default in policy | `pnpm vertical:check` |
| 8 | W4 preset CSS + settings iframe | Staging visual |
| 9 | Mobile: vocabulary + accent/preset tint | Mobile owner path |
| 10 | Doc propagation | `pnpm vertical:doc-check` |
| 11 | P0 PNGs captured or queued honestly | `pnpm screen-cards:status` |

All nine verticals require founder sign-off row in [`FOUNDER-UAT-CHECKLIST.md`](../operations/FOUNDER-UAT-CHECKLIST.md) before GTM Wave 1 exit.

---

## 3. Phased execution

### Phase V0 — Documentation spine ✅ (2026-06-01)

- [x] `VERTICAL-PROGRAMS-INDEX.md`
- [x] Nine `*-VERTICAL-PROGRAM.md` files
- [x] `PARTNER-AND-ADJACENT-VERTICALS.md`
- [x] `DOC-PROPAGATION-CASCADE.md` + `vertical:doc-check`
- [x] This build plan

### Phase V1 — GTM Wave 1 depth (current — all nine verticals)

**No heartland vs beta-full split for GTM.** Parallel depth waves D0–D4 per [`GTM-VERTICAL-DEPTH-PROGRAM.md`](./GTM-VERTICAL-DEPTH-PROGRAM.md).

| Workstream | Deliverable |
|------------|-------------|
| **D0** | Wildcard subdomain; sub-segment profiles; beauty + hair packs |
| **D1** | `/my` visit shell; wellness + body-art relationship |
| **D2** | Vertical memory; medspa + allied health intake |
| **D3** | Pack/credit on `/my`; fitness + pet + automotive |
| **D4** | Innovation P1; nine-slug founder smoke sign-off |
| Presets | `.target.png` per [`VERTICAL-TARGET-MOCK-PROGRAM.md`](../design/VERTICAL-TARGET-MOCK-PROGRAM.md) |
| Demo depth | [`PER-VERTICAL-DEMO-SEED.md`](./PER-VERTICAL-DEMO-SEED.md) + guest hub heterogeneous links |
| E2E | `all-verticals-smoke` + guest hub path |

**Exit:** GTM Wave 1 criteria in GTM depth program §8.

### Phase V2 — Partner honesty

- Dental, mental health: sales one-pagers only — no demo grid tile pretending full product.
- V11 adjacent: Calendly-parity messaging until Gate 2.

### Phase V4 — Ring 2 expansion (doc-first)

Mobile operator, corporate wellness — spec in manifesto; **no enum** until V2 exits.

**Event vendors (V12) — program complete (2026-06-10):**

| Phase | Scope |
|-------|--------|
| **P1** | Website lite + enquire form + inbox pipeline + catalogue + settings |
| **P2** | Quote generator + templates + PDF/link + send (email + WhatsApp one-tap) + accept quote |
| **P3** | Follow-up reminders, event-day sheet, milestone deposits, date holds, multi-contact, mood board, seasonal pricing, review ask, richer CMS |

Platform kernel: [`CONSULT-FIRST-WORKFLOW-SPEC.md`](./CONSULT-FIRST-WORKFLOW-SPEC.md) · program [`EVENT-VENDORS-VERTICAL-PROGRAM.md`](./EVENT-VENDORS-VERTICAL-PROGRAM.md).

**Probably later (event vertical only):** contracts / e-sign; inventory for hire sub-segment.

**First tenant:** design-partner event-decor operator (solo, IG/WhatsApp).

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
| 2026-06-10 | V12 event vendors program + consult-first spec; Phase V4 scope table |
| 2026-06-01 | Initial cross-vertical build plan |
