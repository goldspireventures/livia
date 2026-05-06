# Livia — 90-second demo script

A founder-narratable walkthrough that lands every wedge of the product without
ever feeling rushed. Total ~90 seconds when read at conversational pace.

## Setup (do once before the meeting)

1. Open two browser windows side-by-side:
   - **Owner** — Livia dashboard, signed in as the demo owner.
   - **Customer** — incognito window, no auth.
2. In the owner window, go to **Settings → Demo & Data → Reload demo data**.
   Wait ~3 seconds. The cockpit hydrates with three businesses, real bookings.
3. Pick **Salon Aurora** from the business switcher (top-left).
4. In the owner window, copy the public booking URL from
   **Settings → General → Public booking link**.
5. Paste that URL into the **Customer** incognito window. Do not load it yet.

You're ready.

## Beat 1 — "This is what an owner sees when they sit down" (0:00 – 0:20)

- Land on the cockpit. Read the header line out loud:
  > "Today's flight plan — 8 today · 2 to confirm. The agent has 2 actions ready."
- Point at the **timeline spine** — "every booking on a single hour-by-hour
  track, with a live now-marker. No staring at a Google Calendar grid."
- Hover one **Action Queue** card and confirm it inline.
  > "I just confirmed that without changing pages or opening a modal."

## Beat 2 — "The wedge — AI takes the call" (0:20 – 0:55)

- Switch to the **Customer** incognito window. Load the public booking page.
- Click the floating **Chat with Liv** widget bottom-right. Type:
  > "Hey, I'd like a haircut tomorrow afternoon."
- Liv replies in under five seconds with two or three slot options. Pick one.
  Liv asks for a name + contact, you confirm.
- Watch the **champagne shimmer + chime** on the confirmation screen.
  > "That's the sound of revenue you weren't going to capture at 11pm."

## Beat 3 — "The owner sees everything" (0:55 – 1:20)

- Back to the **Owner** window → click **Inbox** in the left rail.
- Show the live thread (it polls every 5 seconds — the conversation appears).
- Click **Take over** in the thread header.
  > "Now Liv stops responding and I'm in the seat. The customer never knew
  > there was a swap."
- Switch back to the **Cockpit**. The new booking is on the timeline,
  flagged with the AI badge.

## Beat 4 — "And it's tunable" (1:20 – 1:30)

- Open **Settings → AI Assistant**.
- Show the four controls: **enable**, **auto-book**, **tone**, **knowledge**.
- Type one new line into knowledge — e.g. "We don't bleach after 5pm." — save.
  > "Next conversation knows. No retraining, no engineers, no waiting."

End on the cockpit. Total time: ~90 seconds.

## Reset between demos

- **Settings → Demo & Data → Wipe all my data**, then **Reload demo data**.
- Takes ~5 seconds. Use this between back-to-back investor calls so every
  demo lands on a fresh, identical workspace.

## Seed credentials

Demo workspace seeded by `POST /api/dev/seed` includes three businesses on
the calling owner: **Salon Aurora** (hair), **Tattoo Ember** (tattoo),
**Smile Atelier** (dental-style). Each comes pre-loaded with staff, services,
customers, and a realistic spread of past + upcoming bookings.

## Wow-moment kill switches

If a particular surface gets disruptive in a sensitive demo, disable the
champagne shimmer + chime via the browser console:

```js
localStorage.setItem("livia.celebrate", "off");
```

Re-enable with `localStorage.removeItem("livia.celebrate")`.

The shimmer + chime also auto-disable when the OS reports
`prefers-reduced-motion: reduce`.
