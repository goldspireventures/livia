# v1.5 integration brokers (engineering)

Read-only import scaffolds for Phase 5. Status is exposed at `GET /api/businesses/:id/integration-brokers`.

| Broker | Env keys | Mode |
|--------|----------|------|
| Fresha | `FRESHA_CLIENT_ID`, `FRESHA_CLIENT_SECRET` | OAuth read-only import (stub) |
| Square | `SQUARE_APPLICATION_ID`, `SQUARE_ACCESS_TOKEN` | Read-only appointments (stub) |
| Google Calendar | `GOOGLE_OAUTH_CLIENT_ID` | Two-way sync job (stub) |
| Xero | `XERO_CLIENT_ID` (optional) | CSV export today; API when configured |
| QuickBooks | `QBO_CLIENT_ID` (optional) | Settlement CSV until OAuth |

Booksy migration uses **CSV paste** at Settings → Integrations (`POST .../import/booksy-csv`).

UK voice: set `UK_VOICE_ENABLED=true` only after Twilio UK + disclosure copy are production-ready.
