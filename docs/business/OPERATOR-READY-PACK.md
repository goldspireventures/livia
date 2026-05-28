# Operator ready pack — ease your go-live

**Status:** Living doc aligned with Livia OS Phase A/B (2026-05-25)  
**Goal:** Everything a business needs **before** and **during** first week on Livia, without building custom HR or job-board products.

---

## 1. Week zero checklist (owner)

1. **Pick your vertical** at onboarding (hair, allied health, medspa, …) — seeds services, Liv tone, and UI labels.  
2. **Settings → Practice** — name, slug, timezone, public booking link.  
3. **Settings → Liv** — greeting, tone, what Liv may book automatically.  
4. **Settings → Policy** — deposits, no-shows, buffers (matches your country pack).  
5. **Team → Invite** — email each stylist/clinician/receptionist (not a job ad).  
6. **Services** — confirm durations and prices; disable anything you do not offer.  
7. **Staff profiles** — assign services and weekly hours.  
8. **Test public book** — open `/b/your-slug` on your phone; complete one booking.  
9. **Inbox** — send a test message; practice “take over” once.  
10. **Running late** — from Today or a confirmed booking, send a test SMS (if SMS live).

---

## 2. Product surfaces (what we call things)

| Old / wrong | Now |
|-------------|-----|
| Job board / Hiring | **Removed** — use **Team → Invite** |
| Owner toolkit + Operations grid | **Liv command** — briefing & tuning only |
| Shop (allied health) | **Practice** / **Clinic** (auto from vertical) |
| Manual admin time-off entry | **Leave request** (staff) → **approve** (manager on Rota) |
| Buried running late | **Running late** on Today, Floor, booking detail |

---

## 3. Vertical & country

- **Vertical** changes labels, home emphasis, Liv vocabulary, and colours (web).  
- **Country** (`IE`, `GB`, `DE`, …) changes deposit copy, SMS marketing opt-in, AI disclosure, currency.

See [`../verticals.md`](../verticals.md) and policy packs in `@workspace/policy`.

**Planned verticals (research):** dental, veterinary, mental health counselling, home services, education/tutoring, childcare classes, events/venues, professional services appointments, home care visits.

---

## 4. Customer-facing loops (roadmap in pack)

| Loop | Owner benefit | Customer benefit | Phase |
|------|---------------|------------------|-------|
| Post-visit feedback | NPS + private comments on **Today** | Rate via visit link after 24h | **Live** |
| Branded visit / receipt | Professionalism | `/b/your-slug/visit/:token` after book | **Live** |
| Aftercare SMS (tattoo, medspa, physio, wellness) | Fewer “what do I do after?” calls | 2h SMS when Twilio live | **Live** |
| Customer “I'm running late” | Less no-show chaos | Visit link while confirmed | **Live** |
| Design proof upload (tattoo) | Approve art in thread | Share reference images | C |

Templates for feedback/aftercare are in [`templates/`](./templates/) — wire to Liv as workflows land.

---

## 5. CFO / founder (multi-site)

- **Today** — one location at a time.  
- **Glance / Chain** — pulse across shops (founder).  
- **Payroll export** — Liv command (CSV of shifts + completed bookings) for BrightPay/Xero.  
- **Enterprise audit export** — chain/franchise tiers.

Full CFO dashboard modules are Phase E in [`../product/LIVIA-OS-MASTER-PLAN.md`](../product/LIVIA-OS-MASTER-PLAN.md).

---

## 6. Support & trust

- **Report issue** — sidebar (web); attaches route + business context.  
- **Audit** — hash-chained log for owners.  
- Livia Inc resolves via internal ops — not mixed into your tenant inbox.

---

## 7. Mobile + web

Same business, same data. Staff use **My chair**; managers use **Queue** + **Approvals**; owners use **Today**.

Parity matrix: [`../product/WEB-MOBILE-PARITY.md`](../product/WEB-MOBILE-PARITY.md).

---

## 8. Internal (for your team only)

If you are **Livia Inc staff**, use [`../company/livia-internal-portal-spec.md`](../company/livia-internal-portal-spec.md) and [`../operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md`](../operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md) — not this pack.
