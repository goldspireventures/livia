# Post-visit feedback workflow

**Trigger:** `booking.completed` (Inngest `post-visit-feedback`)  
**Delay:** 24 hours  
**Business template:** [`../business/templates/post-visit-feedback.md`](../business/templates/post-visit-feedback.md)

## Flow

1. Booking marked **Completed** → domain event `booking.completed`.  
2. After 24h, Liv sends SMS (if Twilio + customer phone) with link `/b/:slug/visit/:token`.  
3. Customer rates 1–5 + optional comment on the guest visit page.  
4. Owner sees scores on **Today** (`VisitFeedbackStrip`); scores ≤3 logged as `WARN`.

## APIs

| Method | Path |
|--------|------|
| GET | `/api/public/b/:slug/visit/:token` |
| POST | `/api/public/b/:slug/visit/:token/feedback` |
| GET | `/api/businesses/:id/visit-feedback` (staff auth) |
