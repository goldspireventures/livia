# Livia platform terminology

**Status:** canonical (2026-05-30)  
**Purpose:** One vocabulary for docs, code comments, and UI copy. When terms conflict, **this doc wins**.

---

## Company & product

| Term | Meaning | Not |
|------|---------|-----|
| **Livia Inc** | The company (B2B brand) | The AI |
| **Livia** | The platform / operating system product | A single vertical app |
| **Liv** | The agent character — speaks AS Liv | “The AI” in customer-facing copy |
| **Platform kernel** | Auth, tenant, Postgres, OpenAPI, audit, events, entitlements | Vertical UI |
| **Vertical pack** | Policy module: vocabulary, routes, seed, P7 flows (`hair`, `body-art`, …) | GTM wedge alone |
| **Wedge (GTM)** | First market focus (e.g. hair + English-IE) | Whole product definition |

---

## Domains & surfaces (W1–W6)

| Term | Production | Artifact |
|------|------------|----------|
| **Marketing** | `https://livia-hq.com` | `livia-marketing` |
| **Tenant app** | `https://app.livia-hq.com` | `livia-dashboard`, `livia-mobile` |
| **API** | `https://api.livia-hq.com` | `api-server` |
| **Internal ops** | `https://ops.livia-hq.com/{secret}` | `livia-internal` |
| **Public guest `/b`** | `https://app.livia-hq.com/b/{slug}` | dashboard public routes |
| **Guest hub (R2)** | `https://my.livia-hq.com` (planned) | P7 cross-shop self view — not tenant login |

**Legacy in docs:** `livia.io`, `app.livia.io`, `b.livia.io` — historical / demo-email pattern. **Production truth is `livia-hq.com`.** Demo logins may still use `@livia.io` or `@demo.livia-hq.com` per [`operations/WORKFORCE-ONBOARDING.md`](./operations/WORKFORCE-ONBOARDING.md).

---

## Skins (do not merge)

| ID | Name | Who |
|----|------|-----|
| **W1** | Marketing — Aurora Editorial | Prospects |
| **W2** | Gateway aurora | Demo, sign-in |
| **W3a** | Internal exec — ops amber | `@livia-hq.com` founder ops |
| **W3b** | Internal support — ops amber | Support operators |
| **W3c** | Internal modules | Tenants, flags, platform |
| **W4** | Tenant — Platform Default + presets | Owners, staff |
| **W5** | Public guest — brand × vertical | P7 customers, no login |
| **W6** | Guest hub — Liv Guest / My Livia | P7 cross-shop **self** view (R2); phone OTP |

Full map: [`product/LIVIA-PLATFORM-LIFECYCLE.md`](./product/LIVIA-PLATFORM-LIFECYCLE.md) §1.

---

## “Cockpit” disambiguation

| Term | Meaning |
|------|---------|
| **Exec cockpit** | Livia Inc operator home — Ship Lane, Hats, Exceptions (`FounderCockpitView`) |
| **Tenant dashboard** | Owner/staff web app — **not** “cockpit” in docs |
| **Chain view** | P1 founder multi-shop rollup — `/chain` |
| **Exec command center** | Operator runbook — URLs, secrets, sign-in ([`operations/EXEC-COMMAND-CENTER.md`](./operations/EXEC-COMMAND-CENTER.md)) |

---

## Tenant authority (owner vs team)

| Term | Meaning | Not |
|------|---------|-----|
| **Owner** | Legal/contractual holder of this `business` — billing, invites, succession | “Admin” colloquially |
| **Staff roster** | People on the calendar (`staff` table) | Guaranteed Livia login |
| **Team invite** | Clerk invite → `business_memberships` (ADMIN/STAFF sign-in) | Ownership transfer |
| **Pass the keys** | G8 ownership succession — same tenant, new `owner_id` | “Transfer staff” |

Canonical: [`product/TENANT-AUTHORITY-AND-SUCCESSION.md`](./product/TENANT-AUTHORITY-AND-SUCCESSION.md) · policy `ownership-succession.ts`.

---

## Guest & channels

| Term | Meaning |
|------|---------|
| **`/b/{slug}`** | Public storefront + book (W5) |
| **Guest surface** | Token page: visit, proof, consent, pay — no Clerk account |
| **Thick Livia** | Rich work on Livia pages (images, forms, approval) |
| **Thin channel** | SMS/WhatsApp/voice — links + short replies only |
| **P7** | End customer persona |

Spec: [`product/PUBLIC-B-SURFACE-SPEC.md`](./product/PUBLIC-B-SURFACE-SPEC.md), [`design/CHANNEL-UX-CONTRACT.md`](./design/CHANNEL-UX-CONTRACT.md).

---

## Internal ops

| Term | Meaning |
|------|---------|
| **The Thread** | Primary support layout — queue \| thread \| context (I4-A) |
| **Triage Board** | Kanban support route (I4-B) |
| **Tenant Radar** | Tenant-health-first support route (I4-C) |
| **Ship Lane** | Exec gate checklist — collapsed/expanded |
| **`surfaceId`** | Stable registry id linking ticket → product route |
| **`requestId`** | API correlation UUID |

---

## Programs & releases

| Term | Meaning |
|------|---------|
| **OPERATION-SOLIDIFY** | Active in-repo build program (v1 final) |
| **PLATFORM-EVOLUTION-AND-OPS-PROGRAM** | Master engineering todo (Tracks A–H) |
| **PLATFORM-RELEASE-PROGRAM** | R1 / R2 / R3 platform-wide release cadence |
| **R1 (now)** | ~8–12 weeks — F+G+D foundation |
| **R3 (v3)** | ~12–18 months — platform coherence |
| **North star** | Ultimate design target — not a single ship date |
| **Gate 2** | Commercial proof — 10 shops, real bookings ([`launch-plan.md`](./launch-plan.md)) |

**Archived program names:** SYSTEM-REALIGNMENT (complete), V1.5/V2 execution (closed) — see [`archive/README.md`](./archive/README.md).

---

## Currency & locale

| Term | Rule |
|------|------|
| **€** | Marketing and EU GTM pricing display |
| **English-IE** | First locale pack to prove |
| **Jurisdiction pack** | Legal, SMS, deposit rules per country |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Initial glossary — domains, skins, cockpit, releases |
