# Public booking (`/b/:slug`) — audit & redesign plan

**Status (May 2026):** Phase A + B complete in repo. Ready for full automated + manual test.

## What exists today

| Area | State |
|------|--------|
| Flow | Services → time → details → (medspa consent) → confirmed |
| API | `GET /api/public/b/:slug` (+ address fields), slots, `POST` create |
| Vertical theme | CSS tokens + optional `coverImageUrl` hero |
| Copy | `countryPack` + `businessVocabulary` + guard section titles per vertical |
| Medspa | Consent step, procedure pre-select from service name, regulatory footer on consent |
| Pet / allied / auto | Guards styled as first-class “About your pet” / “Clinical intake” / “Your vehicle” |
| Body-art | Consult-only badge on free/consult services |
| Mobile | Sticky summary CTA on details + consent (`md:hidden`) |
| AI | Chat widget + footer disclosure line |
| E2E | `all-verticals-smoke` + `public-booking-quality` (axe, flow, sticky) |

## Phase A — done

- [x] Consent as its own progress step for medspa
- [x] Logo + description in header; vertical `serviceNoun` in step labels
- [x] AI disclosure footer when chat enabled
- [x] Country-pack strings for confirm CTA
- [x] Medspa consent pill smoke in `all-verticals-smoke`

## Phase B — done

- [x] Cover image hero when `coverImageUrl` set
- [x] Address block (`addressLine1` + city/postal from API)
- [x] Sticky booking summary on details/consent (mobile)
- [x] Medspa: procedure guess from service name; regulatory footer on consent step
- [x] Pet / vertical guard sections with dedicated titles
- [x] Body-art: consult-only service badge
- [x] `public-booking-quality` Playwright + axe (hair, medspa, pet)

## Phase C — proof (your test session)

- [ ] Re-capture `e2e/visual-captures/full-audit/public-b-*` after visual review
- [ ] Founder walkthrough: complete booking on 2+ verticals from phone (incognito)
- [ ] Native Maestro captures (`pnpm maestro:visual-capture`)

## Demo URLs

See `docs/testing/DEMO-FULL-SHOWCASE.md` — e.g.:

- http://127.0.0.1:5173/b/clarity-medspa-dublin
- http://127.0.0.1:5173/b/motion-physio-cork
- http://127.0.0.1:5173/b/paws-parlour-dublin
- http://127.0.0.1:5173/b/ink-anchor-galway

**Full test checklist:** [`READY-FOR-FULL-TEST.md`](./READY-FOR-FULL-TEST.md)
