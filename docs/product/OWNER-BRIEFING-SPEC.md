# Owner briefing — Today home spec (P2 ritual)

**Status:** canonical draft (2026-05-31)  
**Audience:** product, design  
**Purpose:** Define what **Owner Today** (`/dashboard`) must answer every open — the daily briefing ritual.

**Screen cards:** [`w4.ops.today.web.yaml`](./screen-cards/w4.ops.today.web.yaml) · mobile Today tab

---

## 1. Job

> "Is today OK — and what needs me?"

Not a feature grid. One scroll: briefing → KPIs → proposals → inbox pulse.

---

## 2. Blocks (order)

| Block | Content | Liv? |
|-------|---------|------|
| **Greeting + date** | Business name, vertical accent line | No |
| **Briefing strip** | 1–3 sentences: bookings, gaps, urgent inbox | Yes |
| **KPI chips** | Today count, pending, revenue hint (if wired) | No |
| **Proposals** | Liv-suggested actions (approve/dismiss) | Yes |
| **Inbox pulse** | Unread + handoff count → deep link | No |
| **Running late** | Quick action if confirmed bookings today | No |

---

## 3. Vertical modules (below fold)

Optional modules from `vertical-home-modules` — pipeline (body-art), mandates (medspa), class roster (fitness). Max one vertical block above fold.

---

## 4. Motion

- Entry: `enter-page` + `accent-draw` on vertical stripe ([`PREMIUM-MOTION-LAYER.md`](./PREMIUM-MOTION-LAYER.md))
- Briefing update: crossfade, not full reload
- Proposal dismiss: `exit-panel`

---

## 5. Related

- [`UI-UX-MASTER-PROGRAM.md`](./UI-UX-MASTER-PROGRAM.md) §6 persona rituals
- [`PERSONA-VERTICAL-SURFACE-MATRIX.md`](./PERSONA-VERTICAL-SURFACE-MATRIX.md) P2 rows

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial owner briefing spec |
