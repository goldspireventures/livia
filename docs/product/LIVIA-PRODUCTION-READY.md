# Livia — production-ready product (live users)

**As of:** 2026-05-22  
**Audience:** founder, GTM, engineering, support  
**Truth:** Everything in this document that is **in-repo** is shipped. What blocks **paying strangers on the public internet** is listed in §6 only.

---

## 1. What Livia is (for real users)

Livia is an **EU-first operating system for appointment-based businesses** — hair, barber, beauty, tattoo, wellness, fitness, medspa, allied health, and any bookable service:

- **Owners and managers** run the day from web (**dashboard**) or phone (**mobile**): Today, bookings, clients, team, inbox, audit, settings.
- **Staff** see **My chair** — today's slate, next client, their regulars.
- **Receptionists** live on **The floor** (bookings) and **Queue** (inbox).
- **Founders with 2+ shops** use **Glance** (chain rollup) then drill into any location.
- **Customers** book at **`/b/{your-slug}`** and message **Liv** on web, SMS, and configured social channels.
- **Livia Inc** operators use **internal ops** (`pnpm dev:internal`, port 5175) with `INTERNAL_OPS_SECRET`.

Liv is not a chatbot bolt-on: she books, explains policy, hands off to humans, and leaves a **hash-chained audit trail**.

---

## 2. Surfaces (all shippable today)

| Surface | URL / command | Who |
|---------|----------------|-----|
| Tenant web | `pnpm dev:dashboard` → :5173 | Owner, manager, receptionist, staff (role-gated) |
| Tenant mobile | `pnpm dev:mobile:device` | Same personas, native UX |
| Public booking | `/b/{slug}` | Customers |
| Demo gateway | `/demo` → provision → persona doors | Prospects, QA |
| API | `pnpm dev:api` → :3001 | All clients + webhooks |
| Internal ops | `pnpm dev:internal` → :5175 | Livia support (secret-gated) |

**Sign-in:** Clerk (dashboard + mobile). **Data:** Postgres (Supabase) with RLS, Drizzle, SQL migrations.

---

## 3. Core journeys (code-complete)

### Owner / manager — first week

1. **Sign up** → onboarding wizard (12 acts) or **Load full demo** at `/demo`.
2. **Shop profile** — name, slug, phone, city, timezone, **logo URL**, description.
3. **Services & team** — seeded menu, staff, availability.
4. **Liv** — tone, greeting, enable/disable, operational policy (deposit %, buffer, cancel window, no-show strikes).
5. **Channels** — Settings → Communications (SMS provision, email from, social channels); deep links from onboarding (`?tab=comms|liv|billing|policy`).
6. **Public link** — copy `/b/{slug}`; optional marketing vanity `livia.io/{slug}` via edge rewrite (§5).
7. **Bookings** — dialog from list; `pendingReason` on pending rows; detail + confirm/cancel/no-show.
8. **Inbox** — filters, thread, **take over → reply** (web + mobile), resume AI, close.
9. **Clients** — CRM, channel identity **merge**, trust/strike badges, book from profile.
10. **Audit** — search, action class, date range, paginated load-more.
11. **Second location** — `/onboarding?intent=second-shop` creates a **new business** (not resume shop 1).
12. **Glance** — tap shop → switch tenant + toast + **Today** for that shop.

### Customer

1. Open booking page → pick service → slot → confirm.
2. Chat with Liv (AI disclosure on first message).
3. Receive confirmation email/SMS when transports configured.

### Internal ops

1. Paste ops secret → search tenants → Stripe/Clerk links → support tickets → Liv assist on tenant context.

---

## 4. Platform spine (not visible, but real)

| Capability | Where |
|------------|--------|
| Liv tool registry + vertical packs | `lib/liv-runtime` |
| Booking policy resolver + `pendingReason` | `api-server` bookings + policy routes |
| Inngest workflows | Reminders, no-show recovery, weekly digest, time-off |
| Stripe Billing | Checkout, webhooks, Settings → Billing |
| Meta / Twilio webhooks | SMS, voice (EN-IE), social simulate in dev |
| Audit hash chain | `lib/audit-log` + Audit UI |
| Entitlements gate | Plan features |
| Push tokens (mobile) | `usePushRegistration` |
| Biometric gate | Approvals, settings (mobile) |
| Media assets API | `POST /businesses/:id/media` + logo URL on business |
| Channel identities | Merge API + customer detail UI |
| E2E + smoke | `pnpm e2e:prep`, `smoke:gate3`, `test:e2e`, `e2e:visual-capture` |

---

## 5. Marketing URL (off-app config)

Vanity **`https://livia.io/{slug}`** → public booking is **not** a second React route (would collide with `/dashboard`). Configure at the CDN/host:

```nginx
# Example: only single-segment paths that are not app routes
location ~ ^/(?!sign-in|sign-up|demo|guides|onboarding|dashboard|b/)([a-z0-9-]+)$ {
  return 302 /b/$1;
}
```

Tenant app continues to use **`/b/{slug}`** everywhere in product copy.

---

## 6. Only blockers before “strangers pay on the public internet”

These are **explicitly not code** in this repo:

| Blocker | Owner | Doc |
|---------|-------|-----|
| Counsel-reviewed Privacy, Terms, Cookie, DPA | Legal | `docs/legal/*` |
| Stripe Connect **production** + first **paid** subscription | Finance / ops | `OPEN-ITEMS-DEFERRED.md`, launch-plan L6–L7 |
| Production Twilio / Resend / Meta **live** credentials | Ops | `.env` production |
| EU production region **pinned** (ADR + deploy) | Eng + legal | #57 |
| App Store + Play **public** approval | GTM | launch-plan G3 |
| `livia.io` marketing site live + honest copy | GTM | `marketing-vs-reality.md` |
| 10 real design-partner shops with real bookings | Founder | G2 evidence |
| SOC 2 Type 1 kickoff | Compliance | post-G3 |
| Figma design system sprint | Design | parallel |
| WhatsApp/Instagram **live** inbound (if claimed on site) | Product + BSP | deferred in marketing audit |

**Closed beta (G2)** can start when: prep passes, smoke green, legal drafts linked in-app, Inngest + cron in staging/prod, and founder accepts [`FOUNDER-FIRST-LOGIN.md`](../testing/FOUNDER-FIRST-LOGIN.md) checklist.

---

## 7. How to run the full stack (your machine)

See [`docs/testing/E2E-RUNBOOK.md`](../testing/E2E-RUNBOOK.md):

```text
pnpm e2e:prep
pnpm dev:api          # :3001
pnpm dev:dashboard    # :5173
pnpm dev:mobile:device
pnpm smoke:gate3
pnpm test:e2e
```

Demo: http://localhost:5173/demo → provision → `LiviaDemo2026!` for `demo-*@livia.io`.

---

## 8. Doc index (all product truth aligned)

| Doc | Status |
|-----|--------|
| `UX-AUDIT-2026-05-21.md` | **Closed** (code items) |
| `BUILD-BACKLOG.md` | **Closed** (repo scope) |
| `OPEN-ITEMS-DEFERRED.md` | **Only external blockers** |
| `MULTI-STRUCTURE-SCENARIOS.md` | Spec + shipped paths |
| `LIVIA-DOCUMENTATION-READINESS.md` | L2/L4 complete; G2/G3 = §6 above |
| `marketing-vs-reality.md` | G2/G3 rows = ops/legal |

---

## 9. Sign-off

| Layer | Status |
|-------|--------|
| Tenant product (web + mobile) | **Ready for design partners and closed beta** |
| Liv OS + API + audit | **Ready** |
| Internal ops MVP | **Ready** |
| Public paid launch | **Blocked by §6 only** |

*Ship the beta. Close §6 with ops and counsel, not more dashboard features.*
