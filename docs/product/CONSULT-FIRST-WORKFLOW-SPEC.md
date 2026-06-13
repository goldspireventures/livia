# Consult-first workflow — platform spec

**Status:** canonical Ring 2 primitive (2026-06-10)  
**First vertical consumer:** [`EVENT-VENDORS-VERTICAL-PROGRAM.md`](./EVENT-VENDORS-VERTICAL-PROGRAM.md)  
**Also reuses:** home trades consult-first, creative studio hire, photographers, equipment hire  
**Authority:** Policy hub → API → guest surfaces → dashboard (same cascade as book-first)

---

## 1. Problem

Livia V1 default loop is **book-first**:

```text
Demand → pick slot → book → deposit → visit
```

Consult-first businesses default to:

```text
Demand → enquire → quote → (negotiate) → accept → deposit → event date locked
```

Same operator suite underneath — different **primary object** and **guest surface entry**.

---

## 2. Core objects

### Enquiry

| Field | Notes |
|-------|-------|
| `id`, `businessId`, `customerId?` | Links to customer on create or match |
| `status` | `new` \| `quoted` \| `booked` \| `lost` \| `needs_info` |
| `source` | `instagram` \| `whatsapp` \| `web` \| `referral` \| `other` |
| `eventType` | Vertical vocabulary |
| `eventDate` | Date or flexible flag |
| `guestCount` | Number |
| `budget` | Amount or range enum |
| `theme`, `notes` | Free text |
| `inspirationUrls` | Pinterest / IG links |
| `servicesRequested` | Checklist from catalogue categories |
| `preferredQuoteChannel` | `email` \| `whatsapp` |
| `contacts` | Primary + optional partner/planner (P2) |
| `internalNotes` | Operator only |
| `createdAt`, `updatedAt` | |

### Quote

| Field | Notes |
|-------|-------|
| `id`, `businessId`, `enquiryId` | |
| `status` | `draft` \| `sent` \| `accepted` \| `declined` \| `expired` |
| `lineItems` | Snapshot array: `catalogueItemId?`, name, qty, unit, unitPrice, lineTotal |
| `subtotal`, `depositPercent`, `depositAmount`, `balanceDue` | |
| `validUntil` | Operator-set validity |
| `termsSnapshot` | Frozen at send |
| `personalMessage` | Editable intro |
| `sentAt`, `sentVia` | `email` \| `whatsapp_assisted` |
| `publicToken` | Guest quote view |
| `acceptedAt` | From client accept button |

**Rule:** On send, **snapshot** all prices and terms. Catalogue edits do not mutate sent quotes.

### Catalogue item (extends service)

| Field | Notes |
|-------|-------|
| `name`, `description`, `price` | Operator-managed |
| `unit` | `flat` \| `per_guest` \| `per_table` \| `per_item` \| `per_metre` |
| `category` | Grouping for templates |
| `active` | Hide without delete |

### Quote template (operator-managed)

| Field | Notes |
|-------|-------|
| `name` | e.g. “Birthday – standard” |
| `eventTypes` | Suggested when enquiry matches |
| `presetLineItems` | catalogue refs + default qty hints |

---

## 3. Operator flows

### Generate quote

```text
Enquiry detail → [Generate quote]
  → suggest template from eventType + servicesRequested
  → pre-fill line items from catalogue
  → operator edits qty, prices, message, deposit %
  → preview (PDF + mobile)
  → [Send]
```

### Send quote

| Channel | Behaviour |
|---------|-----------|
| **Email** | Branded email + PDF and/or quote link |
| **WhatsApp** | Open `wa.me/{phone}` with pre-filled message + quote link; operator taps Send in WhatsApp |

### Pipeline

```text
new → quoted (on send) → booked (on accept + deposit note) → lost
```

---

## 4. Guest surfaces

| Surface | Purpose |
|---------|---------|
| `/enquire` | Structured intake form |
| `/q/{token}` | View quote, accept, ask questions (link to inbox) |

Enquire-first tenants: subdomain hero CTA = **Get a quote**, not **Book now**.

---

## 5. Liv integration

| Moment | Liv assist |
|--------|------------|
| New DM without form | Draft “thanks — fill our enquire link” |
| Enquiry missing fields | Suggest follow-up questions |
| Quote draft | Suggest line items from catalogue + budget flag if over |
| Stale quote | Remind operator to follow up |

Policy-governed — no auto-send quote without operator confirm in R1.

---

## 6. API sketch (when built)

| Method | Path |
|--------|------|
| POST | `/businesses/:id/enquiries` (public) |
| GET | `/businesses/:id/enquiries` |
| PATCH | `/businesses/:id/enquiries/:id` (status, notes) |
| POST | `/businesses/:id/enquiries/:id/quotes` (generate draft) |
| PATCH | `/businesses/:id/quotes/:id` |
| POST | `/businesses/:id/quotes/:id/send` |
| GET | `/public/:slug/q/:token` |
| POST | `/public/:slug/q/:token/accept` |

Run `pnpm codegen` after OpenAPI — never hand-edit clients.

---

## 7. Policy hub (when enum ships)

- `consultFirstVerticals` or pack flag on `VerticalPack`
- Vocabulary: quote, enquiry, event date
- Onboarding: catalogue setup act before go-live
- Guest surface registry: enquire + quote view types

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-06-10 | Initial spec — enquiry, quote, catalogue, pipeline; first consumer event vendors |
