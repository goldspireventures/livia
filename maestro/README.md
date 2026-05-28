# Maestro — mobile visual capture

Captures signed-in tenant screens for parity review with `e2e/visual-captures/web/`.

## Prerequisites

1. [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro) installed (`maestro -v`).
2. API + demo provisioned: `pnpm dev:api` and `POST /api/demo/provision` (or `pnpm e2e:prep`).
3. Expo app running on simulator/emulator or device:
   - iOS Simulator: `pnpm --filter livia-mobile run ios`
   - Android: `pnpm --filter livia-mobile run android`
4. Env (optional, for sign-in flow):
   - `MAESTRO_DEMO_EMAIL=demo-owner@livia.io`
   - `MAESTRO_DEMO_PASSWORD=LiviaDemo2026!`
   - `MAESTRO_APP_ID` — bundle id (default `io.livia.app` from `app.json`)

## Run

```powershell
pnpm maestro:visual-capture
```

Output: `e2e/visual-captures/mobile/<flow>.png`

## Flows

| Flow | Persona / path |
|------|----------------|
| `sign-in-demo.yaml` | Clerk email sign-in (skip if already signed in) |
| `capture-owner-tabs.yaml` | Owner: tabs + More (staff, services, premises, audit, new booking) |
| `capture-founder-more.yaml` | Founder: Glance, Today, Approvals, Inbox, rota, lifecycle, audit |
| `capture-founder-verticals.yaml` | Founder: open each EU vertical shop → Today screenshot |
| `capture-persona-manager.yaml` | Manager: queue, floor, clients, messages, time-off |
| `capture-persona-staff.yaml` | Staff: my chair, appointments, clients, time-off |
| `capture-persona-receptionist.yaml` | Reception: floor, clients, messages |

Full suite: `pnpm e2e:full-visual-audit` (web Playwright + these flows). See `docs/testing/FULL-VISUAL-AUDIT-WEB-MOBILE.md`.

## Dev shortcut (no Clerk)

On a dev build with `EXPO_PUBLIC_DEMO_LOGIN=true`, use **More → Switch persona** instead of `sign-in-demo.yaml` — run flows with `MAESTRO_SKIP_SIGN_IN=1`.
