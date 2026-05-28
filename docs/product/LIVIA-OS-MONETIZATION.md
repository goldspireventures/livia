# Livia OS — monetization architecture

**Status:** Canonical (2026-05-26)  
**Audience:** founder, product, engineering  
**Principle:** Monetize **capabilities on the OS**, not “AI credits” alone. Liv is included; **modules and scale** are billed.

---

## Why OS monetization matters

Competitors sell **seats + SMS**. Livia sells **a colleague on an operating system**. When the kernel is right, revenue layers stack without feeling bolted-on:

```text
Base tenant (shop) → seats → channels → outcomes → lifecycle moments → enterprise
```

All entitlements flow from **`plan_tier` + feature flags + metering** — surfaced in Settings → Billing and enforced in API + Liv tool registry.

---

## Revenue layers (v1 implement / v1.5 price)

| Layer | What customer buys | Enforcement | UI surface |
|-------|-------------------|-------------|------------|
| **L1 — Shop base** | One `businessId`, core booking + inbox + Liv R2 | `plan_tier` solo/studio/chain | Settings → Billing, marketing pricing |
| **L2 — Seats** | Staff/manager logins | `businessMemberships` count vs entitlement | Team invite gate |
| **L3 — Channels** | SMS, voice minutes, WA/IG volume | Metering recorder + caps | Comms settings + usage strip |
| **L4 — Outcomes** | Optional % on recovered no-shows / voice bookings | Stripe Connect + ledger | Reports (honest: G3 for live money) |
| **L5 — Lifecycle** | Second shop, succession, migration concierge | One-shot SKUs | Lifecycle wizard |
| **L6 — Enterprise** | SSO, audit export, SLA | `enterprise` tier + flags | Sales-led |

**v1 build requirement:** L1–L3 **visible and enforced in UI** (even if Stripe test mode). L4–L6 documented with honest “available at launch” where not live.

---

## Liv is not a line-item upsell

| Wrong | Right |
|-------|-------|
| “Pay €20/mo for AI” | Liv included; you pay for the OS + scale |
| Hidden tool calls | Metered, audited, cap-aware |
| Generic AI tier | **Tool catalog** filtered by plan + vertical pack |

Registry: `liv_tool_catalog` + `resolveLivToolsForBusiness`. Dashboard: Settings → Liv → Tool catalog (read/write for owner).

---

## Data-driven pricing display

Marketing pricing must read from **same entitlements table** as app (or generated JSON at build) — no hand-edited €49 on site and €99 in app.

**Target:** `lib/policy/src/entitlements.ts` (or billing service) → `GET /billing/plans` → marketing `pricing.tsx` consumes API or shared static export.

---

## Cross-border billing

| Concern | Approach |
|---------|----------|
| Currency | `jurisdiction.currency` per business |
| Tax | Stripe Tax / founder ops — not invented in UI |
| Invoices | Stripe Customer per `businessId` |
| EU residency | Marketing honest until ADR #57 closed |

---

## Competitive moat (hard to copy)

1. **Outcome-linked pricing** tied to audit log (“Liv recovered €X”) — needs real continuity data.  
2. **Channel-native OS** — WA/IG/inbox/voice one graph; incumbents patch chat on.  
3. **Chair-host / franchise** commercial shapes — not single-shop SKU only.  
4. **Peer insights** (k-anonymized) as retention layer — data network effect.

---

## Engineering checklist (Operation Solidify T7)

- [ ] Plan tiers enforced on invite, voice, WA send, chain features  
- [ ] Usage meter visible to owner (SMS/voice/Liv tool calls)  
- [ ] Billing tab matches marketing tiers  
- [ ] Internal ops can see tenant `plan_tier` + usage (support bundle)

---

## v2 monetization (explicit defer)

- Marketplace / app store for vertical packs  
- White-label `/b` domains  
- Reseller / franchise billing splits  
- US payment rails
