# Beta Showcase Program — full Livia, no vertical left behind

**Status:** Active (2026-05-24)  
**Goal:** Beta impresses with near-complete OS breadth; v1 commercial wedge can still be narrower later.  
**Canonical with:** [`LIVIA-OS-MASTER-PLAN.md`](./LIVIA-OS-MASTER-PLAN.md), [`../verticals.md`](../verticals.md), [`LIV-OPERATING-SYSTEM.md`](./LIV-OPERATING-SYSTEM.md)

---

## 1. Revenue principle

Every appointment business vertical in [`verticals.md`](../verticals.md) must have a **declared coverage tier** — demo shop, Today widget, mandate defaults, or honest “partner-only” with nearest pack. Silent gaps = lost revenue.

| Vertical (doc) | Code pack | Beta demo shop | Today / mandate | Notes |
|----------------|-----------|----------------|-----------------|-------|
| V1 Hair | `hair` | Core IE/UK demos | Full | Heartland |
| V2 Beauty | `beauty` | Bloom Beauty Dublin | Full | Heartland |
| V3 Wellness | `wellness` | Harbour Wellness Cork | Full | Gift-voucher copy |
| V4 Body art | `body-art` | Ink & Anchor Galway | Proof-first mandate | Design proof prominent |
| V5 Fitness | `fitness` | Peak Fitness Dublin | Class capacity widgets | Package credits |
| V6 Medspa | `medspa` | Clarity Medspa Dublin | Consent-heavy mandate R1 max | Regulatory overlay |
| V7 Allied health | `allied-health` | Motion Physio Cork | Treatment-plan language | Not full EHR |
| V8 Dental | — | — | Map → `allied-health` preview | **Partner-only**; never solo ship |
| V9 Mental health | — | — | Map → `wellness` preview | **Partner-only**; special-category data |
| V10 Pet grooming | `pet-grooming` | Paws Parlour Dublin | Pet on booking | Temperament notes |
| V11 Adjacent solo | — | — | Calendly parity only | Defer; salon focus |
| **Automotive** | `automotive-detailing` | Shine Studio Belfast | Vehicle fields | EU valeting wedge |

**Country packs (beta):** IE, GB, DE, DK, FR — jurisdiction packs in `lib/policy`; flagship demos per country in Phase 3.

---

## 2. Company hierarchy — screens + automated reports

| Role (membership v2) | Primary surfaces | Automated report (email/push/in-app) |
|----------------------|------------------|--------------------------------------|
| OWN Owner-operator | Today, mandate, billing | Owner morning briefing, weekly digest |
| ADM Manager | Approvals, rota, inbox | Manager ops digest (pending, no-shows) |
| ADM-D Delegated admin | Scoped team | Team pending summary |
| STA Staff | My day, own calendar | Staff day sheet |
| REC Reception | Inbox, book | Handoff queue digest |
| OWNER_HOST Chair host | Rent roll, renters | Host rent collect report |
| Franchise ops (chain) | Rollup dashboard | Multi-site health (founder) |
| **Livia Inc** | Internal portal | Platform health, support SLA |

API: `GET /api/businesses/:id/reports` + `GET .../reports/:slug` (persona-filtered).  
Internal: Knowledge tab + monitoring (existing).

**Future (Phase 4):** Accountant read-only export tease, supplier PO digest, marketing agency read-only.

---

## 3. Liv Mandate — trust ramp (centre of beta)

Owner-configured permission envelope. Autonomy rungs **R0–R4**:

| Rung | Name | Behaviour |
|------|------|-----------|
| R0 | Observe | Suggest only; no side effects |
| R1 | Propose | Queue proposals; human approves |
| R2 | Act bounded | Auto inside caps (€, %, time window) |
| R3 | Act routine | Auto for allowlisted action types |
| R4 | Mandated | Full allowlist minus hard stops |

Stored in `business.operational_policy.livMandate` (jsonb). Proposals in `liv_action_proposals`.

**Vertical defaults:** medspa/allied-health start R1; hair/beauty R2; body-art R1 (proof); fitness R2.

---

## 4. Internal ops — company-grade

| Module | Status | Phase |
|--------|--------|-------|
| Tenant search + health | Shipped | — |
| Support queue + Liv bundle | Shipped | — |
| Monitoring + alerts | Shipped | — |
| **Knowledge hub** (business + eng docs) | Phase 1 | This program |
| Runbook links in tenant detail | Phase 2 | |
| Impersonation workflow | Phase 3 | Spec in `company/livia-internal-portal-spec.md` |

Docs served read-only from repo `docs/` via `/api/internal/ops/docs` (path-safe). Canonical index: [`DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md).

---

## 5. Build phases (fit maximum per phase)

### Phase 1 — Foundation ✅
- [x] In-app notification centre (web + mobile)
- [x] Mobile demo persona + business scoping
- [x] Liv Mandate schema + resolver + proposals table + API
- [x] Internal Knowledge hub (docs browser)
- [x] Persona reports API (owner/manager/staff digests)
- [x] Automotive demo shop + vertical coverage registry
- [x] Mandate defaults on business create
- [x] Public `GET /public/vertical-coverage`
- [x] This program doc + DOC index link

### Phase 2 — Mandate UX + vertical Today ✅
- [x] Mandate settings (dashboard Settings → Liv + mobile `/liv-mandate` + More menu)
- [x] Per-vertical Today insights API + web/mobile cards
- [x] DK flagship (`copenhagen-havn-wellness`) + FR (`paris-belle-vue`) market shops
- [x] Liv proposal approve/dismiss (web dashboard + mobile Approvals)
- [x] Internal tenant runbook links → Knowledge tab
- [x] Demo seeds: pending tattoo proof, fitness class session

### Phase 3 — Country depth ✅
- [x] `country-locale-pack.ts` + `public-holidays.ts` (IE, GB, DE, DK, FR)
- [x] Public profile `countryPack` + localized booking headings
- [x] Slots engine blocks public holidays
- [x] Market shop `countryShowcase` metadata seed

### Phase 4 — Hierarchy expansion ✅
- [x] Host rent roll report (persona API + mobile host mark-paid)
- [x] Franchise rollup mobile `/franchise`
- [x] Accountant preview report + CSV tease (web + mobile)
- [x] Demo chair-host link (Aurora → Conor's) + franchise link

### Phase 5 — Internal excellence ✅
- [x] Workforce SSO status banner (`INTERNAL_CLERK_*`)
- [x] Ticket-gated impersonation intent (no tenant JWT)
- [x] Internal feature flags UI
- [x] Weekly platform report (markdown)

---

## 6. Verification

- `pnpm --filter @workspace/api-server test` (mandate resolver unit tests)
- `pnpm e2e` notification + demo sign-in specs
- `docs/testing/FULL-VISUAL-AUDIT-WEB-MOBILE.md` after UI phases
- Internal: sign in with `INTERNAL_OPS_SECRET`, open Knowledge tab, load `DOC-CANONICAL-INDEX.md`
