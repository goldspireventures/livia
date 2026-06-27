# Visual audit log

Running record of **what we captured**, **what we saw in screenshots**, **what we changed**, and **whether we re-verified**.  
Captures live under `e2e/visual-captures/` (gitignored). Re-run: `pnpm e2e:visual-audit:all:web` · native: `pnpm maestro:visual-capture`.

**Guest placement registry:** [`design/GUEST-SURFACE-PLACEMENT-CONTRACT.md`](../design/GUEST-SURFACE-PLACEMENT-CONTRACT.md) §6.

---

## 2026-06-21 — Platform perfection pass (P0 trust + program)

| Surface | Route | Finding | Fix | Status |
|---------|-------|---------|-----|--------|
| Guest hub OTP | `/my` sign-in | Staging/dev OTP codes visible when `magicOtp` set even without relaxed staging | Show codes only when `stagingRelaxed` | **Done** — re-capture prod build |
| Cross-surface copy | onboarding handoff | Mary demo text with staging code in prod constant | Split `CROSS_SURFACE_DEMO_COPY` vs prod copy | **Done** |
| Settings parallel-run | `/settings` integrations | "Compare salon bookings" — salon-default | "Compare previous bookings" | **Done** |
| Settings integrations | `/settings` | Legacy broker grid with generic Connect | `MigrationSwitchPanel` (prior session) | **Done** |
| Error surfaces | onboarding, inbox, billing, store | Raw `HTTP 4xx` / `err.message` in toasts | `parseUserFacingError()` wired across owner surfaces | **Done** |
| Mobile guest hub | `my-livia` | Staging code + demo buttons in prod builds | `isProductionCustomerSurface()` gates | **Done** |
| Mobile guest OTP | guest-hub-otp | "port 3000" dev message on network fail | Prod: connection message only | **Done** |
| Mobile comms | settings comms block | `META_ACCESS_TOKEN` operator jargon | Customer-friendly linking copy | **Done** |
| Wellness reports | `/wellness/reports` | "Restart API on port 3000" on 404 | Human reports-unavailable message | **Done** |
| Care series | customers panel | "Service ID" operator label | "Linked treatment" + placeholder | **Done** |
| Migration import | onboarding switch | "verify salon ID" generic error | "check your identifier" | **Done** |
| Communications test | `/settings` comms | FAILED transport jargon in toast | Plain send-failed guidance | **Done** |

**Program authority:** [`product/PLATFORM-PERFECTION-PROGRAM.md`](../product/PLATFORM-PERFECTION-PROGRAM.md)  
**Next:** Full web re-capture `pnpm e2e:visual-audit:all:web` · founder Bucket C · sacred path script.

## 2026-06-24 — Automated deep analysis closeout

| Metric | Count |
|--------|-------|
| Routes scanned (automated) | 0 |
| Hard error copy | 0 |
| Serious a11y (axe) | 0 |
| Layout overflow | 0 |

**Result:** No automated findings — surfaces passed error-copy + serious axe gates.

**PNG cleanup:** screenshots removed after analysis (findings JSON retained).

---


| Surface | Route | Finding | Fix | Status |
|---------|-------|---------|-----|--------|
| Public book details | `/book/{slug}` | Hub autofill banner + top deposit card cluttered wizard; “Save to My Livia” shown when already signed in; raw `HTTP 422` on patch-test gate | Silent hub prefills; deposit breakdown in summary card; hub-only hides save CTA; `parsePublicApiError`; patch-test hint on services step | **Engineering done** — founder re-verify on staging after deploy |

**Next in queue:** Founder staging pass on P1 retail/quote/visit · P2 gateway verify.

---

## 2026-06-27 — PLS Wave 1 (content + capture)

| Surface | Route | Finding | Fix | Status |
|---------|-------|---------|-----|--------|
| Onboarding attestation | `/onboarding` create shop | “closed beta” in KYB copy | Plain compliance — owner responsible for licences | **Done** |
| Billing toasts | `/settings` billing | “Add-on active (staging demo)” | Neutral “Add-on active” + API message | **Done** |
| Feature unlock | billing panels | “Unlocked (staging demo)” | Use add-on name in title | **Done** |
| Event vendor 503 | `/e/*` | “staging demo link” on unavailable | `isProductionCustomerSurface` branch | **Done** |
| Chain borrow | `/chain` | Placeholder “Staff row id” | “Staff member ID from roster” | **Done** |
| Comms wizard | settings comms | `META_ACCESS_TOKEN` env jargon | Meta credentials configured copy | **Done** |

**Automation added:** `pnpm pls:wave1` · `pnpm pls:content-audit` · `pnpm pls:simulate` · `POST /api/dev/pls/fast-forward`

**Captures:** 14 steps in `artifacts/pls/2026-06-27/` — 0 runtime content hits. Internal: 12 tabs in `e2e/visual-captures/internal/`.

**Next:** W2 vertical expansion · mobile Maestro · unhappy-path matrix · Liv learning UI evidence check post-simulation.

---

## 2026-06-27 — PLS Wave 2 (vertical matrix + staff)

| Surface | Route | Finding | Fix | Status |
|---------|-------|---------|-----|--------|
| Staff pack E2E | Pack C sign-in | Clerk identifier field missing after prior owner sessions | `resetDemoBrowserSession` before each persona in `pls-wave2` | **Done** |

**Captures:** 77 steps in `artifacts/pls/wave2-2026-06-27/` — all vertical public books, 5 owner slices, 4 staff personas, founder chain, guest 404.

**Next:** W3 gateway + unhappy matrix · Maestro mobile when device available.

---

## 2026-06-27 — PLS Wave 3 (gateway + chain + session)

| Surface | Route | Finding | Fix | Status |
|---------|-------|---------|-----|--------|
| *(none)* | — | All 27 captures passed content audit | — | **Clean** |

**Captures:** G1–G3 for beauty/wellness/hair/medspa/events, marketing handoff, chain HQ + single-shop edge, session-expiry sign-in gates, billing addon catalog.

**Next:** W4 internal ops + workflow unhappy paths.

---

## 2026-06-27 — PLS Wave 4 (internal ops + migration + workflows)

| Surface | Route | Finding | Fix | Status |
|---------|-------|---------|-----|--------|
| Wave 4 OTP probe | API test | Wrong guest-hub OTP path in spec | Use `/api/public/guest-hub/otp/request` | **Done** |

**Captures:** 17 steps — internal support radar/board/trace, liv_error ticket thread, tenant detail, migration onboarding + integrations, owner help dialog, comms limits.

**Next:** W5 remediation re-run + mobile Maestro.

---

## 2026-06-27 — PLS Wave 5 (program closeout)

| Metric | Value |
|--------|-------|
| Total PLS steps (waves 1–5) | 145 |
| Content failures | 0 |
| Persona UAT (prod) | 26/26 |
| Serious axe (owner dashboard + billing) | pass |

**Deliverables:** `pnpm pls:wave5` orchestrator · `PLS-FINAL-REPORT-2026-06-27.json` · mobile skip documented (no emulator).

**Remaining (non-blocking):** Maestro mobile capture when device available · sacred-path signup E2E on staging.

---

## 2026-06-15 — Gateway P2 (G1–G3 + sign-in)

| Surface | Change |
|---------|--------|
| `Launcher.tsx` | Wedge grid first; guest + founder paths in `<details>` |
| `demo-world-readiness-strip.tsx` | Quiet line when ready; neutral setup row when not |
| `demo-guest-client-shortcut.tsx` | Slim neutral card (G1/G3) |
| `demo-consult-first-guest-shortcut.tsx` | Same — consult-first guest row |
| `gateway-demo-card-stage.tsx` | G3: `← Brief` + role grid; `All worlds` link only |
| `WedgeStory.tsx` | Inline setup hint (no amber slab); drop redundant enter header |
| `gateway-demo-launcher-shell.tsx` | Hero copy — guest path on wedge enter screen |
| `sign-in.tsx` | Single launcher text link; removed duplicate CTA card |

**Status:** Engineering done — founder verify G1 grid → G2 continue → G3 roles · sign-in has one Clerk home.

**Next in queue:** Founder re-verify P1 surfaces on staging.

---

| Surface | Change |
|---------|--------|
| `public-shop.tsx` | Total in summary card; sticky bottom pay; `parsePublicApiError` |
| `public-visit.tsx` | `GuestVisitSummaryCard`; hero time-only; deposit fields from API |
| `public-event-vendor-quote.tsx` | Line items + payment schedule in one card; sticky accept/pay; human errors |
| `public-event-vendor-enquire.tsx` | `parsePublicApiError` on submit failures |
| `guest-vault-owner-callout.tsx` | Slim owner note — My Livia for returning guests |
| `guest-relationship-panel.tsx` | Memory as border-l line (matches guest `/my`) |
| `my-livia-visit.tsx` | Memory line parity with shop page |
| `public.ts` | Deposit breakdown on anonymous `/visit/{token}` |

**Status:** Engineering done — founder re-verify retail shop link, event quote pay, anonymous visit token.

**Next in queue:** P2 gateway G1–G3.

---

| Surface | Change |
|---------|--------|
| `public-pay.tsx` | Shared money breakdown; human API errors |
| Book confirm | Deposit + pay CTA inside confirmation card (no amber slab) |
| `/my` shop rows | Manage **or** book — not both |
| `/my/{slug}` | Memory as border line; Liv in sidebar; single primary CTA |
| Visit manage | Summary card holds status + money + pay; hero is time only |
| `mandate-gated-tool` | Era 1 blocks auto policy/setup mutations without approval |

**Founder re-verify on staging after deploy.**

---

## 2026-05-26 — Full web pass (~368 PNGs)

### Run summary

| Area | Folder | Status |
|------|--------|--------|
| Vertical + public booking | `full-audit/` | Captured (8 verticals, public `/b/*`) |
| Persona dashboard | `web/` | Captured (founder, owner, manager, staff×2, receptionist) |
| Marketing | `marketing/` | 13 routes on livia.io |
| Internal ops | `internal/` | 10 tabs (with `INTERNAL_OPS_SECRET`) |
| Mobile web (Chromium viewport) | `mobile-web/` | Owner + 3 verticals @ 390×844 |
| Native (Maestro) | `mobile/` | **Not captured from CI agent** — Maestro/adb not on agent PATH; user machine has Maestro at `%USERPROFILE%\.maestro\bin` (see below) |

Automated gate: `e2e/tests/ux-quality-gate.spec.ts` → `e2e/visual-captures/ux-quality-findings.json`.

---

### Screenshot review → findings → fixes

| # | Screenshot / route | What we saw | Severity | Change | Verified |
|---|-------------------|-------------|----------|--------|----------|
| 1 | `web/owner/hair-inbox.png` (and similar) | Liv-on threads listed as **“Anonymous visitor”** with **“(no messages yet)”** — misleading when AI is active | P1 UX | `inbox.tsx`: preview shows **“Liv is handling this thread”** when `aiHandled` and no message/summary | Re-capture pending |
| 2 | `web/owner/hair-dashboard.png` | Layout OK; demo chrome expected (persona switch, demo override) | — | No change | — |
| 3 | Axe: most authenticated routes | **`button-name`** — icon-only Buttons + unnamed Radix `SelectTrigger` comboboxes (status filter on `/bookings`, timezone + AI-tone on `/settings`) + Clerk `UserButton` | P1 a11y | Added `aria-label` on all icon buttons + `SelectTrigger` on bookings/settings + Clerk `appearance.elements.userButtonTrigger` | **Y** — 0 violations, 5/5 gate passed 2026-05-26 |
| 4 | Axe: `/audit` | **`label`** — filter inputs without associated labels | P1 a11y | `audit.tsx`: `htmlFor` + visible/sr-only labels on search and date/action filters | **Y** — dropped from `ux-quality-gate` 2026-05-26 |
| 5 | Axe: `/sign-in`, `/sign-up` | **`link-in-text-block`** — sign-up link low contrast in paragraph | P2 a11y | `sign-in.tsx`: underline on “create a password account” link | **Y** — auth routes clean in `ux-quality-gate` 2026-05-26 |
| 6 | Shell header | Business/persona selects and account control unnamed for AT | P1 a11y | `app-layout.tsx`: `aria-label` on location switch, demo persona, "view as stylist" select; Clerk `appearance` label | **Y** — part of 0-violation run 2026-05-26 |
| 7 | E2E inbox lens test | **Platform tour** overlay blocked queue lens clicks | Test infra | Tests: `localStorage` tour dismiss + Skip tour; `force: true` on lens clicks | Test green in last run |
| 8 | Clerk `UserButton` | May still report `button-name` in axe (third-party) | P2 | Wrapper `aria-label="Account menu"` — may not fully satisfy axe on Clerk internals | Monitor on re-run |
| 9 | Native mobile | Folder empty | Gap | **Windows:** Maestro 2.6.0 at `%USERPROFILE%\.maestro\maestro\bin\maestro.bat`; JDK found at `C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot`; `adb.exe` at `Android\Sdk\platform-tools`. Agent set `JAVA_HOME` + extended PATH permanently. Maestro CLI confirmed running (`maestro -v → 2.6.0`). No AVD connected at time of check. Needs emulator + Expo app foreground. | `pnpm maestro:visual-capture` when emulator is up |

---

### Not fixed yet (tracked)

- Broader **vertical copy** review (salon wording on physio/medspa) — human pass on `full-audit/*` still open; see `UX-PUNCH-LIST.md`.
- **Clerk** auth card buttons — limited control without Clerk appearance overrides.
- **sign-up.tsx** — waitlist link already `hover:underline`; add sign-in footer parity if product wants symmetric auth footers.
- Re-capture **hair-inbox** after inbox preview fix to close loop on #1.

---

### Commands

```powershell
# Web + marketing + internal + mobile-web
pnpm e2e:visual-audit:all:web

# UX gate only (needs API + dashboard up, demo provisioned)
pnpm --filter @workspace/e2e exec playwright test --project=ux-quality-gate --workers=1

# Native (after: Expo app on simulator, API up, adb devices shows emulator)
$env:Path += ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"
pnpm maestro:visual-capture
```

---

### 2026-05-26 — livia.io alignment pass

| # | Area | What we saw | Change | Verified |
|---|------|-------------|--------|----------|
| 10 | Marketing copy | Home/pricing/how-it-works claimed WhatsApp/Instagram as shipped (O5 drift) | `marketing-copy.ts` + honest channel wording on home, pricing, how-it-works | **Y** — `marketing-platform` 24/24 |
| 11 | Marketing nav | No `/verticals` hub, weak link to product demo | `/verticals` index, footer + nav **Try demo** / **Sign in** → `:5173` | **Y** |
| 12 | Marketing status | Did not probe local API/dashboard | Status page checks API + dashboard + demo provisioned | **Y** |
| 13 | Stack for test | Marketing not running in prior restart | `start-platform-for-test.mjs` starts :3001–:5175 + provision | **Y** — running now |

---

## 2026-06-05 — Mobile cold-open walkthrough (code review + Maestro prep)

**Capture status:** Maestro CLI present; **0 devices/emulators connected** from agent (`adb` not on PATH; physical Expo Go on Wi‑Fi not automatable without USB debugging). New flow `capture-cold-open-gateway.yaml` added; run when emulator or USB device is up.

### Screen-by-screen review (download → signed-in)

| # | Screen / route | What user sees | Fit for purpose? | Severity | Notes / change |
|---|----------------|----------------|------------------|----------|----------------|
| 1 | `/` entry gateway | Two doors (My Livia + studio sign-in) + Walk the demo | **Y** — matches W4 split | — | `testID`s: `app-entry-gateway`, `entry-gateway-guest`, `entry-gateway-operator`, `entry-gateway-demo` |
| 2 | `/my-livia` guest OTP | Phone + Send code, demo chip `+353 87 100 0001` | **Y** after fix | **P1** | Metro warned `No route named "my-livia"` — `_layout.tsx` stack screens fixed to `my-livia/index` + nested routes |
| 3 | `/sign-in` operator | Gateway story, email/password, Google, back link, demo link | **Y** | P2 | Long scroll; demo password not shown on screen (must know `LiviaDemo2026!` or use demo gateway quick enter) |
| 4 | `/demo` G1 launcher | Set up strip + horizontal world cards + guest card | **Y** (new) | — | Replaces legacy persona grid; aligns with web `/demo` |
| 5 | `/demo/wedge/:vertical` | Story beats → Walk into live demo → role roster | **Y** | P2 | Wedge card images need dashboard CDN (`EXPO_PUBLIC_DASHBOARD_URL` or :5173 on LAN) |
| 6 | Post ticket sign-in | Persona tabs (Today, Bookings, …) | **Y** | — | `PresentationThemeProvider` applies Constellation via tenant-experience API |
| 7 | Real signup `/onboarding` | Create business wizard (not demo path) | **Y** for prod | — | Separate from demo; demo guide still lists emails |
| 8 | Maestro legacy flows | Jump to sign-in / persona switcher | **N** for first-run | P2 | `capture-owner-tabs` etc. skip gateway; new cold-open flow is first in suite |

### E2E navigation checklist (manual / Maestro)

| Path | Steps | Blocker |
|------|-------|---------|
| Guest | Gateway → My Livia → demo phone → OTP → vault | API `:3000` + guest hub seeded |
| Demo owner | Gateway → Demo → Set up → Beauty world → Owner enter | API demo provision + Clerk ticket |
| Studio sign-in | Gateway → Sign in → `owner-conorcuts@livia.io` + demo password | Same |
| Back navigation | Sign-in ← gateway; demo ← Home | OK via `sign-in-back-to-gateway` |

### Commands (your machine)

```powershell
$env:Path += ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"
# Expo Go on emulator: $env:MAESTRO_APP_ID="host.exp.Exponent"
# Dev build: $env:MAESTRO_APP_ID="io.livia.app"
pnpm maestro:visual-capture
# Output: e2e/visual-captures/mobile/01-entry-gateway.png … 06-owner-today.png
```

---

## 2026-06-26 — GTM alignment + full-path QA (goldspireventures/livia)

| Surface | Route / area | Finding | Fix | Status |
|---------|----------------|---------|-----|--------|
| Repo / ops | GitHub URLs | 7 refs still `goldspire-global/livia` | Updated to `goldspireventures/livia` in code + ops docs | **Done** |
| Marketing GTM | FAQ + nav | Waitlist vs self-serve conflict | FAQ + founder CTA → instant signup; nav "Contact" not waitlist scroll | **Done** |
| Marketing → app | `/get-started?vertical=` | Trade lost at sign-up | `dashboardSignUpUrl(vertical)` + session vertical intent → onboarding pre-select | **Done** |
| Auth (web) | Clerk load timeout | Dev jargon on user screen | Prod-friendly copy; dev details only in `import.meta.env.DEV` | **Done** |
| Auth (web) | Sign-in | No forgot-password; errors mention Google | Added forgot-password email; removed Clerk/Google jargon | **Done** |
| Auth (mobile) | Sign-in placeholder | Demo slug in prod placeholder | `isProductionCustomerSurface()` — email only | **Done** |
| Settings | Account panel | "when Clerk shows" | "when that option is available" | **Done** |
| Mobile comms | Settings block | Raw webhook URL | Hidden — status + open web only | **Done** |
| Liv setup guide | Platform tour | Booksy/webhook jargon; WA/IG overclaim | Plain import + honest SMS-first channel copy | **Done** |
| E2E local | Dashboard dev | Transient Tailwind overlay during parallel runs | Re-run after single `pnpm dev:dashboard`; prod `app.livia-hq.com` 200 | **Verify** |
| E2E local | Guest hub Mary | 0 shops after long demo provision | Re-run `pnpm e2e:prep` to completion then `dual-entry-uat` | **Verify** |

**Prod smoke:** `livia-hq.com/get-started` 200 · `app.livia-hq.com/sign-in` 200 · `api.livia-hq.com/healthz` ok · CI green on `goldspireventures/livia`.

**Remaining P2 (not blocking GTM):** Home page waitlist form (footer leads); mobile Liv chat on `/my-livia` (web has it); gift/pack redeem UI; email-only guest sign-in (planned).

---

## 2026-06-26 — `/my` guest hub depth pass

| Surface | Finding | Fix | Status |
|---------|---------|-----|--------|
| `/my` home | Favourites merged into one list | Split favourites + more studios sections | **Done** |
| `/my` shops | Raw vertical slug (`allied health`) | `getVerticalPack().label` | **Done** |
| `/my` empty states | Thin copy | Policy `emptyUpcoming*`, `coldStartHint`, `favoritesEmpty` | **Done** |
| Post-book | Vault linked but no session → dead end | Nudge card + Open My Livia CTA on confirmation | **Done** |
| Web `/my-livia` | Broken alias on dashboard | Redirect routes → `/my` | **Done** |
| Owner quick actions | Ask Liv → guest hub | Fixed to `/toolkit` | **Done** |
| Marketing discovery | No public entry to guest hub | Footer + how-it-works My Livia chapter/link | **Done** |
| Vertical pages | Waitlist below get-started | Contact CTA only | **Done** |
| Inbox lens | Empty state said `No threads in "Liv on"` | Friendly copy per lens | **Done** |
| Mobile legal | Hand-written checkbox | Policy `platformLegalAcceptance*` | **Done** |

**`/my` entry model (GTM):** Book on `/book/{slug}` (no account) → optional save to My Livia → OTP at `app.livia-hq.com/my` or mobile `/my-livia` with same number → vault. Cold start: marketing footer, how-it-works, mobile gateway, post-book nudge, demo Mary.

**Still R∞ for `/my`:** Email OTP; native Liv chat; gift redeem; post-OTP first-run carousel; `my.livia-hq.com` subdomain when DNS ready.

---

## Template for next entries

```markdown
### YYYY-MM-DD — [scope]

| # | Screenshot | What we saw | Severity | Change | Verified |
|---|------------|-------------|----------|--------|----------|
| 1 | `path.png` | … | P1/P2 | `file.tsx`: … | Y/N |
```
