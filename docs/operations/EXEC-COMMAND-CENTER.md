# Exec command center (hidden operator surface)

**Not a customer feature.** Salon owners never see this. There is no `/cockpit` route in production.

## Your account: `projectlazarus@livia-hq.com`

1. **Clerk (once):** Create this user in your production Clerk app (email + password and/or Google). Use `@livia-hq.com` or `@goldspireventures.com` — not `@livia.io`.
2. **Railway:** `LIVIA_PLATFORM_EXEC_EMAILS=projectlazarus@livia-hq.com` (default in code if unset).
3. **Sign in** at `https://app.livia-hq.com/sign-in` with that account → browser redirects to **Livia Internal** (ops console).
4. **Internal (once per browser):** Paste `INTERNAL_OPS_SECRET`, role **exec**, operator `projectlazarus@livia-hq.com`. Open **Join / onboarding** for the checklist; grant Goldspire inboxes under **Goldspire workforce access** on the exec overview.

Mobile: sign in as exec email → lands on operator overview (no 7-tap). Still paste ops secret on first open.

**Goldspire:** `@goldspireventures.com` has no automatic access — exec cockpit only. See [`WORKFORCE-ONBOARDING.md`](./WORKFORCE-ONBOARDING.md).

## URLs

| Surface | Local | Production |
|---------|-------|------------|
| Tenant app | `http://localhost:5173` | `https://app.livia-hq.com` |
| Marketing | `http://localhost:5174` | `https://livia-hq.com` |
| **Ops (Internal)** | `http://localhost:5175` + optional secret path | `https://ops.livia-hq.com/{secret}` when deployed |

Env:

- API: `INTERNAL_PORTAL_URL`, `INTERNAL_EXEC_PATH` (server)
- Internal Vite: `VITE_INTERNAL_PORTAL_URL`, `VITE_INTERNAL_EXEC_PATH`, `VITE_PLATFORM_EXEC_EMAILS`
- Dashboard Vite: `VITE_INTERNAL_PORTAL_URL`, `VITE_INTERNAL_EXEC_PATH`, `VITE_PLATFORM_EXEC_EMAILS`
- Workforce domains: `LIVIA_STAFF_EMAIL_DOMAINS`, `GOLDSPIRE_STAFF_EMAIL_DOMAINS` (Goldspire grants via cockpit only)

## Customer sign-up flow (app.livia-hq.com)

Same for **email** and **Google**:

1. `https://app.livia-hq.com/sign-up` (or **Get started** from livia-hq.com)
2. Clerk account created
3. `/legal-acceptance` — platform terms
4. `/onboarding` — create shop (unless already provisioned)
5. `/dashboard` — product

Sign-in only: `/sign-in` → dashboard (or persona home).

## Security

1. `INTERNAL_OPS_SECRET` on every ops API call.
2. Exec role for snapshot + automations.
3. No public links to ops in marketing or tenant UI.
4. `/internal/ops/org-admin/cockpit` → **404 in production**.
5. Internal HTML: `noindex, nofollow`.

Reads with: [`FOUNDER-RELEASE-RUNBOOK.md`](./FOUNDER-RELEASE-RUNBOOK.md), [`WORKFORCE-ONBOARDING.md`](./WORKFORCE-ONBOARDING.md).
