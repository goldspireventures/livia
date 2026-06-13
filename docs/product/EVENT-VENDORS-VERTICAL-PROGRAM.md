# Event vendors & decor — platform program (V12)

**Status:** Ring 2 program complete (doc-first) · **execution:** Phase V4 — after V2 exits  
**Registry:** V12 · **defer** · no `codeVertical` yet · nearest pack `wellness` (packages, couples) + `medspa` (deposits, high consideration)  
**Platform primitive:** [`CONSULT-FIRST-WORKFLOW-SPEC.md`](./CONSULT-FIRST-WORKFLOW-SPEC.md)  
**Design partner:** solo event-decor operator (IG/WhatsApp leads, quote-first) — see § Design partner profile  
**Reads with:** [`vertical-playbooks/event-vendors.md`](./vertical-playbooks/event-vendors.md) · [`PARTNER-AND-ADJACENT-VERTICALS.md`](./PARTNER-AND-ADJACENT-VERTICALS.md) § Ring 2 · [`pricing-and-packaging.md`](../business/pricing-and-packaging.md) § Event Operator pack

### Commercial packaging (2026-06)

Consult-first depth ships as **Event Operator** add-on (€49/mo on Solo/Studio) — entitlement `event_operator_pack` in `@workspace/entitlements`. Gated surfaces: `/inbox`, `/quotes`, `/event-site`, guest quote deposits. Design partners receive the pack during DP window; demo slug `atelier-decor-dublin` is pre-granted.

---

## L0 — What Livia means for event vendors

Event businesses trade **speed for trust** — date-bound work, bespoke quotes, visual proof, multi-channel enquiries. Default loop is **consult-first**, not instant book.

**One sentence:** *Livia is the quiet back office for event vendors — capture the enquiry, draft the quote from your catalogue, send it their way, track it to booked.*

### Sub-segments (onboard profiles)

| Profile | Examples | Default loop |
|---------|----------|--------------|
| **Event decor & styling** | Balloons, backdrops, table styling, room dressing | Enquiry → quote → book |
| **Wedding vendors** | Photographers, DJs, florists, cake makers | Enquiry → quote → date hold → milestones |
| **Party & celebration** | Kids entertainers, photo booths, catering mobile | Enquiry → quote → book |
| **Venue / function hire** | Party rooms, banquet styling | Enquiry → quote → capacity check → book |
| **Equipment hire** | AV, furniture, marquees | Enquiry → line-item quote → qty → book |

### Wow — operator

| Moment | Why |
|--------|-----|
| **One link from IG** | Bio/story → enquire page; no more chasing theme/date/guests in DMs |
| **Draft quote in 30s** | Form + catalogue → 80% quote; tweak and send |
| **Pipeline at a glance** | New → Quoted → Booked → Lost — nothing lost in WhatsApp |
| **Follow-up nudge** | “Quote sent 5 days ago — no reply” |
| **Event-day sheet** | Venue, theme, setup time, checklist on phone |

### Wow — guest (enquirer)

| Moment | Why |
|--------|-----|
| **Structured enquire** | Theme, date, guests, budget, event type — one pass |
| **Channel choice** | “Send my quote by email or WhatsApp” |
| **Professional quote link/PDF** | Not a screenshot of Notes |
| **Accept quote** | One tap yes → operator marks booked |
| **Similar work on quote** | Gallery shots matched to event type |

---

## L1 — Capability map

### Reuses from platform today

| Primitive | Event use |
|-----------|-----------|
| Inbox + channels | IG/WhatsApp/email enquiries converge |
| Customers | Enquirer becomes customer record |
| Services catalogue (extend) | Quote line items — qty, unit, price |
| Deposits / Stripe | Deposit on accepted quote |
| Guest subdomain | Public enquire + quote view tokens |
| Liv proposals | Draft reply, deposit ask (extend to customer quotes) |
| Design proofs (body-art) | Morph → mood board / inspiration approval |
| Notifications | New enquiry, quote follow-up |
| Multi-user tenant | Solo now; staff roles later |

### Net-new platform capabilities

See [`CONSULT-FIRST-WORKFLOW-SPEC.md`](./CONSULT-FIRST-WORKFLOW-SPEC.md):

| Capability | Priority |
|------------|----------|
| **Enquiry intake** | P0 |
| **Quote object** (line items, snapshot on send) | P0 |
| **Enquiry pipeline** (New / Quoted / Booked / Lost) | P0 |
| **Quote generator** (template + catalogue → draft) | P1 |
| **Marketing CMS-lite** (gallery, pages) | P1 |
| **Milestone deposits** | P2 |
| **Date holds** (tentative vs confirmed) | P2 |
| **Multi-contact** (client + partner/planner) | P2 |

| Layer | Status |
|-------|--------|
| `businessVerticalSchema` enum | ✅ `event-vendors` (design-partner ship) |
| Consult-first workflow | ✅ API + dashboard (2026-06-11) |
| Enquiry / quote tables | ✅ migration `047-event-vendors-consult-first.sql` |
| Enquire-first guest surface | ⚠️ API (`POST /public/:slug/enquire`) — public HTML page next |
| Demo tenant | ✅ `atelier-decor-dublin` · `owner-atelier@demo.livia-hq.com` |

---

## L2 — Presentation

**Default preset (planned):** `event-vendor-atelier` — gallery-forward, warm neutrals, celebration photography.  
**Alt:** `wedding-ledger` (muted luxury), `party-pop` (birthday/kids).

**Vocabulary morph:** Event date (not appointment); Client / Enquirer; Services catalogue; Quote (not booking) as primary CTA on public surface.

---

## L3 — Personas

| Persona | Ritual |
|---------|--------|
| **Solo owner** | Mobile inbox → generate quote → WhatsApp one-tap send |
| **Coordinator (later)** | Pipeline board, follow-ups, event-day sheets |
| **Enquirer** | Form → wait → quote link → accept or questions |

---

## L4 — Surfaces

| Surface | Route / pattern | Role |
|---------|-----------------|------|
| **Public website lite** | `{slug}.livia-hq.com` | Home + gallery + enquire |
| **Enquire** | `{slug}.livia-hq.com/enquire` | Structured intake |
| **Quote view** | `{slug}.livia-hq.com/q/{token}` | Client views / accepts quote |
| **Admin — Enquiries** | `/enquiries` | Inbox + pipeline |
| **Admin — Quotes** | `/quotes` | Drafts + sent |
| **Admin — Catalogue** | `/catalogue` | Self-managed services + prices |
| **Admin — Website** | `/website` | Gallery, copy, hero |
| **Admin — Settings** | `/settings` | Deposit %, terms, business info |
| **Event-day sheet** | Mobile / quote detail | Day-of execution |

**Fine details:** Quote snapshot on send — catalogue price changes do not rewrite sent quotes. WhatsApp send = one-tap `wa.me` prefill + link/PDF (not Meta Business API in v1).

---

## L5 — Demo

**Planned slug:** TBD at first design-partner provision (event-decor profile).  
**Seed story:** Birthday enquiry → draft quote from catalogue → sent → booked with deposit note.

---

## L6 — CI

Target when enum ships: `public-enquiry-quality` + `quote-send-smoke` + consult-first E2E path.

---

## L7 — Build phases (full scope)

### Phase 1 — Foundation (launch for design partner)

| # | Deliverable |
|---|-------------|
| 1 | Website lite — home, gallery, enquire |
| 2 | Enquiry form — theme, date, guests, budget, event type, services checklist, contact, **quote channel** (email/WhatsApp) |
| 3 | Admin auth + **enquiry inbox** + status pipeline + notes |
| 4 | **Settings** — deposit % default, terms, business info (operator-controlled) |
| 5 | **Catalogue** — add/edit/remove services, price, unit (flat / per guest / per table / per item), active toggle |
| 6 | Email notification on new enquiry |
| 7 | Enquiry **source tracking** (`?from=ig`, form field) |
| 8 | **Inspiration links** on enquiry (Pinterest / IG URL field) |

### Phase 2 — Quote generator + close

| # | Deliverable |
|---|-------------|
| 9 | **Generate quote** from enquiry + catalogue |
| 10 | **Quote templates** by event type (operator-managed) |
| 11 | Edit lines, per-quote deposit % override, personal message |
| 12 | Preview + **PDF** + shareable quote link |
| 13 | **Send** — email automatic; **WhatsApp one-tap** (prefilled message + link) |
| 14 | Status → Quoted on send; **quote snapshot** frozen |
| 15 | **Accept quote** button on client quote view |
| 16 | **Quote follow-up reminders** (“sent N days ago, no reply”) |
| 17 | **Liv draft reply** — thanks + form link; first-pass quote message from catalogue |

### Phase 3 — Operator polish + vertical depth

| # | Deliverable |
|---|-------------|
| 18 | **Gallery by event type** on site + “similar work” on quote |
| 19 | **Date availability flag** — mark dates full; warn on enquire |
| 20 | **Event-day sheet** — venue, theme, setup time, checklist |
| 21 | **Post-event review ask** — SMS/email after event date |
| 22 | **Milestone deposits** — e.g. 25% hold, 50% at 30d, balance on day |
| 23 | **Date holds** — tentative vs confirmed on event date |
| 24 | **Multi-contact** — primary + partner/planner on enquiry |
| 25 | **Mood board / approval** — extend design-proof pattern |
| 26 | **Travel/setup fee** from venue address |
| 27 | **Seasonal / peak pricing** hints on quote draft |
| 28 | **Stripe deposit** on accept quote (optional — manual bank OK in v1) |
| 29 | Richer **website CMS** — reorder gallery, edit page blocks |
| 30 | **Dashboard** — new enquiry count, stale quotes, follow-ups due |

### Platform reuse (other Ring 2 verticals)

These ship as part of consult-first kernel — reused by photographers, hire companies, home trades:

- Enquiry → quote → book spine  
- Line-item catalogue (qty, unit, price)  
- Quote templates by job type  
- Enquiry source tracking  

---

## L8 — Completion (GTM-ready for event vertical)

| # | Criterion |
|---|-----------|
| 1 | Design partner runs live enquiries through enquire → quote → booked without spreadsheets |
| 2 | Operator manages catalogue, gallery, deposit %, terms without developer |
| 3 | Quote send via email + WhatsApp one-tap; client accept updates pipeline |
| 4 | Founder smoke: enquire → draft → send → accept path green |
| 5 | `pnpm vertical:doc-check` + program changelog current |

---

## Design partner profile (event decor — solo)

First tenant shape driving Phase 1–2:

| Attribute | Value |
|-----------|-------|
| **Operator** | Solo owner, full-time, IG/WhatsApp leads |
| **Service** | Event decor — theme, styling, balloons, backdrops, tables |
| **Quote inputs** | Theme, date, guest count, budget, event type |
| **Pricing** | Mix of packages and custom; she manages catalogue |
| **Deposit** | Operator-set %; per-quote override |
| **Send channel** | Client chooses email or WhatsApp on form |
| **WhatsApp** | One-tap send (not Meta API v1); paid API later if she opts in |
| **Users** | Solo login now; multi-user-ready |

---

## Out of scope (honest)

| Item | Why |
|------|-----|
| Instant book as default loop | Wrong physics — quote-first |
| Enterprise CRM / ERP | Light pipeline only |
| Multi-vendor planner OS | Coordinator of 8 suppliers — different product |
| Corporate approval workflows | B2B procurement — defer |
| Full Squarespace-style CMS | Website lite + gallery admin is enough for v1–v3 |
| Full WhatsApp Business API | v1 uses one-tap; API is optional paid add-on later |

### Probably later (explicit defer)

| Item | Notes |
|------|-------|
| **Contracts / e-sign** | After quote accept + deposit proof; reuse medspa consent patterns where possible |
| **Inventory** (“2 backdrops left”) | Equipment hire sub-segment; stock counts on catalogue items |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-11 | Code vertical + consult-first API/dashboard; demo `atelier-decor-dublin` provisioned |
| 2026-06-10 | Initial Ring 2 program — full scope from design-partner discovery + vertical expansion list; consult-first spec linked |
