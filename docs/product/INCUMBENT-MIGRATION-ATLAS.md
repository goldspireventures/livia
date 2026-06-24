# Incumbent migration atlas

**Status:** canonical (2026-06-21)  
**Audience:** product, engineering, GTM, support  
**Policy hub:** `lib/policy/src/incumbent-migration-atlas.ts`  
**Fast-track onboarding:** `lib/policy/src/migration-fast-track-program.ts`  
**Reads with:** [`IMPORT-MIGRATION-SPEC.md`](./IMPORT-MIGRATION-SPEC.md) · [`COMPETITIVE-PARITY-BUILD-PLAN.md`](./COMPETITIVE-PARITY-BUILD-PLAN.md) · [`../journeys/onboarding-paths.md`](../journeys/onboarding-paths.md)

---

## Purpose

Livia wins solo owners and small studios when switching feels **faster than staying**. This atlas is the single source of truth for:

1. What each incumbent platform **actually exposes** (CSV, API, support-only, paid connector).
2. What Livia **ships today** vs **plans next** (brokers, OAuth, concierge).
3. How **Liv-guided fast-track onboarding** applies imports and walks owners through navigation.

North star: **register → pick previous tool → paste exports (or connect OAuth) → same shop on Livia in one sitting** — sacred metric unchanged: **first booking**.

---

## Owner experience (shipped 2026-06-21)

### Fast track fork

At business creation, owners choose:

| Path | Meaning |
|------|---------|
| **Starting fresh** | Starter pack seeds menu + team; standard 6-step portal onboarding. |
| **Bringing my shop** | Import-first: portal adds **Bring your data** step after shop profile; Liv shows platform-specific export steps + magic multi-CSV apply. |

### Surfaces

| Surface | Capability |
|---------|------------|
| **Web onboarding** | Migration intent picker · `MigrationSwitchPanel` on act `a11_migration` · magic setup bundle |
| **Web Settings → Integrations** | Single CSV import + magic setup (services, staff, clients, appointments) |
| **Mobile onboarding continue** | Source picker + Liv guide + CSV paste |
| **API** | `POST …/import/csv` · `POST …/import/preview` · `POST …/import/magic-setup` · `POST …/import/oauth/start` · `POST …/import/oauth/pull` · `GET …/migration/oauth-capabilities` |

Import side-effects auto-complete onboarding acts: **service menu**, **team**, **migration** when records land.

---

## Livia import stack (today)

```text
Owner export (CSV or future OAuth)
  → lib/policy/import-formats.ts (detect + normalize)
  → universal-import.service.ts (write clients, services, staff, appointments)
  → import-onboarding.service.ts (checklist + act completion)
  → dashboard / mobile Today + public /book
```

**Honesty:** **Live OAuth pulls** ship for Acuity, Square Appointments, Fresha (partner API when credentials exist), and Google Calendar (appointments as bookings) when workspace env vars are set — see `migration-oauth-program.ts`. All other incumbents remain **CSV + Liv walkthrough** today. Settings broker labels stay generic; onboarding may name platforms.

### Phase 2 OAuth pulls (2026-06-21)

| Broker | Env keys | Pulls |
|--------|----------|-------|
| `migration_acuity` | `ACUITY_CLIENT_ID`, `ACUITY_CLIENT_SECRET` | Clients, appointment types → services, upcoming appointments |
| `migration_square` | `SQUARE_APPLICATION_ID`, `SQUARE_APPLICATION_SECRET` | Catalog, customers, team, bookings |
| `migration_fresha` | `FRESHA_CLIENT_ID`, `FRESHA_CLIENT_SECRET` | Partner read (best-effort; CSV remains primary) |
| `calendar_google` | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | Upcoming calendar events → bookings |

Extended atlas (`incumbent-migration-atlas-ext.ts`) adds Jane, Cliniko, Zenoti, Mangomint, GlossGenius, Setmore, Glofox, HoneyBook, Gingr, PetExec, Shopmonkey, SimplyBook, Schedulista, Pabau, Shortcuts — all verticals covered via CSV paths.

---

## Platform matrix

Legend:

- **CSV** = owner self-serve export Livia ingests today  
- **API** = OAuth/partner path (planned or stub)  
- **Support** = must ask incumbent support chat  
- **Livia** = `csv_self_serve` · `csv_plus_guide` · `oauth_planned` · `oauth_live` · `oauth_stub` · `partner_required` · `concierge_only`

### Tier 1 — heartland (hair, beauty, barber)

#### Phorest

| Entity | Incumbent | Livia today | Notes |
|--------|-----------|-------------|-------|
| Services | Manager → Services → Export all services | CSV | Per-location export |
| Clients | Marketing export, Top Clients report, transaction CSV | CSV | No single “all clients” button |
| Appointments | Future appointments report; CSV export jobs | CSV | Third-party API: CSV export jobs (partner approval via api-requests@phorest.com) |
| Staff | Manual | Manual / concierge | |
| **Livia status** | | **partner_required** | Parallel run recommended for staffed salons |

#### Fresha

| Entity | Incumbent | Livia today | Notes |
|--------|-----------|-------------|-------|
| Clients | Partners → Clients → Import/export template | CSV | Strong client CSV story |
| Services | Data connector (paid Snowflake) or manual | CSV / booking page | OAuth API referenced by partners; not public self-serve dev portal |
| Appointments | Data connector or calendar export | CSV | |
| **Livia status** | | **oauth_planned** | IE/EU solo density |

#### Booksy

| Entity | Incumbent | Livia today | Notes |
|--------|-----------|-------------|-------|
| Clients | Support chat → request CSV | CSV (`booksy_legacy` + universal) | No self-serve export |
| Appointments | Support chat | CSV | |
| Services | Public booking page | Concierge / manual | Scraper APIs exist — **not used** (ToS) |
| **Livia status** | | **csv_plus_guide** | Liv walks support-chat path |

### Tier 2 — common

#### Acuity Scheduling

| Entity | Incumbent | Livia today | Notes |
|--------|-----------|-------------|-------|
| Clients | Clients → Import/export | CSV | Excellent |
| Appointments | Reports → Import/Export | CSV | Includes type, price, calendar |
| Services | Appointment types in export | CSV | |
| API | OAuth2 + Basic auth REST | **oauth_planned** | `/appointments`, `/clients` |
| **Livia status** | | **oauth_planned** | Wellness, allied-health, solo consult |

#### Square Appointments

| Entity | Incumbent | Livia today | Notes |
|--------|-----------|-------------|-------|
| Bookings | Bookings API `GET /v2/bookings` | **oauth_planned** | Scopes: `APPOINTMENTS_READ`, `APPOINTMENTS_ALL_READ` |
| Catalog / services | Catalog API | OAuth | |
| Customers | Customers API / dashboard export | CSV + OAuth | |
| **Livia status** | | **oauth_planned** | Solo barbers who “tried Square once” |

#### Vagaro (US)

| Entity | Incumbent | Livia today | Notes |
|--------|-----------|-------------|-------|
| Clients | Reports → Customers → Export Excel | CSV | Owner-only export |
| API | OAuth + webhooks | **Forward-only** | No bulk historical API per vendor docs |
| **Livia status** | | **oauth_stub** | CSV migration + parallel run |

#### Mindbody (fitness / wellness)

| Entity | Incumbent | Livia today | Notes |
|--------|-----------|-------------|-------|
| Clients | Reports / exit data export | CSV | Full export often via support on cancellation |
| Classes / appointments | Reports | CSV | Distinct from 1:1 salon model |
| API | Public API (partner) | **oauth_stub** | |
| **Livia status** | | **oauth_stub** | Parallel run for studios |

#### Timely (GetTimely salon)

| Entity | Incumbent | Livia today | Notes |
|--------|-----------|-------------|-------|
| Clients | Reports → Customer List → CSV | CSV | |
| Appointments | Reports → Appointment Schedule → CSV | CSV | |
| Services | No export | Booking page mirror | privacy@gettimely.com for GDPR full export |
| **Livia status** | | **csv_plus_guide** | AU/NZ/IE |

### Tier 3 — adjacent

| Platform | Verticals | Primary path | Livia status |
|----------|-----------|--------------|--------------|
| **Treatwell** | hair, beauty | Partner reports + CSV | csv_plus_guide |
| **Calendly** | solo, consult | Scheduled events CSV | csv_plus_guide |
| **Google Calendar** | solo | OAuth calendar sync (partial) | oauth_planned |
| **Spreadsheet / paper** | all | Paste any CSV | csv_self_serve |

### Not yet catalogued (backlog)

Add rows when GTM density justifies: **Jane App**, **Goldie**, **Salon IQ**, **MioSalon**, **Kitomba**, **Rosy**, **Zenoti**, **Mangomint**, **GlossGenius**, **Squarespace Scheduling**, **Setmore**, **SimplyBook.me**, **MassageBook**, **ClubReady**, **Glofox**, **WellnessLiving**.

Process: extend `INCUMBENT_MIGRATION_SOURCES` in policy → export steps appear in onboarding picker automatically.

---

## Engineering roadmap (import)

Ordered by solo/small-studio activation impact:

| Phase | Work | Unlocks |
|-------|------|---------|
| **P0** (shipped) | Universal CSV, magic-setup API, fast-track onboarding UI, atlas policy | CSV switchers in minutes |
| **P1** | Acuity OAuth read (clients, appointments, appointment types) | Consult + solo wellness |
| **P1** | Square OAuth (bookings, catalog, team, customers) | Solo barber/beauty |
| **P1** | Fresha partner OAuth read | EU salon density |
| **P2** | Phorest partner CSV export job automation | IE/UK heartland |
| **P2** | Google Calendar → appointment import for Calendly-adjacent solos | |
| **P2** | File upload + Inngest background jobs (`IMPORT-MIGRATION-SPEC` §3) | Large files |
| **P3** | Mindbody / Vagaro forward-sync + parallel-run UI | Studios |
| **P3** | OpenAPI codegen for import routes | Typed clients |

---

## Support & concierge

When CSV is incomplete (Booksy, partial Phorest):

1. Owner picks platform → Liv shows honest steps.  
2. Magic setup applies whatever pasted.  
3. Owner completes **hours, Liv, public link** (blocking acts).  
4. Optional: support/concierge completes menu from booking URL screenshot.

**Never claim** “we pull everything automatically” until OAuth/broker is **live** for that platform (`livStatus` ≠ `oauth_planned`).

---

## Parallel run

Recommend when:

- Multi-staff salon (`studio` tier+)  
- Phorest, Fresha, Treatwell marketplace mix  
- Mindbody / Vagaro studios  

Solo chair-rental / single provider can **cut over same day** after upcoming appointments import.

---

## Acceptance criteria

- [ ] Owner on **Bringing my shop** sees platform picker filtered by vertical.  
- [ ] Liv walkthrough matches atlas steps for selected platform.  
- [ ] Magic setup imports ≥1 entity and completes relevant onboarding acts.  
- [ ] Fresh path unchanged (starter pack opt-in).  
- [ ] Settings → Integrations documents magic setup + single CSV.  
- [ ] Mobile onboarding continue shows source picker + import.  
- [ ] `pnpm run typecheck` passes.  
- [ ] No false OAuth marketing — broker panel shows honesty strings.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-21 | Initial atlas + fast-track onboarding delivery |
| 2026-05-31 | IMPORT-MIGRATION-SPEC (target API jobs — partial) |
