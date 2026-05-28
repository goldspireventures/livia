# v3 execution program — go big, whole product, alive

**Status:** Active (2026-05-22) — **only in-repo build plan**  
**Scope ledger:** [`../roadmap/v3-scope.md`](../roadmap/v3-scope.md)  
**Experience:** [`V3-EXPERIENCE-SPEC.md`](./V3-EXPERIENCE-SPEC.md)  
**Scenarios:** [`V3-REAL-WORLD-SCENARIOS.md`](./V3-REAL-WORLD-SCENARIOS.md)  
**Prerequisite:** v2 wrapped — [`V2-ENGINEERING-CLOSED.md`](./V2-ENGINEERING-CLOSED.md)  
**Off-platform (you):** [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md)  
**Matrix:** [`V3-SURFACE-MATRIX.md`](./V3-SURFACE-MATRIX.md)  
**Every release:** [`../engineering/release-pipeline.md`](../engineering/release-pipeline.md) § Whole-product release rule

---

## North star

> **Go big:** Livia ships as a **whole, alive product** every time — kernel, Liv, all seven surfaces, marketing truth — while solving **real booking chaos** (web → social handoff, no-shows, intake) and opening **DACH + medspa** in parallel, not as a mythical 2028 phase.

**Quality bar:** No shortcuts. A block is done when demoable on a design-partner path, matrix row updated, release sweep logged, and (if customer-facing) `marketing-vs-reality` row honest.

---

## §0 — Scope vs calendar

| | Role |
|--|------|
| [`v3-scope.md`](../roadmap/v3-scope.md) | **What** v3 includes |
| **This program** | **How** we build and ship |
| [`V3-REAL-WORLD-SCENARIOS.md`](./V3-REAL-WORLD-SCENARIOS.md) | **Why** — pains → blocks |
| Calendar in v3-scope | **Target**, not blocker — slip with audit; do not shrink scope silently |

**Hard gates (cannot code around):** medspa informed-consent **counsel per market**; SOC2 Type 2 for enterprise tier **marketing** claims; eval pass before voice claims go live.

---

## How we work through v3 (no rush, no half jobs)

| Phase | Focus | Exit |
|-------|--------|------|
| **Phase 0** | Block R + motion tokens (M1.1) + matrix discipline | Every PR has sweep row |
| **Phase 1** | **N** booking continuity + **M** public/inbox experience | Scenario 01 demo path |
| **Phase 2** | **A** payroll + **F** workflow depth (no-show, waitlist, design-proof) | Scenarios 05, 09, 16 |
| **Phase 3** | **I + J** DE + medspa packs + regulatory overlay | Scenarios 08, 14 |
| **Phase 4** | **B + C** internal + Liv OS | Scenario 20 |
| **Phase 5** | **D + E + G** channels, mobile parity, API | Social OAuth honesty |
| **Phase 6** | **L** enterprise + **H** full verification | v3 acceptance in scope ledger |

Phases overlap where safe; **Phase 1 is the soul** — if booking still feels dead, later locale packs won’t save it.

---

## Block R — Whole-product release rule (every ship)

*Canonical process: [`../engineering/release-pipeline.md`](../engineering/release-pipeline.md)*

Every production release (semver tag) must touch **all product surfaces** — at minimum a documented pass:

| # | Surface | Minimum per release |
|---|---------|---------------------|
| 1 | API + DB | Changelog + migrations note if N/A |
| 2 | Dashboard | Smoke / E2E row or “no change” |
| 3 | Mobile | OTA notes or “no change” |
| 4 | livia.io | Copy/changelog sync if customer-facing |
| 5 | Public `/b` | Disclosure + booking smoke if Liv touched |
| 6 | Internal portal | Version banner or “no change” |
| 7 | Policy / Liv packs | Version bump if vertical/locale changed |
| 8 | Docs | `docs/changelog.md` + matrix row |

**PR rule:** No merge that only updates one artifact without **release sweep row** in PR description (template in PRODUCT-GRADE-BAR).

---

## Block M — Livia experience (alive / fluid / real)

*Spec: [`V3-EXPERIENCE-SPEC.md`](./V3-EXPERIENCE-SPEC.md)*

| ID | Work | Exit |
|----|------|------|
| M1.1 | Motion token doc + web/mobile/marketing constants | Shared import |
| M1.2 | Public `/b` **Next steps** panel after confirm | E2E + reduced-motion |
| M1.3 | Inbox unified thread UI (badges, attachments, stagger) | Manager ritual |
| M1.4 | Booking detail **continuity timeline** | Events from Block N |
| M1.5 | Mobile haptics + list motion parity | My Day + bookings |
| M1.6 | livia.io demos match `/b` confirm beat | Screenshots honest |
| M1.7 | WCAG motion/sound audit extension | CI script |
| M1.8 | Pack-driven tone: hair celebratory vs medspa calm | CSS vars |

---

## Block N — Booking continuity (channel unity)

*Scenarios: 01–03, 06–07, 13 — [`V3-REAL-WORLD-SCENARIOS.md`](./V3-REAL-WORLD-SCENARIOS.md)*

| ID | Work | Exit |
|----|------|------|
| N1.1 | `booking-continuity-bridge` workflow on `BOOKING_CREATED` | Inngest + tests |
| N1.2 | `continuity-templates` in policy packs (hair, beauty, DE) | Versioned copy |
| N1.3 | Outbound via channel router (SMS/WA/email first) | Metering + audit |
| N1.4 | `booking.media[]` + upload from thread | API + dashboard thumbs |
| N1.5 | Booking status `pending_continuity` → `confirmed` | Staff one-tap + Liv assist |
| N1.6 | **Stuck bookings** queue (web, no reply 24h) | Owner/manager home |
| N1.7 | IG deep-link handoff (optional) + `LIV-{id}` token | Documented fallback when no API |
| N1.8 | Service guard questions on public book (duration) | Scenario 06 |
| N1.9 | Settings: continuity mode + stylist handle → template | Not decorative IG field |
| N1.10 | E2E: web book → SMS thread → attach → confirm | Runbook |

**Principle:** Instagram is a **channel**, not a second booking system. Thread SoT lives in Livia; IG is optional last mile.

---

## Track 1 — Platform depth (kernel + ecosystem)

### Block A — Payroll & people handoff

*[`LIVIA-COMPLETE-SYSTEM-SPEC.md`](./LIVIA-COMPLETE-SYSTEM-SPEC.md) §7 · [RFC 0012](../rfcs/0012-hours-to-payroll-export.md)*

| ID | Work | Exit |
|----|------|------|
| A1.1 | Payroll-ready export (IE/GB CSV) | Toolkit / settings |
| A1.2 | Pre-flight checks | Block export with fixes |
| A1.3 | BrightPay IE connector | ≥1 DP on prod |
| A1.4 | Hire packet export | DocuSign / partner stub |
| A1.5 | Liv pay-run briefing | Today |

### Block B — Internal portal

| ID | Work | Exit |
|----|------|------|
| B2.1–B2.7 | Health, Liv traces, flags, incidents, impersonation, claim drift, connectors | [`livia-internal-portal-spec.md`](../company/livia-internal-portal-spec.md) |
| B2.8 | Booking continuity trace viewer | N events visible |

### Block C — Liv OS

| ID | Work | Exit |
|----|------|------|
| C3.1–C3.5 | DB registry, event matrix, memory, eval CI, no rules in chat service | [`LIV-OPERATING-SYSTEM.md`](./LIV-OPERATING-SYSTEM.md) |
| C3.6 | Continuity + intake tools in registry | N + Liv assist |

### Block D — Channels & voice

| ID | Work | Exit |
|----|------|------|
| D4.1 | OAuth brokers or ADR + claim cut | marketing-vs-reality |
| D4.2–D4.4 | UK + Nordic voice honesty | Eval + copy |
| D4.5 | Meta IG messaging integration or ADR “deep-link only” | N1.7 |

### Block E — Mobile parity

| ID | Work | Exit |
|----|------|------|
| E5.1–E5.4 | Rota create, hiring, classes, franchise glance | Native or documented web SoT |
| E5.5 | Thread reply + attachment from mobile | N parity |

### Block F — Workflow depth

| ID | Work | Exit |
|----|------|------|
| F6.1 | Waitlist auto-offer | Scenario 16 |
| F6.2 | Design-proof approve → book | Scenario 09 |
| F6.3 | Healing / recovery check-ins | Tattoo pack |
| F6.4 | Partner-vote / escalation | Host workflows |
| F6.5 | Package credits | Product, not scaffold |
| F6.6 | No-show / cancel policy enforce | Scenario 05 |
| F6.7 | Running-late broadcast | Scenario 07 |

### Block G — Public API

| ID | Work | Exit |
|----|------|------|
| G7.1–G7.2 | Partner API alpha + webhooks doc | Sandbox |

---

## Track 2 — Expansion (go big: DACH + medspa)

*Ledger: [`v3-scope.md`](../roadmap/v3-scope.md)*

### Block I — Locales (DACH first, then FR/NL)

| ID | Work | Exit |
|----|------|------|
| I1.1 | `de-DE` locale pack (policy, money, holidays, templates) | Onboarding + Liv text |
| I1.2 | German voice cast + eval golden paths | ADR 0016 pass |
| I1.3 | `fr-FR` text-first pack (no voice until eval) | marketing + onboarding |
| I1.4 | Regulatory disclosure overlay (Impressum, FR cookies) | livia.io + public `/b` |
| I1.5 | livia.io `/verticals` + pricing copy for DE market | Honest claims |
| I1.6 | DE continuity templates (formal tone) | N1.2 |

### Block J — Verticals (medspa + allied health adjacency)

| ID | Work | Exit |
|----|------|------|
| J1.1 | `medspa` vertical pack + services seed | Policy |
| J1.2 | `medspa-informed-consent` workflow | Counsel-signed per market |
| J1.3 | `medical-intake-comprehensive` | Body-art framework extended |
| J1.4 | Dashboard surfaces for consent + intake | Owner review queue |
| J1.5 | Allied health adjacency pack (physio/hygiene/coaching) | **Not** primary clinical care |
| J1.6 | marketing-vs-reality rows for medspa | Before any DE campaign |
| J1.7 | Medspa motion/copy variant (calm confirm) | M1.8 |

**Explicit line:** appointment-based + health **adjacency** — not GP/surgical primary care.

### Block P — Adjacent appointment verticals

| ID | Work | Exit |
|----|------|------|
| P1.1 | `pet-grooming` vertical pack + vocabulary | Policy + onboarding |
| P1.2 | `pets` / `booking_pets` schema + API (list/create) | Dashboard customer pet tab |
| P1.3 | `automotive-detailing` pack + marketing `/verticals` | livia.io |
| P1.4 | Continuity templates for pet + detailing | N1.2 |
| P1.5 | Entitlements `vertical_pack_pet_grooming` | Plans |

---

## Track 3 — Enterprise foundations (Block L)

| ID | Work | Exit |
|----|------|------|
| L3.1 | C9 large chain (10+ shops) tier hooks | Billing + nav |
| L3.2 | Enterprise audit export (SOC2 evidence pack) | v1 CSV/zip |
| L3.3 | SSO provisioning stub (SAML/OIDC) | One IdP test |
| L3.4 | BYOK rotation — ADR + schema only until customer | No false marketing |

---

## Block H — Verification

| ID | Work | Exit |
|----|------|------|
| H8.1 | typecheck + API tests | CI |
| H8.2 | E2E: continuity, payroll, internal, DE smoke, medspa consent | Runbook |
| H8.3 | Matrix green or ADR-deferred | [`V3-SURFACE-MATRIX.md`](./V3-SURFACE-MATRIX.md) |
| H8.4 | **Release sweep** on every prod tag | § Block R |

---

## Operating rules

1. **Whole Livia every release** — Block R is non-optional.  
2. **Alive before locale** — Phase 1 (M + N) before claiming DE/medspa marketing.  
3. Founder lane never blocks eng PRs; it **does** block medspa/enterprise **marketing** claims.  
4. Parallel tracks: platform and expansion both advance when Phase 1 exit met.  
5. Liv: registry + policy — no ad-hoc business logic in chat routes.  
6. New market/vertical → eval + `marketing-vs-reality` row **same PR** as pack.  
7. Scenario without block ID → add row to scenarios doc before coding.

---

## Progress

| Track / block | Status |
|---------------|--------|
| R Release rule | ✅ template + `scripts/v3-release-check.sh` |
| M Experience | ✅ |
| N Booking continuity | ✅ (IG API ⏸) |
| P Pet / detailing | ✅ |
| A Payroll | ✅ CSV + preflight |
| B Internal | ✅ traces + platform v3 |
| C Liv OS | 🟡 |
| D Channels | 🟡 (OAuth honesty) |
| E Mobile | 🟡 |
| F Workflows | ✅ |
| G Public API | ✅ alpha |
| I DACH/FR locale | ✅ text; voice ⏸ |
| J Medspa / allied | ✅ eng; counsel ⏸ campaigns |
| L Enterprise | ✅ stub + audit export |
| H Verify | ✅ typecheck + tests |

**Engineering closure:** [`V3-ENGINEERING-CLOSED.md`](./V3-ENGINEERING-CLOSED.md). **Founder lane** remains for commercial ship.

---

## Definition of v3 complete

Engineering may call v3 **closed** when:

1. All acceptance rows in [`v3-scope.md`](../roadmap/v3-scope.md) are ✅ or ⏸ with ADR.  
2. [`V3-SURFACE-MATRIX.md`](./V3-SURFACE-MATRIX.md) shows no ❌ for P0/P1 rows without deferral.  
3. Scenario 01–05, 14, 20 have automated or runbook proof.  
4. Last five prod tags each have release sweep recorded.  
5. Founder lane items for commercial ship documented separately — not mixed into eng close.
