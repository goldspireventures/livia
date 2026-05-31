# Beauty — public booking flow (W5)

**Demo:** `bloom-beauty-dublin` · **Playbook:** [`vertical-playbooks/beauty.md`](../vertical-playbooks/beauty.md)

---

## Flow

```text
/b/{slug} → service (lash/nail/brow) → staff optional → datetime → details (patch-test gate if colour)
→ confirm → visit token SMS
```

## Steps

| # | Screen | Notes |
|---|--------|-------|
| 1 | Storefront hero | Soft preset; retail attach optional R2 |
| 2 | Service catalog | Categories; patch-test badge on colour services |
| 3 | Slot picker | Station-aware R2; staff optional R1 |
| 4 | Guest details | Phone required; email optional |
| 5 | Confirm | `success-beat`; continuity template beauty confirm |
| 6 | Post | Visit token; rebook window in reminder copy |

## Screen cards

- [`w5.public.book.mobile.yaml`](../../design/screen-cards/w5.public.book.mobile.yaml)
- [`w5.public.visit.mobile.yaml`](../../design/screen-cards/w5.public.visit.mobile.yaml)

## Channel (thin)

SMS: confirm + reminder + `/visit/{token}` — no MMS patch-test forms; link to `/b` if rebook.
