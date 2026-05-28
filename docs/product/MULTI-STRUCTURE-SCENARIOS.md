# Multi-structure scenarios — locations, brands, and premises

**Status:** Production (2026-05-24). All scenario rows below have shipped API + dashboard paths unless noted.

---

## Structure kinds (shipped in API + onboarding)

| Kind | When to use | Shipped flow |
|------|-------------|--------------|
| `standalone` | First business / new legal entity | Full 12-act wizard |
| `location` | Second shop, same brand (`?intent=second-shop`) | Create business step + profile; skips resuming tenant 1 |
| `brand_entity` | New brand under same owner (franchise, acquisition) | `parentBusinessId` on create + full wizard |

---

## Scenarios (all shipped)

| # | Scenario | Production surface |
|---|----------|------------------|
| 1 | **Shared premises** (hair + spa, one address) | `premises` + `premises_tenants`; `/premises`; `/p/:slug`; `POST /api/me/premises`; `POST /api/premises/:id/provision-tenant` |
| 2 | **Shared phone / WhatsApp routing** | `channel_premises_routing`; SMS webhook + Meta inbound resolve tenant menu; `PATCH /api/premises/:id` for `sharedPhone` + `sharedWhatsappPhoneNumberId` |
| 3 | **Spa day packages** (multi-step itinerary) | `day_packages` + `day_package_steps`; `/day-packages`; public book `POST /public/b/:slug/day-packages/:id/book` |
| 4 | **Care series** (physio 6-session) | `care_series` + `care_series_sessions`; customer detail panel; book next session API |
| 5 | **Rooms & thermal capacity** | `booking_resources`; Settings → Policy; slot + booking capacity checks |
| 6 | **Chair-rental host** | `/host`; link renters; **end rental** with GDPR customer portability export |
| 7 | **Franchise policy override** | `franchise_links.policy_pack_override`; `PATCH .../franchise-links/:id/policy`; merged in `getPoliciesForBusinessId` |
| 8 | **Staff at two locations** | Multi `business_memberships`; `GET /api/me/workplaces` |
| 9 | **Founder chain pulse** | `GET /api/me/chain-rollup` — act/watch/ok per shop |
| 10 | **Org shape runtime** | `GET /api/me/org-shape` — C2–C13 detection |
| 11 | **OPS director role** | `membership_role_v2` = `OPS` (chain-level; scope via `memberships.scope`) |

---

## Operator guidance

- **Add location (same brand):** Settings → Lifecycle → Add location, or `/onboarding?intent=second-shop`.
- **New brand / entity:** `/onboarding` with structure kind **New brand entity**.
- **Same building, two businesses:** `/premises` → create → provision co-tenant → share `/p/{slug}`.
- **Shared reception number:** Set `sharedPhone` on premises; customers text in → numeric menu → correct tenant.
- **Spa package:** `/day-packages` → create steps → book from staff or public API.
- **Physio series:** Customer profile → Care series → start plan → Book next.
- **Renter leaves:** Host → End rental → portability bundle returned to API (download/export in UI next).

---

## Migrations

Run in order: `014-premises-and-resources.sql`, then `015-roadmap-complete.sql`.

```powershell
pnpm run db:migrate:sql
```
