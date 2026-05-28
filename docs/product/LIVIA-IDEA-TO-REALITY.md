# Livia — Idea to Reality (complete platform plan)

**Status:** Canonical — 2026-05-21  
**Owner:** founder  
**Supersedes:** ad-hoc UX complaints and scattered build lists as *execution truth*  
**Reads with:** [`LIVIA-MASTER-PLAN.md`](./LIVIA-MASTER-PLAN.md) (sprints & gates) · [`LIVIA-MASTER-BUILD-PLAN.md`](./LIVIA-MASTER-BUILD-PLAN.md) (engineering phases) · [`LIVIA_MASTER_DESIGN.md`](./LIVIA_MASTER_DESIGN.md) (surfaces)

---

## What this document is (and is not)

| This doc **is** | This doc **is not** |
|-----------------|---------------------|
| The full stack: company → business → product → platform → UX → code → docs → internal ops | “Wave E = plug in Stripe and done” |
| Honest **today vs target** on every layer you raised | A replacement for legal, tax, or HR runbooks |
| The **definition of done** per phase, including UI/UX quality bars | A Figma file (it specifies what Figma must contain) |

**Relationship:** [`LIVIA-MASTER-PLAN.md`](./LIVIA-MASTER-PLAN.md) sequences *when* we ship commercially. **This doc** sequences *what “built right” means* at every layer so we do not ship a brilliant backend inside an embarrassing cockpit.

---

## Part I — Truth today (grounded audit)

Your questions map to real gaps. The API is often ahead of the UI.

### I.1 CRUD & operations matrix (tenant product)

| Entity | API (OpenAPI) | Web dashboard | Mobile | Gap you felt |
|--------|---------------|---------------|--------|--------------|
| **Customer** | create, update, list, get | List (limit 50); detail = **block only**, no edit form | Detail + **edit screen** (`/customer/edit/:id`) | Web customer edit form still thin; list scale |
| **Booking** | full | New booking = **functional form**, weak visual/flow | `booking/new` | “Not beautiful”; wizard missing |
| **Service** | create, update, deactivate | **Inline edit** on services page | list only | “Can create but can’t edit” — **web can**; mobile thin |
| **Staff** | create, update, services, availability, time-off | **staff-detail** tabs (services, availability, time-off) | **active toggle + read-only services list** | “Can’t edit staff / assign services” — **web can**; mobile not |
| **Settings** | business + AI + comms + billing | Tabs exist; **owner value uneven** | basic settings | “Kinda useless” — needs persona-first IA |
| **Lifecycle** | transfer, nudges | partial (new) | partial | parity + copy pass needed |

**Conclusion:** This is not “missing backend.” It is **incomplete product surface + uneven mobile parity + no UX quality program.**

### I.2 UX / brand / copy (not yet a program)

| Topic | Today | Target |
|-------|-------|--------|
| **Theme** | Aurora-Midnight tokens exist; dashboard uses shadcn + some rogue colours | Single token source; lint ban on raw Tailwind colours in product UI |
| **Responsive** | Dashboard: sidebar desktop, bottom nav mobile; not fully specified per screen | **Responsive matrix** per screen (Part IV) |
| **Static vs dynamic** | Mixed ad hoc | Rules: data-heavy = virtualised lists; marketing = static; forms = consistent |
| **Copy** | Mixed generic (“Customer Profile”) | Persona + public-readability review per screen |
| **Contrast / text** | Generally OK; not systematically tested | WCAG 2.2 AA checklist in CI (axe on critical routes) |
| **Motion** | Mobile onboarding strong; web flat | Shared motion budget (Part IV) |
| **Persona** | Rituals exist (`persona-rituals.ts`) | Every screen tagged P1–P7 + min role |

### I.3 Architecture (partially there — needs one diagram everyone uses)

**Exists today:**

```text
Clients (dashboard, mobile, public)
    → OpenAPI client (@workspace/api-client-react)
        → api-server (Express)
            → requireAuth + requireRole + tenantContext (AsyncLocalStorage)
            → services/* (business logic)
            → db (Drizzle, businessId-scoped)
            → domain-events / booking-events (publish)
            → Inngest workflows (async)
            → audit-log (append-only chain)
            → Liv runtime (AI tool loop)
```

**“Conductor” name in docs:** There is no single class called `Conductor`. The role is split — **by design**, but under-documented:

| Layer | Package / module | Role |
|-------|------------------|------|
| **Contract** | `lib/api-spec/openapi.yaml` | Single truth for HTTP |
| **Tenant context** | `@workspace/tenant-context` + `resolveTenantContext` | Who is acting, which `businessId` |
| **AuthZ** | `auth.ts` `requireRole` | What they may do |
| **Domain events** | `domain-events.ts`, `booking-events.ts` | Side effects, analytics, workflows |
| **Events log** | `events.service` `logEvent` | Operational telemetry |
| **Audit** | `@workspace/audit-log` | Trust / compliance |
| **Workflows** | `artifacts/api-server/src/workflows/*` | Durable time-based processes |
| **Policy** | `@workspace/policy` | Vertical, jurisdiction, lifecycle vocabulary |

**Refinement:** Add a documented **Platform Kernel** section (Part III) — not a new god-object, but a **named map** so engineers and internal portal link to the same picture.

### I.4 Documentation & internal portal

| Asset | Status |
|-------|--------|
| `docs/` foundation, personas, journeys, ADR | Rich |
| **Doc graph in internal portal** | **Partial** — Knowledge tab; full graph in [`OPERATION-SOLIDIFY.md`](./OPERATION-SOLIDIFY.md) T5 |
| **RBAC for Livia Inc** | Spec’d; **Solidify T5.6** (role-gated tabs) |
| **Screen ↔ API ↔ doc links** | `SCREEN-INVENTORY.md` generated; browsable target T5.3 |
| **Active v1 program** | [`OPERATION-SOLIDIFY.md`](./OPERATION-SOLIDIFY.md) — supersedes scattered deferrals |

### I.5 Modularity & code quality

| Principle | Today | Target |
|-----------|-------|--------|
| Monorepo boundaries | Documented in `code-organization.md` | Enforced via dependency-cruiser or lint |
| No artifact → artifact imports | Mostly true | CI rule |
| Naming | kebab-case files, PascalCase components | ADR + lint |
| “Ingenious but fragile” | Some `as any`, persona in localStorage for demo | Strict OpenAPI types; explain non-obvious patterns in **Architecture Notes** (Part VI) |
| Comments | Sparse | **Aha comments** only where creativity > convention (Part VI) |

---

## Part II — Business model locked (confirm / refine)

**Locked for execution** (change only via RFC + master plan §8):

1. **Unit primitive:** Colleague (Liv), not dashboard-with-AI.  
2. **Beachhead:** EU, IE-first; appointment-based service businesses.  
3. **Wedge:** Voice + WhatsApp + ops cockpit for Hair/Beauty configurations.  
4. **Revenue:** Per-business base + seats + voice outcome share; lifecycle one-shots (succession, 2nd shop, migration).  
5. **Tenancy:** One `businessId` = one legal/commercial tenant; founder = multiple OWNER memberships, not one org table (v1).  
6. **Data:** Customer belongs to salon (Bet 5); no cross-tenant PII (v1).  
7. **Trust:** Audit log, GDPR export, EU residency — never upsold.  
8. **Go-to-market:** Design partners → founder-led → PLG; concierge for shape-change moments.

**Refine (explicitly open):**

- Exact Stripe price IDs per market (IE vs UK) — Wave B.  
- Chair-renter commercial pass-through — v1.5.  
- Org-level billing — post first chain customer asking.

---

## Part III — Platform architecture (foundation → top)

### III.1 Layer cake (build order — never invert)

```text
L0  Legal / company entity (Livia Inc, DPAs, subprocessors)
L1  Domain model + policy packs (vertical, tier, jurisdiction)
L2  Postgres schema + RLS + migrations (businessId everywhere)
L3  Platform kernel (auth, tenant context, audit, events, entitlements)
L4  OpenAPI contract + generated clients
L5  Core domain services (bookings, customers, staff, services, slots)
L6  Liv runtime + channels (chat, SMS, voice)
L7  Workflows (Inngest) + metering
L8  Surfaces (public, dashboard, mobile)
L9  Internal portal (cross-tenant, separate auth)
L10 Observability (Sentry, logs, status, analytics)
```

**Rule:** L8 cannot invent business rules that belong in L5. UI is **thin**.

### III.2 Request path (the “middleman”)

Every authenticated API request:

1. **Clerk JWT** → `userId`  
2. **`businessId` from URL** → `resolveMembership` → 404 if not member  
3. **`requireRole(min)`** → 403 if insufficient  
4. **`resolveTenantContext`** → AsyncLocalStorage for downstream services  
5. **Service method** → queries **always** filter `businessId`  
6. **Mutations** → `appendHumanAudit` + `logEvent` + `publishDomainEvent` where applicable  

Optional: **`?as=staff:id`** → read-only shaping; audited.

### III.3 Realtime & near-realtime data

| Channel | Pattern | v1 target |
|---------|---------|-----------|
| Dashboard inbox / bookings | React Query poll + invalidation on mutation | 30s staleTime on lists; manual refresh on focus |
| Mobile tabs | Same | Pull-to-refresh |
| Liv chat (public) | HTTP stream / poll | Existing chat endpoint |
| Voice / SMS | Webhooks → domain events → workflows | Async, not websocket to UI |
| Push (mobile) | Expo push + device tokens | Approvals, booking changes |

**v2+:** Selective SSE or websocket for inbox only — RFC required.

**Controller pattern:** `@tanstack/react-query` keys are **centralised** per surface (`lib/query-keys.ts` in each artifact) — prevents cache chaos.

### III.4 Modularity for evolution

| Need | Mechanism |
|------|-----------|
| New vertical | `@workspace/policy` pack + service templates + feature flags |
| New product tier | `PLAN_CATALOGUE` + entitlements gate |
| New channel | Channel router (`channel-router.ts`) + entitlement |
| New workflow | Inngest function + domain event subscription |
| New persona surface | `persona-rituals.ts` + nav filter; no forked app |

---

## Part IV — Experience system (design properly)

### IV.1 Design system (single source)

| Token / asset | Owner | Consumers |
|---------------|-------|-----------|
| Colour, type, motion, elevation | `packages/design-tokens` (target; today split dashboard/mobile constants) | dashboard, mobile, marketing, internal |
| Web components | shadcn in dashboard + shared `packages/ui` (grow) | dashboard, internal |
| Mobile | `constants/colors`, `typography`, `motion` | mobile |

**Sprint mandate (Wave 0):** Token unification ADR — one import path per artifact.

### IV.2 Responsive vs static rules

| Surface type | Layout rule |
|--------------|-------------|
| **Marketing / legal** | Static content width max-w-3xl; no tenant data |
| **Cockpit lists** (customers, bookings) | **Virtualised** table/list; search; pagination cursor; never unbounded `limit: 50` as production |
| **Detail panels** | Master–detail on desktop (list left, detail right); full-page on mobile |
| **Forms** (new booking) | **Stepped wizard** on all breakpoints; sticky summary column on lg+ |
| **Chain / founder** | Dashboard grids; horizontal scroll only for KPI cards, not tables |
| **Public booking** | Mobile-first; thumb zones; min 44px tap targets |

### IV.3 Persona-first screen ownership

Each route gets a **Screen Card** in docs (generated into internal portal):

```yaml
route: /customers/:id
personas: [owner, manager, receptionist]
minRole: STAFF
job: "Know the client before the appointment"
mustShow: [contact, notes, recentBookings, editProfile, blockToggle]
mustNot: [billing, aiConfig]
copyTone: plain EU English; no jargon
emptyState: "No bookings yet — first visit?"
```

**Deliverable:** `docs/product/screens/` — one YAML per route; portal renders them.

### IV.4 Copy & readability bar (public-ready)

| Check | Rule |
|-------|------|
| Sentence length | Max ~20 words per sentence in UI labels |
| Jargon | Ban “tenant”, “slug”, “ADMIN” in user-facing text — use “shop”, “booking link”, “Manager” |
| Visibility | `text-muted-foreground` only for secondary; never sole carrier of critical info |
| Actions | Verb-first buttons: “Save client”, not “Submit” |
| Errors | Human + recovery step: “Couldn’t save — check email format or try again.” |

**Process:** Copy review gate in PR template for `artifacts/*/pages` and `app/`.

### IV.5 Priority UX fixes (your examples → epics)

| Epic | Scope | Wave |
|------|-------|------|
| **UX-C1** Customer master–detail + edit on detail (web + mobile) | Form: name, email, phone, notes; save; invalidate list | A |
| **UX-C2** Customers list scale | Search debounce, cursor pagination, virtual list | A |
| **UX-B1** New booking wizard | Steps: client → service → staff (filtered by staff_services) → slot → confirm | A |
| **UX-S1** Services parity | Mobile edit/deactivate; duration/price clear | A |
| **UX-ST1** Staff profile edit | Name, email, colour; link userId; services multi-select both platforms | A |
| **UX-ST2** Staff–service matching visible at booking | Filter staff dropdown by service; explain empty states | A |
| **UX-SET1** Settings persona IA | Owner: Billing, Team, Liv, Comms, Shop; Manager: Liv + Team read-only; strip noise | B |
| **UX-A11y** | axe CI on 10 critical routes | B |

---

## Part V — What “done” means (founder definition — locked)

**Done is not frozen forever.** Done is: **Livia and Liv are ready to serve in ways that change what appointment businesses can expect** — and what happens next is driven by **usage, feature requests, and company direction**, not by us discovering we forgot to wire edit-client or build the booking flow properly.

**Done is not:** every vertical, every country, every Wave E item, or “no more commits.”

### V.0 The only acceptable delays: **Go-live ops** (off-platform)

When the product is **platform-ready**, remaining work is **configuration and operations outside the repo** — not “we need another sprint on core UX.”

| Go-live ops (acceptable delay) | Owned by | Examples |
|-------------------------------|----------|----------|
| **Payments** | founder / finance | Stripe Dashboard: products, prices, Connect, webhooks, tax, bank |
| **Comms** | ops | Twilio regulatory bundle, number purchase, WhatsApp Business approval |
| **Identity** | ops | Clerk production instance, OAuth, session policies |
| **Email** | ops | Resend domain verify, SPF/DKIM, sender addresses |
| **Stores** | ops | App Store / Play metadata, screenshots, review cycles, age ratings |
| **Legal** | counsel + founder | ToS/Privacy/DPA sign-off, insurance, DPAs with subprocessors |
| **Infra** | ops | Production env vars, DNS, SSL, Supabase prod, Inngest prod |
| **GTM** | founder | Design partner contracts, pricing page copy, launch date |

**Unacceptable delay (platform-not-ready):** “Customers list breaks at 200 rows,” “can’t edit staff on mobile,” “Liv books wrong staff,” “manager sees owner billing,” “settings don’t configure Liv,” “API missing pagination,” “no audit on impersonation.”

### V.1 Platform-ready checklist (Tracks A–J — **in our control**)

Gate **Platform-Ready** (declare before public launch; can parallel last-mile go-live ops):

#### B — Platform kernel
- [ ] OpenAPI matches implementation; clients generated; no silent `businessId` leaks (404 cross-tenant)
- [ ] Booking create/update conflict-safe; slots respect staff_services + availability
- [ ] Webhooks idempotent (Stripe, Twilio); failures visible in logs
- [ ] Entitlements enforced server-side for voice, chain, etc.

#### C — Experience (persona wedge)
- [ ] CRUD **web + mobile**: customers (edit on detail), bookings (wizard), services, staff (profile + services)
- [ ] Customers list: pagination/virtualisation; search; no unbounded load
- [ ] New booking: stepped, beautiful enough for public demo; staff filtered by service
- [ ] Settings: owner can configure shop + Liv + comms + billing path in one session
- [ ] Persona homes correct (founder/owner/manager/staff/reception); copy plain English
- [ ] Theme: tokens only; contrast pass on critical routes; responsive rules met

#### H — Liv
- [ ] Public chat + voice/SMS (scoped v1): books correctly; disclosures visible; scope enforced (no owner-only actions as manager)
- [ ] Eval suite green on golden paths; kill switch works
- [ ] Reminder / no-show workflows run in prod (Inngest or cron)

#### F — Trust (minimum to serve legally in IE wedge)
- [ ] AI disclosure on customer-facing surfaces
- [ ] GDPR export/delete path exists; DPA published
- [ ] `marketing-vs-reality.md`: **zero `build-before-G2` for platform claims**

#### G — Reliability
- [ ] CI: typecheck, tests, Playwright persona smoke, axe on core routes
- [ ] Sentry on api + dashboard + mobile; structured logs with tenant id
- [ ] Rate limits on public chat; incident runbook exists

#### D — Knowledge (minimum)
- [ ] Screen cards for all v1 core routes
- [ ] Internal: tenant search + health + support runbook (portal MVP or doc)

#### E — Lifecycle (minimum)
- [ ] G8 transfer + G3 checklist; graduation nudges not misleading

#### A + I + J (truth, not polish)
- [ ] Pricing in app matches Stripe products you will create
- [ ] Migration path documented (Phorest concierge acceptable at first 10)
- [ ] livia.io does not promise what Platform-Ready checklist lacks

**Platform-Ready does not require:** v1.5 chair-host, v3 medspa, org billing, full internal portal IP-6, UK locale, partner API write, widget embed.

### V.2 After platform-ready: how evolution works

| Source of change | Process |
|------------------|---------|
| Usage patterns | Analytics + DP transcripts → UX epics → sprint |
| Feature requests | RFC if scope/version; else backlog |
| Company direction | Master plan + roadmap version bump |
| Legal/regulatory | Track F item → may block *new* markets, not rewrite kernel |
| Competitors | Strategy doc; not emergency refactors |

**Engineering rule:** post Platform-Ready, default is **extend** (new vertical pack, new workflow), not **repair** (fixing core CRUD we should have shipped).

### V.3 Honest status today (May 2026) vs your “done”

| Your bar | Today |
|----------|--------|
| Delays only off-platform | **Not yet** — Track C gaps (client edit, list scale, booking wizard, mobile staff/services, settings IA) would still cause “we’re not ready” |
| Liv serves wedge transformative | **Partial** — chat/voice path exists; prod hardening + eval + reminder cron verification per marketing-vs-reality |
| Future = usage not foundation | **Directionally right** once Platform-Ready checklist is green |

**Estimated to Platform-Ready:** Sprints **S2–S6** (UX + Liv prod + trust/reliability) if those are the primary focus — not Wave E.

### V.4 Version waves (still useful, not “done”)

| Version | Meaning after your definition |
|---------|-------------------------------|
| **Platform-Ready** | Serve IE hair/beauty wedge; go-live ops can run in parallel |
| **Gate 3 / public launch** | Platform-Ready + go-live ops complete + first paying shops |
| **v1.5 / v2 / v3** | Evolution from usage & direction — new shapes and markets |

Wave E is **expansion**, not the definition of done you described.

---

## Part VI — Documentation & internal portal (mandatory)

### VI.1 Documentation graph

```text
docs/
  product/
    LIVIA-IDEA-TO-REALITY.md     ← this file
    LIVIA-MASTER-PLAN.md         ← sprints & gates
    screens/*.yaml               ← per-route spec
  personas.md, journeys/, adr/
  engineering/
  business/
  legal/
```

**Rule:** Every PR that touches a route updates the matching `screens/*.yaml`.

### VI.2 Internal portal modules (build sequence)

| Phase | Module | RBAC |
|-------|--------|------|
| IP-1 | SSO + roles (founder, engineer, support_l1/l2, finance_read) | IdP groups |
| IP-2 | Tenant directory + health card | L1 read |
| IP-3 | Doc browser (render docs/ + screen cards) | all internal |
| IP-4 | Support actions + ticket ID | L2+ |
| IP-5 | Feature flags + kill switch | engineer |
| IP-6 | Finance read-only Stripe roll-up | finance_read |

**Never** tenant JWT on internal portal. Separate Clerk app or workforce SSO per spec.

### VI.3 Architecture Notes (aha comments policy)

Where code is clever, add a short block:

```ts
/**
 * Why AsyncLocalStorage for tenant:
 * Routes carry businessId in URL but services must not trust callers to pass it correctly.
 * ALS mirrors request scope so every query uses the same resolved tenant without threading 12 params.
 */
```

Living index: `docs/engineering/architecture-notes.md` — links from portal.

---

## Part VII — How a real company structures this

### VII.1 Org functions (even if one human today)

| Function | Owns | Artifacts |
|----------|------|-----------|
| **Product** | Screen cards, copy, persona acceptance | `docs/product/screens` |
| **Design** | Figma ↔ tokens ↔ components | design-tokens, packages/ui |
| **Engineering** | L3–L7 kernel, API, workflows | api-server, packages |
| **Surface** | Dashboard + mobile UX | artifacts/* |
| **AI / Liv** | Character, evals, prompts | liv-runtime, liv-evals |
| **GTM / CS** | Design partners, concierge playbooks | `.local/research`, Notion |
| **Ops / SRE** | Gates, incidents, status | launch-plan, internal portal |
| **Legal / Compliance** | C-items, DPA | docs/legal, compliance lane |

### VII.2 Decision rights (summary)

Founder: bets, pricing, gate pass, RFC sign-off.  
Engineering: ADR, kernel, OpenAPI.  
Product: screen cards, UX epics.  
No gate pass on “feels done” — only checklists in Part V.

### VII.3 Vendor boundary

| Vendor | Role |
|--------|------|
| Clerk | Human identity (tenant + internal separate) |
| Stripe | Money |
| Twilio | SMS/voice |
| Anthropic | Liv brain |
| Postgres (Supabase) | Data plane |
| Inngest | Durable workflows |
| Resend | Email |

Livia owns: **orchestration, audit, entitlements, persona, policy packs.**

---

## Part VIII — Unified program (one timeline)

### Are tracks A–E “100% final”?

**No.** A–E were a **spine** (commercial, kernel, UX, docs, lifecycle) — enough to stop plan sprawl, **not** exhaustive for a multi-country platform.

What was missing from A–E alone (expanded below as **F–J**):

| Gap | Why it matters |
|-----|----------------|
| **Trust & compliance** | EU AI Act, GDPR, ToS/DPA, disclosures — launch-plan Lane 3; not optional |
| **Reliability & ops** | Sentry, incidents, status page, backups, rate limits — prod without this is fragile |
| **Liv / AI quality** | Evals, guardrails, voice legal, prompt packs — the product *is* Liv |
| **Data & migration** | Phorest brokers, integrity, reporting — switching and founder trust |
| **Brand & markets** | livia.io, locale, currency, marketing truth — multi-country ≠ multi-tenant only |

**Final program = Tracks A–J.** Every sprint touches at least one row; **one primary theme** per sprint.

```text
PROGRAM: LIVIA-REALITY

Track A — Commercial        Gates, DPs, pricing, sales motion, MRR
Track B — Platform kernel   L0–L7: schema, API, auth, events, audit, entitlements
Track C — Experience        Design system, UX epics, copy, a11y, responsive rules
Track D — Knowledge         Docs graph, screen cards, internal portal + RBAC
Track E — Lifecycle         G1–G8 graduations, concierge playbooks
Track F — Trust             Legal, compliance, security, AI disclosure, SOC2 path
Track G — Reliability       Observability, CI/CD, perf, incidents, status, DR
Track H — Liv               Character, evals, channels (chat/SMS/voice), guardrails
Track I — Data              Migrations, brokers, analytics, data integrity
Track J — Brand & markets   Marketing site, i18n/locale, pricing truth, GTM assets

Cross-cutting: launch-plan Lanes 1–5 map into B+C+F+G+J (not a separate plan).
```

### Track definitions (expanded — your guide + platform reality)

#### Track A — Commercial
- Design-partner programme, Gate 2/3 criteria, Stripe products, outcome-share metering  
- Sales motion per persona (founder vs Conor vs Niamh)  
- Lifecycle SKUs: succession pack, 2nd shop, migration  
- Churn / expansion plays (G1→Studio, G3→Chain)  
- **Not in A alone:** brand promise (→ J), legal terms (→ F)

#### Track B — Platform kernel
- OpenAPI-first; `requireRole`; tenant ALS; domain events; Inngest  
- Booking engine + advisory locks; slot generation; conflict rules  
- Partner API plane (read-only → expand)  
- Feature flags + entitlements composition (ADR 0018)  
- Package boundaries (`code-organization.md`); dependency rules  
- **Stress:** concurrency tests, idempotency on webhooks, 404-not-403 tenant isolation  

#### Track C — Experience (your questions live here + more)
- Everything in Part IV (tokens, responsive matrix, persona screen cards)  
- UX epics UX-C1…UX-SET1  
- **Also:** empty/loading/error states; skeleton vs spinner rules; offline/mobile flaky network  
- **Also:** embeddable booking widget (v2); tablet/kiosk reception (v1.5)  
- **Also:** notification UX (push, email previews in settings)  
- **Also:** “beautiful” = stepped flows, density control, master–detail — not only colours  

#### Track D — Knowledge
- `docs/product/screens/*.yaml` per route  
- Internal portal: doc browser, architecture notes, API explorer link, runbooks  
- RBAC: who sees PII, finance, kill switches  
- Onboarding engineers: read order in `product/README.md`  
- **Also:** customer-facing help centre (v2); in-app contextual help (tooltips, not walls of text)  

#### Track E — Lifecycle
- G1–G8 product + concierge scripts  
- Ownership transfer (built); dual-sign succession (RFC)  
- Configuration graduation events in audit  
- **Also:** churn/downgrade (solo after staff leave); shop closure / data export  

#### Track F — Trust (was implicit — now explicit)
- GDPR: export, delete, retention, DPA, subprocessors list  
- EU AI Act Art. 50: disclosure on public chat + voice  
- ToS, Privacy, cookie banner, security.txt  
- Impersonation audit policy; break-glass for internal ops  
- Pen test / dependency audit cadence  
- Maps to **launch-plan Compliance lane**

#### Track G — Reliability (was implicit — now explicit)
- Sentry + structured logs (tenant id, user id, request id)  
- CI: typecheck, test, lint, axe, Playwright persona smoke  
- Rate limits (public chat, API abuse)  
- Status page + incident response + postmortems  
- DB backups, migration discipline, rollback playbook  
- Inngest failure handling; dead-letter visibility in internal portal  
- Maps to **launch-plan Engineering + Launch ops lanes**

#### Track H — Liv (the product soul — was split across B and C)
- Character bible + tone per vertical  
- Tool-loop guardrails; scope enforcement (manager ≠ owner actions)  
- Eval harness (`liv-evals`); golden transcripts; regression on prompt change  
- Voice: provisioning, recording, disclosure, outcome attribution  
- SMS/WhatsApp: continuity, opt-out, template compliance  
- Kill switch + rung demotion (owner control)  
- **Kill criteria** from `livia-bets.md` (e.g. 60% say “Liv” by name)

#### Track I — Data (migrations & truth)
- Phorest/Fresha/Booksy/Square brokers  
- 30-day parallel-run reconciliation  
- Customer dedupe rules; import “do you really want marketing list?”  
- Reporting: owner digest, chain rollup, finance export (Xero v1.5)  
- Peer insights differential privacy (ADR 0014) when k≥10  
- Analytics funnel (signup → first booking) — aggregate only in portal  

#### Track J — Brand & markets (multi-country platform)
- `livia.io` aligned to cockpit (ADR 0004)  
- `marketing-vs-reality.md` — no lie in copy  
- Per-market: currency, date format, phone validation, timezone defaults  
- UK voice + EN-GB copy (v1.5); DACH (v3)  
- App Store / Play listings, screenshots per persona  
- Maps to **launch-plan Brand + GTM lanes**

### Coverage map: launch-plan five lanes → tracks

| Launch-plan lane | Primary tracks |
|----------------|----------------|
| Engineering | B, G, H (infra for Liv) |
| Brand | J, C (visual parity) |
| Compliance | F |
| Launch ops | G, A |
| GTM | A, J, E (concierge) |

### Sprint rule (unchanged, now against A–J)

Each sprint: **one primary theme**, but **Definition of Done** must cite checklist items from **every track touched** (e.g. shipping voice = H + F + G, not only H).

### Sprint overlay (next 6 sprints — concrete)

| Sprint | Primary theme | Tracks (must touch) |
|--------|---------------|---------------------|
| **S1** | Foundation truth | **D** screen cards · **B** OpenAPI lifecycle · **F** disclosure audit on public chat · **G** CI baseline |
| **S2** | Customer & booking UX | **C** UX-C1,C2,B1 · **B** pagination API · **I** list integrity · **D** docs |
| **S3** | Staff & services parity | **C** UX-ST1,ST2,S1 · **B** staff_services · **H** slot/staff rules for Liv |
| **S4** | Settings & persona IA | **C** UX-SET1, copy · **A** DP onboarding · **F** legal links · **D** portal |
| **S5** | Voice + Gate 2 prep | **H** voice E2E · **A** 10 DPs · **G** Sentry/Twilio · **J** promise check |
| **S6** | Gate 2 proof | **A** Gate 2 · **G** Playwright+axe · **F** compliance row green · **D** support runbook |

### Gate checklists now span tracks (not only A)

| Gate | Tracks required green |
|------|------------------------|
| **Gate 2** | A, B (core), C (core CRUD UX), D (runbooks), F (min compliance), G, H (SMS/voice slice) |
| **Gate 3** | All of Gate 2 + J (marketing) + I (billing truth) + C (polish bar Part V.1) |
| **v1.5** | E (G5,G7…) + B/C depth for C7,C10,C13 |
| **v3** | F (regulated) + H + I at scale |

---

## Part IX — Working through it (your operating rhythm)

### Monday (90 min)

1. Which **sprint theme** (S1–S6)?  
2. Any **RFC** needed?  
3. Gate checklist: **one row** progressed?  
4. **UX epic** acceptance: demo screen recording for one epic.

### Per feature PR

- [ ] OpenAPI updated if API changed  
- [ ] Screen card YAML updated  
- [ ] Persona + min role stated in PR description  
- [ ] axe clean on touched routes  
- [ ] No new `as any` without comment  

### Monthly

- Reconcile `marketing-vs-reality.md`  
- Update **built vs backlog** in master plan §6.2  
- Design partner transcript → one UX epic adjustment  

---

## Part X — Answer to “is this the final plan?”

**Yes — as the single orchestration model** — **Tracks A–J**, with **done = Platform-Ready** (Part V), not Wave E.

| Your intent | Captured in plan |
|-------------|------------------|
| Done ≠ never change | **V.2** evolution from usage & direction |
| Done = Liv/Livia ready to serve; delays only Stripe/App Store/legal ops | **V.0** vs **V.1** split |
| No delay from code/design/engineering gaps | **V.1** checklist — **V.3** says not green yet |
| Change is normal | Roadmap versions = evolution, not “we weren’t finished” |

**Start here:** Close **V.1** (Platform-Ready) in order: **S2–S4 (Track C)** → **H + G + F** → declare Platform-Ready → run **V.0** go-live ops in parallel → public launch.

---

## Annex — Quick links

| Question | Go to |
|----------|-------|
| Who pays / ROI? | `docs/persona-economics-and-switching.md` |
| Sprint order? | `docs/product/LIVIA-MASTER-PLAN.md` §6 |
| Code layout? | `docs/engineering/code-organization.md` |
| Internal portal spec? | `docs/company/livia-internal-portal-spec.md` |
| Persona homes? | `docs/product/lifecycle-map.md` |
| What ships v1? | `docs/roadmap/v1-scope.md` |
