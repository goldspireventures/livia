# v2 execution program — full build (v1.5 engineering merged)

**Status:** **Engineering closed** (2026-05-22) — archived reference; see [`V2-ENGINEERING-CLOSED.md`](./V2-ENGINEERING-CLOSED.md) · [ADR 0020](../adr/0020-v2-engineering-close-boundary.md)  
**Spec:** [`V2-EXPANDED-SCOPE.md`](./V2-EXPANDED-SCOPE.md) + [`../roadmap/v2-scope.md`](../roadmap/v2-scope.md) + [`../roadmap/v1.5-scope.md`](../roadmap/v1.5-scope.md) (heartland ledger)  
**Matrix:** [`V2-SURFACE-MATRIX.md`](./V2-SURFACE-MATRIX.md)  
**Off-platform (you):** [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md) — **not a blocker for engineering**

### Finality

- **Engineering done (v2):** ✅ **Closed 2026-05-22** per ADR 0020 — matrix snapshot in [`V2-SURFACE-MATRIX.md`](./V2-SURFACE-MATRIX.md).
- **Product shipped (commercial):** [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md) only — **not** blocked on further v2 PRs.
- v1.5 is **not** a separate active program — see [`V1.5-TO-V2-BRIDGE.md`](./V1.5-TO-V2-BRIDGE.md).
- **Next in-repo:** v3 program (deferred list in [`V2-ENGINEERING-CLOSED.md`](./V2-ENGINEERING-CLOSED.md)).

---

## North star

> **UK + Nordics** on **fitness, body art, wellness**, plus **heartland org shapes** (host, chain, multi-brand, hiring) — one OS, locale-native Liv.

---

## Block A — Heartland carryover (ex-v1.5 engineering)

*Merged from v1.5 program; ship here, not in a separate version backlog.*

### A0 — Beta deferrals

| ID | Work | Exit |
|----|------|------|
| A0.1 | Mobile morning briefing | ✅ Today owner/admin |
| A0.2 | Mobile policy parity | Read + web deep links |
| A0.3 | Mobile channel merge | Client detail |
| A0.4 | WCAG axe P0 fixes | `pnpm a11y:routes` + fixes |
| A0.5 | Load smoke | `pnpm smoke:load` in CI optional |

### A1 — Locale & beauty (v1.5)

| ID | Work | Exit |
|----|------|------|
| A1.1 | Beauty onboarding + demo | `vertical=beauty` E2E |
| A1.2 | EN-GB jurisdiction + TZ | GB shops |
| A1.3 | UK voice disclosure + flag | Comms + env |
| A1.4 | Vertical pack entitlements | Billing gates |

### A2 — Org shapes (v1.5)

| ID | Work | Exit |
|----|------|------|
| A2.1 | Chair-rental host API + `/host` | No renter PII |
| A2.2 | Multi-brand portfolio `/brands` | Brand wall test |
| A2.3 | Staff shifts + `/rota` | Web + mobile menu |
| A2.4 | Hiring intake `/hiring` | Full workflow vs CRUD |
| A2.5 | Chain rollup + staff-borrow | CTA + workflow depth |
| A2.6 | Peer insights settings | k≥10 gate wired |
| A2.7 | Senior-w-admin scoped policy | Refund/time-off tests |

### A3 — Workflows & integrations (v1.5)

| ID | Work | Exit |
|----|------|------|
| A3.1 | `host-rent-collect` notify | Email/SMS not just DB |
| A3.2 | `hire` full intake | v1.5-scope workflow |
| A3.3 | `partner-vote` UI | C12 depth |
| A3.4 | Booksy CSV | ✅ |
| A3.5 | Fresha/Square/GCal live or ADR | OAuth or claim removed |
| A3.6 | Liv prompt store | ✅ versioned API |
| A3.7 | Brand-wall integration test | CI |

**Migrations:** `004-v15-chair-rental.sql`, `005-v15-hiring.sql`, `010-v2-foundations.sql`

---

## Block B — Locale packs (UK + Nordics)

| ID | Work | Exit |
|----|------|------|
| B1.1 | `SE`, `DK`, `NO`, `FI` policy | ✅ packs |
| B1.2 | UK voice production | Eval pass + `UK_VOICE_ENABLED` |
| B1.3 | Nordic Liv corpora | DB prompt modules |
| B1.4 | Nordic payments | Klarna/Trustly stubs |
| B1.5 | Locale add-on billing | €29/mo |

---

## Block C — Vertical depth (v2 core)

| ID | Work | Exit |
|----|------|------|
| C2.1 | Class sessions API | ✅ |
| C2.2 | Waitlist + roster + check-in UI | `/classes` |
| C2.3 | Package credit ledger UI | Buy/burn |
| C2.4 | Design-proof flow | Upload → approve → book |
| C2.5 | Healing-followup workflow | 24h/7d/30d |
| C2.6 | Intake framework | Body-art + wellness |
| C2.7 | Unified calendar 1:1 + class | Mode toggle |

---

## Block D — C8 / C11 / C12

| ID | Work | Exit |
|----|------|------|
| D3.1 | `mid-chain` + checkout | ✅ catalogue |
| D3.2 | Franchise links + rollup | ✅ API; `/franchise` UI |
| D3.3 | `franchise-royalty-rollup` | Sunday report |
| D3.4 | `mid-chain-staff-promote` | Workflow |
| D3.5 | `partner-vote` full | Tally + notify |
| D3.6 | C8 ops dashboard | Chain enhancements |

---

## Block E — Surfaces (web + mobile)

| ID | Work | Exit |
|----|------|------|
| E4.1 | `/classes` | Manager |
| E4.2 | Package balance public | Customer |
| E4.3 | Design-proof reviewer | Owner |
| E4.4 | `/franchise` | Franchisor |
| E4.5 | Mobile classes + check-in | Staff |
| E4.6 | `livia-internal` voice cast | Ops |

---

## Block F — Integrations & platform

| ID | Work | Exit |
|----|------|------|
| F5.1 | Vagaro/Acuity/Timely/Mindbody | Live or stub+doc |
| F5.2 | GCal two-way | OAuth |
| F5.3 | DocuSign / consent export | Body-art |
| F5.4 | Public API alpha | Read-only partners |
| F5.5 | `class.*` webhooks | Partner doc |

---

## Block G — Workflows (Inngest)

| ID | Work | Exit |
|----|------|------|
| G6.1 | `class-booking` lifecycle | Remind + check-in |
| G6.2 | `tattoo-design-proof` | State machine |
| G6.3 | `intake-form-medical` | Pre-appt gate |
| G6.4 | `brand-mandated-promotion` | Franchise |

---

## Block I — Livia Internal (operator surface, v2)

| ID | Work | Exit |
|----|------|------|
| I1 | Tabbed portal: Tenants / Platform / Voice | `:5175` |
| I2 | `GET /internal/ops/platform-health` | Tenant count + flags |
| I3 | Locale cast registry view | v2 Nordics + UK |
| I4 | E2E `internal-gate.spec.ts` | CI optional |
| I5 | Align with [`livia-internal-portal-spec.md`](../company/livia-internal-portal-spec.md) | Roadmap for flags/incidents |

---

## Block J — livia.io (public marketing)

*First contact for prospects; must stay aligned with [`../audits/marketing-vs-reality.md`](../audits/marketing-vs-reality.md) and v2 wedge (UK + Nordics, fitness, body-art, host/franchise).*

| ID | Work | Exit |
|----|------|------|
| J1.1 | `pnpm dev:marketing` on `:5174` | Documented in E2E runbook |
| J1.2 | Claim audit — no dental hero; SMS-only channel honesty | `marketing-vs-reality` |
| J1.3 | Vertical pages + fitness / body-art | `/verticals/:slug` |
| J1.4 | Chair-rental host landing | `/for/chair-rental` |
| J1.5 | Pricing tiers incl. Host + mid-chain/franchise notes | `/pricing` |
| J1.6 | UK + Nordics positioning (honest rollout) | Home + how-it-works |
| J1.7 | Footer + demo link to dashboard | No dead `#` legal |
| J1.8 | Marketing E2E + gate3 smoke | `marketing-gate.spec.ts` |

**Map:** [`LIVIA-FULL-SURFACE-MAP.md`](./LIVIA-FULL-SURFACE-MAP.md)

---

## Block H — Verification (engineering exit)

| ID | Work | Exit |
|----|------|------|
| H7.1 | Typecheck + API tests | CI green |
| H7.2 | Persona UAT (v1.5 + v2 cells) | `UAT-CERTIFICATION.md` |
| H7.3 | Eval ADR 0016 | Vertical × locale |
| H7.4 | Matrix all green or ADR | `V2-SURFACE-MATRIX.md` |

---

## Operating rules

1. **Never** block a PR on founder ship lane items.  
2. UK W1 marketing before Nordics W3 voice.  
3. Franchisor / host: aggregate only — no downstream customer PII.  
4. Same bar as [`PRODUCT-GRADE-BAR.md`](../engineering/PRODUCT-GRADE-BAR.md).

---

## Progress (engineering only) — closed

| Block | Status at close |
|-------|-----------------|
| A | ✅ heartland web + API; mobile native where listed in matrix |
| B | ✅ policy packs; voice production → v3 |
| C | ✅ web + API scaffolds; workflow depth → v3 |
| D | ✅ franchise UI + API; mid-chain catalogue |
| E | ✅ web surfaces |
| F | ✅ broker registry + docs; live OAuth → v3 |
| G | ✅ Inngest registered; depth → v3 |
| I | ✅ MVP tabs (flags/incidents → v3) |
| J | ✅ livia.io |
| H | ✅ automated verification |

**Certificate:** [`V2-ENGINEERING-CLOSED.md`](./V2-ENGINEERING-CLOSED.md)

**Your lane (only open work):** [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md)

**v2 wrap-up (comprehensive):** [`V2-ENGINEERING-CLOSED.md`](./V2-ENGINEERING-CLOSED.md) — rest of v2 = founder lane + v3 seed only.
