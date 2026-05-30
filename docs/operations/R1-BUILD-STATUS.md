# R1 build status — where we are (living doc)

**Authority:** [`product/LIVIA-FINAL-BUILD-PLAN.md`](../product/LIVIA-FINAL-BUILD-PLAN.md) (master scope)  
**Tracker:** [`PLATFORM-BACKLOG.md`](./PLATFORM-BACKLOG.md) (checkboxes — sync from here)  
**Updated:** 2026-05-30

---

## How we work (founder + agent)

1. **One release program:** R1 → R2 → R3 (months). We are **inside R1**, not done.
2. **One staging stack for your E2E:** You test **once** when R1 exit criteria (§4.1 below) are green on staging — not after every partial merge.
3. **Each agent wave** updates the **Wave log** at the bottom (what shipped, which URLs).
4. **Surfaces are separate deploys** — merging `main` updates all connected hosts, but **each URL is a different “world”** (see map below).

---

## Hierarchy (nested plan)

```text
LIVIA FINAL BUILD PLAN (master)
├── R1 — NOW (~8–12 wks)  ← WE ARE HERE (~55% code, ~35% exit criteria)
│   ├── Track F — Marketing + gateway + internal chrome (W1, W2, W3a/b)
│   ├── Track G — Guest /b surfaces (W5) + hub shell (W6 partial → R2)
│   ├── Track D — Tenant presets (minimal R1)
│   ├── Track B — Support surfaceId (R1 shell)
│   └── Solidify 0–6 — kernel, mobile, ops (parallel)
├── R2 — post-R1 (~6 mo)
│   └── W6 guest hub complete · support depth · mobile parity push
└── R3 — v3 (~12–18 mo)
    └── Preset parade · Gate 2 field proof · headless lifecycle full
```

---

## Surface map — which URL is which world

| World | Staging URL | What it is | R1 test when |
|-------|-------------|------------|--------------|
| **W1 Marketing** | [staging.livia-hq.com](https://staging.livia-hq.com/) | Prospects, waitlist, pricing story | E2 (M1+M2) done |
| **W2 Gateway** | [app.staging…/sign-in](https://app.staging.livia-hq.com/sign-in) | Owner sign-in (email/password) | Anytime |
| **W2 Demo** | [app.staging…/demo](https://app.staging.livia-hq.com/demo) | Vertical launcher + wedge | E1 done |
| **W2 Wedge** | `/demo/wedge/:vertical` | G1-A interstitial per vertical | E1 done |
| **W4 Tenant** | `/dashboard`, `/inbox`, `/bookings`, … | Owner/staff app (after sign-in) | E4 + UAT |
| **W5 Guest book** | `/b/{slug}` | Public booking (no login) | E4 |
| **W5 Guest visit** | `/b/{slug}/visit/{token}` | Day-of token page | E6 |
| **W5 Guest proof** | `/b/{slug}/proof/{token}` | Body-art proof (reference) | E5 |
| **W6 Guest hub** | [app.staging…/my](https://app.staging.livia-hq.com/my) | Customer vault (R2 — **shell only**) | R2 |
| **W3a Exec** | ops portal (exec email handoff) | Founder cockpit | E9 |
| **W3b Support** | internal `/support/*` | Thread / board / radar | E8 |
| **Mobile** | TestFlight / EAS staging profile | Owner shop-floor | Solidify T3 |

**Why `/my` looks like “the product”:** It’s the **end-customer** screen (W6). The **owner** product is **`/sign-in` → `/dashboard`**. Marketing is a **third** site entirely.

---

## R1 exit criteria (§4.1) — honest status

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| E1 | G1-A wedge all verticals | **Done** | `/demo/wedge/:vertical` + policy |
| E2 | M1-R2 + M2-A marketing on staging | **In progress** | M2-A honest pricing + home teaser wired wave 8 |
| E3 | `wedge-demo-stories.ts` + `guest-surfaces.ts` | **Done** | policy |
| E4 | All 9 `/b/{demoSlug}` E2E | **Done (local)** | `pnpm test:e2e:verticals` 76/76 green 2026-05-30 (34 vertical + 12 booking + rest) |
| E5 | Body-art proof guest page | **Done** | `/b/.../proof/:token` |
| E6 | Visit token pages | **Done (local)** | visit token smoke in verticals E2E wave 10 |
| E7 | Platform Default polish + preset picker | **Partial** | D-R1 aurora wash wave 9; picker staging |
| E8 | I4 Thread 3-column shell | **Done (local)** | queue \| thread \| context + Investigate wave 10 |
| E9 | I2 Ship Lane + Hats | **Done (local)** | tab shell + hats river wave 10 |
| E10 | Phone E.164 normalize | **Done** | customers + guest hub |
| E11 | Signup → seed → `/b` headless | **Partial** | headless visit API + marketing-lifecycle (wedge + sign-up gateway) wave 11 |
| E12 | `presentation_preset_id` D2 | **Done** | migration 028 + API |
| E13 | Continuity templates all verticals | **Done** | policy test |
| E14 | typecheck clean | **Done** | CI |

**R1 exit:** **~11/14 done · ~3/14 partial** → **staging must reflect main (PR #3 merged 2026-05-30) before founder E2E**.

### Staging deploy status (post PR #3)

| Check | Result |
|-------|--------|
| `pnpm smoke:staging` | ✓ green |
| CI `staging-smoke` on main | ✓ green |
| `staging.livia-hq.com` wave 8 content (€79, wedge chips) | ✗ not live yet — Vercel marketing staging may need promote / branch hook |
| `api.staging…/api/demo/*` | ✗ 404 — fixed in code (LIVIA_DEPLOY_ENV=staging); Railway vars set, deploy pending |
| `pnpm test:e2e:staging` | blocked until API redeploy + demo seed |

---

## Track progress (R1 only)

### Track F — Surfaces

| ID | Item | Status |
|----|------|--------|
| F0 | PNG catalog + dev galleries | Done |
| F1 | M0 aurora shell + EUR copy | Partial |
| F2 | **M1 home + M2 pricing** | **In progress** | M2-A + home teaser + M9 vertical field wave 10 |
| F3 | G1-A wedge + launcher | Done |
| F4 | M3 how-it-works + M5 vertical links | **In progress** | M5 wedge CTAs on home + `/verticals` |
| F5 | Ship Lane + sign-in gateway | Done |
| F6 | I4 support thread + board/radar stubs | Partial |
| F7 | M6–M12 utility pages | Open |
| F8 | E2E marketing→demo→tenant | **Partial** | marketing-lifecycle Playwright wave 10 |

### Track G — Guest

| ID | Item | Status |
|----|------|--------|
| G0 | guest-surfaces policy | Done |
| G1 | proof page + API | Done |
| G2 | medspa/waitlist/pet polish | Open |
| G3 | continuity + E2E | Partial |
| G4 | phone normalize | Done |
| G5 | public book mobile pass | **Done (local)** | sticky CTA + mobile E2E wave 9 |
| G6 | guest hub `/my` | **Shell (R2)** |

### Track D — Presets (R1 minimal)

| Item | Status |
|------|--------|
| D2 migration + API | Done |
| D5 public `/b` skin | Partial |
| D-R1 platform default polish | **Partial** | tenant shell aurora wash wave 9 |

---

## Wave log (what each merge shipped)

| Wave | Date | Focus | Staging URLs affected |
|------|------|-------|---------------------|
| 11 | 2026-05-30 | Headless lifecycle fix; staging E2E script; E11 sign-up gateway test | `pnpm test:e2e:staging` |
| 10 | 2026-05-30 | E6 visit smoke; E8 support 3-col; E9 exec tabs; M9 waitlist; F8 browser E2E | internal `/support`, marketing waitlist |
| 9 | 2026-05-30 | G5 public book mobile pass; E7/D-R1 platform-default shell wash | `/b/*` mobile, tenant app |
| 8 | 2026-05-30 | E4 local green; M2-A pricing; M5 home wedge chips; headless lifecycle fix | marketing home + `/pricing` |
| 7 | 2026-05-30 | M1-R2 story home wired + BUILD-PLAN-WIRE doc | [staging.livia-hq.com](https://staging.livia-hq.com/) |
| 2 | 2026-05-30 | Guest proof `/b/.../proof/:token` | public `/b/*` |
| 3 | 2026-05-30 | D2 presets, Ship Lane, M3 how-it-works, headless script | app settings, internal ops, marketing `/how-it-works` |
| 4 | 2026-05-30 | Guest hub DB + `/my` shell, book opt-in | app `/my`, `/b/*` checkbox |
| 5 | 2026-05-30 | `/my` redirect fix, gateway sign-in (no Google) | app `/my`, `/sign-in` |
| 6 | 2026-05-30 | Staging relaxations (OTP bypass), prod API fix | app `/my`, api surface-config |

**Next waves (agent queue — R1 closeout):**

1. **Staging infra** — Vercel `livia-marketing` → `staging.livia-hq.com` deploy from `main`; Railway staging `LIVIA_DEMO_ENABLED=true` + `pnpm db:seed` on staging DB
2. **Verify** — `pnpm test:e2e:staging` green; E2 visual on staging marketing
3. **E7** — preset picker UAT on staging settings
4. **Backlog sync** — mark done items in PLATFORM-BACKLOG.md
5. **Founder E2E** — ping when exit table hits 14/14 on staging

---

## Your single E2E checklist (when R1 exit = ready)

Use staging only:

1. [staging.livia-hq.com](https://staging.livia-hq.com/) — home, pricing, waitlist, how-it-works  
2. [app.staging…/demo](https://app.staging.livia-hq.com/demo) — wedge each vertical  
3. [app.staging…/sign-in](https://app.staging.livia-hq.com/sign-in) — owner login → dashboard  
4. `/b/{slug}` — book + visit token + proof (body-art)  
5. [app.staging…/my](https://app.staging.livia-hq.com/my) — guest hub (phone `12345`, OTP `000000`)  
6. Mobile staging build — Today, inbox, book  
7. Ops — exec cockpit Ship Lane (internal)

---

## Agent rule

**Do not ask founder to spot-check partial surfaces.** Finish R1 exit table → update this doc → then ping for one E2E pass.
