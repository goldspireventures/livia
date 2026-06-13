# Event vendors & decor — innovation program

**Status:** living (2026-06-10)  
**Authority:** [`EVENT-VENDORS-VERTICAL-PROGRAM.md`](./EVENT-VENDORS-VERTICAL-PROGRAM.md) · [`CONSULT-FIRST-WORKFLOW-SPEC.md`](./CONSULT-FIRST-WORKFLOW-SPEC.md) · master matrix [`VERTICAL-INNOVATION-PROGRAM.md`](./VERTICAL-INNOVATION-PROGRAM.md)  
**Principle:** Consult-first people business — **enquiry → quote → booked** — not calendar-shaped. Cascade **policy → API → web + mobile + `/e/` guest surfaces**.

**Demo tenant:** `atelier-decor-dublin` · wedge G2 beats: **Inbox · Quote generator · Catalogue**

---

## North star

A solo event-decor operator should feel like Livia already runs their back office: **one inbox for every channel, a quote drafted in under a minute, catalogue units that scale themselves, and a guest quote link that looks like a studio — not a spreadsheet screenshot.**

Competitors (HoneyBook, Dubsado, spreadsheets + Canva + WhatsApp) treat quotes as documents. Livia treats the **quote as the primary platform object** — same OS as salon inbox + medspa consent + body-art proof.

---

## Wedge story (G2)

| Beat | Showstopper moment | Status |
|------|-------------------|--------|
| **Unified inbox** | IG + WhatsApp + email + web enquire → one thread; Liv on draft | ✅ live |
| **Quote generator** | Enquiry brief → template + catalogue → itemised quote < 60s | ✅ live |
| **Your catalogue** | Per-guest / per-table / per-item units scale quotes automatically | ✅ live (via `/services`) |
| **Guest enquire shortcut (G3)** | Enter demo → `/e/{slug}/enquire` — no “Open My Livia” | ✅ live |

**Next wedge beat (G2 chapter 4):** Event-day sheet or milestone pay on accept — the “booked + money collected” payoff.

---

## Operator wow — by persona

### Solo owner (primary design partner)

| Idea | Real problem | Cross-surface | Build lane | Status |
|------|--------------|---------------|------------|--------|
| **Brief intelligence** | DM missing guest count / venue — bad quotes | `QuoteBriefPanel` on `/enquiries` + `/quotes` | P0 | ✅ |
| **Draft quote in 30s** | Hours in Notes + calculator | Generate from enquiry + template | P0 | ✅ |
| **Stale-quote radar** | Quotes die in WhatsApp | Today KPI + `StaleQuotesPanel` | P0 | ✅ |
| **One-tap Liv follow-up** | “What do I say on day 5?” | Copy `stale-liv-draft` → WhatsApp (web + mobile) | P1 | ✅ |
| **Pipeline at a glance** | Lost leads in DMs | New → Quoted → Booked → Lost on `/enquiries` | P0 | ✅ |
| **Milestone deposit ladder** | Wedding 25/50/25 schedules | Policy + guest pay view + Stripe/dev sim | P1 | 🟡 next-due collect |
| **Event-day sheet** | Day-of chaos on phone | `EventDaySheetPanel` on `/quotes` + mobile | P1 | ✅ |
| **Liv event prep timeline** | “What do I do 2 weeks out?” | `EventPrepTimelinePanel` after deposit | P1 | ✅ |
| **Mood board approval** | Pinterest photo tennis | Extend body-art `/proof` pattern | P2 | 🔲 |
| **Travel/setup fee from venue** | Manual mileage math | Address on enquire → auto line | P2 | 🔲 |
| **Seasonal pricing hints** | Peak Saturday underpriced | Hint on quote draft | P2 | 🔲 |
| **Revenue forecast** | Pipeline € invisible | Weighted quoted → expected | P3 | 🔲 |
| **Liv pre-screen learning** | Repeat pricing mistakes | Learn default qty per guest band | P3 | 🟡 partial |

### Coordinator (later multi-user)

| Idea | Problem | Pri | Status |
|------|---------|-----|--------|
| **Multi-contact** | Client + planner on same enquiry | P2 | 🟡 fields |
| **Planner portal lite** | Planner sees all client quotes | P3 | 🔲 |
| **Date holds** | Tentative vs confirmed on calendar | P2 | 🔲 |
| **Blocked-date warn on enquire** | Book full Saturdays twice | P2 | 🔲 |

---

## Guest (enquirer) wow — `/e/` surfaces

| Idea | Real problem | Cross-surface | Pri | Status |
|------|--------------|---------------|-----|--------|
| **Structured enquire** | 12 DM questions | `/e/{slug}/enquire` one pass | P0 | ✅ |
| **Channel choice** | “Email or WhatsApp my quote?” | Enquire form field | P0 | ✅ |
| **Professional quote link** | Notes app screenshot | `/e/{slug}/q/{token}` branded | P0 | ✅ |
| **Similar work on quote** | “Will it look like our vibe?” | Gallery matched by `eventType` | P1 | ✅ |
| **Accept + pay deposit** | Chase bank details | Accept → Stripe checkout | P0 | ✅ |
| **Milestone schedule visible** | Wedding payment anxiety | Paid / due / upcoming on quote | P1 | ✅ |
| **Event-day checklist (guest)** | “What happens on the day?” | Checklist after accept | P1 | ✅ |
| **Inspiration links on enquire** | Pinterest lost in DMs | URL field on form | P1 | ✅ |
| **Quote versioning** | Negotiation confusion | v2 diff on guest view | P2 | 🔲 |
| **Mood board approve link** | Palette sign-off before deposit | `/proof`-style token | P2 | 🔲 |

---

## Tier 1 showstoppers — “I've never seen this”

These are the category-killing moments. Each must feel native, not bolted on.

1. **Brief intelligence** — Liv reads enquiry + flags missing fields before you draft; suggests template + scaled quantities.
2. **Gallery-matched quote** — Three “similar work” shots on the guest quote page, tagged by event type from your CMS gallery.
3. **Quote snapshot freeze** — Catalogue price edits never rewrite sent quotes (immutable line items on send).
4. **One-tap WhatsApp send** — Assisted `wa.me` prefill + link; status → Quoted; thread stays in inbox.
5. **Stale-quote Liv follow-up** — “Sent 5 days ago — no reply” with one-tap copy drafted by Liv.
6. **Milestone deposits** — 25% hold → 50% at T-30 → balance on day; guest sees schedule; collect next due.
7. **Event-day sheet** — Venue, theme, date, guests, setup checklist — mobile-first on quote detail.
8. **Sibling thread banner** — Same celebration enquired on IG *and* web — one thread (inbox routing).

---

## Tier 2 — “This makes me look premium”

| Idea | Pri |
|------|-----|
| Quote line templates by event type (birthday / wedding / corporate) | P1 ✅ |
| Branded HTML invoice / PDF download on guest quote | P1 ✅ |
| Liv outbound template hub (Settings → Channels) | P1 ✅ |
| Post-event review ask (SMS/email T+1) | P2 🟡 API |
| Enquiry source tracking (`?from=ig`) | P1 ✅ |
| Prescreen tier (high / medium / low fit) on enquiry | P2 ✅ |
| Collapsible Liv message templates in Settings | P1 ✅ |

---

## Tier 3 — category killer (hard moat)

| Idea | Why it wins |
|------|-------------|
| Live availability on enquire | “14 June full” before wasted time |
| Quote versioning with guest diff | Negotiation without confusion |
| Inventory-aware catalogue | “Only 2 neon arches left that week” |
| Weather/contingency clause auto-terms | Outdoor decor protection |
| Competitor reply-time benchmark | “You replied in 4 min — top 10%” |
| Meta WhatsApp Business API | True send — defer; assisted OK in v1 |

---

## Consult-first kernel (reused by Ring 2+)

These ship once for event vendors; other consult-first verticals inherit:

- Enquiry → quote → book spine  
- Line-item catalogue (qty, unit, price)  
- Quote templates by job type  
- Enquiry source tracking  
- Guest quote token + accept/decline/pay  
- Brief intelligence + stale nudge copy in policy hub  

**Future consumers:** photographers, equipment hire, home trades, creative studio hire.

---

## Hardware & modality matrix

| Surface | Event-vendor native use |
|---------|-------------------------|
| **Owner phone** | Inbox triage, copy stale nudge, event-day sheet |
| **Owner laptop** | Quote edit, send review, catalogue, website CMS |
| **Guest phone** | Enquire form, quote view, accept + pay |
| **Guest desktop** | Quote PDF download, milestone schedule review |

---

## Onboarding jaw-drop sequence (target)

1. **Enter Atelier demo** — wedge G2 shows inbox → quote-gen → catalogue (not salon Today).
2. **Inbox seeded** — Sarah Murphy birthday enquiry, Aoife wedding thread — realistic copy.
3. **Generate quote** — Brief intelligence flags; template pre-fills; quantities scale from guests.
4. **Guest path** — G3 shortcut → `/e/atelier-decor-dublin/enquire` without sign-in.
5. **Public quote** — Similar work gallery + accept + milestone deposit pay.
6. **Booked** — Event-day sheet + Liv prep timeline unlock after deposit.

---

## P0–P3 prioritisation (event-vendors)

| Priority | Item | Why now |
|----------|------|---------|
| **P0** | Guest `/e/` routes without sign-in | Founder demo blocker |
| **P0** | Quote generate + send + accept | Sacred metric: enquiry → booked |
| **P0** | Demo inbox realism (no salon bleed) | Trust in wedge |
| **P1** | Gallery-matched quote on guest view | Guest wow — highest gap closed |
| **P1** | Stale nudge one-tap (web parity) | Operator wow — Liv writes follow-up |
| **P1** | Brief intelligence on `/quotes` | Reinforce “quote writes itself” |
| **P1** | Event-day sheet (web + mobile) | Day-of execution |
| **P2** | Mood board approval | Body-art proof reuse |
| **P2** | Blocked dates on enquire | Reduce wasted enquiries |
| **P2** | Full milestone auto-collect | Wedding segment depth |
| **P3** | Planner portal | Multi-stakeholder weddings |
| **P3** | Revenue forecast | Owner analytics |

---

## Implementation status legend

| Mark | Meaning |
|------|---------|
| ✅ | Shipped in repo |
| 🟡 | Partial — API or one surface only |
| 🔲 | Spec locked — build in depth wave |

---

## Cascade checklist (when shipping any row)

- [ ] `lib/policy` — `event-vendor-quote-program.ts` + vocabulary  
- [ ] API — `consult-first.service.ts` + routes  
- [ ] Dashboard — `/enquiries`, `/quotes`, `/services`, `/website`  
- [ ] Mobile — `enquiries.tsx`, `quotes.tsx` parity  
- [ ] Guest — `/e/{slug}/enquire`, `/q/{token}`  
- [ ] Demo seed — `event-vendors-demo-depth.ts` + inbox threads  
- [ ] Wedge — `wedge-demo-stories.ts` + G2 preview  
- [ ] Registry + `pnpm vertical:doc-check`

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-10 | Initial innovation program — tier 1–3 showstoppers, persona matrix, wedge beats, P0–P3 |
| 2026-06-10 | Shipped: gallery-matched quote, stale nudge web, brief on quotes, event-day sheet panels |
