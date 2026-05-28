# Notifications — platform spec

**Status:** Implemented (in-app centre + staff push + web alert strip) · **Surfaces:** mobile Expo, web dashboard

---

## Principles

1. **Actionable only** — every alert should deep-link to the screen that resolves it.
2. **Vertical copy** — titles/bodies use `businessVocabulary()` (client vs patient vs member, etc.).
3. **Role-aware** — inbox events → OWNER + ADMIN; bookings → all active staff.
4. **Liv-transparent** — inbound copy states whether Liv is handling the thread or a human is needed.
5. **Logged** — staff push writes `notification_logs` with `channel=PUSH` and a `templateKey`.

---

## Channels

| Channel | Audience | Status |
|---------|----------|--------|
| **In-app centre** | Every signed-in user (persona-targeted fan-out) | Live |
| **Expo push (iOS/Android)** | Staff with registered device token | Live |
| **Web alert strip** | Signed-in dashboard (polls summary every 60s) | Live |
| **Browser push (VAPID)** | Desktop staff when permission granted | Live |
| **Email / SMS** | Customers (confirmations, reminders) | Live via `notification_logs` |
| **WhatsApp / IG outbound** | Customers | Live when Meta configured |

---

## Staff push events

| Event | Trigger | Default audience | Deep link (mobile) |
|-------|---------|------------------|-------------------|
| `booking.created` | Domain event after new booking | OWNER, ADMIN, STAFF | `/booking/:id` |
| `booking.cancelled` | Domain event | OWNER, ADMIN, STAFF | `/booking/:id` |
| `inbox.inbound` | Meta/SMS inbound user message | OWNER, ADMIN | `/inbox` |
| `inbox.handoff` | Conversation → `HANDED_OFF` | OWNER, ADMIN | `/inbox` |

Copy builders: `@workspace/policy` → `notification-policy.ts`.

Orchestrator: `artifacts/api-server/src/services/notification-orchestrator.service.ts`  
In-app feed: `in-app-notifications.service.ts` → `user_notifications` table  
Transport: `push.service.ts` (Expo + Web Push)

---

## In-app notification centre

Persistent per-user feed (bell icon on web sidebar + mobile tab headers).

| Persona | Typical notifications |
|---------|----------------------|
| **Founder** | Chain alerts per shop, pending approvals, cross-location inbox handoffs |
| **Owner** | Bookings, pending yes, inbox, cancellations |
| **Manager** | Approvals queue, inbox handoff, Liv-booked via channel |
| **Staff** | Bookings assigned to their chair only |
| **Receptionist** | Floor bookings + inbox (ADMIN + reception preset) |

API:

- `GET /api/me/notifications` — list + `unreadCount` (optional `businessId`, `unreadOnly`)
- `PATCH /api/me/notifications/:id/read`
- `POST /api/me/notifications/read-all`

Founders: opening the centre syncs **chain alerts** from `/me/chain-rollup` into the feed (idempotent).

Deep links: `href` (web) and `mobileHref` (Expo) on every row — same targets as push.

---

## Tenant preferences

Stored under `business.operational_policy.notifications` (JSON).  
Settings → Communications → **Push & alerts** toggles.

Defaults: all push types **on**. Owners can disable noisy categories per shop.

---

## Liv utilisation

- **Inbound:** push says “Liv is on it” when AI will reply; otherwise “needs your team”.
- **Booking via DM:** `booking.created` body notes channel source (`via WhatsApp`, etc.).
- **Handoff:** when staff takes over, `conversation.updated` → `HANDED_OFF` notifies managers.
- **Signals:** Liv UI signals (coach cards) are separate from push — see `liv-signals.service.ts`.

---

## Testing locally

1. Run API + mobile `dev:mobile:device` on a physical device.
2. Allow notification permission on first launch.
3. `POST /internal/cron/test-push` with `x-internal-cron-secret` + `{ "businessId": "…" }`.
4. Or simulate Meta inbound → inbox push to OWNER/ADMIN devices.
5. Web: create pending booking → amber strip on dashboard.

---

## Related

- [`CHANNELS-EU-MESSAGING.md`](./CHANNELS-EU-MESSAGING.md) — customer channels  
- [`mobile-roadmap.md`](../mobile-roadmap.md) — N1 push, N3 Live Activities  
- [`impersonation-audit.md`](../policy/impersonation-audit.md) — weekly staff digest (future)
