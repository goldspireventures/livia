# Visual audit log

Running record of **what we captured**, **what we saw in screenshots**, **what we changed**, and **whether we re-verified**.  
Captures live under `e2e/visual-captures/` (gitignored). Re-run: `pnpm e2e:visual-audit:all:web` · native: `pnpm maestro:visual-capture`.

**Guest placement registry:** [`design/GUEST-SURFACE-PLACEMENT-CONTRACT.md`](../design/GUEST-SURFACE-PLACEMENT-CONTRACT.md) §6.

---

## 2026-06-15 — Guest book P0a (staging founder pass)

| Surface | Route | Finding | Fix | Status |
|---------|-------|---------|-----|--------|
| Public book details | `/book/{slug}` | Hub autofill banner + top deposit card cluttered wizard; “Save to My Livia” shown when already signed in; raw `HTTP 422` on patch-test gate | Silent hub prefills; deposit breakdown in summary card; hub-only hides save CTA; `parsePublicApiError`; patch-test hint on services step | **Engineering done** — founder re-verify on staging after deploy |

**Next in queue:** P1a `/b` storefront · P1b consult-first · P2 gateway.

---

## 2026-06-15 — Guest hub P0b–P0e + Liv policy lock

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

## Template for next entries

```markdown
### YYYY-MM-DD — [scope]

| # | Screenshot | What we saw | Severity | Change | Verified |
|---|------------|-------------|----------|--------|----------|
| 1 | `path.png` | … | P1/P2 | `file.tsx`: … | Y/N |
```
