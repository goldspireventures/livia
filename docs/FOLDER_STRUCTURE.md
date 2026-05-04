# Service and API folder structure (canonical)

**Onboarding map:** see [REPO_LAYOUT.md](./REPO_LAYOUT.md) for the full repo (root, docs, `src` layers, and how to add a feature).

**Rule:** Domain logic lives under `src/services/*`. Routes under `src/app/api/*` stay thin.

## Layout (matches repo today)

| Area | Path |
|------|------|
| Business + membership | `src/services/business/` |
| Staff | `src/services/staff/` |
| Service catalog + staff assignments | `src/services/catalog/` |
| Customers + channel identities | `src/services/customer/` |
| Bookings | `src/services/booking/` |
| Availability + time off | `src/services/availability/` |
| Payments | `src/services/payments/` |
| Feature flags | `src/services/featureFlags/` |
| Health | `src/services/health.ts` |
| Auth (Clerk / user glue) | `src/services/auth/` |

## Shared libs

| Concern | Path |
|---------|------|
| Prisma singleton | `src/lib/prisma.ts` |
| Env validation | `src/lib/env.ts` |
| Events | `src/lib/events.ts` |
| HTTP helpers | `src/lib/http.ts` |
| Errors | `src/lib/errors.ts` |
| API identity helpers | `src/lib/apiIdentity.ts` |
| Business settings helpers | `src/lib/businessSettings.ts` |
| Global styles + Tailwind | `src/styles/globals.css` |

## Naming note for external specs

Some master docs use plural folders (`bookings/`, `services/`). **This repo uses** `booking/`, `catalog/`, `customer/` — prefer matching the table above in new code unless an ADR renames for consistency.
