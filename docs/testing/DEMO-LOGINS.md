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
| `atelier-decor-dublin` | `owner-atelier@demo.livia-hq.com` | event-vendors |
| `luxe-salon-spa` | `owner-luxe@livia.io` | hair |
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

## End clients (guest `/my` — OTP `000000` in dev/staging)

| Guest | Phone | Story |
|-------|-------|--------|
| **Mary McNamara** | `+353 87 100 0001` | Cross-vertical — 9 showcase shops, 5 upcoming visits |
| **Sean Kelly** | `+353 87 100 0002` | Solo barber loyalist + studio visits — Stoneybatter, DBC, Dundrum Hair, Conor's |
| **Orla Murphy** | `+353 87 100 0003` | Wellness-first — Serenity Spa, Harbour, Bloom, Dundrum Hair |

Sync after provision: `pnpm demo:sync-liv-world` or `POST /api/demo/sync-guest-hub`

Autonomous gate: `pnpm smoke:demo-liv-world`

## Operator shapes (Liv alive)

| Shape | Sign in | Guest in story |
|-------|---------|----------------|
| Solo barber | `owner-stoney@demo.livia-hq.com` | Sean — running late SMS, pending fade today |
| Studio barber | `owner-barber@demo.livia-hq.com` | Sean handoff refund; Mary reschedule |
| Solo wellness | `owner-serenity@demo.livia-hq.com` | Orla — pack redemption thread |

Shortcut scenarios: `solo@` → Stoneybatter · `studio-barber@` → DBC · `solo-wellness@` → Serenity

## Suggested test matrix

| Goal | Account |
|------|---------|
| Beauty presets + `/b` + inbox (Bloom) | `owner-bloom@livia.io` |
| Tattoo design proofs + camera upload | `owner-ink@livia.io` |
| Medspa clinical hub | `owner-clarity@livia.io` |
| Hair salon Today / bookings | `owner-conorcuts@livia.io` |
| Multi-shop Glance | `founder@livia.io` |
| Staff chair view | `staff-lara@livia.io` |
| Manager inbox queues | `manager@livia.io` |

Public booking (no login): `http://localhost:5173/b/<slug>` or mobile `/public-book/<slug>`.

---

## Per-tenant roster (launcher role cards)

Pattern on each demo business: `owner-<short>`, `manager-<short>`, `desk-<short>`, `staff-<short>` @ `demo.livia-hq.com` (e.g. Bloom: `manager-bloom@demo.livia-hq.com`).

**Clerk quota:** manager / desk / staff cards sign in via **shared** global Clerk users (`manager@demo.livia-hq.com`, `desk@…`, `staff-lara` / `staff-mo`) while membership is wired to the shop you picked. Owners stay one Clerk user per business (`owner-bloom@…`).

If manager/staff fail after a quota error, deploy the API fix and run **Sync logins** on `/demo` (or `POST /api/demo/repair-db`).

### Clerk quota cleanup (staging dev instance)

Prune synthetic demo users in Clerk — **keeps** the 21 modern per-shop owners (`owner-bloom@demo.livia-hq.com`, etc.), **deletes** legacy `demo-owner-*@livia.io` duplicates, manager/staff/desk per-tenant accounts, and other demo clutter:

```bash
pnpm demo:clerk-prune              # dry-run — lists keep vs delete
pnpm demo:clerk-prune -- --execute
```

By default, prune **also keeps** pooled globals (`manager@demo`, `staff-lara`, `org-admin`, …). Use `--owners-only` for aggressive cleanup, then rebuild.

After aggressive prune:

```bash
pnpm demo:clerk-rebuild
```

Or **Sync logins** on `/demo` once pooled personas exist in Clerk again.
