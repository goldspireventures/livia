# People-business category manifesto

**Status:** canonical (2026-05-31) — **supersedes salon-first public framing**  
**Audience:** founder, product, design, engineering, GTM, agents  
**Authority:** When category language conflicts with older docs (“salon OS”, “salon hires”), **this doc wins** for *product definition*. GTM wedge (IE hair) remains in [`SCOPE-MORATORIUM.md`](./SCOPE-MORATORIUM.md) until Gate 2 unlock.

**Reads with:** [`MASTER-BLUEPRINT-INDEX.md`](./MASTER-BLUEPRINT-INDEX.md) · [`../LIVIA-ALIGNMENT.md`](../LIVIA-ALIGNMENT.md) · [`LIVIA-GLOBAL-PRODUCT-SYSTEM.md`](./LIVIA-GLOBAL-PRODUCT-SYSTEM.md) · [`../livia-positioning.md`](../livia-positioning.md)

---

## 1. What Livia is (final category)

**Livia is the operating system for people-businesses — businesses where revenue comes from skilled humans selling scarce time to people who come back.**

**Liv** is the named colleague who runs the gap between floor reality and owner visibility: demand, schedule, memory, policy, channels — under audit and disclosure.

| Term | Meaning | Not |
|------|---------|-----|
| **People-business** | Appointment + skill + relationship + floor hierarchy | Generic SMB, CRM, marketplace |
| **Operating system** | One truth for time, people, money, memory, policy | Calendar CRUD with sidebar |
| **Liv** | Governed autonomous operator (R1→R5 promotion) | Chatbot bolt-on |
| **Vertical pack** | Ritual + vocabulary + gates (hair, medspa, detailing…) | The whole product |
| **Wedge (GTM)** | First market to prove (IE hair/beauty) | Product ceiling |

**Hair was the microscope, not the organism.** Origin story only.

---

## 2. The physics (what every in-scope business shares)

Any business that **fits** Livia shares these operating truths:

```text
Demand (async) → Commitment (book) → Delivery (service) → Money → Memory → Governance
```

| Invariant | Examples across verticals |
|-----------|---------------------------|
| **Time inventory** | Chair, room, bay, class slot, consult block |
| **Skill match** | Stylist, artist, therapist, practitioner, coach |
| **Relationship memory** | Formula, design, pet profile, treatment plan lite, vehicle notes |
| **Policy** | Deposit, cancel, consent, refund ladder |
| **Channels** | Phone, DM, web, SMS — must converge on one schedule |
| **Org hierarchy** | Owner, manager, practitioner, front desk |
| **Async demand** | Bookings start outside desk hours |

**Out of scope (honest):** SKU retail without service, inpatient hospital, pure content, marketplace that owns the customer, full regulated EHR without partners.

---

## 3. Expansion rings (think wide)

### Ring 1 — Code verticals today (`VERTICAL_COVERAGE_REGISTRY`)

Hair, beauty, wellness, body-art, fitness, medspa, allied-health, pet-grooming, automotive-detailing + locale flagship (DK wellness).

### Ring 2 — Same physics, new packs (document before build)

| Space | Pack needs | Tier |
|-------|------------|------|
| Mobile operators (van groomer, mobile detailer) | Travel buffer, geo | FIT |
| Home/property consult-first trades | Multi-day job, deposit binds scope | FIT + partner |
| Creative studio hire (photo, podcast, rehearsal) | Room + equipment | FIT |
| Wedding/event vendors | Date-bound, multi-stakeholder; consult-first | FIT — [`EVENT-VENDORS-VERTICAL-PROGRAM.md`](./EVENT-VENDORS-VERTICAL-PROGRAM.md) |
| Corporate wellness B2B | Payer ≠ attendee | Org-shape |
| Vet consult lite (not full PMS) | Pet + clinical gate | PARTNER |
| Education/coaching sessions | Package consumption | Defer V11 until OS dominates |

### Ring 3 — Category-defining (one-of-a-kind)

| Bet | Why revolutionary |
|-----|-------------------|
| **Liv as hireable capacity** | Outcome + promotion, not €99/mo seats |
| **Operating reality layer** | Truth above Phorest + WhatsApp + Xero |
| **Guest vault (W6)** | Person-owned continuity; owners blind cross-tenant |
| **Quality registry (Bet 6)** | Discovery without marketplace commission |
| **Policy-governed autonomy** | Audit-as-diary; EU-accountable automation |
| **Composable units (12)** | Liv runtime, voice, audit — Stripe-shaped decomposition |

---

## 4. Public language (approved)

**Primary (external):**

> **Livia is the operating system for people-businesses in Europe. Liv is the colleague you hire to run bookings, messages, and the day’s chaos — and she earns more responsibility over time.**

**Subhead:**

> Skilled time. Real relationships. One place for the truth — on web, mobile, and the channels your customers already use.

**Deprecated in product/marketing copy (GTM residue):**

- “Salon software”, “salon OS”, “for hair salons”
- “AI-native booking platform” (table stakes 2026)
- “Multi-tenant OS” (engineering README only)

**Engineering README one-liner:**

> Operator platform for scheduled skilled services — multi-tenant kernel + vertical/locale/org packs + Liv agent runtime.

---

## 5. What we are explicitly NOT

See [`livia-positioning.md`](../livia-positioning.md) §5. Summary:

- Not a marketplace (Fresha/Treatwell shape)
- Not payments-led (Square shape)
- Not generic Calendly
- Not CRM-with-calendar
- Not clinical EHR (partner or never)
- Not “AI feature inside legacy UI”

---

## 6. Implications for build and docs

| Area | Rule |
|------|------|
| **Copy** | `businessVocabulary(vertical)` — never hardcode salon |
| **Demo** | Lead with multi-vertical showcase, not Aurora-only |
| **Gateway wedge** | G1-A interstitial for **every** registry vertical |
| **Screens** | Persona × vertical × surface matrix — not one default nav |
| **Build authority** | [`LIVIA-DOCUMENTATION-PROGRAM.md`](./LIVIA-DOCUMENTATION-PROGRAM.md) until doc gate passes |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial manifesto — people-business category; supersedes salon-first product framing |
