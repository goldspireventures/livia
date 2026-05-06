# Cursor Rules for Livia

**Foundational document:** `docs/LIVIA_BUILD_PLAN.md` — read it **first** for what Livia is, engineering non‑negotiables, booking/payment/messaging/storefront/AI/UX philosophy, and the build roadmap (Parts A–D).

Also skim **`docs/ROADMAP.md`**, **`docs/MASTER_SPINE.md`**, **`docs/TRANCHES.md`**, **`docs/REPO_DELTA.md`**, and **`docs/elite/README.md`** (elite pack index).

Before editing code, also read:
- `prisma/schema.prisma`
- relevant `src/services/*` and routes you will change
- **[docs/REPO_LAYOUT.md](REPO_LAYOUT.md)** (repo map) and **[docs/FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md)** (services ↔ API table)

Never:
- put business logic in API routes
- put business logic in UI components
- bypass services
- hardcode barber-specific logic
- write cross-tenant queries without businessId
- call Stripe directly outside payment provider modules
- call AI providers directly outside shared AI client
- silently fake external integrations

Always:
- use **tenant-nested HTTP APIs**: `/api/businesses/[businessId]/...` for all tenant-scoped resources (staff, services, bookings, etc.); do not add parallel `/api/<resource>/[id]` routes without `businessId` in the path unless explicitly platform-global
- keep code typed
- use Zod for API validation
- emit events for major actions
- keep route handlers thin
- run build after changes
- summarize changed files
- explain how to test