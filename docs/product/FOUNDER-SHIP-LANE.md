# Founder ship lane — off-platform only

**Rule:** Nothing in this file is built in the repo. **v2 is wrapped** ([`V2-ENGINEERING-CLOSED.md`](./V2-ENGINEERING-CLOSED.md)). **Active engineering:** [`V3-EXECUTION-PROGRAM.md`](./V3-EXECUTION-PROGRAM.md). **This file** remains your off-platform checklist.

They gate **revenue**, **marketing truth**, and **commercial ship** — not the next engineering PR.

---

## G2 / G3 — launch (IE closed beta → production)

| # | You | Done when |
|---|-----|-----------|
| 1 | Counsel-signed ToS, Privacy, Cookie, DPA | Signed PDFs live |
| 2 | Stripe Connect **production** + first real deposit | Live keys; one shop paid |
| 3 | Stripe Billing **first paid subscription** in prod | Invoice paid |
| 4 | App Store + Play **public** listings | Approved + live |
| 5 | **10 real design-partner shops** (non-demo bookings) | Evidence in CRM |
| 6 | Production Twilio IE + Meta BSP (if claiming SMS/WA) | Number live |
| 7 | EU production region ADR + deploy pin | Infra doc + prod URL |
| 8 | **`livia-hq.com`** marketing + status page | Public |
| 9 | Lighthouse ≥90 on marketing | Report saved |

Details: [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md) · [`../launch-plan.md`](../launch-plan.md).

**Execution plan (founder vs AI work):** [`../company/EXECUTIVE-ACTION-PLAN.md`](../company/EXECUTIVE-ACTION-PLAN.md)  
**Support (SLAs, hire L1, support@ inbox):** [`../operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md`](../operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md) §10–11

---

## v1.5 / v2 product proof (GTM — not code)

Use these for **version ship** narratives and investor updates; engineering tracks parity in [`V2-SURFACE-MATRIX.md`](./V2-SURFACE-MATRIX.md).

| # | Proof | Target |
|---|--------|--------|
| P1 | Chair-host (C10) paying tenants | ≥3 × 30 days |
| P2 | Small chain (C7) cross-shop rollup | ≥2 × 30 days |
| P3 | Multi-brand brand wall audit | 30 days, zero leak |
| P4 | Peer insights peer-set | k≥10, ≥3 tenants consuming |
| P5 | UK design partners | ≥3 onboarded (GB) |
| P6 | Fitness class-booking studios | ≥3 × 30 days (v2) |
| P7 | Body-art design-proof studios | ≥3 × 30 days (v2) |
| P8 | Mid-chain (C8) | ≥2 customers, 5+ shops |
| P9 | Franchise (C11) | ≥1 franchisor, ≥5 franchisees |

---

## Ops / governance (parallel)

| Item | Owner |
|------|--------|
| Founder sign-off `LIVIA_MASTER_DESIGN.md` | You |
| `.local/discovery-notes` interviews | You |
| Figma design system sprint | Design |
| SOC 2 Type 1 | Post-G3 + auditor |
| Telegram/Viber BSP **or** remove marketing claim | You + legal |
| WhatsApp/IG inbound **or** remove claim | You + BSP |
| Run SQL migrations on prod (`004`–`010`) | You / ops |

---

## What engineering will not block on

- Paying tenant counts  
- Legal / store review timelines  
- Carrier/BSP approvals  
- Design-partner recruitment velocity  

When your rows above are done, **Livia is ship-complete** for the commercial milestone you are targeting (G2/G3). In-repo v2 engineering is already **build-complete**.
