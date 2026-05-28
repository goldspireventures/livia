# Workflows — local development (Inngest)

**Phase 3** wires durable workflows via [Inngest](https://www.inngest.com/) (ADR 0013).

## Run the stack

1. Apply schema: `pnpm db:push` (includes `domain_event_dedup`, `workflow_pauses`).
2. Start API: `pnpm dev:api` (port 3001).
3. In another terminal, start Inngest dev server:

```bash
npx inngest-cli@latest dev -u http://127.0.0.1:3001/api/inngest
```

Set in `.env` (optional for cloud dev):

```env
INNGEST_DEV=1
INNGEST_SIGNING_KEY=  # dev server injects via CLI
```

## Domain events

Producers call `publishDomainEvent()` in `artifacts/api-server/src/lib/domain-events.ts`:

- Dedupes via `domain_event_dedup` table (Postgres unique key).
- Forwards to Inngest as `livia/<event.name>` when `INNGEST_EVENT_KEY` or `INNGEST_DEV=1` is set.

## Workflows registered

| Function | Trigger | Purpose |
|----------|---------|---------|
| `booking-reminder-t24` | `booking.created`, `booking.confirmed` | Sleep until T-24h, send reminder email |
| `weekly-digest` | Cron Sun 18:00 UTC | Scaffold aggregate |
| `no-show-recovery` | `booking.confirmed` | Scaffold at start+15m |
| `time-off-approval` | `time-off.proposed` | Wait for `time-off.approved` |

## Fallback

When Inngest is disabled (`WORKFLOWS_DISABLED=true` and no keys), `POST /internal/cron/send-reminders` runs the legacy sweep.

## Owner cockpit

`GET /api/businesses/:id/workflows/status` — `livWaiting` + open pauses when a workflow exhausts retries.
