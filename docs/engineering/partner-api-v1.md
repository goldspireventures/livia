# Partner API v1 (alpha)

**Base:** `/api/partner/v1`  
**Auth:** `X-Partner-Api-Key` header  
**Entitlement:** `public_api_alpha` on chain / franchise tiers

## Scopes

| Scope | Access |
|-------|--------|
| `business:read` | Business profile by slug |
| `bookings:read` | List bookings in date range |
| `bookings:write` | Create booking |
| `customers:read` | Customer list (no PII email/phone) |
| `services:read` | Active services |
| `slots:read` | Availability for date |

## Create booking

```http
POST /api/partner/v1/businesses/:slug/bookings
Content-Type: application/json

{
  "serviceId": "...",
  "startAt": "2026-06-01T10:00:00.000Z",
  "customerFirstName": "Alex",
  "customerPhone": "+353..."
}
```

Emits `booking.created` for webhooks when configured.

## Webhooks

Subscribe to events in `WEBHOOK_SUBSCRIBABLE_EVENTS` via integrations routes (tenant dashboard).
