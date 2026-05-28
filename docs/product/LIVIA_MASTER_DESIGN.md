# Livia — master design (paper architecture)

**Status:** v0.1 living document (2026-05-20).  
**Purpose:** Single place for **constituencies**, **surfaces**, **Liv capability model** (including staff scheduling and beyond), **multi-app decision**, and **phasing** so engineering and GTM do not drift.  
**Does not replace:** `docs/personas.md`, `docs/verticals.md`, `docs/roadmap/v1-scope.md`, ADRs — it **indexes and reconciles** them.

---

## 1. Category definition (what Livia *is*)

**Livia** (company): European-anchored operator platform for **appointment-based service businesses** — businesses whose core unit of value is **scheduled time with a skilled human** (and sometimes a room, chair, or device).

**Liv** (agent): Named colleague — not “AI features.” Customers meet Liv on **public** channels; staff and owners meet Liv inside **tenant** products.

**Not the category:** generic SMB CRM, generic chatbot, marketing blast tools, full clinical EHR, dental imaging, mental health records — explicit **nevers** or **partner-only** in `verticals.md` and positioning.

**Market context (external research, high level):**  
Spa/salon/booking software markets are forecast to grow materially through the 2030s; vendors bundle **scheduling, CRM, POS/payments, marketing, analytics**. AI integration is a recurring trend. Medspa adjacency grows faster but carries **heavier compliance**. Livia’s wedge is **character-led operator depth + EU posture + audit trust** — not “another calendar.”

---

## 2. Constituencies (everyone Livia serves)

| Constituency | Relationship | Primary surfaces | Data sensitivity |
|----------------|-------------|------------------|------------------|
| **P7 End customer** | Books / chats / calls the business | Public booking web, SMS, WhatsApp, voice | PII, payment, conversation |
| **P5 Staff** | Delivers service | Mobile (flagship), optional tablet | Own slate + clients they serve |
| **P6 Reception** | Routes floor | Mobile + tablet + inbox | Multi-staff schedule |
| **P3 Manager** | Approvals, floor | Web + mobile | Escalations, refunds |
| **P2 Owner / P1 Founder** | Owns outcome | Web cockpit + mobile + digest | Revenue, policies, all tenants |
| **Livia Inc operators** | Run the company (you) | **Internal portal** (see company spec) | Cross-tenant **support** data, billing, incidents |
| **Prospect / public** | Evaluates Livia | Marketing site, demo gateway | Marketing cookies only |
| **Regulators / auditors** | Trust | Published legal, DPA, audit evidence | Minimal direct access |

**Design rule:** No single “persona” in the **tenant** app stands in for P7. P7 is always **World B** (public modalities). Staff app routes that implied “customer persona” were a **model bug** — fix in implementation (see ADR 0009 / product README).

---

## 3. Worlds and surfaces (architecture, not one binary)

```text
World A — Tenant staff & owners (Clerk, business_memberships)
  A1 Mobile app (Expo)     — day-of flagship (ADR 0011)
  A2 Web dashboard (Vite) — cockpit + configuration + heavy analytics
  A3 Optional tablet/kiosk — reception landscape, check-in

World B — Customers (no staff login)
  B1 Public booking + chat — /b/{slug} (+ embed later)
  B2 WhatsApp / SMS        — conversational modality
  B3 Voice                 — per-tenant number; deepest wedge where scoped

World C — Livia corporate
  C1 Marketing (livia.io)
  C2 Legal / status / changelog

World D — Livia Inc internal (Livia employees, NOT tenant Clerk org)
  D1 Internal ops portal   — support, tenant health, incidents, feature flags
  D2 Admin APIs            — strictly separated auth (no tenant JWT overlap)
```

### 3.1 One app vs many apps (decision)

**Conclusion: one *consumer-facing* tenant app is wrong for “everything.”**  
A single binary that is simultaneously: deep cockpit, AI trainer, billing portal, public customer PWA, and internal god-mode — becomes unmaintainable and insecure.

**Recommended product architecture (same monorepo, multiple deployables):**

| Artifact / app | Audience | Auth | Notes |
|----------------|----------|------|-------|
| `livia-mobile` | Tenant staff + owners | Clerk tenant | Keep flagship; no internal god-mode |
| `livia-dashboard` | Tenant owners/managers | Clerk tenant | Configuration + cockpit |
| Public routes on dashboard **or** future `livia-booking` | P7 | Session / guest | SEO + lightweight; can split if bundle size hurts |
| **`livia-internal`** (new when ready) | Livia Inc | Separate IdP (Clerk separate instance, or SSO) | Support console, impersonation with policy |
| `livia-marketing` | Prospects | None | Already separate |

**Why split internal:** blast radius, SOC2 scope, accidental `businessId` leak, and **mental model** — “I am in God mode” must look visually different from “I am in Luxe Salon.”

**Why not 10 apps:** shared `lib/db`, `api-spec`, policy packs, design tokens — monorepo stays (ADR 0006).

---

## 4. Liv capability model (what Liv can grow into)

Capabilities are grouped by **operating loop**. Each capability has: **modality** (M1–M4), **minimum role**, **vertical gate** (from `verticals.md`), **rung** (R1–R5 from positioning), **workflow doc** if any.

### 4.1 Revenue protection (book + keep + recover)

| Capability | Description | Vertical gate | Workflow / feature |
|------------|-------------|---------------|-------------------|
| Omnichannel book | Visual + DM + voice | v1 hair; v2+ expand | `workflows/book.md` |
| Drift recovery | Re-engage lapsed regulars | v1 | passive + conv |
| Deposits / no-show | Policy + caps | v1 | `no-show.md` |
| Refund ladder | Cap-bound approvals | v1 | `refund-request.md` |
| Waitlist promote | Fill cancelled slots | v1.5+ | spec when built |

### 4.2 Staff scheduling & workforce (your stretch — full design)

**Vision:** Liv does not only “see bookings” — she **maintains the roster**: who is on floor, who is training, who swapped, who is near overtime, who is double-booked across chairs.

| Sub-capability | Owner/staff value | Data model hints | Phase |
|----------------|-------------------|------------------|-------|
| **Shift templates** | Week rhythm (Tue–Sat 9–6) | `shift_pattern`, `business_hours` | v1.5 |
| **Rota generation** | Propose week from template + PTO | `shifts`, `shift_assignment` | v1.5 |
| **PTO / time-off** | Request → approve | exists `time-off-request.md` | v1 |
| **Swap / cover** | Peer swap with manager optional approve | `shift_swap_request` | v2 |
| **Skill × service matching** | Only qualified staff for service | links `staff_skills` ↔ services | v2 |
| **Compliance hours** | Max hours, break rules (jurisdiction) | policy pack | v3 |
| **Payroll export** | Hours → CSV for payroll provider | integration | v3 (not in-house payroll) |

**Realistic constraint:** roster + payroll law differs by country; **do not** claim “global scheduling law” in v1. Ship **duration + conflict + PTO** first; add jurisdiction packs later.

### 4.3 Customer memory & CRM

| Capability | Phase |
|------------|-------|
| Unified customer profile (visits, prefs, allergies, channel prefs) | v1 CRM depth hair |
| CT1–CT6 typology-driven tone | v1 text |
| Before/after photos (camera) | Gate 3 native (ADR 0011 N6) |

### 4.4 Inbox & handoff

| Capability | Phase |
|------------|-------|
| Thread list + take-over + audit | v1 / Gate 2 |
| WhatsApp 24h session rules | v1 |
| Owner “pause Liv” | v1 Settings |

### 4.5 Money (shop, not Livia invoice)

Stripe Connect for deposits/tips (pricing doc). **Never** mix tenant customer card data with Livia Inc billing without PCI scope clarity.

### 4.6 Trust & governance (product, not appendix)

| Capability | Phase |
|------------|-------|
| Audit log search | v1 |
| Hash chain integrity | v1 acceptance |
| Impersonation with banner + log | internal portal + policy |
| “Liv was wrong” rollback classes | `liv-was-wrong.md` |

### 4.7 Intelligence (cross-tenant)

Scaffolding only at v1 per ledger; real insights when k≥10 — see `policy/cross-tenant-intelligence.md`.

---

## 5. Screen & function inventory (how to complete “every screen”)

The repo already has **140+ docs** including journeys and features. What was missing was a **single routing table**. Process:

1. Export OpenAPI paths → tenant API surface.
2. List Expo routes + dashboard routes.
3. Build matrix: **Route × Persona × Role × Vertical variant × Empty/loading/error**.
4. Store result in `docs/product/SCREEN-INVENTORY.md` (automation optional).

Until that file exists, treat **journeys/** as the authoritative narrative coverage and **features/** as module specs.

---

## 6. Phasing (vision vs ship)

| Phase | Horizon | Summary |
|-------|---------|---------|
| **Target state** | 24–36 mo | Full `verticals.md` waves; voice per locale; roster depth; optional outcome pricing |
| **v3 roadmap** | See `roadmap/v3-scope.md` | Chain, multi-brand, etc. |
| **v1 ledger** | `v1-scope.md` | Current legal/eng commitment |

**Forward-thinking without lying:** build **modular policy packs** (jurisdiction × vertical) in API from early phases so UI expansion is **configuration**, not rewrite.

---

## 7. “Best product ever seen” — measurable criteria

Non-exhaustive scorecard:

| Pillar | Metric |
|--------|--------|
| Trust | Audit drill passed; zero marketing-vs-reality reds at gate |
| Depth | Rung targets met for wedge cell (P2b × hair) |
| Latency | Chat p95; voice first-token; push delivery |
| Reliability | SLOs, incident MTTR, SEV1 “Liv wrong” budget |
| Access | WCAG 2.2 AA on web; mobile a11y audit |
| Leave | Export works day 1 |
| Economics | Design partner ROI documented |

---

## 8. Open decisions (need founder sign-off)

1. **Widen v1 verticals** — yes/no; if yes, RFC + counsel + eval budget (see `TARGET-STATE-VS-SHIP-SCOPE.md`).
2. **Internal portal stack** — new Vite app vs isolated dashboard route tree behind separate Clerk instance.
3. **Public booking** — stay on dashboard host vs dedicated subdomain app for performance/branding.
4. **Chair rental / host** — v1.5 per ledger; confirm when to expose in UI.

---

## 9. Document control

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 0.1 | 2026-05-20 | Staff + founder direction | Initial master design |

Changes that affect ship scope **must** update roadmap + audit docs in same PR.
