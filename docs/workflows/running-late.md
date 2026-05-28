# Running late — notify customers

**Product (Phase A):** Web + mobile · API `POST .../bookings/:id/running-late` and `.../running-late-broadcast`  
**Business template:** [`../business/templates/running-late-procedure.md`](../business/templates/running-late-procedure.md)

---

## Actors

| Actor | Action |
|-------|--------|
| Staff / reception / owner | Trigger from Today, booking detail, or mobile quick actions |
| Liv | Optional future: suggest delay from calendar drift |
| Customer | Receives SMS when Twilio + phone on file |

---

## Modes

### Single appointment

1. User opens **Running late** on a **CONFIRMED** booking.  
2. Enters minutes late (default 15).  
3. API loads customer phone; sends SMS with business name.  
4. Event logged as `NOTIFICATION_SENT` on booking.

### All today

1. User opens **Running late** from **Today** (no booking id).  
2. Inngest workflow loads today's CONFIRMED bookings; batch SMS.  
3. Use when whole shop is delayed — not for one stylist (prefer single mode).

---

## Liv posture

| Step | Posture |
|------|---------|
| Detect delay | Future: draft suggestion only |
| Send SMS | Autonomous after human tap (no auto-send without confirmation in v1) |
| Compose copy | Default template; optional custom message (broadcast API) |

---

## Failure modes

- **No Twilio** — API succeeds with `sent: false`; user should call or inbox manually.  
- **No phone** — skip customer; show in response count.  
- **Wrong status** — only CONFIRMED bookings.

---

## UI map

| Surface | Entry |
|---------|--------|
| Web Today | Running late chip |
| Web booking detail | Running late (confirmed) |
| Web Liv command | Removed (was buried in toolkit) |
| Mobile Today / bookings | Quick actions → Running late (Phase B parity) |
