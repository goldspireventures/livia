# Messaging (T6), AI spine (T5), Capacitor

## Messaging inbound (`MessageLog`)

1. Set `MESSAGING_INBOUND_SECRET` in `.env`.
2. `POST /api/webhooks/messaging` with header `x-livia-messaging-secret: <same>` and JSON body:
   - `businessId`, `channel` (`EMAIL` | `PHONE` | `SMS` | …), `from`, `body`
   - optional `provider`, `payload`
3. A row is written to `MessageLog`. If `ChannelIdentity` exists for the same `businessId` + `channel` + normalized `from`, status is `LINKED` and `customerId` is set; else `UNMATCHED`.
4. Owner/admin UI: `/b/[businessId]/messaging`.

Normalization: `EMAIL` → lowercased trim; `PHONE`/`SMS` → digits only.

## AI health (T5)

- `GET /api/businesses/[businessId]/ai/health` — any business member; returns deterministic counts + optional LLM narrative when `OPENAI_API_KEY` is set. Each call appends `AIInteraction` (`BUSINESS_HEALTH_INSIGHT`). Failures never touch bookings.

## Capacitor

- Dependencies: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`.
- `capacitor.config.ts` — `webDir: capacitor-www`; optional `CAPACITOR_SERVER_URL` for live reload to your Next server.
- First-time native projects: `npx cap add ios` and `npx cap add android` (generates `ios/` and `android/`; often gitignored locally).
- Scripts: `npm run cap:sync`, `cap:open:ios`, `cap:open:android`.
