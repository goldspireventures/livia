# Visual screen master inventory

**Status:** canonical (2026-05-31) — **living document**  
**Total screens:** ~120 (expand as routes added)  
**Screen cards:** `docs/design/screen-cards/{meta.id}.yaml`  
**Legend:** `card` = YAML exists · `png` = northstar/export · `e2e` = automated test · `figma` = frame id

---

## How to read

| Column | Meaning |
|--------|---------|
| **ID** | Stable `meta.id` — never rename without migration |
| **World** | W1–W6 |
| **Route** | Production path |
| **Persona** | P1–P7 |
| **P0** | Must have screen card before build Phase 1 |

---

## W1 — Marketing (`livia-marketing` :5174)

| ID | Route | Persona | P0 | card | png | e2e |
|----|-------|---------|----|------|-----|-----|
| w1.marketing.home | `/` | Prospect | ✅ | ✅ | M1 locked | marketing-gate |
| w1.marketing.pricing | `/pricing` | Prospect | ✅ | ✅ | M2 locked | marketing-gate |
| w1.marketing.how | `/how-it-works` | Prospect | ✅ | 📋 | M3 ns | — |
| w1.marketing.verticals | `/verticals` | Prospect | | 📋 | M4 ns | — |
| w1.marketing.vertical | `/verticals/:slug` | Prospect | | 📋 | — | — |
| w1.marketing.chair-rental | `/for/chair-rental` | Prospect | | 📋 | — | — |
| w1.marketing.europe | `/europe` | Prospect | | 📋 | — | — |
| w1.marketing.de | `/de` | Prospect | | 📋 | — | — |
| w1.marketing.eu-ai | `/eu-ai` | Prospect | | 📋 | — | — |
| w1.marketing.contact | `/contact` | Prospect | | 📋 | — | — |
| w1.marketing.changelog | `/changelog` | Prospect | | 📋 | — | — |
| w1.marketing.status | `/status` | Prospect | | 📋 | — | — |
| w1.marketing.legal.privacy | `/legal/privacy` | Prospect | | 📋 | — | — |
| w1.marketing.legal.tos | `/legal/tos` | Prospect | | 📋 | — | — |
| w1.marketing.legal.dpa | `/legal/dpa` | Prospect | | 📋 | — | — |
| w1.marketing.404 | `*` | Prospect | | 📋 | — | — |

---

## W2 — Gateway (`livia-dashboard` auth + demo)

| ID | Route | Persona | P0 | card | png | e2e |
|----|-------|---------|----|------|-----|-----|
| w2.gateway.sign-in | `/sign-in` | All | ✅ | ✅ | G3 ns | auth-smoke |
| w2.gateway.sign-up | `/sign-up` | Owner | | 📋 | — | — |
| w2.gateway.legal-accept | `/legal-acceptance` | Owner | ✅ | ✅ | — | onboarding |
| w2.gateway.onboarding | `/onboarding` | Owner | ✅ | ✅ | — | onboarding |
| w2.gateway.demo.launcher | `/demo` | Prospect | ✅ | ✅ | G1 grid | full-platform-demo |
| w2.gateway.demo.wedge | `/demo/wedge/:vertical` | Prospect | ✅ | ✅ | G1 tattoo | wedge-smoke |
| w2.gateway.demo.persona | `/demo/:persona` | Prospect | | 📋 | — | demo-personas |
| w2.gateway.guides | `/guides` | Internal QA | | 📋 | — | — |

---

## W4 — Tenant web (`livia-dashboard` authenticated)

| ID | Route | Persona | P0 | card | png | e2e |
|----|-------|---------|----|------|-----|-----|
| w4.owner.dashboard | `/dashboard` | P2 | ✅ | ✅ | tenant inbox ns | dashboard-smoke |
| w4.owner.chain | `/chain` | P1 | ✅ | ✅ | — | founder-smoke |
| w4.ops.inbox | `/inbox` | P2,P3,P6 | ✅ | ✅ | tenant inbox ns | inbox-smoke |
| w4.ops.my-day | `/my-day` | P4 | ✅ | ✅ | mobile today ns | my-day-smoke |
| w4.ops.bookings.list | `/bookings` | P2,P3,P6 | ✅ | ✅ | — | bookings-smoke |
| w4.ops.bookings.new | `/bookings/new` | P3,P6 | ✅ | ✅ | — | booking-wizard |
| w4.ops.bookings.detail | `/bookings/:id` | All staff | ✅ | 📋 | — | — |
| w4.ops.customers.list | `/customers` | P2,P3,P6 | | 📋 | — | — |
| w4.ops.customers.detail | `/customers/:id` | P2,P3,P4 | | 📋 | — | — |
| w4.ops.staff.list | `/staff` | P2,P3 | | 📋 | — | — |
| w4.ops.staff.detail | `/staff/:id` | P2,P3 | | 📋 | — | — |
| w4.ops.services | `/services` | P2,P3 | | 📋 | — | — |
| w4.ops.audit | `/audit` | P2 | | 📋 | — | — |
| w4.ops.settings | `/settings` | P2 | ✅ | ✅ | — | — |
| w4.ops.design-proofs | `/design-proofs` | body-art | ✅ | ✅ | proofs ns | proof-flow |
| w4.ops.medspa.hub | `/medspa` | medspa | ✅ | ✅ | — | medspa-smoke |
| w4.ops.classes | `/classes` | fitness | | 📋 | — | fitness-smoke |
| w4.ops.rota | `/rota` | P2,P3 | | 📋 | — | — |
| w4.ops.day-packages | `/day-packages` | wellness | | 📋 | — | — |
| w4.ops.host | `/host` | chair-rental | | 📋 | — | — |
| w4.ops.brands | `/brands` | multi-brand | | 📋 | — | — |
| w4.ops.franchise | `/franchise` | franchise | | 📋 | — | — |
| w4.ops.premises | `/premises` | multi-location | | 📋 | — | — |
| w4.ops.toolkit | `/toolkit` | P2 | | 📋 | — | — |
| w4.ops.lifecycle | `/lifecycle` | P2 | | 📋 | — | — |
| w4.ops.launch-status | `/launch-status` | P2 | | 📋 | — | — |
| w4.ops.portal | `/portal` | demo | | 📋 | — | — |

---

## W4 — Tenant mobile (`livia-mobile` Expo)

| ID | Route | Persona | P0 | card | png | e2e |
|----|-------|---------|----|------|-----|-----|
| w4m.staff.my-day | `/(tabs)/my-day` | P4 | ✅ | ✅ | today ns | maestro-my-day |
| w4m.staff.today | `/(tabs)/index` | P4 | ✅ | 📋 | today ns | — |
| w4m.ops.inbox | `/(tabs)/inbox` | P3,P6 | ✅ | 📋 | — | — |
| w4m.ops.bookings | `/(tabs)/bookings` | P3,P6 | | 📋 | — | — |
| w4m.ops.customers | `/(tabs)/customers` | P4 | | 📋 | — | — |
| w4m.ops.approvals | `/(tabs)/approvals` | P3 | | 📋 | — | — |
| w4m.ops.more | `/(tabs)/more` | All | | 📋 | — | — |
| w4m.founder.shops | `/(tabs)/shops` | P1 | ✅ | ✅ | — | — |
| w4m.booking.detail | `/booking/[id]` | P4 | | 📋 | — | — |
| w4m.booking.new | `/booking/new` | P6 | | 📋 | — | — |
| w4m.customer.detail | `/customer/[id]` | P4 | | 📋 | — | — |
| w4m.notifications | `/notifications` | All | ✅ | ✅ | — | — |
| w4m.settings | `/settings` | All | | 📋 | — | — |
| w4m.onboarding | `/onboarding` | Owner | ✅ | 📋 | — | — |
| w4m.onboarding.setup | `/onboarding-setup` | Owner | | 📋 | — | — |
| w4m.sign-in | `/sign-in` | All | | 📋 | — | — |
| w4m.design-proofs | `/design-proofs` | body-art | | 📋 | — | — |
| w4m.clinical-hub | `/clinical-hub` | medspa | | 📋 | — | — |
| w4m.founder.cockpit | `/founder/cockpit` | P1 | | 📋 | — | — |
| w4m.public.book | `/public-book/[slug]` | P7 | | 📋 | — | mobile-web-parity |

---

## W5 — Public guest (`/b` on dashboard)

| ID | Route | Persona | P0 | card | png | e2e |
|----|-------|---------|----|------|-----|-----|
| w5.public.book | `/b/:slug` | P7 | ✅ | ✅ | public-book ns | public-booking-quality |
| w5.public.proof | `/b/:slug/proof/:token` | P7 | ✅ | ✅ | guest-proof ns | proof-token |
| w5.public.visit | `/b/:slug/visit/:token` | P7 | ✅ | ✅ | visit ns | — |
| w5.public.intake | `/b/:slug/intake/:token` | P7 | ✅ | ✅ | — | medspa-consent |
| w5.public.waitlist | `/b/:slug/waitlist/:token` | P7 | | 📋 | — | fitness-waitlist |
| w5.public.pay | `/b/:slug/pay/:token` | P7 | ✅ | ✅ | — | deposit-flow |
| w5.public.premises | `/p/:slug` | P7 | | 📋 | — | — |

---

## W6 — Guest hub (R2)

| ID | Route | Persona | P0 | card | png | e2e |
|----|-------|---------|----|------|-----|-----|
| w6.guest.hub | `/my` or `my.livia-hq.com` | P7 | R2 | 📋 | — | guest-hub-r2 |
| w6.guest.otp | `/my/verify` | P7 | R2 | 📋 | — | — |

---

## W3 — Internal ops (`livia-internal` :5175)

| ID | Route | Persona | P0 | card | png | e2e |
|----|-------|---------|----|------|-----|-----|
| w3.internal.exec.cockpit | `/` or exec path | Exec | ✅ | ✅ | I2 shiplane | — |
| w3.support.thread | `/support`, `/support/:id` | Support | ✅ | ✅ | I4 thread | — |
| w3.support.investigate | `/support/investigate` | L2 | | 📋 | I5 ns | — |
| w3.support.board | `/support/board` | Support | | 📋 | I4-B | — |
| w3.support.radar | `/support/radar` | Support | | 📋 | I4-C | — |
| w3.internal.tenants | `/tenants`, `/tenants/:id` | Ops | | 📋 | — | — |
| w3.internal.knowledge | `/knowledge` | Support | | 📋 | — | — |
| w3.internal.monitoring | `/monitoring` | Eng | | 📋 | — | — |
| w3.internal.flags | `/flags` | Eng | | 📋 | — | — |
| w3.internal.access | `/access` | Exec | | 📋 | — | — |
| w3.internal.platform | `/platform` | Eng | | 📋 | — | — |

---

## Vertical `/b` variants (same ID, preset morph)

Each code vertical gets **copy + step + visual tone** overrides in screen card `vertical_overrides` — not separate routes.

| Vertical | w5.public.book override |
|----------|-------------------------|
| hair | Stylist picker step |
| body-art | Consult vs session archetype |
| medspa | Consent gate step |
| fitness | Class vs PT branch |
| pet-grooming | Pet profile picker |
| automotive-detailing | Vehicle + package |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial inventory ~120 screens |
