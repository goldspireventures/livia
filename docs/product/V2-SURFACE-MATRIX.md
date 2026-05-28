# v2 surface matrix — at engineering close

**Status:** **Engineering closed** (2026-05-22) — see [`V2-ENGINEERING-CLOSED.md`](./V2-ENGINEERING-CLOSED.md) · [ADR 0020](../adr/0020-v2-engineering-close-boundary.md)  
**Open for you only:** [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md)

Legend: ✅ v2 delivered · ⏸ v3 or founder (not v2 eng)

---

## Entire Livia — v2 delivered

| Surface | Web | Mobile | Marketing | API |
|---------|-----|--------|-----------|-----|
| Core OS (bookings, customers, inbox, audit) | ✅ | ✅ | — | ✅ |
| Host / chair-rental | ✅ | ✅ | ✅ `/for/chair-rental` | ✅ |
| Multi-brand | ✅ | ✅ | — | ✅ + brand-wall test |
| Chain + staff-borrow | ✅ | ✅ | — | ✅ |
| Rota | ✅ | ✅ list + web edit | — | ✅ |
| Owner toolkit + Liv hub | ✅ | — | — | liv-assist |
| Ask Liv (inbox) | ✅ | — | — | ✅ |
| Hiring | ✅ | ⏸ web deep link | — | ✅ scaffold |
| Peer insights | ✅ | ⏸ | — | ✅ k≥10 |
| Booksy CSV | ✅ | — | — | ✅ |
| Classes / fitness | ✅ `/classes` | ⏸ | ✅ vertical | ✅ |
| Design proofs / body-art | ✅ | ⏸ | ✅ vertical | ✅ |
| Franchise C11 | ✅ `/franchise` | ⏸ | ✅ pricing note | ✅ rollup |
| Mid-chain C8 | ✅ tier in policy/billing | ⏸ ops UI depth | ✅ | ✅ catalogue |
| livia.io | — | — | ✅ Block J | leads API |
| Livia Internal | ✅ tabs | — | — | platform-health |
| UK (GB) | ✅ | ✅ | ✅ | ✅ |
| Nordic policy (SE/DK/NO/FI) | ✅ | ✅ | ✅ copy | ✅ packs |

---

## Explicitly not v2 engineering

| Item | Owner | Track |
|------|-------|-------|
| Legal pages on livia.io | Founder | GA / founder lane |
| Stripe prod + first paid sub | Founder | G2/G3 |
| 10 design-partner shops | Founder | P1–P9 proof |
| Live OAuth (Fresha/Square/GCal) | v3 | ADR 0020 |
| Public API alpha GA | v3 | |
| Nordic voice in production | v3 | |
| Healing / waitlist / intake workflow depth | v3 | scaffolds exist |
| Internal flags / incidents / impersonation | v3 | portal spec |
| Native mobile rota/hiring/classes/franchise | v3 | web is SoT |
| Package credits customer UI | v3 | API exists |
| Marketing-vs-reality weekly review | Founder | ops cadence |

---

## Verification at close

- `pnpm run typecheck` ✅
- `pnpm smoke:gate3` ✅ (API + dashboard; marketing when `:5174` up)
- `pnpm test:e2e:marketing` ✅ (6 tests, marketing up)
- `pnpm test:e2e` ✅ (71 passed in last full run; skips = optional keys / marketing if down)

**v2 wrapped:** [`V2-ENGINEERING-CLOSED.md`](./V2-ENGINEERING-CLOSED.md). **Next:** founder lane or v3 — not v2 eng.
