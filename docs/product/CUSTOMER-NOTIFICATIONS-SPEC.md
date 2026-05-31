# Customer notifications — P7 specification

**Status:** canonical draft (2026-05-31)  
**Audience:** product, engineering, legal  
**Purpose:** Outbound notifications **to end customers (P7)** — confirmations, reminders, visit tokens — distinct from staff push in [`NOTIFICATIONS.md`](./NOTIFICATIONS.md).

**Gap:** Staff notifications documented; customer push/opt-in was missing until systems audit.

---

## 1. Channels (customer)

| Channel | Use | Opt-in |
|---------|-----|--------|
| **SMS** | Confirm, reminder, token link | Transactional — booking relationship |
| **Email** | Confirm, receipt, policy | Transactional |
| **WhatsApp / IG** | Short message + `/b` link | Meta rules + shop channel config |
| **Web push (P7)** | Visit reminder day-of | **Explicit** browser permission on `/b` |
| **Wallet pass update** | Time/location change | Implicit with pass add |

No marketing blasts without separate consent (GDPR).

---

## 2. Event catalog

| Event | Channels | Content |
|-------|----------|---------|
| `booking.confirmed` | SMS, email | Who, when, where, cancel policy link |
| `booking.reminder` | SMS, web push | 24h + 2h windows (jurisdiction pack) |
| `booking.cancelled` | SMS, email | Refund/deposit note per policy |
| `visit.day_of` | SMS, wallet | Visit token URL |
| `proof.ready` | SMS | `/b/{slug}/proof/{token}` |
| `consent.required` | SMS | Return to book step |
| `waitlist.open` | SMS | Accept link |

Copy: `@workspace/policy` continuity templates + vertical vocabulary.

---

## 3. P7 web push (R2)

- Prompt **after** booking confirm success — not on landing.
- Copy: "Get a reminder on this device?"
- Stored: `guest_push_subscription` scoped to `businessId` + phone hash — not full CRM login.
- Quiet hours: respect shop hours + locale (no 6am SMS unless policy).

---

## 4. Preferences

- Customer opts out via link in SMS/email (STOP) — logged.
- Shop cannot disable transactional confirm (regulatory honesty).
- Marketing re-engagement (CT6 drift) — **owner toggle default OFF** per customer-typologies.

---

## 5. Logging

All sends → `notification_logs` with `templateKey`, channel, customerId, bookingId.

Support tickets attach last 3 customer notifications on dispute.

---

## 6. Related

- [`CHANNELS-EU-MESSAGING.md`](./CHANNELS-EU-MESSAGING.md)
- [`SKIN-BRAND-INHERITANCE-SPEC.md`](../design/SKIN-BRAND-INHERITANCE-SPEC.md) — P7 mobile entry
- [`GUEST-CUSTOMER-IDENTITY.md`](./GUEST-CUSTOMER-IDENTITY.md)

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial customer notifications spec |
