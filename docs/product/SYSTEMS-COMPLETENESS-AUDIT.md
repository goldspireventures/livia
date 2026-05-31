# Systems completeness audit — nothing forgotten

**Status:** canonical (2026-05-31)  
**Audience:** founder, engineering, product, ops  
**Purpose:** Cross-functional inventory of **every platform system** Livia needs — what exists, what’s partial, what’s missing — so doc prep catches gaps like notifications before build resumes.

**Method:** Multi-hat review (§7). Update after each doc sprint.

**Reads with:** [`LIVIA-IDEA-TO-REALITY.md`](./LIVIA-IDEA-TO-REALITY.md) · [`MULTI-HAT-GAP-REVIEW.md`](./MULTI-HAT-GAP-REVIEW.md) · [`LIVIA-DOCUMENTATION-PROGRAM.md`](./LIVIA-DOCUMENTATION-PROGRAM.md)

---

## 1. Legend

| Status | Meaning |
|--------|---------|
| ✅ | Spec + implementation usable |
| ⚠️ | Partial — doc or code gap |
| 📋 | Spec needed (doc sprint) |
| 🔨 | Build after doc gate |
| ❌ | Explicitly out of scope / partner |

---

## 2. Core kernel systems

| System | Status | Canonical doc | Gap / action |
|--------|--------|---------------|--------------|
| Multi-tenant auth (Clerk) | ✅ | ADR 0003, 0010 | Workforce SSO enterprise = R3 |
| Business / membership model | ✅ | `data-model.md` | Chair-rental dual identity doc expand |
| Bookings + calendar | ✅ | OpenAPI, workflows | Resource types (room/bay) schema doc |
| Customers + CRM | ✅ | GUEST-CUSTOMER-IDENTITY | Merge suggestions UX spec |
| Services catalog | ✅ | policy verticals | Duration/skill validation doc |
| Staff + roster | ⚠️ | personas, journeys | Swap/sickness workflow full spec |
| Audit log (hash chain) | ✅ | ADR 0015 | Owner-facing “Liv diary” UI spec |
| Entitlements / capabilities | ✅ | composable monetisation | Per-tenant feature flags doc |
| Domain events (Inngest) | ✅ | ADR 0013 | Event catalog completeness audit |
| OpenAPI + codegen | ✅ | ADR 0005 | surfaceId on all new routes |

---

## 3. Liv intelligence layer

| System | Status | Canonical doc | Gap / action |
|--------|--------|---------------|--------------|
| Agent runtime | ⚠️ | ADR 0012, LIV-OS | Tool registry vs shipped tools matrix |
| Tool registry (target) | 📋 | LIV-OPERATING-SYSTEM | Full alphabet → implementation map |
| Policy graph | ⚠️ | notification-policy, wedge-gate | Central policy graph diagram doc |
| AI disclosure (EU) | ✅ | lib/ai-disclosure | Per-channel tone matrix |
| Eval (3-layer) | ⚠️ | ADR 0016 | Pre-merge eval CI doc |
| Liv signals / coach cards | ⚠️ | liv-signals.service | UI spec per persona |
| Voice receptionist | ⚠️ | features/voice-receptionist | Latency budget + character spec |
| Proactive workflows | ⚠️ | workflows/ | Drift recovery workflow full spec |
| Briefing (owner) | ⚠️ | personas P1 | Morning briefing screen card L3 |

---

## 4. Notifications & comms (example gap you caught)

| System | Status | Canonical doc | Gap / action |
|--------|--------|---------------|--------------|
| **In-app notification centre** | ✅ | NOTIFICATIONS.md | Founder chain sync — document edge cases |
| **Expo push (staff)** | ✅ | NOTIFICATIONS.md | Multi-business token scoping QA doc |
| **Web push (VAPID)** | ✅ | NOTIFICATIONS.md | Permission UX flow L3 |
| **Web alert strip** | ✅ | NOTIFICATIONS.md | — |
| **Email (transactional)** | ✅ | Resend integration | Template inventory per event |
| **SMS (customer)** | ⚠️ | CHANNELS-EU-MESSAGING | IE sender ID registry doc |
| **WhatsApp / IG** | ⚠️ | CHANNELS-EU-MESSAGING | Meta BSP per-tenant model |
| **Customer push** | 📋 | — | **Missing:** P7 opt-in push for visit reminders (wallet/web push) |
| **Notification preferences** | ✅ | Settings UI | Per-persona defaults doc |
| **Digest emails** | 📋 | — | Weekly owner digest spec |
| **Quiet hours / DND** | 📋 | — | Policy + UI for Liv outbound |
| **Escalation alerts** | ⚠️ | support spec | Pager integration for Livia Inc ops |

---

## 5. Surfaces & UX systems

| System | Status | Canonical doc | Gap / action |
|--------|--------|---------------|--------------|
| W1 Marketing | ⚠️ | MARKETING-SURFACE-PROGRAM | M1-R2 not fully built — honest matrix |
| W2 Gateway / wedge | ⚠️ | GATEWAY-SURFACE-PROGRAM | G1-A interstitial build + doc |
| W3 Internal exec | ⚠️ | INTERNAL-EXEC-COCKPIT-SPEC | Ship Lane automation |
| W3 Support Thread | ⚠️ | INTERNAL-SUPPORT-PLATFORM-SPEC | Context pane sparse |
| W4 Tenant web | ⚠️ | TENANT-EXPERIENCE-CONTRACT | Preset rollout Phase 0 polish |
| W4 Mobile (Expo) | ⚠️ | WEB-MOBILE-PARITY | Screen-by-screen parity matrix |
| W5 Public `/b` | ⚠️ | PUBLIC-B-SURFACE-SPEC | PWA, preset preview parity |
| W6 Guest hub | 📋 | GUEST-CONTINUITY-HUB-SPEC | Full L3 screen set |
| Presentation presets (36) | 📋 | PRESENTATION-PRESETS | PNG per preset × vertical sample |
| Motion / alive UX | ⚠️ | V3-EXPERIENCE-SPEC, motion-tokens | Expand motion-tokens to full catalog |
| Accessibility | ⚠️ | accessibility.md | WCAG audit schedule |
| Search (global) | 📋 | — | **Missing:** cross-entity search spec (customer, booking, inbox) |
| Onboarding wizard | ✅ | BETA-ONBOARDING-FLOW | Vertical fair copy audit |
| Empty states | 📋 | — | **Missing:** per-route empty state catalog |
| Error states | 📋 | — | **Missing:** Liv-aware error copy per surface |
| Loading / skeletons | 📋 | UI-UX-MASTER-PROGRAM | Layout-matched skeleton spec |

---

## 6. Guest & customer systems

| System | Status | Canonical doc | Gap / action |
|--------|--------|---------------|--------------|
| Token guest surfaces | ⚠️ | PUBLIC-B, guest-surfaces.ts | Registry population complete |
| Booking continuity thread | ⚠️ | PUBLIC-BOOKING-INTAKE-E2E | Per-vertical step YAML |
| Wallet pass | 📋 | customer-typologies CT1 | Apple/Google pass spec |
| Guest proof workflow | ⚠️ | body-art pack | Mobile proof UX L3 |
| Consent / intake | ⚠️ | medspa pack | Medico-legal review gate G3 |
| Deposit / Stripe guest checkout | ⚠️ | — | Guest pay failure recovery doc |
| Cross-shop guest vault | 📋 | GUEST-CONTINUITY-HUB | API + OTP flow spec |
| Customer typology engine | ⚠️ | customer-typologies | Detection rules in policy code map |

---

## 7. Business operations systems

| System | Status | Canonical doc | Gap / action |
|--------|--------|---------------|--------------|
| Inbox (unified) | ✅ | CHANNEL-UX-CONTRACT | Handoff UX L3 |
| Refund ladder | ⚠️ | BUSINESS-RULES-REGISTRY | Manager queue UI |
| Waitlist | ⚠️ | fitness pack | Promote-on-cancel workflow |
| Packages / vouchers | 📋 | wellness vertical | Ledger schema doc |
| Inventory (consumables) | ❌ | verticals.md | Defer — light retail only |
| Payroll export | ⚠️ | COMPLETE-SYSTEM-SPEC §7 | Hours CSV — expand |
| Reporting / rollup | ⚠️ | chain routes | Founder briefing spec |
| Import / migration | 📋 | booksy-import-runbook | **Productized import** spec |
| Custom domain `/b` | 📋 | PUBLIC-B R3 | DNS + SSL runbook |
| Multi-location / chain | ⚠️ | configurations.md | Switcher UX L3 |
| Chair-rental economics | 📋 | journeys/p2b-chair-rental | Split book attribution |

---

## 8. Platform ops (Livia Inc)

| System | Status | Canonical doc | Gap / action |
|--------|--------|---------------|--------------|
| Support tickets + Thread | ⚠️ | INTERNAL-SUPPORT-PLATFORM-SPEC | Liv transcript attach |
| surfaceId registry | ⚠️ | SUPPORT-POINTS | 100% route coverage |
| Tenant health / Radar | 📋 | gap review | Monitoring hooks doc |
| Feature flags per tenant | 📋 | — | Beta rollout spec |
| Workforce grants | ⚠️ | WORKFORCE-ONBOARDING | Audit on grant/revoke |
| Observability | ⚠️ | ADR 0017 | SLO doc for `/b` LCP |
| DR / backup | ⚠️ | disaster-recovery.md | Supabase verify |
| Billing / Stripe Connect | ⚠️ | LIVIA-OS-MONETIZATION | In-app tier vs marketing |
| Legal / DPA | ⚠️ | legal/* | G3 counsel gate |

---

## 9. Demo & “live feel” systems

| System | Status | Canonical doc | Gap / action |
|--------|--------|---------------|--------------|
| Demo provision API | ✅ | demo-portal-config | — |
| Per-vertical demo shops | ⚠️ | PER-VERTICAL-DEMO-SEED | **Thin** — see DEMO-WORLD-LIVE-SPEC |
| simulate-live-day | ✅ | APPOINTMENT-BUSINESS-PLATFORM | Document operator script |
| Demo personas grid | ⚠️ | DEMO-LOGINS | Non-hair-first ordering |
| E2E vertical smoke | ✅ | e2e/tests | Expand to full journey depth |
| Founder showcase chain | ⚠️ | DEMO-FULL-SHOWCASE | Live narrative script |

---

## 10. Multi-hat sign-off (per system area)

Before build resumes, each hat confirms **L2 spec exists** for their domain:

| Hat | Signs off on | Blocker examples |
|-----|--------------|------------------|
| **Founder** | Category, scope, demo narrative | People-business manifesto |
| **Product** | Flows, gates, vertical fairness | Skin inheritance, `/b` mobile |
| **Design** | L3 screen cards, motion, presets | UI-UX-MASTER-PROGRAM completion |
| **Engineering** | L4 contracts, registry, events | Systems marked 📋 → spec |
| **GTM** | Honest marketing, battlecards | Salon language purge |
| **Support** | surfaceId, runbooks | Guest route registry |
| **Legal** | G3 clinical, AI, DPA | Medspa consent counsel |
| **P7 proxy** | Guest journeys mobile-first | Token + PWA spec |

---

## 11. Priority gaps for doc sprint (P0)

1. **Skin inheritance** — [`SKIN-BRAND-INHERITANCE-SPEC.md`](../design/SKIN-BRAND-INHERITANCE-SPEC.md) ✅
2. **Category reframe** — [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md) ✅
3. **UI/UX master program** — [`UI-UX-MASTER-PROGRAM.md`](../design/UI-UX-MASTER-PROGRAM.md)
4. **Demo world live depth** — [`DEMO-WORLD-LIVE-SPEC.md`](./DEMO-WORLD-LIVE-SPEC.md)
5. **Build plan v2** — [`LIVIA-BUILD-PLAN-V2.md`](./LIVIA-BUILD-PLAN-V2.md)
6. ~~Global search spec~~ — ✅
7. ~~Customer notification opt-in~~ — ✅
8. ~~Screen card grid P0~~ — ✅ 24/24
9. **guest-surfaces.ts registry** — doc + code audit
10. ~~Import/migration product spec~~ — ✅
11. **Performance budgets CI** — spec ✅, wiring pending

---

## 12. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial systems audit — notifications called out; P7 mobile; search; demo depth |
