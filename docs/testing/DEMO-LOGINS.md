# Demo logins (local / beta)

**Password for all accounts:** `LiviaDemo2026!` (or value of `LIVIA_DEMO_PASSWORD` in `.env`)

Sign in on **web** (`http://localhost:5173/sign-in`) and **mobile** with email + password. No persona switcher — UI follows your real Clerk role and memberships.

Re-provision after changing emails:

```bash
pnpm install
pnpm demo:provision
```

---

## Role-based accounts (cross-business)

| Email | Role | Primary business | Use for |
|-------|------|------------------|---------|
| `org-admin@livia.io` | OWNER (3 shops) | Aurora Studio | Chain / Glance, multi-location |
| `owner-conorcuts@livia.io` | OWNER | Conor's Cut Co | Generic single-shop owner |
| `manager@livia.io` | ADMIN | Aurora Studio | Manager inbox, approvals |
| `staff-lara@livia.io` | STAFF | Aurora Studio | My Day / chair |
| `staff-mo@livia.io` | STAFF | Conor's Cut Co | Junior stylist |
| `desk@livia.io` | ADMIN (reception) | Aurora Studio | Front desk / bookings |

---

## Scenario shortcuts (isolated tours)

| Email | Use for |
|-------|---------|
| `solo@livia.io` | Solo barber IE (Conor's Cut) |
| `chain@livia.io` | Aurora chain only |
| `uk@livia.io` | London Rose Spa |
| `de@livia.io` | Berlin Studio Neun |
| `medspa@livia.io` | Clarity Medspa |
| `pets@livia.io` | Paws Parlour |
| `physio@livia.io` | Motion Physio Cork |

---

## One owner per demo business

Pattern: `owner-<short>@livia.io` — only that tenant after sign-in.

| Slug | Email | Vertical |
|------|-------|----------|
| `aurora-studio` | `owner-aurora@livia.io` | hair |
| `aurora-mews` | `owner-mews@livia.io` | hair |
| `aurora-galway` | `owner-galway@livia.io` | hair |
| `conors-cut-co` | `owner-conorcuts@livia.io` | hair |
| `bloom-beauty-dublin` | `owner-bloom@livia.io` | beauty |
| `harbour-wellness-cork` | `owner-harbour@livia.io` | wellness |
| `ink-anchor-galway` | `owner-ink@livia.io` | body-art |
| `paws-parlour-dublin` | `owner-paws@livia.io` | pet-grooming |
| `clarity-medspa-dublin` | `owner-clarity@livia.io` | medspa |
| `motion-physio-cork` | `owner-physio@livia.io` | allied-health |
| `peak-fitness-dublin` | `owner-peak@livia.io` | fitness |
| `shine-studio-belfast` | `owner-shine@livia.io` | beauty |
| `luxe-salon-spa` | `owner-luxe@livia.io` | beauty |
| `stoneybatter-cuts` | `owner-stoney@livia.io` | hair |
| `dublin-barber-collective` | `owner-barber@livia.io` | hair |
| `dundrum-hair-studio` | `owner-dundrum@livia.io` | hair |
| `dundrum-serenity-spa` | `owner-serenity@livia.io` | wellness |
| `london-rose-spa` | `owner-rose@livia.io` | beauty |
| `berlin-studio-neun` | `owner-berlin@livia.io` | hair |
| `paris-belle-vue` | `owner-paris@livia.io` | beauty |
| `copenhagen-havn-wellness` | `owner-havn@livia.io` | wellness |

**Mobile shortcuts:** type `founder`, `owner`, `conor`, `manager`, `staff`, `desk`, or a **slug** (e.g. `ink-anchor-galway`).

---

## Suggested test matrix

| Goal | Account |
|------|---------|
| Tattoo design proofs + camera upload | `owner-ink@livia.io` |
| Medspa clinical hub | `owner-clarity@livia.io` |
| Hair salon Today / bookings | `owner-conorcuts@livia.io` |
| Multi-shop Glance | `founder@livia.io` |
| Staff chair view | `staff-lara@livia.io` |
| Manager inbox queues | `manager@livia.io` |

Public booking (no login): `http://localhost:5173/b/<slug>` or mobile `/public-book/<slug>`.
