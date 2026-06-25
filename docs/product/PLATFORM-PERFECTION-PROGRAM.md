# Platform perfection program

**Status:** canonical operating doc (2026-06-21)  
**Method:** `.cursor/rules/livia-build-from-blueprint.mdc` — dissect before build, inside-out, no patches  
**North star:** V1 sacred metric — **first booking** · operational trust · people-business OS (internal vision, external simplicity)

Related: [`V1-PRODUCT-DEFINITION.md`](V1-PRODUCT-DEFINITION.md) · [`ONBOARDING-MIGRATION-PROGRAM.md`](ONBOARDING-MIGRATION-PROGRAM.md) · [`REPO-VS-BLUEPRINT-GAP-MATRIX.md`](REPO-VS-BLUEPRINT-GAP-MATRIX.md) · [`docs/testing/VISUAL-AUDIT-LOG.md`](../testing/VISUAL-AUDIT-LOG.md)

---

## 1. What “spectacular” means (all hats in one room)

| Hat | Question every screen must answer |
|-----|-----------------------------------|
| **CEO** | Does this advance “trust us to run your business”? |
| **CPO** | Is the next step obvious? Does it reduce owner/guest anxiety? |
| **CTO** | Is behaviour policy-driven and wired end-to-end? |
| **Design** | Clean, calm, premium — not cluttered, not dev-facing |
| **CS** | Could a stressed owner at 9pm understand this without support? |
| **CRO** | Is the path to book / pay / upgrade honest (no fake buttons)? |

**External V1 promise:** Get booked · stay organized · communicate · get paid — from one place.  
**Not in customer UI:** Business Twin, marketplace, “OS” category jargon, staging codes, broker IDs.

---

## 2. Personas & surfaces (audit matrix)

| Persona | Primary surfaces | Sacred path |
|---------|------------------|-------------|
| **Founder (new)** | sign-up → legal → onboarding → `/book` test | Register → bookable → first booking |
| **Owner** | dashboard, bookings, customers, services, settings, lifecycle | Daily ops + activation checklist |
| **Staff** | my-day, inbox (role-gated) | Today’s work, not admin |
| **Guest** | `/book/{slug}`, `/my`, pay/visit/proof | Book in ≤2 min; relationship vault |
| **Demo visitor** | marketing, G1–G3 gateway | Wedge story → role enter — no dead ends |
| **Internal ops** | internal portal | Support registry, not customer copy |

Each persona gets a **screen inventory row** in `VISUAL-AUDIT-LOG.md`: route · actions available · expected next step · P1/P2/OK.

---

## 3. Bi-directional inspection method

### Outside-in (user sees screen)
1. What is this page for? (one sentence)
2. What can I do here? (actions)
3. What should I do next? (natural flow)
4. Too much / too little? Labels clear? Tone human?
5. What breaks trust? (fake connect, jargon, errors, clutter)

### Inside-out (system supports screen)
1. Policy / tenant-experience source for copy
2. API + state that powers actions
3. Onboarding / capability gates
4. Sibling surfaces (web ↔ mobile ↔ guest)
5. E2E that proves the path

**Stop rule:** If outside-in expectation ≠ inside-out capability → fix spine first, not copy alone.

---

## 4. Flow catalog (strip → verify → perfect)

### A. Acquisition & trust
- [ ] Marketing → app sign-up/sign-in (custom Livia forms, no Clerk chrome leak)
- [ ] Legal acceptance (plain language, no dev notes)
- [ ] Gateway G1–G3 (wedge, roles, demo — vs target PNGs)

### B. Onboarding (Wave A–F)
- [x] Path pick (fresh vs import)
- [x] Fast track G0–G6 (see `ONBOARDING-MIGRATION-PROGRAM.md`)
- [x] Migration honesty (no fake connect)
- [x] Go-live = real test book on `/book`
- [x] Sacred path automated gate — `pnpm sacred-path:signup` (sign-up, not demo)

### C. Owner daily loop
- [ ] Dashboard / today — one briefing, vertical-aware
- [ ] Bookings list → detail → actions (confirm, cancel, pay, message)
- [ ] Customers → profile → history
- [ ] Services / staff / hours — vertical nouns from tenant-experience
- [ ] Inbox / channels — no “not configured” without next step
- [ ] Settings — integrations use `MigrationSwitchPanel`, not broker grid

### D. Guest loop
- [ ] Book wizard — hub autofill, deposit honesty, errors human
- [ ] `/my` — OTP sign-in (**no staging codes in prod**)
- [ ] Visit / pay / proof / waitlist tokens
- [ ] Event-vendor `/e/*` enquiry → quote → pay

### E. Activation & proof
- [x] `/lifecycle` sacred metric checklist
- [x] Sacred path signup E2E (`sacred-path-signup` Playwright project)
- [ ] Gate 2 field script (10 Dublin shops)
- [ ] Founder Bucket C sign-off
- [ ] Production keys/secrets plugged (Clerk, Stripe, Meta, guest DNS)

### F. Depth / vertical (after core proof)
- [ ] Medspa, wellness chain, event-vendor, etc. — only after P0 paths green

---

## 5. Copy & UX standards (production bar)

| Rule | Example violation → fix |
|------|-------------------------|
| No staging/dev in prod | “Staging code 000000” → gate behind `stagingRelaxed` only |
| No salon-default on non-beauty | Use `GET /me/tenant-experience` vocabulary |
| No fake CTAs | “Connect” when tier is `file_only` |
| Human errors | `HTTP 422` → plain sentence + what to do |
| One primary CTA per card | Duplicate “Book” + “Manage” on same row |
| Dev galleries off prod | `/experience/*` behind `!isProductionCustomerSurface` |

---

## 6. Release train (streamlined — no patch culture)

| Gate | Command / artifact |
|------|-------------------|
| Blueprint | Program doc updated if behaviour changes |
| Spine | `pnpm run typecheck` · `pnpm propagation:check` · `pnpm vertical:check` |
| Contract | `pnpm codegen` if OpenAPI touched |
| Visual P0 | `pnpm e2e:visual-audit:all:web` + log in `VISUAL-AUDIT-LOG.md` |
| Founder | `pnpm founder:uat-preflight` + manual Bucket C |
| Occupancy | Gate 2 evidence · real first bookings |

**Release rule:** No feature ships without its flow row marked in §4 and at least one E2E or founder script step.

---

## 7. Phased perfection (order)

| Phase | Focus | Exit |
|-------|-------|------|
| **P0 Trust** | Prod copy leaks, fake buttons, error surfaces | No dev/staging strings on customer prod |
| **P1 Sacred path** | Founder onboard → import → book → open | Founder script green |
| **P2 Guest** | Book + `/my` P0a re-verify on staging | VISUAL-AUDIT-LOG P1 closed |
| **P3 Owner core** | Dashboard, bookings, customers, settings coherence | Persona E2E green |
| **P4 Mobile parity** | Morph gaps, honest handoffs | `WEB-MOBILE-PARITY.md` P0 closed |
| **P5 Vertical depth** | 9 verticals same parity bar | GTM program sign-off |
| **P6 Northstar** | Screen families → northstar density | Pixel tighten post-UAT |
| **P7 Era 2** | Twin, advisor, commerce intel | **After** V1 occupancy proof |

---

## 8. Screenshot audit protocol

1. `pnpm e2e:prep` · `pnpm dev:full-stack`
2. `pnpm e2e:visual-audit:all:web` (~368 routes) · optional `pnpm e2e:full-visual-audit:mobile`
3. Review `e2e/visual-captures/` — log each finding in `VISUAL-AUDIT-LOG.md`
4. Fix P1 → re-capture → mark Verified
5. `pnpm e2e:ux-punch-list` for aggregated punch list

**Per screenshot ask:** Layout · copy · CTAs · next step · clutter · vertical fit · trust.

---

## 9. Current audit snapshot (2026-06-21)

### Solid
- Policy cascade + 9 verticals + guest hub engineering
- Bucket B dashboard density; migration ingest spine
- E2E inventory (~70 specs); founder UAT pipeline

### Fix now (P0 trust) — in progress
- Guest OTP staging codes gated to non-prod
- Cross-surface demo copy split from prod copy
- Settings migration uses honest `MigrationSwitchPanel`

### Perfect next (P1–P2)
- Founder sacred path script + CI
- Gateway/mobile sign-in parity (G-SIGN-2)
- Subdomain book live (DNS flag)
- Event catalog on all mutations (spine coherence)

### Occupancy (market ready)
- Bucket C founder sign-off · Gate 2 · real MRR — **not yet**

---

*This doc is the main building plan. Trades update their section; inspector updates `VISUAL-AUDIT-LOG.md`.*
