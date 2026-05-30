# Guest continuity hub — P7 consolidated experience (options)

**Status:** canonical spec draft (2026-05-30)  
**Audience:** founder, product, design, engineering  
**Problem:** End customers have **no login** and **no cross-shop view** today — one `/b/{slug}` per business, one SMS thread per business. Shops must not see each other's customer data; **customers still need their own consolidated view** of *their* relationships.

**Reads with:** [`GUEST-CUSTOMER-IDENTITY.md`](./GUEST-CUSTOMER-IDENTITY.md) · [`CHANNEL-UX-CONTRACT.md`](../design/CHANNEL-UX-CONTRACT.md) · [`customer-typologies.md`](../customer-typologies.md) CT5 · [`LIVIA-PLATFORM-LIFECYCLE.md`](./LIVIA-PLATFORM-LIFECYCLE.md)

---

## 0. Two different privacy needs (do not conflate)

| Actor | Need | Rule |
|-------|------|------|
| **Business A** | Must not learn that Mary also goes to Business B | No cross-tenant CRM; no Liv leak between owners |
| **Mary (P7)** | Must see *her own* bookings at A, B, C | **Customer-owned vault** — she is the data subject viewing her own history |
| **Livia Inc** | Processor; minimal aggregation | Only what Mary authorized + abuse prevention |

**Key insight:** A “Livia profile” for end customers is **not** a tenant CRM row. It is a **guest vault** — opt-in, phone-verified, owned by the person.

---

## 1. User vision (WhatsApp mental model)

> One chat with Liv. Inside: my bookings. “Book my hair again at Aurora.” Simple repeats happen in chat; confirm with a link to the shop slug if needed. Favorite shops — Aurora, my nail place, my physio — without juggling URLs or five WhatsApp threads.

**Valid direction.** Channels are how P7 lives; the gap is **orchestration layer above per-shop threads**.

---

## 2. Architecture — three layers

```text
Layer 1 — Shop relationship (exists today)
  customers @ businessId  ·  per-shop SMS/WA from shop number  ·  /b/{slug}

Layer 2 — Guest vault (new — customer-owned)
  guest_identity (phone OTP)  ·  guest_shop_links (which shops I use)  ·  favorites

Layer 3 — Liv orchestrator (new)
  Reads vault + calls tenant APIs with scoped tokens  ·  never exposes A→B to owners
```

**Naming:** **Liv Guest** or **My Livia** — not “account”, not “login”. Phone verify once; session on device.

---

## 3. Options compared

### Option A — **Web hub only** (`my.livia-hq.com` or `/my`)

| | |
|--|--|
| **UX** | OTP → list “My shops” → tap shop → upcoming bookings → “Book again” |
| **Pros** | No Meta BSP complexity; full UI; wallet pass links; GDPR-clear |
| **Cons** | Another URL (but **one** URL, not N slugs) |
| **Repeat book** | “Book again” pre-fills last service/staff; complex changes → `/b/{slug}` |
| **Release** | R2 — lowest risk first ship |

### Option B — **SMS to one Liv number** (aggregator)

| | |
|--|--|
| **UX** | Text +353-LIV-IA → “Book hair at Aurora” → Liv replies in thread |
| **Pros** | No app; matches non-smartphone users |
| **Cons** | Twilio cost; parsing ambiguity; regulatory sender ID per country |
| **Repeat book** | Natural language in SMS thread |
| **Release** | R3 after hub API stable |

### Option C — **WhatsApp — Liv Personal** (your visualization)

| | |
|--|--|
| **UX** | WhatsApp chat with **Livia verified business**; rich list messages; shop carousel |
| **Pros** | Familiar; rich UI; push native |
| **Cons** | **Hard:** shop numbers are *theirs* (Meta WABA per tenant today); central Liv WA = second relationship; template approval; EU opt-in |
| **Hybrid** | Liv Personal WA for **hub/navigation**; booking confirmations still from **shop number** (trust) |
| **Release** | R3+; pilot IE after web hub proves flows |

### Option D — **Per-shop WA + deep link hub** (minimal central)

| | |
|--|--|
| **UX** | Each shop keeps their WA thread; hub only aggregates **links** (“Open Aurora chat”) |
| **Pros** | No change to shop↔customer trust model |
| **Cons** | Does **not** solve “one place for everything” — weak vs your vision |
| **Release** | R2 stopgap only |

### Option E — **Wallet pass as hub**

| | |
|--|--|
| **UX** | Apple/Google Wallet stack — one pass per shop today; “Liv Pass” groups them |
| **Pros** | Day-of entry; lock screen |
| **Cons** | Platform limits on multi-business aggregation; not conversational |
| **Release** | Complement A/C, not replacement |

---

## 4. Recommended path (phased)

```text
R2 — Guest vault + web hub (Option A)
  · Phone OTP → guest_identity
  · Auto-link shop on first book (“Save to My Livia” default ON, explain in UI)
  · Favorites pin + “Book again” for simple repeats
  · Deep link to /b/{slug} for complex flows

R2.5 — Liv orchestrator in hub chat (web chat widget, same backend)
  · “Book my usual at Aurora” → tool calls tenant API with guest scope
  · Confirm in-thread + SMS from shop number as today

R3 — WhatsApp Liv Personal pilot (Option C hybrid)
  · Central WA for hub commands only
  · Confirmations/reminders stay from shop WABA
  · Opt-in: “Also message me on Liv Personal”

R∞ — Voice “Hey Liv” same vault backend
```

**Why not WhatsApp first:** Shop WhatsApp **is** the brand relationship. Replacing it centralizes trust in Livia Inc — owners may resist. **Hybrid** preserves shop sender for transactional, Liv Personal for **navigation and repeat booking across favorites**.

---

## 5. Product behaviors (detailed)

### 5.1 First book at a shop (no hub yet)

1. Customer books on `/b/aurora-studio` with phone.  
2. Checkbox (default on): **“Save to My Livia — view all your bookings in one place.”**  
3. SMS link: `my.livia-hq.com/continue?token=…` (magic link, no password).

### 5.2 Returning — simple repeat

**In hub chat or WA Liv Personal:**

```text
Mary: Book my hair again at Aurora
Liv:  Your usual — Cut & blowdry with Lara, Tuesday-ish?
Mary: Yes
Liv:  Lara has Tue 11am or Wed 2pm.
Mary: Tue 11
Liv:  ✓ Booked. Details: [link]. Aurora will text you from their usual number.
```

**Backend:** `guest_identity` → `guest_shop_link` → `POST` partner-scoped rebook using last booking template; owner CRM unchanged.

### 5.3 Returning — complex change

Liv: *“Colour needs a quick consult — open Aurora’s booking page?”* → `/b/aurora-studio?guest=…&intent=colour`

### 5.4 Favorites

- Auto: shops you’ve booked ≥2 times  
- Manual: pin from hub  
- **Not** visible to shop owners as a list of competitors

### 5.5 Still use shop WhatsApp directly?

**Yes — always allowed.** Hub is **additive**. Mary can reply to Aurora’s thread for salon-specific chat; hub for **cross-shop calendar and repeat booking**.

---

## 6. Data model (sketch)

| Table | Scope | Notes |
|-------|-------|-------|
| `guest_identities` | Platform | `id`, `phone_e164`, `verified_at`, `created_at` |
| `guest_shop_links` | Platform | `guest_id`, `business_id`, `first_booking_at`, `consent_at` |
| `guest_favorites` | Platform | `guest_id`, `business_id`, `pinned_at` |
| `guest_sessions` | Platform | OTP/magic-link sessions |
| `customers` | **Tenant** | Unchanged — shop CRM row |

**Rule:** `guest_shop_links` created only with **customer action** (book + consent). Owners never query `guest_identities`.

---

## 7. What shops see vs what Mary sees

| Data | Mary | Shop A owner |
|------|------|--------------|
| Her bookings at A | ✅ | ✅ |
| Her bookings at B | ✅ | ❌ |
| That she uses My Livia | ✅ (optional badge in SMS) | ❌ |
| “Also books at B” | ✅ | ❌ **forever** |

---

## 8. Open decisions (founder)

| # | Question | Lean |
|---|----------|------|
| 1 | Default opt-in to My Livia on first book? | Yes with clear copy + one-tap out |
| 2 | Brand name: “My Livia” vs “Liv” vs shop-white-label | **Liv** for consumer; Livia Inc in legal footer |
| 3 | WhatsApp before web hub? | No — prove orchestration on web first |
| 4 | Charge businesses for hub rebooks? | No — included; increases retention |
| 5 | Guest hub on `my.livia-hq.com` vs `app.` subdomain | `my.` — clearly P7, not owner app |

---

## 9. Relation to programmatic platform

| System | Trigger |
|--------|---------|
| New vertical | [`VERTICAL-ADD-PLAYBOOK.md`](../engineering/VERTICAL-ADD-PLAYBOOK.md) — hub “Book again” uses vertical playbook for copy |
| Guest surfaces | `guest-surfaces.ts` — hub deep-links to correct surface type |
| Liv tools | New tools: `list_guest_bookings`, `rebook_simple`, `open_shop_booking` — scoped to guest vault |

---

## 10. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Initial options spec — WhatsApp vision → phased hub |
