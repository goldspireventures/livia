# Livia — demo script

A founder-narratable walkthrough that lands every wedge of the product without
ever feeling rushed. Three acts, ~3 minutes total at a conversational pace.

The script is written against the **real seed** the product ships with, not a
fictionalised version — what you read here is what the demo viewer sees.

---

## Setup (do once, ~30 seconds before the meeting)

1. **Open all three surfaces side-by-side**, in this order, so the audience can
   follow the arc:
   - **The pitch** — `livia.io` (the marketing artifact).
   - **The owner's command center** — the dashboard, signed in as the demo
     owner.
   - **The shop floor** — the mobile artifact (Expo preview, phone-shaped).
   - Optional: a fourth incognito window for the **customer's view** of the
     public booking page (used in Act 2).
2. In the dashboard, sign in. Clerk is in **development mode**, so you can use
   any email; the magic-link is logged to the API console.
3. **Seed the workspace.** Go to **Settings → Demo & Data → Reload demo data**.
   Wait ~3 seconds. The cockpit hydrates with three businesses:
   - **Luxe Salon & Spa** (hair & wellness, London) — 3 staff, 5 services, 8
     customers, 15 bookings spread across past + upcoming.
   - **Iron & Ink Tattoo Studio** (tattoo, Manchester) — 2 staff, 5 services,
     6 customers, 12 bookings.
   - **Peak Performance** (personal training, Birmingham) — 2 staff, 5
     services, 6 customers, 14 bookings.
4. Pick **Luxe Salon & Spa** from the business switcher (top-left of the
   dashboard). The cockpit hydrates with today's plan.
5. Copy Luxe Salon & Spa's public booking URL — `<dashboard-host>/b/<slug>`
   (visible in **Settings → General**) — and paste it (don't load) into the
   incognito tab.

You're ready.

---

## Act 1 — "This is the brand promise" (0:00 – 0:30)

Open `livia.io`. Read the headline aloud:

> *"For barbershops, tattoo studios, dental practices — and every appointment
> in between."*

Scroll once through the three pillars (AI Inbox, Revenue Protection, Owner
Cockpit). Pause on Pricing.

> "Four honest tiers — Solo €79, Studio €149, Chain from €249 per shop, Host €99 plus €19 per renter. The product behind that pricing is
> what I'm about to show you."

This 30-second beat exists so the audience meets the brand voice before they
meet the dashboard. Skip it if you've already shown the site.

---

## Act 2 — "The owner sits down" (0:30 – 1:30)

Switch to the dashboard cockpit. Read the header line:

> *"Today's flight plan."*

- Point at the **timeline spine** — every booking on a single hour-by-hour
  track with a live now-marker. "Not a Google Calendar grid. A live
  conductor's view."
- Point at the **Action Queue** card — pending bookings inline-confirm.
  Confirm one without changing pages.
- Click into the **Inbox** in the left rail to show the recent customer
  conversations (seeded threads + any live ones).

This is the "calm interface" pillar from the marketing site, made real.

---

## Act 3 — "AI takes the call" (1:30 – 2:30)

Switch to the **incognito** tab and load the public booking URL you prepared.
The page renders Luxe Salon & Spa's services and a **Chat with Liv** widget
bottom-right.

- Click the widget. Liv opens with the EU AI Act Art. 50 disclosure first
  bubble: *"Hi, I'm Liv — an AI assistant booking on behalf of Luxe Salon &
  Spa…"*. Point at it.
  > "Notice the disclosure. We don't pretend Liv is a human. The EU AI Act
  > requires it; we built it into the product instead of bolting it on."
- Type: *"Hey, can I get a haircut tomorrow afternoon with Maya?"*
- Liv replies in under five seconds with two or three slot options, picks up
  the staff name, and offers to book. Pick a slot, give a name + contact,
  confirm.
- Watch the **champagne shimmer + chime** on the confirmation screen.
  > "That's the sound of revenue you weren't going to capture at 11pm."

Switch back to the **dashboard → Inbox**. The thread is live (5-second poll).
Click **Take over** in the thread header.

> "Liv stops responding; I'm in the seat. The customer never knew there was
> a swap. That's the model: AI by default, human override always one click."

---

## Act 4 — "The shop floor" (2:30 – 3:00)

Switch to the **mobile** artifact. This is what staff see when they open the
app at the start of their shift:

- **My Day** tab (default for STAFF role) — today's appointments only for
  the signed-in staff member, with the next one + a countdown.
- Switch to **Bookings** — the same shop's calendar, scoped to the staff
  member's view.
- Switch to **Clients** — the staff member's customers list.

> "Same product, different lens. Owners get the cockpit; staff get the
> day. Nobody sees data they shouldn't."

End on the dashboard cockpit. Total: ~3 minutes.

---

## Reset between demos

- **Settings → Demo & Data → Wipe all my data**, then **Reload demo data**.
- Takes ~5 seconds. Use this between back-to-back investor calls so every
  demo lands on a fresh, identical workspace.

## Wow-moment kill switches

If a particular surface gets disruptive in a sensitive demo, disable the
champagne shimmer + chime via the browser console:

```js
localStorage.setItem("livia.celebrate", "off");
```

Re-enable with `localStorage.removeItem("livia.celebrate")`.

## Surfaces & paths cheat sheet

| Surface | Path | Role |
|---|---|---|
| Marketing | `/livia-marketing/` | The pitch |
| Dashboard (owner cockpit, inbox, settings) | `/` | The command center |
| Public booking + Liv chat | `/b/<business-slug>` | What the customer sees |
| Mobile (My Day, Bookings, Clients) | Expo preview URL | The shop floor |

## When the demo breaks

- **"Loading…" never resolves on mobile** → you're not signed in on mobile.
  Use the mobile sign-in flow before showing Act 4.
- **Cockpit empty after seed** → seed only runs once per user; if you've
  seeded before, **Wipe all my data** first then **Reload**.
- **Chat replies feel slow** → first request to Anthropic warms up the
  integration. Send a throwaway "hi" before the demo and discard the reply.
