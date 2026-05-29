# Product UX system — business + engineering

**Canonical for:** how Livia should *feel* on screen.  
**Code:** `artifacts/livia-dashboard/src` (web cockpit).  
**Supersedes:** ad-hoc per-page layout guesses.

---

## One building, different keys

| Layer | Rule |
|-------|------|
| **Visual system** | Aurora baseline (`index.css`) — exposed as **Platform Default** preset; vertical-native skins override tokens. |
| **Persona** | Same components; different **home route**, nav order, ritual header accent (`PERSONA_ACCENT`). See [`../product/PERSONA-UX.md`](../product/PERSONA-UX.md). |
| **Vertical** | Same shell; **tone class** + vocabulary (`verticalPackUi`, `VerticalBadge`) so hair vs medspa vs pet reads clearly without a different app. |
| **Presentation preset** | Tenant picks 1 of **4** skins **within** their vertical (Platform Default + 3 native; staging rollout). Same features; different density/colour chrome. See [`PRESENTATION-PRESETS-AND-ROLLOUT.md`](./PRESENTATION-PRESETS-AND-ROLLOUT.md). |
| **Surface** | Phone / tablet / desktop **layout morph** on top of preset — same data, different shape. See [`SURFACE-AND-BREAKPOINTS.md`](./SURFACE-AND-BREAKPOINTS.md). |

We do **not** ship separate apps per vertical. We ship **one kernel** with vertical capability packs, optional presentation presets, and surface-adaptive layouts (plus honest vertical cues: label, tone, copy).

---

## Layout contract (every authenticated page)

1. **PageFrame** — `animate-in` enter, `max-w-3xl` (or `lg` for chain), `pb-16` for mobile nav.
2. **PersonaRitualHeader** — title, subtitle, Liv line, persona accent stripe (not a static H1).
3. **Content** — cards with hover elevation; skeletons while loading (never frozen “Loading…” only).
4. **Actions** — primary = cyan button; destructive = semantic red; ghost for secondary.

---

## Motion (fluid, not decorative)

From `lib/motion.ts` / [`motion-tokens.md`](./motion-tokens.md):

- **Page enter:** fade + slide up 500ms
- **Panel / wizard step:** slide from right 300ms
- **Lists:** stagger via `listItem` where it helps scan

Avoid animation on data tables that update every second.

---

## Responsive

- Mobile-first padding; `sm:` grids for forms.
- **Surface classes:** phone `<640px`, tablet `640–1023px`, desktop `≥1024px` — layout morph per [`SURFACE-AND-BREAKPOINTS.md`](./SURFACE-AND-BREAKPOINTS.md).
- Native tenant app: [`MOBILE-UX-PRINCIPLES.md`](./MOBILE-UX-PRINCIPLES.md) (tabs vs More vs web handoff).
- Public booking: full viewport height chat; `100dvh` where needed; tablet 2-col service grid where applicable.
- Chain / premises: stack cards on narrow screens; `sm:grid-cols-*` for KPI rows; desktop multi-pane for inbox.

---

## Beta walkthrough

Founder + partner manual script (includes UX pass/fail): [`../testing/MANUAL-WALKTHROUGH-BETA.md`](../testing/MANUAL-WALKTHROUGH-BETA.md).

---

## Related docs

| Audience | Doc |
|----------|-----|
| Business / GTM | [`../product/LIVIA-EXPERIENCE-DESIGN-BIBLE.md`](../product/LIVIA-EXPERIENCE-DESIGN-BIBLE.md) |
| Personas | [`../personas.md`](../personas.md) |
| Engineering | [`../engineering/PRODUCT-GRADE-BAR.md`](../engineering/PRODUCT-GRADE-BAR.md) |
| Doc index | [`../DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md) |
