# Inngest production runbook

**Owner:** founder + engineering  
**Wedge workflows:** booking-reminder, weekly-digest, liv-was-wrong, no-show-recovery, booking-continuity

## Prerequisites

- Inngest Cloud app created
- `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` in production env
- `WORKFLOWS_DISABLED` unset (or `false`)
- API server exposes `/api/inngest` (see `inngest-serve.ts`)

## Deploy checklist

1. Deploy API with workflow bundle (`artifacts/api-server/src/workflows/index.ts`).
2. Register app URL in Inngest dashboard → **Serve URL** `https://<api>/api/inngest`.
3. Send test event `support/liv_error.reported` in dev; confirm run in dashboard.
4. Verify `booking-reminder` cron for a pilot shop (booking within 25h).
5. Enable weekly-digest schedule (Monday 08:00 shop TZ).

## Rollback

Set `WORKFLOWS_DISABLED=true` — API keeps serving; workflows no-op.

## Monitoring

- Failed runs → Sentry + internal ops
- Partner-visible: reminder SMS/email delivery logs (Resend/Twilio)
