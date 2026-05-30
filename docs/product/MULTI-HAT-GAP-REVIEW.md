# Multi-hat platform review — gaps, risks, elevation

**Status:** canonical review (2026-05-30)  
**Method:** Simulated cross-functional review — each hat reads the **documented plan** and asks what Livia must satisfy to win in the real world.  
**Inputs:** All surface programs, release program, lifecycle/flows docs, north-star dashboard, Gate 2 criteria, and this conversation’s locks.

**Use:** Prioritize R1 scope, RFCs, and founder decisions. Update after each release.

---

## 0. Simulation framing

```text
Room: founder, eng lead, support lead, design, GTM, salon owner (design partner),
      staff stylist, end customer, legal, Goldspire operator, future enterprise buyer.

Question: “If we ship what’s documented in R1/R3, does each person get what they
need — and what are we still not seeing?”
```

**Verdict summary:** Architecture and **programmatic intent** are strong. Biggest gaps are **field proof**, **guest surface execution**, **support at scale**, **owner trust loops**, and **commercial packaging clarity** — not lack of vision docs.

---

## 1. Hat-by-hat review

### 1.1 Founder / CEO

**Needs:** Gate 2 proof, honest marketing, ship without burning out, platform evolves as one system.

| ✅ Documented well | ⚠️ Gap / risk | 🔺 Elevate |
|-------------------|---------------|-----------|
| Ship Lane, release program, scope moratorium | 10 Dublin shops still **off-repo evidence** | Tie Ship Lane rows to **automated** smoke output, not manual checkboxes |
| Programmatic lifecycle §0.2 | Too many “master plans” until audit — **now fixed in index** | Single Monday screen: NORTH-STAR-DASHBOARD + release R1 checklist |
| Workforce grants | Goldspire process manual | Audit log on grant/revoke in `/access` |

**Missed angle:** **Capital efficiency narrative** — when to hire support L1 vs founder-as-support; not documented as a trigger (e.g. “>20 active tenants → hire”).

---

### 1.2 Engineering lead

**Needs:** Clear build order, no orphan routes, policy-first, testable releases.

| ✅ | ⚠️ | 🔺 |
|----|----|-----|
| PLATFORM-EVOLUTION tracks, composable evolution, OpenAPI | `wedge-demo-stories.ts`, `guest-surfaces.ts` **not in repo yet** | R1 exit = **headless lifecycle script** in CI |
| surfaceId registry spec | Registry **not populated** for all routes | Block merge on missing `surfaceId` for new routes |
| Release program vertical slices | Risk of **Solidify vs F/G tracks** diverging | One `platform-release-r1.md` checklist derived from RELEASE-PROGRAM |

**Missed angle:** **Performance budgets** for `/b` on 3G — guest pages are acquisition; no doc sets LCP/TTI targets.

**Missed angle:** **Feature flags** per tenant for beta — roadmap mentions flags but not tied to R1 guest proof rollout.

---

### 1.3 Support L1 / L2

**Needs:** Context-rich tickets, fast hypothesis, no tool sprawl.

| ✅ | ⚠️ | 🔺 |
|----|----|-----|
| INTERNAL-SUPPORT-PLATFORM-SPEC (depth) | MVP today = **list + detail**, not Thread 3-col | R1: Thread **layout shell** even if Context pane sparse |
| surfaceId + requestId architecture | Liv errors without **conversation excerpt** in ticket | Auto-attach last 5 Liv turns on `liv_error` |
| Runbooks | Runbooks **not dynamic** in UI yet | Tag → runbook link in Context pane (R2) |

**Missed angle:** **Customer-visible status** — “your ticket #123” portal for owners; reduces “did you get my email?” pings.

**Missed angle:** **Proactive support** — Radar spec exists but no **monitoring hooks** doc (stuck onboarding, zero bookings 14d).

---

### 1.4 Design / product

**Needs:** Coherent skins, inheritance, mobile-first P7, no cramming.

| ✅ | ⚠️ | 🔺 |
|----|----|-----|
| Visual inheritance, evolution tiers, wedge clarity | **Preset rollout (Track D)** still heavy doc, light UI | R1: Platform Default polish **before** 36 presets |
| PUBLIC-B-SURFACE-SPEC depth | Storefront **depth** (team, gallery) deferred R3 — OK but owners may churn | “Good enough `/b`” bar for Gate 2 — define minimum |
| Mobile north-stars | Not all locked screens have **mobile companions** in PNG catalog | M1/G1/P7 mobile frames in FINAL-CATALOG |

**Missed angle:** **Accessibility certification** path — WCAG called out but no audit schedule pre–Gate 3.

**Missed angle:** **Liv personality consistency** across surfaces — voice.md exists but no **per-surface tone matrix** (marketing vs `/b` vs SMS).

---

### 1.5 GTM / sales (IE wedge)

**Needs:** Credible demo, vertical story, pricing clarity, competitor truth.

| ✅ | ⚠️ | 🔺 |
|----|----|-----|
| Gateway wedge program, MARKETING program, battlecard docs | Demo **still persona grid** — G1-A **not built** | R1 blocker: wedge interstitial live |
| € pricing locked on M2 | **In-app billing** vs marketing tiers alignment | Single pricing SSOT test in CI |
| Scope moratorium | Risk of over-promising **partner-only** verticals | Demo grid = registry honesty; sales one-pager lists tier per vertical |

**Missed angle:** **Switching cost story** — Phorest export, data migration; mentioned in sales-motion but **no productized import** in R1–R3 plan.

**Missed angle:** **Partner channel** — accountants, booth renters, suppliers; no partner portal spec.

---

### 1.6 Salon owner (P2 — design partner)

**Needs:** Shop runs tomorrow, looks professional, clients don’t embarrass me, Liv saves time not creates work.

| ✅ | ⚠️ | 🔺 |
|----|----|-----|
| Onboarding acts, `/b`, inbox, Today | **Guest collab surfaces** not fully shipped for all verticals | R1: **all 9 code verticals** book E2E; body-art proof = reference depth for collab surfaces |
| Platform Default on signup | Presets **overwhelming** if shown too early | Staging-only preset picker until D mature |
| Channels thin-link model | Owner expects **WhatsApp to do more** — education gap | Onboarding beat: “Liv sends links; collab on Livia” |

**What owners still fear (not fully addressed):**

1. **“Will Liv say something wrong to my client?”** — eval pipeline exists; **owner-visible guardrails** (forbidden topics, approval mode) underdocumented for P2.
2. **“Is my client data safe?”** — trust center / sub-processors on marketing; **in-app trust strip** for owners thin.
3. **“Can I still use my website?”** — PUBLIC-B spec says coexist; need **embed widget / custom domain** roadmap visible to owners.
4. **No-shows / deposits** — policy partial; **Stripe guest checkout** not end-to-end in docs as R1.

**Elevate:** **“Shop ready in 20 minutes”** guaranteed path — timed onboarding with live `/b` preview; not a documented SLA.

---

### 1.7 Staff (P5 — stylist)

**Needs:** My chair, my day, minimal admin, phone-first.

| ✅ | ⚠️ | 🔺 |
|----|----|-----|
| Mobile Today north-star, running late workflow | **Staff week summary** still v1.5 | Mobile parity scorecard ~82% — explicit R3 target |
| Approvals on mobile | **Design proof approve** on mobile for artist? | Tattoo artist approves from phone — spec implied, not routed |
| Persona rituals | Junior staff **confusing nav** — UX contextual review noted | “My chair” as universal staff home |

**Missed angle:** **Offline / bad salon WiFi** — mobile roadmap mentions but no **queue actions offline** for day-of.

**Missed angle:** **Tips / retail upsell** — hair retail in verticals table; **no POS tie-in** doc — OK defer but owners will ask.

---

### 1.8 End customer (P7)

**Needs:** Book fast, no account, trust the shop, approve design / consent without friction.

| ✅ | ⚠️ | 🔺 |
|----|----|-----|
| PUBLIC-B-SURFACE-SPEC, token model, no login | **Guest proof page not built** | Phone-first proof is **differentiator** — prioritize G1 |
| Visit token shipped | Reschedule/cancel **partial** | One-tap from SMS without re-entering phone |
| Vertical skins | **Generic book** still default for some verticals | Vertical P7 templates in policy, not just marketing |

**Missed angle:** **Accessibility for guests** — older clients, large type mode on `/b`.

**Missed angle:** **Language** — `/de` marketing; **guest `/b` locale** not in R1 plan.

**Elevate:** **“Feels like iMessage thread with the shop”** — continuity UI on guest pages (thread of bookings + messages) without login — aligns with M1 story but **not spec’d for W5**.

---

### 1.9 Legal / compliance (EU)

**Needs:** GDPR, AI Act disclosure, medspa consent, honest subprocessors.

| ✅ | ⚠️ | 🔺 |
|----|----|-----|
| Legal drafts, ai-disclosure lib, jurisdiction packs | **Counsel review** still Gate 3 | Block production medspa claims until consent flow shipped |
| DPIA template | **Per-tenant DPIA** helper not productized | Owner downloads “my shop DPIA pack” |
| Cookie policy | `/b` first-party only — documented | Marketing vs app cookie banner consistency |

**Missed angle:** **Data residency narrative** for enterprise — “EU Postgres” in ops docs; **customer-facing trust page** thin.

**Missed angle:** **Liv decision logging** for medspa — audit exists; **consent artifact retention** policy not tied to guest surfaces.

---

### 1.10 Goldspire / platform operator

**Needs:** Beta gate, workforce grants, no accidental prod access.

| ✅ | ⚠️ | 🔺 |
|----|----|-----|
| WORKFORCE-ONBOARDING, exec cockpit spec | Grant UI **partial** | `/access` audit trail |
| Beta signup gate in policy | **Restricted tier** UX for partners unclear | In-app banner: “beta features limited” |

**Missed angle:** **Multi-org operator** — Goldspire portfolio view across tenants; Radar is support-side, not **partner-side**.

---

### 1.11 Future buyer (multi-location / franchise)

**Needs:** Chain rollup, standards, reporting, brand shells.

| ✅ | ⚠️ | 🔺 |
|----|----|-----|
| P1 founder `/chain`, chair-rental docs, multi-brand in presets | **Franchise playbook** thin vs salon single-shop | Org-shape packs in policy underdeveloped vs verticals |
| Host dashboard routes | **Cross-tenant analytics** not R1 | Document “chain mode” as R3+ with explicit defer |

**Missed angle:** **API / partner integrations** — partner-api-v1 doc exists; **not in release program** — enterprises will ask.

---

## 2. Cross-cutting gaps (whole platform)

| # | Gap | Why it matters | Suggested home |
|---|-----|----------------|----------------|
| G1 | **Headless lifecycle not in CI** | “Programmatic” is doc-only until scripted | R1 exit criterion + script |
| G2 | **Guest proof + link-first SMS not shipped** | Core wedge story for body-art; GTM liability if marketed | Track G — R1 |
| G3 | **G1-A demo wedge not built** | Marketing → demo broken | Track F3 — R1 |
| G4 | **surfaceId registry empty/incomplete** | Support + eng debug tax | Track B1 — R2 |
| G5 | **Preset system (D) vs “Platform Default now”** | Owners see unfinished picker | R1 polish default; defer 36 presets |
| G6 | **Owner trust / Liv guardrails UX** | Adoption blocker for P2 | New spec slice in LIV-OPERATING-SYSTEM |
| G7 | **Guest continuity thread (W5)** | M1 story promises; `/b` is transactional | Extend PUBLIC-B-SURFACE-SPEC §6 |
| G8 | **Import / switching from Phorest** | GTM objection | business/ + product RFC |
| G9 | **Performance + offline mobile** | Day-of reliability | mobile-roadmap + engineering |
| G10 | **In-app owner trust center** | GDPR sales cycle | marketing + dashboard settings |
| G11 | **Proactive health monitors → support** | Scale without founder firefighting | INTERNAL-SUPPORT §4.6 + Radar |
| G12 | **Pricing/billing SSOT drift** | Commercial trust | CI test vs pricing-catalog |
| G13 | **Locale on guest `/b`** | DACH expansion | R2 with M7 |
| G15 | **Phone normalize on public book** | Duplicate customer rows | [`GUEST-CUSTOMER-IDENTITY.md`](./GUEST-CUSTOMER-IDENTITY.md) §5 R1 |

---

## 3. What we’re not foreseeing (blind spots)

### 3.1 Operational reality at shop floor

- **Noise, interruptions, bleach on hands** — staff won’t read paragraphs; Liv must **push** not wait. Push notification strategy doc exists (`NOTIFICATIONS.md`) but **day-of escalation** (client late, artist behind) not wired to guest visit token updates.
- **Double booking human overrides** — managers override system; audit yes, **UX for override + client notify** thin.

### 3.2 Liv as colleague vs tool

- Docs strong on **Liv OS** architecture; weak on **relationship memory** owners feel — “Liv remembered Sarah prefers silent appointments” — needs **customer preference model** visible to owner, not only agent prompt.

### 3.3 Competitive response

- Incumbents add AI widgets fast; Livia wedge is **continuity + guest surfaces + vertical depth**. If we ship **generic inbox only**, we become a feature not a category. **R1 must include one unreplicable flow** (proof or voice+book loop).

### 3.4 Economic downturn / churn

- No doc on **pause subscription**, **export on leave**, **downgrade** — owner trust when closing shop.

### 3.5 AI regulation shifts

- EU AI Act referenced; **model change communication** to tenants not documented.

---

## 4. Elevation opportunities (big swings — grounded)

| Opportunity | What it is | Foundation already |
|-------------|------------|-------------------|
| **Guest continuity passport** | P7 sees one timeline per shop (bookings, proofs, visits) via token — no account | visit + proof tokens, M1 narrative → **Guest hub** [`GUEST-CONTINUITY-HUB-SPEC.md`](./GUEST-CONTINUITY-HUB-SPEC.md) |
| **Liv approval mode** | Owner toggles: Liv drafts, human sends — reduces fear | inbox, policy |
| **Programmatic design partner program** | Scripted weekly evidence capture for 10 shops | Gate 2 pack, NORTH-STAR-DASHBOARD |
| **Vertical “shop kits”** | Body-art kit = proof + deposit + consult; hair kit = DM→book | vertical packs, wedge stories |
| **Support that teaches** | Resolved ticket → micro-lesson in owner app (“how to fix X”) | support platform + activation |
| **Release train visibility** | Owners see “what improved this month” — changelog in-app | changelog.md, M10 |
| **Chain command** | P1 sees exceptions across shops with **one-click** support ticket | chain view + Radar |

---

## 5. Recommended priority stack (after this review)

**R1 must ship (non-negotiable for coherent story):**

1. G1-A wedge interstitial for **every registry vertical** + marketing M1/M2 token pass  
2. All vertical `/b` book paths + guest tokens where vertical pack defines them (proof = body-art reference)  
3. Thread layout shell for support (even minimal Context)  
4. Headless lifecycle smoke script  
5. Platform Default tenant polish (defer preset parade)  

**R2 should add:**

6. surfaceId registry populated + Investigate panel  
7. Proactive Radar feeds (stuck onboarding, repeat errors)  
8. Owner Liv guardrails UX  
9. Guest visit/reschedule polish + SMS templates  

**R3 / north star:**

10. Preset rollout, guest continuity passport, chain command, partner API, custom domain  

---

## 6. Doc system gaps (meta)

| Fixed in 2026-05-30 audit | Still watch |
|---------------------------|-------------|
| Canonical index tiers | Keep index updated when adding specs |
| Terminology glossary | Enforce in PR template |
| Archive list | Delete V1.5-TO-V2-BRIDGE; supersede headers on archive set |
| Surface program docs | Add **owner trust** + **guest continuity** specs when scoped |
| Multi-hat review (this doc) | Re-run after R1 ship |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Initial multi-hat simulation after doc audit + platform programs |
