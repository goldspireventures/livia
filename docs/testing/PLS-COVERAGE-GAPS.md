# PLS coverage gaps — paths not yet exercised

**Purpose:** Nothing left untouched. Tracks routes/flows vs PLS Waves 1–10 (2026-06-27).

**Latest run:** **311 screenshot steps · 0 content-audit failures** · `pnpm pls:gaps-closeout` · report `artifacts/pls/PLS-FINAL-REPORT-2026-06-27.json`

**Authority:** [`PLATFORM-LIFE-SIMULATION-PROGRAM.md`](../product/PLATFORM-LIFE-SIMULATION-PROGRAM.md) · [`PLS-RUN-LOG.md`](PLS-RUN-LOG.md)

**Legend**

| Status | Meaning |
|--------|---------|
| **Done** | PLS wave captured (W6–W10) or equivalent suite green |
| **Partial** | Landing + one action; not full unhappy matrix |
| **Open** | Not covered — blocks mobile only if web-prod truth |

---

## 1. Guest / public — **Done (W6)**

| Path / flow | Status | Wave |
|-------------|--------|------|
| Book wizard landings (6 slugs) | **Done** | W6-H |
| Book wizard depth (mobile sticky + best-effort desktop) | **Done** | W6-H |
| Guest tokens pay/proof/intake/balance/waitlist/quote | **Done** | W6-H |
| Visit token pages (API book → `/visit`) | **Done** | W6-H |
| Event vendor subpages + quote token | **Done** | W6-H |
| `/my` OTP success + `/my/account` | **Done** | W6-H (dev/staging OTP) |
| Public premises `/p/dundrum-house` | **Done** | W6-H |
| Guest retail cart on `/b` | **Done** | W6-H |
| Public Liv chat open | **Done** | W6-H |
| Guest rebook from vault (second visit UX) | **Open** | manual / future |
| Prod OTP delivery (503) guest copy | **Partial** | API probe only on prod |

---

## 2. Dashboard signed-in — **Done (W7–W8 + contextual-web)**

| Area | Status | Wave |
|------|--------|------|
| Owner core routes + all settings tabs | **Done** | W7-I |
| bookings/:id, customers/:id, staff/:id | **Done** | W7-I |
| Inbox thread open | **Done** | W7-I |
| lifecycle, audit, toolkit, bookings/new | **Done** | W7-I |
| Founder chain + staff borrow form | **Done** | W7-I |
| Help/support ticket submit | **Partial** | W7 (retry bloom/inbox) |
| Vertical owner hubs (all registry slugs) | **Done** | W8-J |
| franchise, premises, day-packages | **Done** | W8-J |
| Live Stripe addon checkout | **Open** | prod keys — demo grant only |
| Migration file import execute | **Partial** | panel visible W4; upload not run |

---

## 3. Gateway & demo — **Done (W9 + W3)**

| Flow | Status | Wave |
|------|--------|------|
| All 10 wedge G2/G3 stories | **Done** | W9-K |
| `/demo/open`, `/demo/:persona` showcase | **Done** | W9-K |
| Marketing → sign-up handoff | **Done** | W9-K |
| `/demo` off on prod redirect | **Open** | prod-only unhappy |
| Marketing demo gate key handoff | **Open** | `marketing-demo-gate` E2E |

---

## 4. Marketing — **Done (W9-K)**

All routes in `MARKETING_ROUTES` captured: `/`, pricing, verticals index + all slugs, legal, contact, `/de`, `/eu-ai`, changelog, status, etc.

---

## 5. Auth & sacred path

| Flow | Status | Notes |
|------|--------|-------|
| Demo onboarding fresh intent | **Done** | W10-M |
| Real prod/staging sign-up → first book | **Open** | `pnpm sacred-path:signup` |
| Legal acceptance (fresh founder) | **Partial** | anonymous redirect W10-N |

---

## 6. Internal ops — **Done (W10-O + W4)**

| Surface | Status | Wave |
|---------|--------|------|
| Voice `/voice` | **Done** | W10-O |
| Impersonation form filled | **Done** | W10-O |
| Monitoring log search | **Done** | W10-O |
| Ticket thread + status UI | **Done** | W10-O |
| Auto-triage human rubric | **Open** | manual CS review |

---

## 7. Mobile — **Code + API parity (no emulator)**

| Surface | Status | Command |
|---------|--------|---------|
| Screen file map vs web PLS (43 surfaces) | **Done** | `pnpm pls:mobile-parity` |
| Maestro testID hooks in source | **Done** | same (3 legacy maestro ids warn-only) |
| Forbidden copy scan (app/components) | **Done** | same |
| Guest + operator API spine | **Done** | `mobile-entry-smoke` inside parity |
| Authenticated mobile APIs | **Done** | `pnpm pls:mobile-api` |
| Maestro screenshots | **Manual — you** | [`MOBILE-MANUAL-VISUAL-CHECKLIST.md`](MOBILE-MANUAL-VISUAL-CHECKLIST.md) |

**Verdict:** Emulator not required for logic/API/code parity. Your device visual pass closes the last gap.

---

## 8. Unhappy matrix — **Partial (W10-N)**

| Scenario | Status |
|----------|--------|
| Invalid guest tokens | **Done** | W10-N |
| OTP bad request UX | **Done** | W10-N |
| Session cleared mid-book reload | **Done** | W10-N |
| Anonymous protected routes | **Done** | W10-N |
| Liv learning UI post-simulate | **Done** | W10-M |
| WORKFLOWS_DISABLED / webhook retry UI | **Open** |
| Live Meta/Twilio send | **Open** | honest limits only |

---

## 9. Bundled suites (run via `pls:gaps-closeout`)

| Suite | Status |
|-------|--------|
| contextual-web (all personas) | **Done** — 7/7 in gap closeout |
| guest-tokens | Run via closeout script |
| demo-depth | Run via closeout script |
| founder-uat 21/21 | Run via closeout script |
| sacred-path-signup | Run via `pnpm sacred-path:signup` |

---

## 10. Web ready for mobile?

| Gate | Status |
|------|--------|
| PLS W1–W10 captures | **311 steps, 0 content failures** |
| Prod persona UAT | **26/26** |
| Mobile code + API parity | **`pnpm pls:mobile-parity` + `pnpm pls:mobile-api`** |
| Mobile visual (device) | **Manual** — checklist |
| Prod sacred path | **Not started** |

**Verdict:** Web fully exercised locally. Mobile **logic parity automated**; you own the visual pass on device.

Last updated: 2026-06-27 (Waves 6–10 gap closure).
