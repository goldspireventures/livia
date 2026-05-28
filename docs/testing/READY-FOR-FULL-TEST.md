# Ready for full test — checklist

Use this before a founder walkthrough or Gate 2 dry run. Everything below should be green locally.

---

## 1. One-command stack

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm start:platform:test
```

**Expect:** API `:3001`, dashboard `:5173`, marketing `:5174`, internal `:5175`, demo provisioned.

| URL | Purpose |
|-----|---------|
| http://127.0.0.1:5174/ | livia.io (local marketing) |
| http://127.0.0.1:5173/demo | Product demo picker |
| http://127.0.0.1:5173/sign-in | Clerk sign-in |
| http://127.0.0.1:5175/ | Internal ops |
| http://127.0.0.1:5173/b/clarity-medspa-dublin | Public booking (medspa) |
| http://127.0.0.1:5173/b/luxe-salon-spa | Public booking (hair) |

**Demo password:** `LiviaDemo2026!` (unless `LIVIA_DEMO_PASSWORD` in `.env`)

---

## 2. Automated gate (run in a second terminal)

```powershell
pnpm test:e2e:verticals
```

**Includes:**

| Project | What it proves |
|---------|----------------|
| `marketing-platform` | livia.io routes + copy |
| `all-verticals-smoke` | 9 verticals owner routes + public `/b/*` load |
| `public-booking-quality` | B2C axe, medspa consent, pet guards, mobile sticky CTA |
| `internal-ops-smoke` | :5175 proxy → Livia API, support queue JSON |
| `ux-quality-gate` | Owner wedge routes axe + no error copy |

Optional visual pass:

```powershell
pnpm test:e2e:verticals:full
```

---

## 3. Surfaces — what’s “ready”

| Surface | Status |
|---------|--------|
| Owner dashboard | UX gate + vertical smoke |
| Public booking `/b/:slug` | Phase A+B (ritual, consent, sticky mobile, guards, cover/address) |
| Marketing livia.io | 24-route smoke |
| Internal ops | Visual captures in full audit |
| Native mobile app | **Manual** — `pnpm maestro:visual-capture` with simulator |

Details: [`PUBLIC-BOOKING-AUDIT.md`](./PUBLIC-BOOKING-AUDIT.md), [`UX-PUNCH-LIST.md`](./UX-PUNCH-LIST.md)

---

## 4. Manual full test (incognito)

1. **Public** — Book (or walk to consent) on medspa + hair; check sticky bar on phone width.
2. **Owner** — Sign in via `/demo` → pick `motion-physio-cork` → inbox, bookings, vertical nav labels.
3. **Marketing** — Home → pricing → verticals; confirm SMS/email/web chat only (no false WA/IG claims).
4. **Internal** — `:5175` with `INTERNAL_OPS_SECRET` header / env as documented.

Walkthrough script: [`MANUAL-WALKTHROUGH-BETA.md`](./MANUAL-WALKTHROUGH-BETA.md)

---

## 5. Not in-repo (founder-only)

- 10 real Dublin shops + Gate 2 declare
- Production deploy of livia.io
- Twilio/Resend live sends (optional for booking flow test)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Internal: `Unexpected token '<'` / HTML error | **Port 3001 is not Livia API** — another app (e.g. Next.js) is bound there. `netstat -ano \| findstr :3001` → `taskkill /F /PID <pid>` → `pnpm start:platform:test` |
| Internal: Unauthorized | Paste `INTERNAL_OPS_SECRET` from repo-root `.env` into the :5175 sign-in form (must match exactly) |
| Port in use | Re-run `pnpm start:platform:test` (clears 3001, 5173–5175) |
| Vertical shop 404 | `pnpm demo:sync-verticals` after API restart |
| Playwright browsers | `pnpm --filter @workspace/e2e run install-browsers` |
| DB | Pooler URL in `DATABASE_URL` — see [`E2E-RUNBOOK.md`](./E2E-RUNBOOK.md) |

Verify API is Livia (must print JSON `{"status":"ok"}`):

```powershell
curl http://127.0.0.1:3001/api/healthz
```
