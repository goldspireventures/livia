# Propagation program — border control for Livia

**Status:** canonical (2026-06-14)  
**Hub:** `lib/policy/src/propagation/`  
**Lifecycle:** `artifacts/api-server/src/platform/lifecycle/`  
**Reads with:** [`COMPOSABLE-EVOLUTION.md`](./COMPOSABLE-EVOLUTION.md) · [`PLATFORM-LIFECYCLE-REGISTRY.md`](./PLATFORM-LIFECYCLE-REGISTRY.md) · [`VERTICAL-ADD-PLAYBOOK.md`](./VERTICAL-ADD-PLAYBOOK.md)

---

## 1. One sentence

Every change enters **border control** → **clearance** → **fan-out** to registered consumers → **receipt**. Surfaces never invent rules; they consume bundles and capability routes declared in policy.

---

## 2. The three clocks

| Clock | When | Engine | Examples |
|-------|------|--------|----------|
| **Build** | PR / CI / `pnpm propagation:check` | Manifest compiler, routing graph, copy bleed | New vertical, copy change, capability add |
| **Resolve** | HTTP request / page load | `resolveTenantExperience()` + 45s bundle cache | Owner opens dashboard, guest opens `/b` |
| **Event** | After domain action | Inngest workflows, `logEvent` | Booking created, BUSINESS_CREATED |

Product rules live in **build + resolve**. Workflows react in **event** — never duplicate copy in handlers.

---

## 3. Ingress taxonomy

Defined in `lib/policy/src/propagation/ingress-types.ts`:

- **Platform:** `vertical.manifest`, `capability.add`, `platform.release`, `copy.evolution`
- **Tenant:** `tenant.birth`, `tenant.mutation`, `tenant.plan_change`
- **Domain:** `booking.lifecycle`, `guest.ingress`, `operator.action`, `support.ticket`, `liv.action`

Many passengers, one protocol: classify → clear → route → receipt.

---

## 4. Hub modules

| Module | Role |
|--------|------|
| `propagation/vertical-manifest.ts` | `compileVerticalManifest()` — assembles pack, registry, copy, announcement |
| `propagation/capability-routing.ts` | Capability → policy modules, bundle keys, surfaces |
| `propagation/surface-consumers.ts` | P0 surface → `consumesCapabilities` + `policyModules` |
| `propagation/clearance.ts` | `runPropagationClearance()` — full CI gate |
| `vertical-copy-program.ts` | Per-vertical copy bleed guards |
| `vertical-announcement.ts` | Platform welcome handshake |
| `platform/lifecycle/on-business-created.ts` | Tenant birth + mutation fan-out |

---

## 5. Adding a vertical (mandatory path)

1. Add enum in `types.ts`
2. Fill hub modules (pack, vocabulary, copy, continuity, guest, registry) — TypeScript `Record<BusinessVertical, …>` forces completeness
3. `compileVerticalManifest("foo")` must pass
4. `pnpm propagation:check` — manifest + routing + surfaces + copy
5. `pnpm vertical:check` — includes propagation + demo/E2E/registry
6. `pnpm codegen` if OpenAPI enum changed
7. **No** new copy `if` chains in `artifacts/*` — extend policy; surfaces read `tenant-experience`

`defineVerticalManifest()` in `vertical-manifest.ts` is the authoring contract for net-new verticals.

---

## 6. Tenant birth + mutation

**Birth:** `POST /businesses` → `createBusiness()` → `onBusinessCreated()` plans fan-out, runs optional seed hooks, logs propagation receipt on `BUSINESS_CREATED`.

**Mutation:** `updateBusiness()` when `vertical` or `presentationPresetId` changes → `onTenantMutation()` invalidates tenant-experience cache.

**Performance:** `GET /me/tenant-experience` uses in-memory cache (45s TTL, fingerprinted by vertical/preset/onboarding/updatedAt) + `Cache-Control: private, max-age=30`.

---

## 7. Change impact (engineering)

```bash
pnpm propagation:impact lib/policy/src/booking-experience-copy.ts
```

Returns affected capabilities, surfaceIds, verticals, and tests to run.

---

## 8. CI gates

```bash
pnpm propagation:check   # propagation program + copy + announcement + registry
pnpm vertical:check      # propagation + full vertical matrix + E2E fixtures
pnpm run typecheck
```

**Before onboarding testers or shipping:** all three green.

---

## 9. Anti-patterns (forbidden)

- Hardcoded vertical lists in dashboard/mobile/marketing
- Salon-default copy in owner UI (`photos or confirmation`, `continuity thread`)
- Product rules in Inngest handlers
- Editing generated `lib/api-client-react` by hand
- Skipping `propagation:check` after policy copy changes

---

## 10. Changelog

| Date | Change |
|------|--------|
| 2026-06-14 | Propagation program shipped — manifest compiler, routing, lifecycle, cache, CI |
