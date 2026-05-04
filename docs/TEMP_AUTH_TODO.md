# Temporary auth — grep index (T1)

Until real sessions land ([TRANCHES.md](./TRANCHES.md) T1), routes use `?userId=` and/or `actorUserId` in JSON. Search:

```bash
rg "TODO: Replace temporary (userId|actorUserId)" src/app/api
```

All matches are under `src/app/api/businesses/...` and should be replaced with the chosen auth provider (see BLIQ_BUILD_PLAN Part C).
