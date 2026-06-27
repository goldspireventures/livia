# PLS coverage gaps — paths not yet exercised

**Purpose:** Nothing left untouched. This is the honest backlog of routes, flows, and surfaces **not** covered (or only landing-level probed) during PLS Waves 1–5 (2026-06-27).

**Exercised summary:** 145 screenshot steps · prod persona UAT 26/26 (mostly **URL/load** probes) · 0 content-audit failures on captured screens.

**Authority:** [`PLATFORM-LIFE-SIMULATION-PROGRAM.md`](../product/PLATFORM-LIFE-SIMULATION-PROGRAM.md) · [`PLS-RUN-LOG.md`](PLS-RUN-LOG.md)

**Legend**

| Status | Meaning |
|--------|---------|
| **Landing** | Page loads / screenshot of entry only — no multi-step flow |
| **Partial** | Some personas or verticals only |
| **None** | Not in PLS captures or prod probes |
| **API only** | HTTP probe, no signed-in or guest UX walkthrough |

---

## 1. Guest / public (`/b`, `/book`, `/e`, `/my`)

| Path / flow | PLS status | Notes / pack to add |
|-------------|------------|---------------------|
| `/b/{slug}` book **wizard** (service → slot → confirm) | **Landing** | W2 captured 52 slugs at step 1 only — need **complete booking** + deposit path per vertical |
| `/b/{slug}` **rebook** / return guest | **None** | Pack D — second visit from `/my` |
| Guest tokens: `/pay`, `/balance`, `/proof`, `/intake`, `/waitlist`, `/visit`, `/shop` | **None** | `test:guest-tokens` · demo proof/pay/waitlist E2E |
| `/my` OTP **success** → vault home | **Landing** | W1/W5 sign-in screen only; OTP delivery 503 on prod (API probed) |
| `/my/account`, `/my/{slug}`, visit manage | **None** | Pack D unhappy + happy |
| `/p/{slug}` premises public | **None** | Vertical: wellness / multi-site |
| Event vendor `/e/{slug}` subpages (enquire, gallery, services, about) | **Landing** | W2 site home only |
| Event vendor tokens `/e/.../q`, `/mood`, `/planner` | **None** | Event-vendor wedge E2E |
| Public **Liv chat** on `/b` (multi-turn, disclosure) | **API only** | persona:uat first-reply disclosure — no UI capture |
| Guest **retail cart** on public shop token | **None** | `test:guest-retail-cart` |

---

## 2. Dashboard — signed-in owner / staff / founder

### 2a. Core ops routes (by persona)

| Route | Founder | Owner | Manager | Staff | Reception | PLS |
|-------|---------|-------|---------|-------|-----------|-----|
| `/dashboard` | ✓ | ✓ partial | ✓ | ✓ | — | Partial (5 verticals + staff) |
| `/my-day` | — | — | — | ✓ | — | W2 staff only |
| `/inbox` | ✓ W3 | ✓ slices | ✓ | — | ✓ | **Landing** — no thread open/reply/handoff |
| `/bookings` | ✓ ctx | partial | ✓ | ✓ | ✓ | **Landing** |
| `/bookings?create=1`, `/bookings/new` | ✓ ctx | partial | — | — | — | **None** in PLS |
| `/bookings/:id` detail | ✓ ctx | **None** | **None** | **None** | **None** | Actions: confirm, cancel, pay link, report issue |
| `/customers`, `/customers/:id` | ✓ ctx | partial | ✓ | ✓ | ✓ | **Landing** — no profile/history |
| `/staff`, `/staff/:id` | ✓ ctx | partial | ✓ | — | — | **None** in PLS |
| `/services` | ✓ ctx | partial | ✓ | — | — | **None** in PLS |
| `/lifecycle` | ✓ ctx | partial | — | — | — | **None** in PLS — sacred metric checklist |
| `/audit` | ✓ ctx | partial | — | — | — | **None** |
| `/toolkit` | — | **None** | — | — | — | founder-uat luxe only |
| `/chain` | ✓ | single-shop edge W3 | — | — | — | **Partial** — borrow submit not captured |
| `/onboarding` fresh + import acts | partial | partial | — | — | — | W4 switching; not full G0–G6 fresh path |
| `/legal-acceptance` | **None** | **None** | — | — | — | Sacred prod signup |

`ctx` = covered in `contextual-audit-web.spec.ts`, not PLS wave manifests.

### 2b. Settings tabs (all personas)

| Tab | PLS | Gap |
|-----|-----|-----|
| account | Partial | W5 owner implicit |
| shop | Partial | founder-uat medspa booking link strip |
| appearance + public preview | **None** in PLS | founder-uat bloom/luxe |
| liv | ✓ W1/W2 | Learning evidence UI after `pls:simulate` not re-captured |
| comms | ✓ W4 | Channel connect/simulate not executed |
| billing | ✓ | **Live Stripe checkout** not exercised |
| legal | **None** | |
| integrations / migration | ✓ W4 | **File import upload** not executed |
| parallel-run | Partial W4 | Compare flow not run |

### 2c. Vertical-specific owner routes

PLS owner slices touched **medspa, beauty-store, wellness/reception, fitness settings** only. **Not visited** in PLS (need per-vertical owner sign-in):

| Route cluster | Verticals |
|---------------|-----------|
| `/medspa` | medspa (partial W2) |
| `/beauty-reception`, `/beauty-tv`, `/beauty-store` | beauty |
| `/wellness-reception`, `/wellness-tv`, `/wellness-retail`, `/wellness-reports`, `/wellness-chain`, `/wellness-audit-diary`, `/wellness-guest-vault`, `/wellness-corporate`, `/corporate-wellness` | wellness |
| `/classes`, `/studio-setup` | fitness |
| `/host`, `/brands`, `/rota`, `/franchise`, `/premises`, `/day-packages` | hair / chain |
| `/design-proofs`, `/enquiries`, `/quotes`, `/event-site` | event-vendors |
| `/store` | retail crossover |

**Target:** one signed-in owner pass per `BusinessVertical` in registry (not just demo slug landing on `/b`).

---

## 3. Gateway & demo (G1–G3)

| Flow | PLS | Gap |
|------|-----|-----|
| G1 `/demo` launcher | ✓ W3 | |
| G2/G3 per wedge (5 verticals) | ✓ W3 | Locked G1 cards · barber/tattoo/pet/fitness wedges |
| `/demo/open`, `/demo/:persona` showcase | **None** | Role enter → live demo tenant |
| `/demo` **off on prod** redirect | **None** | Pack F unhappy — prod only |
| Marketing → app handoff with gate key | **None** | `marketing-demo-gate` |

---

## 4. Marketing (livia.io / livia-hq.com)

| Route | Prod probe | PLS capture |
|-------|------------|-------------|
| `/`, `/pricing`, `/how-it-works`, `/verticals`, `/get-started`, `/contact` | ✓ | Partial (4 pages W1, beauty W3) |
| `/verticals/:slug` (all verticals) | index only | **None** except beauty |
| `/demo`, `/book-demo` redirect | ✓ | Partial |
| `/for/chair-rental`, `/europe`, `/eu-ai`, `/de` | **None** | **None** |
| `/legal/privacy`, `/legal/tos`, `/legal/dpa` | **None** | **None** |
| `/changelog`, `/status` | **None** | **None** |
| Get-started → sign-up **full funnel** | **None** | Sacred path (prod founder) |

---

## 5. Auth & sacred path (production truth)

| Flow | Status |
|------|--------|
| Real **prod sign-up** → legal → onboarding → first book | **None** — `sacred-path-signup` E2E exists, not PLS-captured |
| **Prod sign-in** existing founder | **Landing** (sign-in page only) |
| Clerk **session refresh / expiry mid-flow** | Partial W3 (anonymous redirect only) |
| **Help/support ticket submit** | Dialog opened W4 — **submit not executed** |
| **Addon purchase** (Stripe live) | **None** |

---

## 6. Internal ops (`:5175`)

| Surface | PLS W4 | Gap |
|---------|--------|-----|
| Support inbox / radar / board / investigate | ✓ | |
| liv_error ticket thread | ✓ | |
| Tenant detail | ✓ | |
| Monitoring / continuity / flags / reports / platform | ✓ landing | Log search UX, alert ack, report export |
| **Impersonation** `/access` | Landing | Execute audited tenant open |
| **Voice** `/voice` | Landing | |
| Auto-triage **quality review** (human rubric) | **None** | Pack G rubric in PLS program §10.3 |
| Support ticket **status update** / assign | **None** | |

---

## 7. Mobile (Expo)

| Surface | Status |
|---------|--------|
| Entire mobile app | **None** — Maestro skipped (no emulator) |
| Flows: gateway, sign-in, owner today, personas, verticals | **None** — see `maestro/flows/*.yaml` |

---

## 8. Workflows, integrations & unhappy matrix

| Scenario | Status |
|----------|--------|
| Inngest job runs visible (booking-reminder, liv-was-wrong) | Keys set; **no UI proof** of downstream effect |
| Liv **learning pass** UI after simulation | `pls:simulate` run — **settings/liv evidence not re-shot** |
| Meta/Twilio **connect + inbound** | Comms limits captured — **no live send** |
| Migration **OAuth broker** connect | Honest limits UI — **no OAuth dance** |
| Migration **file import** job progress | Panel visible — **upload not run** |
| OTP **503** guest messaging on prod | API probe only |
| API **rate limit / 503** owner surfaces | **None** |
| **WORKFLOWS_DISABLED** behaviour | **None** |
| Webhook **retry** visibility (internal) | **None** |

---

## 9. Automated suites not folded into PLS

Run separately; results not in PLS manifest:

| Suite | Command |
|-------|---------|
| Full contextual web (all personas × routes × settings) | `pnpm e2e:contextual-web` |
| Founder UAT P0 (21 cases) | `pnpm test:founder-uat` |
| Sacred path signup | `pnpm test:sacred-path-signup` |
| Guest token suite | `pnpm test:guest-tokens` |
| Demo depth (pay, proof, intake, waitlist) | `pnpm test:demo-depth` |
| Platform / EU full | `pnpm test:e2e:platform` |
| Innovation / northstar pixel gates | `pnpm test:innovation-p0`, `pnpm test:northstar-p0` |
| Internal monitoring API | `internal-monitoring-gate.spec.ts` |
| Mobile Maestro | `pnpm maestro:visual-capture` |

---

## 10. Suggested Wave 6+ packs (close the gaps)

| Pack | Scope | Est. steps |
|------|-------|------------|
| **H — Guest depth** | Complete book + rebook + all token types × 3 slugs | ~30 |
| **I — Owner ops depth** | bookings/:id, customers/:id, inbox thread, lifecycle, audit | ~25 |
| **J — Vertical owner matrix** | Sign in as owner per vertical → hub route + settings shop | ~40 |
| **K — Marketing complete** | All marketing routes + legal + vertical pages | ~20 |
| **L — Mobile Maestro** | All flows on emulator | ~15 |
| **M — Prod sacred path** | Real sign-up on staging/prod + first book screenshot trail | ~12 |
| **N — Unhappy matrix** | Session expiry mid-book, checkout fail, OTP fail UX, demo-off prod | ~15 |
| **O — Internal execute** | Impersonation, ticket update, monitoring log drill | ~10 |

**Definition of “nothing untouched”:** every row in §1–§8 at least **Partial** (landing + one happy action) before mobile handoff is considered complete for web.

---

## 11. Tracking

When a gap closes, append to [`VISUAL-AUDIT-LOG.md`](VISUAL-AUDIT-LOG.md) and bump the row here to **Done** with wave id.

Last updated: 2026-06-27 (post Wave 5 closeout).
