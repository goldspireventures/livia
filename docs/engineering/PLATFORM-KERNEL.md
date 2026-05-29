# Platform kernel map

**Status:** 2026-05-26 (A-13)  
**Reads with:** `docs/product/LIVIA-IDEA-TO-REALITY.md` Part I.3

There is no single `Conductor` class. The kernel is a **set of packages and routes** with fixed responsibilities:

```text
Clients (dashboard, mobile, public, internal)
    → OpenAPI (@workspace/api-client-react)
        → api-server
            → auth (Clerk) + requireRole + tenantContext
            → services/* (domain logic)
            → @workspace/db (Drizzle, businessId scope)
            → domain-events / booking-events
            → Inngest workflows
            → @workspace/audit-log
            → Liv runtime (tools + policy + disclosure)
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Contract | `lib/api-spec/openapi.yaml` | HTTP truth |
| Policy | `@workspace/policy` | Vertical, locale, inbox queue, guards |
| Tenant | `@workspace/tenant-context` | Acting business + membership |
| Entitlements | `@workspace/entitlements` | Plan gates |
| Audit | `@workspace/audit-log` | Trust chain |
| Workflows | `artifacts/api-server/src/workflows/` | Time-based automation |
| Liv | `liv-runtime`, `ai-chat.service`, prompts | Agent loop |

Support and ops: `livia-internal` + `internal/ops/*` routes.

**Evolution discipline (hub-and-spoke):** [`COMPOSABLE-EVOLUTION.md`](./COMPOSABLE-EVOLUTION.md)  
**Investigation (surfaceId, tickets):** [`../operations/SUPPORT-POINTS-AND-INVESTIGATION.md`](../operations/SUPPORT-POINTS-AND-INVESTIGATION.md)  
**Program + master todo:** [`../product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](../product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md)
