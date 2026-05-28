# v2 — wrap-up (comprehensive close)

**Date:** 2026-05-22  
**Status:** **v2 in-repo engineering + GTM product layer — closed**  
**Boundary:** [ADR 0020](../adr/0020-v2-engineering-close-boundary.md)  
**Your lane (commercial ship):** [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md) only  
**Next in-repo program:** v3 (when you open it) — seed list §6 below

---

## 1. What v2 was (one paragraph)

v2 merged **v1.5 heartland** (host, brands, rota, hiring, chain) with **UK + Nordics policy**, **fitness / body-art / wellness** vertical depth, **C8/C11/C12** configurations, **livia.io** as first-class surface, **internal ops MVP**, and a **GTM “wow” layer** centred on **Liv** (briefing, toolkit, Ask Liv, public booking). It is the **GTM version** of Livia: demonstrable entire product (7 surfaces), honest marketing, OS-shaped agent runtime — not in-house payroll, not self-learning magic.

---

## 2. Three lanes (what’s open vs closed)

| Lane | Status | Owner |
|------|--------|-------|
| **A. Engineering kernel + surfaces** | ✅ Closed | Eng — ADR 0020 |
| **B. GTM product polish** | ✅ Shipped in repo | Eng — [`V2-GTM-WOW-LAYER.md`](./V2-GTM-WOW-LAYER.md) |
| **C. Commercial / legal / fleet proof** | ⏸ Open | **You** — [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md) |

**There is no hidden “rest of v2 engineering” backlog.** Anything still feeling thin (OAuth live, Nordic voice prod, payroll connector, internal flags UI) is **v3** unless you supersede ADR 0020.

---

## 3. Entire Livia — delivered in v2

| # | Surface | What shipped |
|---|---------|----------------|
| 1 | **livia.io** | Verticals (hair, beauty, fitness, body-art, …), chair-rental, pricing, honest channels, `pnpm dev:marketing`, E2E |
| 2 | **Tenant web** | Today, inbox (+ **Ask Liv**), toolkit, host, brands, rota, hiring, chain, classes, franchise, design-proofs, settings, billing |
| 3 | **Tenant mobile** | Core day, host, brands, **rota list** + web edit link |
| 4 | **Public `/b/{slug}`** | Booking + Liv chat (env-dependent AI) |
| 5 | **API + DB** | `004`–`010` migrations, class sessions, package credits, franchise rollup, brokers, Inngest workflows |
| 6 | **Internal `:5175`** | Tenants / Platform / Voice + platform-health |
| 7 | **Policy** | UK (GB) + Nordic packs (SE/DK/NO/FI text) |

**Map:** [`LIVIA-FULL-SURFACE-MAP.md`](./LIVIA-FULL-SURFACE-MAP.md) · **Matrix:** [`V2-SURFACE-MATRIX.md`](./V2-SURFACE-MATRIX.md)

---

## 4. Liv & Livia — how we build (honest, global)

| Question | Answer |
|----------|--------|
| Is Liv hardcoded? | **No** — registry, profiles, vertical packs, prompt store, tenant runtime pool |
| Does Liv “learn” the business? | **No** — configured per request; policy + audit + tools |
| Is that the right global approach? | **Yes** — packs on invariant kernel; partners for payroll/tax (Complete Spec §7) |
| Target | [`LIV-OPERATING-SYSTEM.md`](./LIV-OPERATING-SYSTEM.md) — event matrix, memory, DB registry (v3 depth) |

**Pitch to a shop:** One OS for appointments and the team on the floor; **Liv** answers customers, books the chair, briefs the owner; payroll/accounting via **integrations**, not Livia doing PAYE.

**Stakeholder value:** [`LIVIA-GLOBAL-PRODUCT-SYSTEM.md`](./LIVIA-GLOBAL-PRODUCT-SYSTEM.md) **Part X** (tenants vs Livia Inc).

---

## 5. GTM “wow” layer (shipped)

| Moment | Where |
|--------|--------|
| Liv Command Hub | Dashboard Today, chain |
| Owner toolkit | `/toolkit` |
| Ask Liv | Inbox → `liv-assist` |
| Morning briefing | Today + refresh from hub |
| Mobile rota | More → Team rota |

Detail: [`V2-GTM-WOW-LAYER.md`](./V2-GTM-WOW-LAYER.md)

---

## 6. Rest of v2 — only this remains

### 6.1 You (founder ship lane) — gates commercial ship

| Priority | Item |
|----------|------|
| P0 | Counsel docs live; marketing truth audit clean |
| P0 | Stripe prod: Connect + first paid sub |
| P0 | Prod migrations `004`–`010`; EU region ADR |
| P1 | 10 real shops (non-demo); proof rows P1–P9 as needed for narrative |
| P1 | `livia.io` public + Lighthouse; app stores if mobile GTM |
| P2 | BSPs **or** remove WA/IG claims |

Full table: [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md)

### 6.2 Optional eng (only if you reopen v2 via ADR)

Not required for v2 close; pick as **v3** instead:

| Item | Why defer |
|------|-----------|
| Payroll export + BrightPay connector | RFC 0012 — LOI from 3 DPs |
| UAT sign-off row in `UAT-CERTIFICATION.md` | Founder/demo ritual, not code |
| Internal: flags, incidents, impersonation | Portal spec §3 — v3 |
| Native mobile hiring/classes/franchise | Web SoT is enough for GTM |

### 6.3 Verification (any time before demo / investor)

```powershell
pnpm run typecheck
pnpm dev:api
pnpm dev:dashboard
pnpm dev:marketing
pnpm dev:internal   # optional
pnpm smoke:gate3
pnpm test:e2e:marketing
pnpm test:e2e
```

**Demo script (5 min):** livia.io → dashboard sign-in → Today (briefing + Liv hub) → toolkit → inbox Ask Liv → `/b/{slug}` customer Liv → chain or host if tier demo.

---

## 7. v3 seed (first program when you reopen eng)

Prioritized from v2 deferrals and ecosystem work (see [`V3-EXECUTION-PROGRAM.md`](./V3-EXECUTION-PROGRAM.md)):

| P | Theme | Outcome |
|---|--------|---------|
| 1 | **Payroll prep** | Export + pre-flight; BrightPay IE connector |
| 2 | **Internal portal** | Tenant health + Liv traces + flags + impersonation policy |
| 3 | **Liv OS depth** | Tool registry in DB; event→action; bounded memory |
| 4 | **Channels** | Live OAuth OR claim removal; Nordic voice prod + eval |
| 5 | **Mobile parity** | Native rota create; hiring/classes/franchise |
| 6 | **Workflow depth** | Waitlist, healing-followup, intake gates |

Ledger: [`../roadmap/v2-scope.md`](../roadmap/v2-scope.md) “not in v2” + Complete Spec §7.

---

## 8. Canonical doc index (post–v2)

| Read this | For |
|-----------|-----|
| **This file** | v2 wrap-up |
| [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md) | Your only active checklist |
| [`LIVIA-ALIGNMENT.md`](../LIVIA-ALIGNMENT.md) | Company + product spine |
| [`LIVIA-GLOBAL-PRODUCT-SYSTEM.md`](./LIVIA-GLOBAL-PRODUCT-SYSTEM.md) | Global OS + Part X stakeholder value |
| [`V3-EXECUTION-PROGRAM.md`](./V3-EXECUTION-PROGRAM.md) | **Active build** (opened 2026-05-22) |
| [`LIVIA-COMPLETE-SYSTEM-SPEC.md`](./LIVIA-COMPLETE-SYSTEM-SPEC.md) §7 | Payroll & people ecosystem |
| [`LIV-OPERATING-SYSTEM.md`](./LIV-OPERATING-SYSTEM.md) | Liv target architecture |
| [`V2-EXECUTION-PROGRAM.md`](./V2-EXECUTION-PROGRAM.md) | Archived block plan |
| [`../audits/marketing-vs-reality.md`](../audits/marketing-vs-reality.md) | Claim integrity |

---

## 9. Sign-off

| Sign-off | Status |
|----------|--------|
| v2 engineering | ✅ 2026-05-22 |
| v2 GTM product layer | ✅ 2026-05-22 |
| v2 commercial ship | ⏸ Founder lane |
| v3 program | ✅ [`V3-EXECUTION-PROGRAM.md`](./V3-EXECUTION-PROGRAM.md) — go big (platform + DACH + medspa) |

**v2 is wrapped.** **Active engineering:** v3 including expansion tracks — whole-product release every ship ([`release-pipeline.md`](../engineering/release-pipeline.md)).
