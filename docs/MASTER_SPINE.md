# Master product spec — spine (in-repo)

This is the **short normative spine** for the external “master build” vision. Read **[LIVIA_BUILD_PLAN.md](./LIVIA_BUILD_PLAN.md)** first for execution law, tenancy, and engineering non‑negotiables. Use appendices below for depth without duplicating Part A.

## Positioning

- **Messaging-first booking OS** for service businesses: customers book from DMs, web, and app; owners run one dashboard.
- **Barbers first**, **not barber-only**: generic domain (Business, Staff, Service, Customer, Booking, ChannelIdentity, …).
- **Mobile-first**, premium, fast, production-minded; **AI-native** as assistive + auditable layer (never authoritative for bookings, payments, permissions).

## Non-goals (near term)

- Full live WhatsApp / Instagram / SMS / Snapchat integrations without real credentials and webhooks.
- Autonomous AI actions on production data (deletes, pricing, risky sends) — suggestions and summaries only until policy + approval exist.
- Drag-and-drop storefront builder v1 — template-led public pages only.

## Quarterly definition (template)

Each quarter, list **in** [TRANCHES.md](./TRANCHES.md) or a short release note: **must ship**, **explicitly not shipping**, and **done when** (e.g. CI green + REPO_DELTA updated). Prevents scope creep from the long master spec.

## Documentation map (satellites)

| Topic | Doc |
|--------|-----|
| Target schema vs repo | [MASTER_APPENDIX_SCHEMA_TARGET.md](./MASTER_APPENDIX_SCHEMA_TARGET.md) |
| UI / screens backlog | [MASTER_APPENDIX_SCREENS.md](./MASTER_APPENDIX_SCREENS.md) |
| AI architecture & safety | [MASTER_APPENDIX_AI.md](./MASTER_APPENDIX_AI.md) |
| Event taxonomy (current + future) | [MASTER_APPENDIX_EVENTS.md](./MASTER_APPENDIX_EVENTS.md) |
| Delivery tranches T0–T6 | [TRANCHES.md](./TRANCHES.md) |
| Livia phases ↔ this spec | [MASTER_LIVIA_INDEX.md](./MASTER_LIVIA_INDEX.md) |
| Repo gap checklist | [REPO_DELTA.md](./REPO_DELTA.md) |
| ADR template (auth, renames) | [ADR_TEMPLATE.md](./ADR_TEMPLATE.md) |
| Elite standards pack (API, security, events target, UX, release, testing) | [elite/README.md](./elite/README.md) |

## Precedence

If the master vision conflicts with **implementation** (routes, `businessId`, service layer), **[LIVIA_BUILD_PLAN.md](./LIVIA_BUILD_PLAN.md)** wins until schema and APIs are intentionally updated.

For **API response shape, error codes, security rules, event catalog targets, UX and release discipline**, treat **[elite/LIVIA_API_STANDARD.md](./elite/LIVIA_API_STANDARD.md)** and siblings as **normative** where they do not contradict Livia or the live codebase.
