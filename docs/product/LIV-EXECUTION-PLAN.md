# Liv platform — execution plan (production build)

**Status:** active (2026-05-21)  
**Authority:** [`LIV-OPERATING-SYSTEM.md`](./LIV-OPERATING-SYSTEM.md)  
**Tracking:** [`BUILD-BACKLOG.md`](./BUILD-BACKLOG.md)

---

## 1. Scope (who Liv serves)

Liv is **not salon-specific**. Liv serves:

| Audience | Runtime profile | Surfaces |
|----------|-----------------|----------|
| **Appointment businesses** (any vertical in catalog) | `tenant` | Public web, SMS, WA, voice, owner/staff apps |
| **Public users** (customers, leads) | `tenant` (inbound only) | `/b/{slug}`, DMs, phone |
| **Livia Inc** (company operators) | `livia_internal` | Internal portal, support tooling |

Same **executor + audit + policy resolver**; different **tool registry slice** and **prompt pack**.

---

## 2. Architecture deliverables (phases)

### Phase A — Platform spine (**shipped in repo 2026-05-21** — run DB push + codegen locally)

| Deliverable | Location | Done when |
|-------------|----------|-----------|
| Tool registry (data-driven) | `lib/liv-runtime/src/registry.ts` | Tools filtered by profile, entitlements, policy |
| Vertical packs | `lib/liv-runtime/src/packs/*.json` | `verticalId` loads extra tools + prompt module |
| Prompt templates | `lib/liv-runtime/src/templates.ts` | No business logic in string literals in api-server |
| `pendingReason` on bookings | `lib/db`, `bookings.service` | Every PENDING has machine reason + UI label |
| Staff inbox reply | API `POST .../messages`, dashboard composer | HANDED_OFF threads get human outbound |
| `send_message` tool | registry + `liv-runtime-deps` | Liv can send when policy allows (staff profile) |
| Event reaction registry | `lib/liv-runtime/src/reactions.ts` | Declarative map event → briefing hooks (v1 read) |

### Phase B — Policy & tools (shipped 2026-05-21)

- [x] `businesses.operational_policy` jsonb + migration `008-phase-b-policy-trust.sql`
- [x] Customer `trusted_client`, `no_show_count`, `strike_count`; strikes increment on NO_SHOW
- [x] `GET/PATCH /businesses/:id/operational-policy` + Settings **Policy** tab
- [x] Liv tools: `confirm_booking`, `cancel_booking`, `reschedule_booking`, `lookup_customer` (`tenant_staff`)
- [x] Internal Liv: `search_tenants`, `tenant_snapshot` + `POST /internal/ops/liv/assist` + panel in `livia-internal`
- [x] `POST .../customers/:id/merge-identity` + customer detail merge UI
- [x] Audit log pagination (load more)
- [x] Booking create dialog from bookings list
- [x] Auto-confirm bookings when policy allows (`derivePendingReason` + operational policy)

### Phase C — Intelligence & scale (shipped 2026-05-21)

- [x] Per-tenant runtime warm pool — `TenantRuntimePool` + `tenant-runtime-pool.ts` (ADR 0012 v1 in-process)
- [x] Morning briefing — `morning_briefings` table, hourly cron, `GET /morning-briefing`, `morning_briefing` tool, dashboard card
- [x] Identity merge queue — `GET /customers/merge-suggestions` + Customers panel + one-click merge
- [x] Versioned prompt store — `liv_prompt_versions` + Settings Liv tab overrides
- [x] Inbox staff Liv assist — `POST .../conversations/:id/liv-assist` (`tenant_staff` tools)

### Phase D — Vertical & structure depth (shipped 2026-05-21)

- [x] Pack loader from DB — `businesses.liv_pack_config` + `GET/PATCH /liv-pack`
- [x] Multi-structure onboarding — `structure_kind`, `parent_business_id`, wizard field for second shop
- [x] Naming governance — `validateBusinessNaming` on `POST /businesses`
- [x] Media pipeline v1 — `media_assets` + `POST /media` (URL attach; sets customer `avatar_url`)

**Migration:** `lib/db/migrations/sql/009-phase-c-d.sql` — run `pnpm --filter @workspace/db run push`

---

## 3. Non-negotiable build rules

1. **No new business rules in `ai-chat.service.ts`** — policy + tool + service.
2. **Every tool call** → audit (`liv.*`) + eval trace hook.
3. **Registry is SSOT** for tool names; `execute-tool` dispatches by name.
4. **OpenAPI** updated when HTTP surface changes; run `pnpm --filter @workspace/api-spec run codegen`.
5. **Migrations** via `pnpm --filter @workspace/db run push` after schema change.

---

## 4. Verification (Phase A exit)

- [x] `pnpm --filter @workspace/api-server run typecheck` green (after `tsc -b` on `lib/db` + `lib/liv-runtime`)
- [x] Registry: `tenant_public` vs `tenant_staff` tool sets differ (`send_message` staff-only)
- [x] Create booking → `pendingReason` set in service layer
- [x] Inbox → `POST .../conversations/:id/messages` + dashboard composer
- [x] Public chat uses `resolveLivTools` + vertical pack on prompt
- [x] **Codegen in repo;** deploy machines run `pnpm db:push` + `pnpm codegen` per release (ops checklist in `E2E-RUNBOOK.md`)

---

## 5. File map (Phase A)

```
lib/liv-runtime/src/
  registry.ts      # tool catalog + resolveLivTools()
  packs/           # vertical JSON manifests
  templates.ts     # prompt assembly
  reactions.ts     # event → Liv briefing hooks
  tools.ts         # Anthropic schema export from registry
  prompt.ts        # uses templates + packs
  execute-tool.ts  # unchanged dispatch contract

lib/db/src/schema/booking/bookings.ts     # pendingReason
lib/db/src/schema/conversations/...       # authorUserId on messages

artifacts/api-server/
  services/bookings.service.ts            # derivePendingReason
  services/conversations.service.ts     # sendStaffMessage
  routes/conversations.ts                 # POST messages
  lib/liv-runtime-deps.ts                 # sendMessage dep
  services/ai-chat.service.ts             # resolveLivTools

artifacts/livia-dashboard/
  pages/inbox.tsx                         # composer
```

---

*Build the spine first; expand tools and policy in Phase B without rewriting the orchestrator.*
