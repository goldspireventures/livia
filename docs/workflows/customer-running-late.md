# Customer running late (self-serve)

**Surface:** Public guest visit link `/b/:slug/visit/:token`  
**Staff counterpart:** [`running-late.md`](./running-late.md) (business-initiated)

## Flow

1. Customer opens visit link from confirmation SMS or booking email.  
2. While status is **CONFIRMED** or **PENDING**, taps 5 / 10 / 15 / 30 minutes late.  
3. API `POST /api/public/b/:slug/visit/:token/running-late` logs event and SMSes the practice phone (when configured).

## Ops note

This is courtesy, not a reschedule — reception still owns calendar changes on the floor.
