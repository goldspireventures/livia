# Production secrets inventory (checklist)

**Status:** 2026-05-26 (O-04)  
**Owner:** founder fills **Prod** column when live.

| Secret / account | Dev (.env) | Prod | Notes |
|------------------|------------|------|-------|
| `DATABASE_URL` | ☐ | ☐ | EU region pin = ADR #57 |
| `CLERK_*` (api, dashboard, mobile) | ☐ | ☐ | Separate apps per ADR |
| `ANTHROPIC_API_KEY` | ☐ | ☐ | Liv runtime |
| `RESEND_API_KEY` + domain | ☐ | ☐ | Ack + booking mail |
| `RESEND_DEFAULT_FROM` | ☐ | ☐ | Verified sender |
| `SUPPORT_INBOX_EMAIL` | ☐ | ☐ | Google Workspace forward |
| `TWILIO_*` | ☐ | ☐ | IE numbers per shop |
| `INNGEST_*` / event key | ☐ | ☐ | Reminders, continuity |
| `STRIPE_SECRET_KEY` (Billing) | ☐ | ☐ | Gate 3 |
| `STRIPE_CONNECT` | ☐ | ☐ | Deposits #58 |
| `INTERNAL_OPS_SECRET` | ☐ | ☐ | internal.livia.io |
| `SENTRY_DSN_API` | ☐ | ☐ | Optional Gate 2 |
| `META_*` (WhatsApp) | ☐ | ☐ | Defer marketing until live |

**Gate 2 minimum:** DB, Clerk, Anthropic, Resend, Inngest, Twilio (if voice claimed).
