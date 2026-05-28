# Per-vertical demo seed spec (EU v1)

**Status:** L2 complete (2026-05-21)  
**Code:** `artifacts/livia-mobile/lib/seed-demo.ts`, `scripts/seed-demo.mjs`, portal `demo-portal.service.ts`

| Vertical | Slug example | Services seeded | Hours | Liv greeting tone |
|----------|--------------|-----------------|-------|-------------------|
| hair | luxe-salon-spa | cut, colour, blowdry | Mon–Sat 9–18 | Friendly salon |
| beauty | — | gel, facial, brow | Same pattern | Professional |
| barber | — | fade, beard trim | Extended Fri | Playful |
| tattoo | — | consult, session | By appointment | Professional |
| wellness | — | massage, consult | Calmer copy | Friendly |

**Rule:** Seeds only change **data + copy packs** — never route graph.  
**Portal:** `GET /demo/personas` returns walkthrough businesses per persona.

**Exit:** `pnpm run seed:demo` + public slug loads in REAL-WORLD guide §3.
