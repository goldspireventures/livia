# Platform Default — G2 beauty thread crops

Real Livia screenshots (not preset mocks). Sync from design targets:

```bash
pnpm sync:platform-default-wedge
```

| Chapter | File | Source |
|---------|------|--------|
| Inbox | `inbox.png` | `w4-tenant/platform-default/web/inbox-thread.target.png` |
| Today | `today.png` | `w4-tenant/platform-default/web/owner-dashboard.target.png` |
| `/b` | `book-mobile.png` | `w5-public/platform-default/mobile/book-mobile.target.png` |

Refresh `/b` after UI change: `pnpm capture:platform-default-book` (requires API + dashboard).
