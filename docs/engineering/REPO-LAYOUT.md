# Repository layout

```
Livia/
├── artifacts/              # Deployable applications (surfaces)
│   ├── api-server/         # Express API + Inngest workflows
│   ├── livia-dashboard/    # Staff web app (Vite + React)
│   ├── livia-mobile/       # Staff mobile (Expo)
│   ├── livia-marketing/    # livia.io marketing site
│   └── livia-internal/     # Internal ops portal
├── lib/                    # Shared packages (@workspace/*)
│   ├── db/                 # Drizzle schema + migrations
│   ├── liv-runtime/        # Liv tool registry + reactions
│   ├── policy/             # Jurisdiction + vertical packs
│   ├── entitlements/       # Plan gates
│   └── …
├── e2e/                    # Playwright (API + UI + visual capture)
├── scripts/                # Node ops scripts (see scripts/README.md)
├── docs/                   # Product + engineering canon
└── .github/workflows/      # CI
```

## Dependency rule

- `lib/*` must not import from `artifacts/*`
- `artifacts/*` may import `@workspace/*`
- `e2e` talks to running API/dashboard URLs only

## Environment

- Single root `.env` (never commit)
- Copy `.env.example` / `.env.e2e.example` for local and CI

## Demo data entry points

| Command | What |
|---------|------|
| `pnpm demo:provision` | Full world (18+ shops, personas, Liv signals) |
| `pnpm db:seed` | Legacy `luxe-salon-spa` only (E2E fallback) |
| Dashboard `/demo` | Same as provision via UI |
