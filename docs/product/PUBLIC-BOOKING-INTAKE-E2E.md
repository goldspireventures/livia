# Public booking & business intake — end-to-end

**Canonical:** How Livia’s **direct-link** customer surface connects to the **business operator** surface and **automation**.  
**Platform flows (thick guest + thin channels):** [`LIVIA-PLATFORM-FLOWS.md`](./LIVIA-PLATFORM-FLOWS.md)

---

## Product split (three audiences)

| Audience | Surface | Job |
|----------|---------|-----|
| **Customer (P7)** | `/b/<slug>` web + mobile `public-book/[slug]` | Browse services, pick staff/time, book, get visit link |
| **Business (P1–P3)** | Dashboard home intake panel, booking detail, inbox | See what arrived, confirm, continuity, day-of ops |
| **Livia Inc** | Internal ops (:5175), founder cockpit tab | Tenant health, public URL deep links, stuck continuity |

**Founder cockpit (multi-shop owner)** = dashboard `/chain` — per-location pulse + public links.  
**Company founder cockpit** = internal ops “Founder cockpit” — platform traffic, gates, vertical coverage.

---

## Customer journey (direct link)

1. **Land** — Hero (logo, cover, city, trust strip, vertical care notes). No Livia marketplace chrome; business-owned feel.
2. **Browse** — Category-grouped service menu (`staff-forward` for hair/beauty/body-art: pick stylist first).
3. **Time** — Date + slot grid; staff filter carries from step 1.
4. **Details** — Name, email/phone, vertical guards (pet, medspa intake), notes.
5. **Consent** — Medspa only: procedure + signature.
6. **Confirmed** — ICS, visit link `/b/<slug>/visit/<token>`, next steps (SMS/email **link** to guest pages when configured — not media collab on channel).

**Guest surfaces (thick, no login):** book · visit · proof (body-art) · consent (medspa) · pay — see [`LIVIA-PLATFORM-FLOWS.md`](./LIVIA-PLATFORM-FLOWS.md) §2.2.

**API:** `GET /api/public/b/:slug` → `POST .../book` with `source: web`, `channelType: WEB`.

---

## What the business sees (intake)

When a public booking lands:

| Moment | Business UI | Backend |
|--------|-------------|---------|
| Created | **Public intake** panel on home (recent web bookings) | `bookings.source = web`, event `BOOKING_CREATED` |
| Pending deposit / continuity | Booking detail badge + **Booking continuity** panel | `pendingReason`, Inngest `booking-continuity` workflow |
| Confirm | One-tap Confirm on booking detail / dashboard queue | `booking.confirmed` → reminder workflows |
| Customer thread | Inbox if continuity SMS/WhatsApp replied | `sourceConversationId` when linked |
| Day-of | My Day, running late, visit feedback | Guest visit token actions |

**Intake API:** `GET /api/businesses/:id/public-intake` — counts + recent web bookings + public URL + automation checklist.

---

## Automation chain (no manual copy-paste)

```
Public POST /book
  → createBooking (web)
  → logEvent BOOKING_CREATED
  → emitBookingCreated → Inngest
  → booking-continuity (if policy + contact)
  → booking-reminder (T-24h)
  → confirmation email (when email present)
  → push to owner devices (when registered)
  → onboarding: mark test booking when first web book
```

Stuck continuity surfaces in: dashboard intake panel, internal monitoring `stuckContinuity`, founder chain alerts.

---

## Per-vertical public design

| Vertical | Layout | Public emphasis |
|----------|--------|-----------------|
| hair | staff-forward | Stylist picker, colour/cut categories |
| beauty | staff-forward | Lashes/nails sections, patch-test care block |
| body-art | staff-forward | Consult vs session, deposit messaging |
| medspa | catalog + consent | Procedure catalog, regulatory footer |
| pet-grooming | catalog | Pet guards on details step |
| wellness / fitness | catalog | Session/class copy |
| allied-health | catalog | Clinical intake guards |

Playbook CTA copy comes from `lib/policy` `publicCta` per vertical.

---

## Demo world

Run `pnpm demo:provision` — each showcase slug gets categories, descriptions, cover/logo URLs, and at least one **web-source** booking in expanded seed where applicable.

**Quick URLs (dashboard base):**

- `/b/conors-cut-co` — barber, staff-forward  
- `/b/luxe-salon-spa` — hair E2E canonical  
- `/b/bloom-beauty-dublin` — beauty categories  
- `/b/clarity-medspa-dublin` — consent flow  
- `/b/paws-parlour-dublin` — pet guards  

---

## Differentiation vs marketplaces

- **Owned URL** — Business brand first; Livia footer minimal.  
- **Same thread** — Public book → SMS **link** to guest pages → inbox (not marketplace account; not MMS proof loops).  
- **Vertical policy packs** — Deposits, cancel windows, guards baked in per jurisdiction + vertical.  
- **Ops loop closed** — Intake panel shows *what just came from the link you posted*, not anonymous marketplace demand.

---

## Experience skins (vertical × market × persona)

| Layer | Where | Effect |
|-------|--------|--------|
| **Vertical** | `data-vertical`, `public-skin-*` | Hair = warm gold serif; medspa = clinical sharp sans; beauty = soft pink; pet = playful purple |
| **Market** | `data-country`, `public-market-*` | IE emerald halo; GB slate; DE precise; FR luxe ribbon |
| **Persona** | `data-persona`, `--persona-accent` | Founder champagne rail; owner cyan; manager violet; staff green; front desk indigo |

Dashboard applies all three via `applyExperienceTheme`. Public `/b/` applies vertical + market only (customer is not a tenant persona).

---

## Related docs

- `docs/journeys/p7-customer-regular.md` — customer POV  
- `docs/product/V3-EXPERIENCE-SPEC.md` — motion + beats  
- `docs/product/BETA-SHOWCASE-PROGRAM.md` — demo mandate  
- `docs/demo-gateway.md` — persona entry without conflating public book
