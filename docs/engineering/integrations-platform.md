# Integrations platform (tenant + partner planes)

**Status:** v1.5 (2026-05-20)  
**Reads with:** `composable-monetisation-architecture.md`, `api-conventions.md`, RFC 0010

## Overview

Livia exposes two integration surfaces:

| Plane | Auth | Base path | Use case |
|-------|------|-----------|----------|
| **Tenant** | Clerk JWT | `/api/businesses/{id}/...` | Dashboard, mobile, owner config |
| **Partner** | API key | `/api/partner/v1/...` | ERP, migration broker, chain BI |

## Partner API (inbound to Livia)

### Authentication

- Header: `X-Partner-Api-Key` or `Authorization: Bearer <key>`
- **Legacy:** env `PARTNER_API_KEY` (full read access, all shops)
- **Scoped:** rows in `api_credentials` — tenant keys (`business_id` set) or partner keys (`allowed_slugs`)

### Scopes

`bookings:read`, `customers:read`, `services:read`, `slots:read`, `business:read`

### Endpoints

| Method | Path | Scope |
|--------|------|-------|
| GET | `/partner/v1/businesses/{slug}` | business:read |
| GET | `/partner/v1/businesses/{slug}/bookings?from=&to=` | bookings:read |
| GET | `/partner/v1/businesses/{slug}/customers` | customers:read (no email/phone) |
| GET | `/partner/v1/businesses/{slug}/services` | services:read |
| GET | `/partner/v1/businesses/{slug}/slots?serviceId=&date=` | slots:read |

Responses use `{ data: ... }` envelope.

## Outbound webhooks (Livia → your stack)

Configured per shop in **Settings → Integrations**.

- Events: `booking.created`, `booking.confirmed`, `booking.cancelled`, `booking.completed`, `booking.no-show`
- Delivery: POST JSON after domain event publish (deduped)
- Signature: `X-Livia-Signature: t=<unix>,v1=<hmac-sha256>` over `{timestamp}.{body}`
- Headers: `X-Livia-Event`, `X-Livia-Delivery-Id`
- Retries: 7 attempts (0, 1m, 5m, 30m, 2h, 12h, 24h); sweep via `POST /internal/cron/webhook-deliveries`

### Payload shape

```json
{
  "id": "bizId:bookingId:confirmed",
  "type": "booking.confirmed",
  "created_at": "2026-05-20T12:00:00.000Z",
  "data": { "businessId": "...", "bookingId": "..." }
}
```

## Tenant integrations API

| Method | Path | Role |
|--------|------|------|
| GET | `/businesses/{id}/integrations` | ADMIN |
| POST | `/businesses/{id}/integrations/webhooks` | OWNER |
| PATCH | `/businesses/{id}/integrations/webhooks/{endpointId}` | OWNER |
| DELETE | `/businesses/{id}/integrations/webhooks/{endpointId}` | OWNER |
| POST | `/businesses/{id}/integrations/webhooks/{endpointId}/test` | OWNER |
| POST | `/businesses/{id}/integrations/api-keys` | OWNER |
| DELETE | `/businesses/{id}/integrations/api-keys/{credentialId}` | OWNER |

## Env

| Variable | Purpose |
|----------|---------|
| `PARTNER_API_KEY` | Legacy global partner key |
| `API_KEY_PEPPER` | HMAC pepper for stored key hashes (production required) |

## Migrations

`lib/db/migrations/sql/004-integrations-platform.sql`

## Not in v1.5 (v3 GA)

- OAuth2 client-credentials
- Mutating partner API (create booking via partner)
- Stock connectors (Xero, Google Calendar)
- Per-tenant rate limit enforcement (conventions documented; not wired)
