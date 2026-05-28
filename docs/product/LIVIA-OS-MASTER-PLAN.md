# Livia OS — Master Plan (finalized)

**Status:** Approved for execution — 2026-05-24  
**North star:** Livia is the **operating system** for appointment-based businesses — one engine, **vertical × country** experiences, **automation first**, correct actors (staff / manager / owner / customer / Livia internal).

**Supersedes:** ad-hoc UX fixes without surface matrix.  
**Companion:** [`LIVIA-IDEA-TO-REALITY.md`](./LIVIA-IDEA-TO-REALITY.md) · [`VERTICAL-PRODUCT-MODEL.md`](../testing/VERTICAL-PRODUCT-MODEL.md) · UX audit [`UX-FULL-PLATFORM-AUDIT-2026-05-24.md`](../testing/UX-FULL-PLATFORM-AUDIT-2026-05-24.md)

---

## 1. Decisions locked

| Topic | Decision |
|-------|----------|
| **Toolkit “Operations” tiles** | **Removed** — duplicate nav, no user value |
| **Toolkit page** | **Keep as “Liv command”** only: briefing, Ask Liv, payroll/enterprise exports for founders — **not** a second app map |
| **Hiring / job board** | **Removed** from product (UI + API routes). Team growth = **Staff → Invite** + onboarding acts |
| **Running late** | **≤1 tap** from Today, Floor, My chair, **booking detail**; per-appointment + all-today |
| **Time off** | **Staff requests for self**; **managers approve** in queue; Liv may propose; no default “manager files for staff” |
| **Branding** | **All verticals** get theme tokens; **country/jurisdiction** overlays legal + comms + deposit copy |
| **Empty states** | No placeholder cards (lifecycle, graduations, “no steps now”) — **hide until qualified** |
| **Visual audit** | Run `pnpm e2e:full-visual-audit` before each major phase; captures deleted after findings committed to audit doc |

---

## 2. Vertical × country matrix (revenue-complete)

### 2.1 Vertical packs (shipped + planned)

| Vertical | `business_vertical` | Status | Distinct UX priorities |
|----------|---------------------|--------|-------------------------|
| Hair & barbering | `hair` | Live | Chair utilisation, colour consult, walk-ins |
| Beauty & nails | `beauty` | Live | Patch tests, tech assignment, treatment menus |
| Tattoo & piercing | `body-art` | Live | **Design proofs**, image share, consult-before-session |
| Wellness & spa | `wellness` | Live | Day packages, room capacity, calm tone |
| Fitness & PT | `fitness` | Live | Classes, packs, member sessions |
| Medspa & aesthetics | `medspa` | Live | Clinical hub, consent, treatment plans |
| Allied health | `allied-health` | Live | Patients, care programmes, **not salon copy** |
| Pet grooming | `pet-grooming` | Live | Pet profile, parent language, rebook cadence |
| Automotive detailing | `automotive-detailing` | Live | Vehicle/bay, make/model on book |

### 2.2 Vertical packs (research — add to enum + policy)

| Vertical | Rationale | Livia wedge |
|----------|-----------|-------------|
| **Dental / oral care** | High regulation, recurring hygiene | Recall automation, insurer notes, consent |
| **Veterinary** | Pet vertical extension | Multi-pet, vaccine records, emergency triage inbox |
| **Mental health / counselling** | Session-based, privacy-heavy | Shorter Liv replies, no marketing SMS defaults |
| **Home services** (cleaning, trades) | Travel time, job slots | Route-aware late, deposit by job size |
| **Education / tutoring** | Term packages | Parent + student, cancellation policy |
| **Childcare / classes** | Guardian booking | Pickup auth, allergy fields |
| **Events / venue hire** | Slot + capacity | Package tiers, deposit schedules |
| **Professional services** (legal, accounting) | Appointment + intake | Intake forms, document upload |
| **Home care / nursing** | Recurring visits | Carer rota, family portal read-only |
| **Hospitality spa (hotel)** | Room + therapist | Multi-resource packages (extends wellness) |

Each new vertical requires: `VerticalPack` in `@workspace/policy`, demo seed shop, theme tokens, Liv tool allowlist, 1 e2e visual pass.

### 2.3 Country / jurisdiction (not optional)

Already in `@workspace/policy` (`IE`, `GB`, `DE`, `FR`, …): affects **deposits, SMS opt-in, AI disclosure, cancellation hours, currency, locale, EU region**.

| Dimension | Implementation |
|-----------|----------------|
| Legal copy on public book | `jurisdictionPack.bookingTermsIntro` |
| Liv first message | `aiDisclosure.chatFirstMessage` |
| Receipts / invoices | Currency + VAT line rules per country (Phase F) |
| Payroll export | Country formats (Phase F) |

**Rule:** `business.country` + `locale` drive **comms templates**, not just labels.

---

## 3. Who needs what (expansion — attract and retain)

### 3.1 Customer (public / B2C)

| Need | Today | Build |
|------|-------|-------|
| Easy book + reschedule | Public `/b/:slug` | Vertical-themed; fewer steps on mobile |
| Understand AI disclosure | Partial | Jurisdiction footer on chat |
| **Running late (customer-initiated)** | No | “I’m running late” → notifies business |
| **Post-visit feedback** | No | Liv asks 24h after; NPS + private comment → owner inbox |
| **Receipt / confirmation** | Email partial | Branded receipt page + resend |
| **Aftercare** | No | Vertical workflows: tattoo care, medspa, physio exercises |
| **Share images** (tattoo) | Design proofs staff-side | Customer upload in thread + proof approval |

### 3.2 Staff

| Need | Today | Build |
|------|-------|-------|
| My day / next client | `/my-day` | Vertical prep card (last visit notes) |
| Request own leave | New request flow | Remove manager-on-behalf default |
| Running late for **my** next apt | Buried | One tap on My chair |
| Commission / tips | No | Phase F optional |

### 3.3 Manager / front desk

| Need | Today | Build |
|------|-------|-------|
| Queue + approve | Inbox | Leave approval queue with badge |
| Floor calendar | Bookings | Running late bulk + per-row |
| Walk-in | Partial | Quick book widget on Floor |
| **Customer feedback triage** | No | Feed in Queue |

### 3.4 Owner

| Need | Today | Build |
|------|-------|-------|
| Today signal | Dashboard | Vertical home modules only |
| Liv briefing | Partial | Toolkit → Liv command on Today |
| **CFO-style reports** | Chain partial | Revenue, utilisation, no-show cost, SMS spend — export CSV |
| Peer insights | Settings | Keep entitlement-gated |
| Brand on public | logoUrl | `brandAccentHex` + vertical theme |

### 3.5 Founder / multi-site

| Need | Today | Build |
|------|-------|-------|
| Chain glance | `/chain` | Rollup + drill-down |
| Brand wall | `/brands` | Isolation audit |
| Cross-shop late | No | Phase E |

### 3.6 Livia internal team

| Need | Today | Build |
|------|-------|-------|
| Tenant search | livia-internal | Keep |
| Support tickets | Partial | Full queue + automation hints from audit/booking context |
| Workflow pauses | Platform tab | Link from ticket |

---

## 4. Dynamic / multi-purpose UI (cleverness without clutter)

| Pattern | Use |
|---------|-----|
| **Context rail** on booking detail | Actions change by status (confirm → running late → complete → feedback) |
| **Adaptive home** | Dashboard sections ordered by `vertical` + `tier` + data (e.g. hide revenue on day 1) |
| **Liv suggestion chips** | Inbox + Today from real events, not static cards |
| **Unified “Notify” sheet** | Running late, reminder, custom SMS — one component, three backends |
| **Media thread** | Conversations + design proofs + tattoo ref images — one attachment model |
| **Feature flags** | `vertical-features.ts` + entitlements — route never registers for wrong vertical |

---

## 5. Information architecture (final)

### Primary nav (owner)

`Today` · `Queue` · `Floor` · `People` · `[vertical ritual]` · `Settings`

Removed from nav: **Hiring**, **Toolkit** (optional footer link “Liv command” for founders only).

### Toolkit (if kept)

- Liv briefing + deep links to Settings (Liv, policy, comms)
- Founder: payroll / enterprise export only
- **No Operations grid**

### Quick actions (global)

- Running late (this apt / today)
- Report issue
- New booking (role-gated)

---

## 6. Execution phases

### Phase 0 — Repo & docs hygiene (ongoing, start now)

- [ ] This plan + UX audit doc
- [ ] Remove dead hiring references from surface matrices
- [ ] `docs/product/SURFACE-MATRIX-V3.md` single source
- [ ] `.gitignore` visual-captures; delete captures after audit
- [ ] Align `TEST-EVERY-BUSINESS.md` with owner-per-slug sign-in

### Phase A — Trust & IA (week 1) **✓ done**

- [x] Delete hiring UI + unmount API routes
- [x] Toolkit: remove Operations; slim Liv command
- [x] Running late: sheet + `POST /bookings/:id/running-late` + surfaces (Today, booking detail, My chair, list row)
- [x] Time off: staff self-serve only; manager approval queue on Rota
- [x] Conditional Lifecycle nav
- [x] `applyVerticalTheme` + tokens for **all 9** current verticals
- [x] Lifecycle empty cards hidden until suggestions
- [x] Bookings list row: running late per row

### Phase B — Vertical depth (weeks 2–3) **✓ done**

- [x] Per-vertical home modules (dashboard `VerticalHomeModules`)
- [x] Public booking theme per vertical + jurisdiction footer (existing API overlay + hero)
- [x] Inbox seeds for body-art, pet-grooming, fitness demo shops
- [x] Liv tool catalog per vertical (recommended tool badges in Settings → Liv)
- [x] Booking detail context rail
- [x] Liv-runtime vertical packs for all 9 verticals
- [x] Activity feed uses vertical `locationNoun` (not “Shop settings updated”)

### Phase C — Customer OS loops (week 4) **✓ done**

- [x] Post-visit feedback (24h SMS → `/b/:slug/visit/:token` → owner Today strip)
- [x] Aftercare workflows (body-art, medspa, allied-health, wellness — 2h SMS)
- [x] Branded visit page (receipt summary on guest link)
- [x] Customer “running late” on guest visit link

### Phase D — New verticals (rolling)

- [ ] Research pack: dental, vet, mental-health (priority by GTM)
- [ ] Enum + migration + demo seed + theme

### Phase E — Multi-site & CFO (week 5+) **✓ done**

- [x] Chain reports export (`GET /me/chain-rollup/export.csv` + Chain page button)
- [x] Cross-shop alerts (`alerts[]` on chain rollup — web Chain + mobile Glance)

### Phase F — Internal ops & automation (parallel week 4) **✓ done**

- [x] Support context bundle API + internal portal tenant detail
- [x] Support ticket triage on create (`context.triage` — priority, tags, suggested reply)
- [x] Internal portal ticket-first IA (Support tab default, urgent-first sort)

### Phase G — Mobile parity **← IN PROGRESS**

- [x] Visit feedback strip on Today (`VisitFeedbackCard`)
- [x] Cross-shop alerts on Glance + founder Today strip
- [ ] Remaining gaps in `WEB-MOBILE-PARITY.md` (settings depth, toolkit)

### Phase I — Production certification **✓ done (baseline)**

- [x] Logging: `request_id` on errors, Sentry tags at request start, PII redact paths
- [x] Internal ops: trace endpoint, Sentry deep link, support triage, trace UI
- [x] Security: CORS allowlist, demo off in prod, webhook fail-closed, public staff DTO, booking rate limit
- [x] Onboarding: second-shop `parentBusinessId`, go-live → create booking, testBooking auto-check + A12 gate
- [x] Onboarding analytics events per completed act
- [x] Dashboard/support: `requestId` in errors and tickets
- [x] `replyDomainError` on core routes (bookings, businesses, billing, public, chat, support)
- [x] Docs: `PRODUCTION-CERTIFICATION.md`, `ONBOARDING-PRODUCTION.md`
- [ ] Loki sink + full route `sendError` sweep

### Phase H — Quality gates (after all product phases)

**Rule:** Full platform visual audit runs only when Phases A–G are code-complete — then screenshot → adjust → repeat until no screen can help users better without real-world usage feedback.

- [ ] `pnpm e2e:full-visual-audit` final pass (not during active build)
- [ ] axe critical routes
- [ ] No vocabulary leak test (allied-health must not match `/shop|balayage|stylist/i` in UI copy)

---

## 7. Definition of done (platform)

1. Every route in surface matrix has owner + vertical acceptance row.  
2. Public booking understandable in **5s** (value prop + next step obvious).  
3. No duplicate nav / no empty graduation cards.  
4. Running late reachable in **≤2 clicks** from floor contexts.  
5. All 9 verticals visually distinguishable in screenshot compare.  
6. Hiring absent from OpenAPI surface (routes 404).  
7. Support path: Report issue → ticket → internal queue.

---

## 8. Build order (immediate)

1. Phases A–C product code (current)  
2. Phase D–G as scoped  
3. `pnpm demo:provision` + `pnpm db:push` for new tables  
4. **Final** `pnpm e2e:full-visual-audit` + human pass — loop until “cannot help better” bar  
5. Update `UX-FULL-PLATFORM-AUDIT-2026-05-24.md` once at sign-off
