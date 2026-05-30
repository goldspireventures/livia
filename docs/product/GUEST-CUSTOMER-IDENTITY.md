# Guest customer identity — how P7 is recognized without login

**Status:** canonical (2026-05-30)  
**Audience:** product, engineering, support, legal, founders  
**Reads with:** [`PUBLIC-B-SURFACE-SPEC.md`](./PUBLIC-B-SURFACE-SPEC.md) · [`customer-typologies.md`](../customer-typologies.md) · [`CHANNEL-UX-CONTRACT.md`](../design/CHANNEL-UX-CONTRACT.md) · [`LIVIA-PLATFORM-LIFECYCLE.md`](./LIVIA-PLATFORM-LIFECYCLE.md)

---

## 0. The question (plain language)

End customers (P7) book at `/b/{slug}` **without accounts**. That is intentional — less friction, salon owns the relationship. It raises four real questions:

1. **Same shop, returns later** — how do we know it is the same person?
2. **Different shop on Livia** — how do we (Livia Inc + each business) know it is the same person?
3. **Same name, different people** — how do we avoid mixing them up?
4. **Many URLs** — must customers bookmark every shop’s slug?

This doc is the **single answer**. When other docs disagree, this wins on guest identity.

---

## 1. Design principles

| Principle | Meaning |
|-----------|---------|
| **Salon-owned relationship** | Customer records live **per business** (`customers.business_id`). The shop owns the CRM row; Livia does not sell a global consumer social graph. |
| **No login by default** | P7 acts via **phone/email at book time**, **channel thread** (SMS/WhatsApp), **opaque tokens**, and optional **wallet pass** — not passwords. |
| **Explicit cross-shop linking only** | Livia **never auto-merges** the same phone across unrelated tenants without **documented consent** (CT5 in [`customer-typologies.md`](../customer-typologies.md)). |
| **Channels are continuity** | The thread the customer already uses (WhatsApp from the salon’s number) is the primary “return path” — not a pile of saved URLs. |
| **Honest duplicates** | Same name ≠ same person. Identity keys are **normalized phone** and **email**, not display name. |

---

## 2. Identity layers (what exists today)

```text
Layer A — Per-shop customer row     customers @ businessId  (owner CRM)
Layer B — Channel binding           channel_identities @ businessId + phone/handle
Layer C — Booking-scoped token      booking_guest_access    (visit/proof links)
Layer D — Ephemeral web session     Liv chat on /b          (conversation id)
Layer E — (Future) Guest hub        phone OTP → active tokens across shops user opted into
```

### 2.1 Layer A — Per-shop customer (`findOrCreateCustomer`)

**Code:** `artifacts/api-server/src/services/customers.service.ts`

When someone books on `/b/{slug}`:

1. If **email** matches an existing row at **this** `businessId` → reuse customer.
2. Else if **phone** matches → reuse customer.
3. Else → **create** new customer.

**Implication:** A regular at *Aurora Studio* who books again and enters the **same phone or email** is the **same customer row** — history, typology, strikes, Liv context all attach.

**Gaps (R1 engineering):**

| Gap | Risk | Fix |
|-----|------|-----|
| Phone not normalized on web book | `+353 87…` vs `087…` → duplicate rows | Normalize E.164 before match (SMS path already normalizes) |
| Web book without phone | Email-only or name-only → weak re-identification | Require phone for verticals that use SMS continuity |
| No auto-merge on name | Two "Sarah Murphy" → two rows until staff merges | Merge suggestions UI (exists) + Liv prompt |

### 2.2 Layer B — Channel binding

Inbound **SMS / WhatsApp / voice** resolves customer by **normalized phone** at that business (`sms-webhook.ts`, `voice-call.service.ts`).

**Implication:** Mary who always texts Aurora’s WhatsApp **does not need the slug URL** — the channel *is* her return path. Liv recognizes her on the next inbound message.

### 2.3 Layer C — Booking tokens

**Code:** `booking-guest-access.service.ts` — opaque token per **booking**, not per person.

| Route | Scope |
|-------|--------|
| `/b/{slug}/visit/{token}` | One appointment — reschedule, day-of, feedback |
| `/b/{slug}/proof/{token}` | One design proof artifact |

Tokens are **delivered by SMS/email** — customers are not expected to memorize them. New booking → new token if needed.

### 2.4 Layer D — Liv chat session

Public chat on `/b/{slug}` may use a **conversation id** for the session. It is not a durable cross-device identity unless tied to phone in the conversation.

---

## 3. Scenario answers

### 3.1 Same customer, same shop, returns to book again

| How they return | Recognized? | How |
|-----------------|-------------|-----|
| Same phone on `/b` form | ✅ Yes | `findOrCreateCustomer` reuses row |
| SMS/WhatsApp to shop | ✅ Yes | Channel routing by phone |
| Voice call | ✅ Yes | Caller ID → customer lookup |
| Visit token from old SMS | ✅ For **that booking** only | Token scoped to booking id |
| `/b/{slug}` with **different** phone | ❌ New row | Staff can merge later |
| `/b/{slug}` name only, no phone | ⚠️ Weak | Likely new row each time |

**Product stance:** Optimize for **phone-first** on `/b` in verticals where SMS continuity is default (hair, beauty, body-art, …).

### 3.2 Same customer, different shop on Livia

| Actor | Knows? | Rule |
|-------|--------|------|
| **Shop A** | Only Shop A’s row | Isolated tenant data |
| **Shop B** | Only Shop B’s row | Separate insert on first book |
| **Livia Inc (infra)** | Could see phone hash across tenants | **Must not** expose to shops or Liv without consent |
| **Liv at Shop B** | Treats as new unless CT5 consent | [`customer-typologies.md`](../customer-typologies.md) CT1, CT5 |

**Today:** Booking at `/b/paws-parlour-dublin` and `/b/clarity-medspa-dublin` creates **two customer records**. Documented in [`DEMO-FULL-SHOWCASE.md`](../testing/DEMO-FULL-SHOWCASE.md).

**Future (R2+, optional):** **Guest continuity hub** — customer enters phone → OTP → sees **only bookings/tokens they already have** at shops they’ve interacted with. Cross-shop **insights** for Liv still require **per-shop consent** (CT5).

### 3.3 Same name, different people

| Signal | Reliable? |
|--------|-------------|
| Display name | ❌ No |
| Phone (normalized) | ✅ Primary |
| Email | ✅ Secondary |
| Staff merge | ✅ Human override |

**Owner tools:** `GET /customers/merge-suggestions`, merge UI, Liv `merge_customer_identity` — **within one shop only**.

**Support rule:** Never assume two "James O'Brien" rows are the same person without phone/email match or staff confirmation.

### 3.4 “Do customers need many URLs saved?”

**No — not as the primary UX.**

| Entry point | What the customer saves / uses |
|-------------|----------------------------------|
| **Shop’s slug** `/b/{slug}` | One URL per shop — Instagram bio, Google Business (owner publishes once) |
| **SMS/WhatsApp thread** | No URL — reply to last message |
| **Wallet pass** (entitlement) | One pass **per shop relationship** — tap to book/view next visit |
| **Token links** | Ephemeral — in message thread, not bookmark pile |
| **Guest hub (future)** | One optional `my.livia-hq.com` or magic link — **all active visits** |

```text
Owner publishes:     /b/aurora-studio     (one canonical link per business)
Customer daily use:  WhatsApp thread + occasional token link from Liv
Customer multi-shop: Optional OTP hub — NOT a folder of 12 slugs
```

---

## 4. What Livia the company vs the business knows

| Data | Business (tenant) | Livia Inc |
|------|-------------------|-----------|
| Customer name, phone, bookings | ✅ Full at their shop | Processor/subprocessor only |
| Same phone at another Livia shop | ❌ Not visible | Hashed/logged for abuse prevention only — **no product surfacing** |
| Cross-shop booking history | ❌ Unless CT5 consent product ships | Aggregated analytics k≥10 only (future) |
| Guest token URLs | ✅ Their bookings | Issuance audit |

**Legal basis:** Contract + legitimate interest with shop; GDPR export/delete per shop via owner workflows.

---

## 5. Roadmap — closing gaps

| Priority | Item | Release | Track |
|----------|------|---------|-------|
| **P0** | E.164 phone normalize in `findOrCreateCustomer` + public book validation | R1 | G |
| **P0** | All vertical `/b` flows require phone where SMS continuity enabled | R1 | G + policy |
| **P1** | Guest hub: phone OTP → list active tokens/bookings (multi-shop **user view**, not CRM merge) | R2 | [`GUEST-CONTINUITY-HUB-SPEC.md`](./GUEST-CONTINUITY-HUB-SPEC.md) |
| **P1** | Wallet pass issuance on first book (where entitled) | R2 | product |
| **P2** | CT5 cross-shop consent UX + Liv posture rules | R3 | policy + Liv OS |
| **P2** | “Continuity passport” UI on `/b` — timeline for **this shop** via token/session | R2 | PUBLIC-B §6.4 |

**North-star story (M1 marketing):** Guest sees **one thread of their relationship with this shop** without creating an account — aligns with [`MULTI-HAT-GAP-REVIEW.md`](./MULTI-HAT-GAP-REVIEW.md) “Guest continuity passport.”

---

## 6. Verification

| Test | Expected |
|------|----------|
| Book twice at same `/b` with same phone | One `customers` row, `totalBookings` = 2 |
| Book at two slugs same phone | Two rows, two `business_id`s |
| Inbound SMS from known phone | Routes to existing customer conversation |
| Two bookings, same name, different phones | Two rows; merge-suggestions may flag for staff |
| Incognito re-book without phone | New or ambiguous — document as known limitation until phone required |

E2E reference: [`DEMO-FULL-SHOWCASE.md`](../testing/DEMO-FULL-SHOWCASE.md) § “Customer accounts”.

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Initial canonical spec — answers cross-shop, returning guest, URL UX |
