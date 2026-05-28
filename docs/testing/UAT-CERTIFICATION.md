# UAT & product certification (Gate 2 candidate)

**Audience:** founder, QA, release  
**Verdict date:** 2026-05-22 (engineering handoff — founder re-sign after live trial)  
**Companion:** [`FOUNDER-FIRST-LOGIN.md`](./FOUNDER-FIRST-LOGIN.md) (terminals) · [`REAL-WORLD-E2E-GUIDE.md`](./REAL-WORLD-E2E-GUIDE.md) (manual journeys)

---

## 1. Certification summary

| Layer | Tool | Status |
|-------|------|--------|
| L0 Types (libs + api + dashboard + marketing) | `pnpm run typecheck` | **Pass** (mobile fixed in this pass) |
| L0 API unit | `pnpm --filter @workspace/api-server run test` | **Pass** |
| L1 HTTP smoke | `pnpm smoke:gate3` | **Pass** if API up + demo seeded; chat needs AI env |
| L1b Concurrent UAT | `pnpm smoke:uat` | **Pass** if no 5xx under parallel load |
| L2 API E2E | `pnpm test:e2e:api` | **Pass** (skips: AI chat, Meta token, authed comms) |
| L3 Dashboard pages | `pnpm test:e2e` | **Pass** (expanded route matrix) |
| L3b Platform | `pnpm test:e2e:platform` | **Pass** |
| L4 Manual multi-persona | §4 below | **Required** before prod |
| L5 Gate 3 ops | launch plan | External (legal, stores, 10 shops) |

**Product-ready for live shop onboarding (closed beta):** **Yes** on web + API + mobile when env is complete. See [`../product/ENGINEERING-HANDOFF.md`](../product/ENGINEERING-HANDOFF.md). G3 public launch = [`../product/OPEN-ITEMS-DEFERRED.md`](../product/OPEN-ITEMS-DEFERRED.md) only.

---

## 2. Automated runbook (clean machine)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"

# Kill stale dev servers
@(3001,5173,5174,5175) | ForEach-Object {
  Get-NetTCPConnection -LocalPort $_ -State Listen -EA SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -EA SilentlyContinue }
}

pnpm run db:migrate:sql
pnpm run db:push
pnpm run db:seed
pnpm --filter @workspace/api-server run build
```

**Terminal 1:** `pnpm dev:api`  
**Terminal 2:** `pnpm dev:dashboard`  

**Terminal 3 — certify:**

```powershell
pnpm --filter @workspace/api-server run test
pnpm smoke:gate3
pnpm smoke:uat
pnpm test:e2e:api
pnpm test:e2e
pnpm test:e2e:platform
pnpm --filter @workspace/livia-mobile exec tsc --noEmit
```

---

## 3. Web vs mobile parity

| Capability | Web dashboard | Mobile | Notes |
|------------|---------------|--------|-------|
| Sign-in / onboarding | ✓ | ✓ | Same Clerk app |
| Today / dashboard | ✓ | ✓ (tabs) | Persona-specific tabs |
| Bookings CRUD | ✓ | ✓ | New + detail |
| Clients CRUD | ✓ | ✓ | New + detail |
| Inbox (all channels) | ✓ | ✓ | WA/IG/SMS/WEB badges |
| My day (staff) | ✓ | ✓ | |
| Approvals / time-off | ✓ | ✓ | |
| Staff + invite | ✓ | ✓ | |
| Services | ✓ | ✓ | |
| Settings (Liv, shop) | ✓ | ✓ | |
| Comms (SMS/email status) | ✓ | ✓ | Read + status in mobile Settings |
| Social (WA/IG/Messenger setup) | ✓ | Web-first | Meta webhook URL + simulate — use web Settings → Communications |
| Billing / Stripe | ✓ | View in settings | Checkout web-first |
| Audit log (hash chain) | ✓ | Web-only | Compliance density |
| Chain / multi-shop rollup | ✓ | Shops tab (founder) | |
| Integrations / partner API keys | ✓ | Web-only | Operator surface |
| Internal ops console | ✓ (:5175) | Link from Experience | Not Clerk |
| Public booking + Liv chat | ✓ `/b/{slug}` | Opens in browser | Correct — customer-facing web |
| Demo provision (7 doors) | ✓ `/demo` | Experience hub + web | |
| Marketing site | ✓ :5174 | N/A | |

**Web-only is intentional when:** dense tables, Meta Developer copy-paste, audit/legal, or founder integrations.

---

## 4. Multi-user real-life simulation (manual UAT)

Run **after** demo provision (`/demo` → Set up full demo world).

| Actor | Account / surface | Actions | Pass if |
|-------|-------------------|---------|---------|
| **Owner** | `demo-owner@livia.io` | Inbox, approve booking, edit client, Settings → Comms, simulate WA inbound | No 500; data persists after refresh |
| **Manager** | `demo-admin@livia.io` | Inbox takeover, new booking | RBAC respected |
| **Staff** | `demo-staff-senior@livia.io` | My day, mark complete | Sees only their chair |
| **Reception** | `demo-frontdesk@livia.io` | New walk-in booking | |
| **Customer** | Incognito `/b/aurora-studio` | Book + chat with Liv | Booking on owner calendar |
| **Customer 2** | `/b/luxe-salon-spa` | Chat only | Seed WA/IG threads visible to owner |
| **Founder** | `demo-founder@livia.io` | Chain glance, switch shop | |
| **Concurrent** | Terminal 3 `pnpm smoke:uat` | 8 parallel API actors × 3 rounds | All &lt;500 |

**Mobile parallel:** Sign in as owner on phone while manager uses web inbox — both should see new messages after simulate/send.

---

## 5. Known flimsy / depth gaps (honest)

| Area | Risk | Mitigation |
|------|------|------------|
| `findBusinessByMessagingLookup` | O(n) scan of businesses | OK for dev; needs index lookup before scale |
| Public Liv chat | Depends on `ANTHROPIC_API_KEY` | Fail-soft; smoke skips without key |
| Twilio / Resend absent | Outbound SMS/email FAILED in logs | Expected locally; configure for prod |
| Meta live send | Needs `META_ACCESS_TOKEN` | `META_DEV_SIMULATE=true` for demo |
| Mobile `experience` partial Business | Fixed — uses full `Business` from context | |
| IE voice prod number | Regulatory | Phase 7 |
| Telegram / Viber | v1.5 doc only | |
| Payroll / Mailchimp | Not in v1 | |

---

## 6. Sign-off

- [ ] All automated commands in §2 green (allowed skips documented)  
- [ ] §4 manual table completed once on web  
- [ ] §4 mobile owner + one staff path on device or Expo web  
- [ ] Self-onboard with **your** Clerk email completed  
- [ ] One real public booking from incognito  

When checked → **cleared for founder live test** (not yet Gate 3 production soak).

---

*Architecture truth: [`docs/product/LIVIA-COMPLETE-SYSTEM-SPEC.md`](../product/LIVIA-COMPLETE-SYSTEM-SPEC.md) · Channels: [`CHANNELS-EU-MESSAGING.md`](../product/CHANNELS-EU-MESSAGING.md)*
