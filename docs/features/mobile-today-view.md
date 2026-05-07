# Feature S1.01 — Mobile "Today" view

**What it is.** The default-frame on mobile when staff (or owner) opens the app. Personalised per persona — a stylist sees her chair-day; an owner sees a cockpit; a junior sees their walk-in flow with a hero empty-state.

**Surfaces.** Staff mobile (iOS + Android via React Native/Expo). Owner mobile.

**Configurations.** Universal.
**Verticals.** Universal.

**Personas.**
- P4a Senior STAFF — "My Day" view. Today's bookings + 1 push if next-client-event.
- P4b Senior-w-admin — "My Day" + small team-tile (their team's day-shape).
- P5 Junior STAFF — "My Day" with hero empty-state when zero bookings.
- P3 Manager — Floor + queue (multi-staff calendar).
- P2a/b Owner — Cockpit (key numbers + 3 things needing attention).
- P1 Founder — Cross-shop cockpit (3 shops in one view).
- P6 Receptionist — Tablet kiosk variant (multi-staff calendar at desk).

**Modalities.** Visual primary. Push notifications layered. SMS no-app variant for staff who never install the app (pushes converted to SMS).

**Rung.** R1+ (always rendered); content depth grows with rung. R5 owner cockpit shows Liv's proposed plans inline.

**Dependencies.** Calendar; bookings; per-staff stats; push-notification system; auth (per ADR 0010 mobile-first).

**Complexity.** L (per-persona shape; per-configuration variation; per-vertical inflection).

**Sub-features.**
- Persona-aware default content
- Pull-to-refresh
- Swipe-to-action (cancel booking, reschedule, message customer) — per affordance rules
- Quick-add (one-tap "book this walk-in")
- Empty-state hero (P5 Junior, slow-day STAFF)
- Push entry-points (notification opens directly to relevant context)

**Power-user / casual.**
- Casual mode (default): Liv-narrated; "here's what matters."
- Power-user mode (toggle): denser; numbers + quick-actions; less narration.

**Accessibility.**
- Voice-over: every actionable element labeled.
- Audio briefing alternative: visually-impaired Owner can request the cockpit as a 90-second audio summary.
- Large-text mode supported.
- Low-bandwidth path: text-first; images lazy-load; voice synthesis served from CDN with fallback to system TTS.

**The "in its own league" angle.**
- **Phorest mobile** rates 2.5/5 on App Store: dashboard ports, dense, owner-default, no per-persona shape.
- **Fresha mobile** is good but customer-facing-first; staff/owner is light.
- **Mindbody mobile** is feature-rich but visually dated.
- **Livia mobile is mobile-first** (per ADR 0011) — designed mobile-up rather than ported from desktop. Per-persona shape is a first-class architecture, not a mode.

The "Today" view IS the product on mobile. Everything else navigates from it.
