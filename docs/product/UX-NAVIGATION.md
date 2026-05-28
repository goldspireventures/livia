# UX & navigation model

How Livia stays coherent across personas, verticals, and hundreds of screens.

## Principles

1. **Ritual names, not jargon** — Nav says "Queue" for managers, "The floor" for reception, "Glance" for multi-shop founders (`persona-rituals.ts`).
2. **Persona order** — Items appear in job priority order per role, not alphabetically.
3. **Sectioned sidebar** — Desktop nav groups: **Today · People · Business · Account** (`nav-sections.ts`).
4. **Mobile: four + More** — Bottom bar shows four primary rituals; overflow opens a sheet (`mobile-bottom-nav.tsx`).
5. **Settings tabs follow role** — Owners: Shop → Policies → Liv → Channels → Team → Plan → … Receptionists: **Channels first**.
6. **Collapsible depth** — Long settings (tool catalog, SMS search, test send) use `SettingsDisclosure` so pages stay scannable.
7. **PageFrame** — Consistent width, motion, and bottom padding for mobile nav.

## Persona → home → nav

| Persona | Lands on | Primary nav |
|---------|----------|-------------|
| Founder (2+ shops) | `/chain` | Glance, Brands, Today, Queue, Bookings… |
| Owner | `/dashboard` | Today, Queue, Bookings, Customers… |
| Manager | `/inbox` | Queue, Overview, Bookings, Team… |
| Staff | `/my-day` | My chair, Appointments, Customers |
| Receptionist | `/bookings` | The floor, Messages, Customers |

## Vertical vocabulary

Hair/beauty use default labels. Medspa, fitness, pet, allied-health override "Customers", "Bookings", "Staff" in nav (`VERTICAL_NAV_LABELS`).

## Branding

- Sidebar: **Livia wordmark** + shop name + persona badge (accent from `PERSONA_ACCENT`).
- Headers: `PersonaRitualHeader` — home hero vs compact `page` variant.
- Vertical accent via `applyVerticalTheme` on business switch.

## Settings map

| Tab | Who | Contents |
|-----|-----|----------|
| Shop | All (edit: owner) | Public link, profile, EU timezone select |
| Policies | Owner, manager | Deposits, buffers, resources |
| Liv AI | Owner, manager | Toggles + collapsible prompts/tools |
| Channels | Not staff | Notifications card + SMS/social |
| Plan & billing | Owner | Stripe plans + add-ons |
| Legal | All | Links + operator pack |

## Demo

Use [`docs/testing/FIRST-DEMO-WALKTHROUGH.md`](../testing/FIRST-DEMO-WALKTHROUGH.md) for terminal-by-terminal walkthrough.
