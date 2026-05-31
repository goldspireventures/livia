# Demo world — live experience specification

**Status:** canonical (2026-05-31)  
**Audience:** founder, product, design, engineering, GTM  
**Purpose:** Define **demo data depth** so Livia feels **live** — not empty calendars and placeholder copy — across **all registry verticals**, personas, and guest flows.

**Supersedes:** thin rows in [`PER-VERTICAL-DEMO-SEED.md`](./PER-VERTICAL-DEMO-SEED.md) (keep as code index; this is the **experience** spec).

**Reads with:** [`../testing/DEMO-FULL-SHOWCASE.md`](../testing/DEMO-FULL-SHOWCASE.md) · [`../testing/DEMO-LOGINS.md`](../testing/DEMO-LOGINS.md) · [`BETA-SHOWCASE-PROGRAM.md`](./BETA-SHOWCASE-PROGRAM.md)

---

## 1. What “live” means

A founder, design partner, or engineer opens Livia and **within 60 seconds** experiences:

1. **Today has motion** — upcoming bookings, inbox threads, pending approvals.
2. **Vertical truth** — medspa shows consent; tattoo shows proof; pet shows pet profile.
3. **Persona truth** — staff sees My Day; owner sees briefing signal; founder sees chain.
4. **Guest path works on phone** — `/b/{slug}` book → confirm beat → visit token.
5. **Liv participated** — at least one inbox thread shows AI handled or handoff.
6. **Notifications fire** — book on `/b` → owner sees strip/push (local env).

**Anti-live:** Empty calendar, generic services, hair-only narrative, desktop-only demo.

---

## 2. Demo business roster (minimum)

Each **beta-full** vertical in `VERTICAL_COVERAGE_REGISTRY` needs a **showcase shop** with full seed:

| Vertical | Slug | Display name | Hero story |
|----------|------|--------------|------------|
| hair | `aurora-studio` | Aurora Studio | Regulars + colour |
| hair/barber | `conors-cut-co` | Conor's Cut Co | Walk-in Saturday |
| beauty | `bloom-beauty-dublin` | Bloom Beauty | Lash cycle + patch test |
| wellness | `harbour-wellness-cork` | Harbour Wellness | Room + voucher |
| body-art | `ink-anchor-galway` | Ink Anchor | Proof pending |
| fitness | `peak-fitness-dublin` | Peak Fitness | Class waitlist |
| medspa | `clarity-medspa-dublin` | Clarity Medspa | Consent gate |
| allied-health | `motion-physio-cork` | Motion Physio | Plan rebook |
| pet-grooming | `paws-parlour-dublin` | Paws Parlour | Multi-pet |
| automotive-detailing | `shine-studio-belfast` | Shine Studio | Vehicle package |
| wellness (DK) | `copenhagen-havn-wellness` | Havn Wellness | Locale DKK |

**Chain founder demo:** P1 access to ≥4 shops across verticals (not all hair).

---

## 3. Per-shop seed depth (required entities)

Each showcase shop **must** have after `POST /api/demo/provision` or seed script:

| Entity | Minimum | Notes |
|--------|---------|-------|
| **Services** | ≥5 | Vertical-appropriate durations, deposits |
| **Staff** | ≥3 | Skill tags where vertical uses skills |
| **Customers** | ≥20 | Mix CT1 new, CT2 regular, CT6 drifted |
| **Bookings** | ≥15 | Past 7d + today + next 14d |
| **Today** | ≥4 | Spread across morning/afternoon |
| **Inbox threads** | ≥3 | 1 AI-active, 1 handoff, 1 resolved |
| **Pending approvals** | ≥1 | Refund or proof where vertical applies |
| **Vertical extras** | per pack | Proof artifact, pet record, class session, consent template |
| **Channel stubs** | optional | Demo WA/IG handles in seed config |
| **Notifications** | triggered | At least 1 unread in-app for owner login |

### 3.1 Vertical-specific “hero artifacts”

| Vertical | Must exist in demo |
|----------|-------------------|
| body-art | 1 design proof **awaiting guest approval** + token URL |
| medspa | Consent step on `/b` book path |
| pet-grooming | Customer with 2 pets |
| fitness | 1 class near capacity + waitlist |
| wellness | 1 unredeemed gift voucher (data) |
| automotive | Vehicle note on booking continuity |

---

## 4. Persona walkthrough scripts (GTM + founder)

Documented paths in [`../testing/DEMO-FULL-SHOWCASE.md`](../testing/DEMO-FULL-SHOWCASE.md) — **update order**:

1. **People-business pitch** (15 min) — start `/demo` → non-hair wedge → `/b/clarity` or `/b/ink-anchor` on phone.
2. **Owner day** (10 min) — `demo-owner-*` → briefing → inbox → approve.
3. **Staff day** (5 min) — mobile My Day → next client.
4. **Founder chain** (10 min) — `demo-founder@livia.io` → rollup → switch shop.
5. **Guest only** (5 min) — incognito phone → `/b` book → no login.

---

## 5. simulate-live-day

`POST /api/businesses/:id/simulate-live-day` must:

- Fill **today** if empty.
- Create **inbox ping** if none active.
- Idempotent — safe before demos.

**Doc gate:** Operator script in [`../testing/FULL-TESTING-INSTRUCTIONS.md`](../testing/FULL-TESTING-INSTRUCTIONS.md) §demo.

---

## 6. Demo login hygiene

- Emails documented in [`../testing/DEMO-LOGINS.md`](../testing/DEMO-LOGINS.md).
- **First screen after login** matches persona ritual — not generic dashboard.
- Demo off in prod: `LIVIA_DEMO_ENABLED` unset.

---

## 7. E2E coverage required

| Test | Proves |
|------|--------|
| `full-platform-demo.spec.ts` | Multi-vertical sign-in |
| `public-booking-quality.spec.ts` | `/b` mobile book |
| `all-verticals-smoke.spec.ts` | Each slug loads |
| **New:** `demo-live-day.spec.ts` | Today non-empty after provision · Playwright `--project=demo-live-day` |
| **New:** `demo-proof-token.spec.ts` | Guest proof flow body-art · `--project=demo-proof-token` |
| **Demo API:** `GET /api/demo/guest-surfaces/:slug/proof` | E2E + GTM proof URL without staff auth |

---

## 8. Gap vs today

| Gap | Action | Status |
|-----|--------|--------|
| PER-VERTICAL-DEMO-SEED thin | Link [`PER-VERTICAL-DEMO-SEED.md`](./PER-VERTICAL-DEMO-SEED.md) + `demo-showcase-depth.ts` | ✅ |
| Copenhagen shop may lack depth | `demo-market-shops.seed.ts` + sync live day | ✅ |
| Shine / paws depth | Hero artifacts §3.1 in seed | ✅ |
| Founder chain hair-heavy | org_admin portfolio slugs expanded | ✅ |
| No “live day” E2E | `demo-live-day.spec.ts` | ✅ |
| No guest proof E2E | `demo-proof-token.spec.ts` | ✅ |

---

## 9. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Live demo experience spec — depth table, hero artifacts, scripts |
