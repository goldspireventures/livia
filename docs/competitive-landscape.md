# Competitive landscape — F6

**Status:** F6 (2026-05-07). Sourced from F2 competitor walks (`.local/discovery-notes/competitors/`) and web research.

## Per-competitor profiles

(Compressed from F2 competitor file. See `.local/discovery-notes/competitors/README.md` for full per-competitor profiles.)

| Competitor | Positioning | Primary persona | Primary config | Pricing | Geo strength | EU/GDPR | AI posture | Mobile | Where they win in our cells | Where they fail |
|---|---|---|---|---|---|---|---|---|---|---|
| **Phorest** | Premium salon SW | P2a | C5, C7 | €80-200/shop/mo | IE, UK | Strong | Light bolt-on | 2.5/5 | C5, C7 owner workflows | Solo, chair-rental, multi-brand, voice, mobile-first, under-35 owner |
| **Fresha** | Free + payments + marketplace | P2b | C2, C4 | Free + 1.5-2.5% pmt | UK, EU | Passable | Generic | Best-in-class | C2, C4 solo/small | Multi-shop, chair-rental, voice, customer-belongs-to-salon model |
| **Booksy** | Barbers + beauty | Solo barber | C2 | $30-50/loc/mo | US, PL | Passable | Light | Strong consumer side | Barbershop solo + small | Multi-shop, chair-rental, voice, multi-brand, EU residency at depth |
| **Treatwell** | EU booking marketplace | Customer | Variable | Software + cmsn | UK, FR, ES, IT, DE, NL, IE | EU strong | Light | Good consumer | Marketplace-led owners | Owners who want customer-ownership |
| **Square Apt** | SMB horizontal | Solo | C1, C2 | Free + Square fees | US | Passable | Generic | Decent | Cross-vertical solo | Salon depth, chair-rental, voice, EU |
| **Mindbody** | Fitness/wellness enterprise | Studio owner | C5-C9 | $159-595+/mo | US | Weak | Some 2024 AI | Mature | Fitness + spa chains | Hair/beauty heartland, chair-rental, voice character, EU posture |
| **Timely** | Friendly UI salon SW | Single-shop owner | C4, C5 | £25-60/mo | AU, NZ, UK | Passable | Light | Decent | Single-shop UK/AU | Voice, multi-brand, chair-rental, EU depth |
| **Zenoti** | Enterprise spa/wellness | Chain ops | C8, C9 | Enterprise | US, ME | Weak | Light | Mature | Enterprise medspa, large chain | Single-shop, solo, our price tier |
| **Vagaro** | All-in-one beauty/wellness | Single-shop owner | C4, C5 | $30+/mo/loc | US | Weak | Light | Decent | US single-shop | EU presence, chair-rental, voice, modern feel |
| **Acuity** | Generic SMB scheduling | Solo professional | C1 | $20-60/mo | Global | Mixed | Generic | Decent | Generic-solo | Salon-specific workflows entirely |

## Feature × competitor matrix

Rows: 30 most-comparable capabilities (drawn from F4 feature inventory). ✅ = strong; ⚠ = present but weak; ❌ = absent or marketplace-mediated only.

| Capability | Phorest | Fresha | Booksy | Treatwell | Square | Mindbody | Timely | Zenoti | Vagaro | Acuity | **Livia** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Multi-staff calendar | ✅ | ✅ | ⚠ | ⚠ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠ | ✅ |
| Mobile-first staff app | ⚠ | ✅ | ⚠ | ❌ | ✅ | ✅ | ⚠ | ✅ | ⚠ | ⚠ | ✅ |
| Mobile-first owner cockpit | ⚠ | ⚠ | ❌ | ❌ | ⚠ | ⚠ | ❌ | ⚠ | ❌ | ❌ | ✅ |
| Voice receptionist (AI) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| WhatsApp bidirectional | ⚠ | ⚠ | ⚠ | ⚠ | ❌ | ⚠ | ❌ | ⚠ | ❌ | ❌ | ✅ |
| Per-character agent (Liv) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Chair-rental data model | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (v1.5) |
| Multi-brand portfolio rollup | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠ | ❌ | ⚠ | ❌ | ❌ | ✅ |
| Senior-with-admin role | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠ | ❌ | ❌ | ✅ |
| Refund-cap ladder | ⚠ | ❌ | ❌ | ❌ | ❌ | ⚠ | ❌ | ⚠ | ❌ | ❌ | ✅ |
| Audit log (trust-amplification surface) | ⚠ | ❌ | ❌ | ❌ | ⚠ | ⚠ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Weekly digest in voice | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| AI training review (per-decision UI) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cross-tenant intelligence (privacy-by-design) | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠ (industry benchmarks) | ❌ | ⚠ | ❌ | ❌ | ✅ (v1.5) |
| Online booking page | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Wallet pass support | ⚠ | ⚠ | ⚠ | ❌ | ⚠ | ⚠ | ❌ | ⚠ | ❌ | ❌ | ✅ |
| Deposit collection | ✅ | ✅ | ✅ | ⚠ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EU residency by default | ✅ | ⚠ | ✅ | ✅ | ❌ | ❌ | ⚠ | ❌ | ❌ | ❌ | ✅ |
| GDPR DSR self-service | ⚠ | ⚠ | ⚠ | ⚠ | ❌ | ❌ | ⚠ | ❌ | ❌ | ❌ | ✅ |
| Per-tenant phone number | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Tip-handling (per staff) | ✅ | ✅ | ✅ | ⚠ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠ | ✅ |
| Hire/promote workflows | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠ | ❌ | ⚠ | ❌ | ❌ | ✅ |
| Owner-on-holiday handoff | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Drift detection + Owner-controlled re-engagement | ⚠ (campaign-led) | ⚠ | ⚠ | ⚠ | ❌ | ⚠ | ⚠ | ⚠ | ⚠ | ❌ | ✅ |
| Marketing-as-conversation (no campaign-blast) | ❌ (campaigns) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Class booking (capacity-bound, fitness) | ❌ | ⚠ | ❌ | ⚠ | ⚠ | ✅ | ⚠ | ⚠ | ⚠ | ⚠ | v2 |
| Medspa informed consent | ⚠ | ❌ | ❌ | ❌ | ❌ | ⚠ | ❌ | ✅ | ⚠ | ❌ | v3 |
| Tattoo design proof workflow | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | v2 |
| Phorest data export broker | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Aurora-Midnight design language | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Read of the matrix:** Livia's wedge isn't any one of these alone — it's the bundle. Voice + per-character agent + chair-rental + multi-brand + Senior-with-admin + audit-log-as-trust-surface + marketing-as-conversation. None of these is impossible to build individually; together they require an architecture and a brand position no incumbent has.

## Configuration × competitor coverage matrix

Rows: 13 configurations from F1. Cells: "primary" / "secondary" / "ignored." Reveals which configurations are under-served.

| Configuration | Phorest | Fresha | Booksy | Treatwell | Square | Mindbody | Timely | Zenoti | Vagaro | Acuity |
|---|---|---|---|---|---|---|---|---|---|---|
| C1 Solo mobile | ignored | secondary | ignored | secondary | primary | ignored | ignored | ignored | secondary | primary |
| C2 Solo single-chair | secondary | primary | primary | secondary | primary | ignored | secondary | ignored | secondary | primary |
| C4 Single-shop owner+staff | primary | primary | secondary | primary | primary | secondary | primary | ignored | primary | secondary |
| C5 Single-shop with mgr | **primary** | primary | secondary | primary | secondary | primary | primary | secondary | primary | ignored |
| C6 Single-shop mature (sr-w-admin) | secondary (no role) | secondary | ignored | secondary | ignored | secondary (no role) | secondary | secondary | secondary | ignored |
| C7 Multi-shop small chain | primary | secondary | secondary | primary | ignored | primary | secondary | primary | secondary | ignored |
| C8 Multi-shop mid chain | primary | secondary | ignored | primary | ignored | primary | ignored | primary | ignored | ignored |
| C9 Multi-shop large | secondary | ignored | ignored | secondary | ignored | primary | ignored | primary | ignored | ignored |
| **C10 Chair-rental** | **ignored** | ignored | ignored | ignored | ignored | ignored | ignored | ignored | ignored | ignored |
| C11 Franchise | ignored | secondary | ignored | secondary | ignored | primary (fitness) | ignored | secondary | ignored | ignored |
| C12 Partnership | secondary | secondary | ignored | secondary | ignored | secondary | secondary | secondary | secondary | ignored |
| **C13 Multi-brand portfolio** | **ignored** | ignored | ignored | ignored | ignored | ignored | ignored | ignored | ignored | ignored |

**Wedge configurations (under-served by everyone):**
1. **C10 Chair-rental** — the dominant wedge. Phorest assumes employees; nobody serves the host.
2. **C13 Multi-brand portfolio** — same.
3. **C6 Single-shop mature with sr-w-admin role** — Phorest doesn't have the role; the senior shares the Owner login (the leak ADR 0009 closes).
4. **C12 Partnership** — passable everywhere, primary nowhere; no first-class partner-vote workflow.

## Livia's wedge per competitor (one-liner each)

- **vs Phorest:** Voice receptionist; per-character agent; chair-rental + multi-brand data model; mobile-first; under-35 owner. (Phorest still wins on chain-owner depth at scale; we close that over time.)
- **vs Fresha:** Customer-belongs-to-the-salon (vs marketplace cut); voice; multi-shop; enterprise. (Fresha still wins on free + best-in-class consumer mobile; we accept that for now.)
- **vs Booksy:** Multi-shop; chair-rental as a model (vs each renter being their own Booksy); enterprise; multi-brand; voice. (Booksy still wins on US + Polish barber consumer-side discovery.)
- **vs Treatwell:** Customer-ownership; non-marketplace model entirely. (Treatwell still wins on customer-acquisition for shops willing to pay marketplace cut.)
- **vs Square:** Salon-specific workflows + verticals; chair-rental; voice; EU residency; the entire posture. (Square still wins on cross-vertical solo + payment-stack integration.)
- **vs Mindbody:** Hair/Beauty heartland (they're fitness-led); chair-rental; voice character; EU posture; price point. (Mindbody still wins on fitness chain depth.)
- **vs Timely:** Voice; multi-brand; chair-rental; multi-shop scale. (Timely still wins on AU/NZ market presence.)
- **vs Zenoti:** Single-shop and SMB scale; price point. (Zenoti still wins on enterprise spa + medspa depth.)
- **vs Vagaro:** EU presence; modern feel; voice; chair-rental. (Vagaro still wins on US single-shop with their installed base.)
- **vs Acuity:** Salon depth entirely; chair-rental; voice; multi-staff. (Acuity is generic horizontal scheduling; we're vertical operator.)

## Where Livia is genuinely behind today

- **Chain-rollup reporting depth.** Phorest has 10+ years of report-building; we're year-1.
- **Marketplace-led customer acquisition.** Fresha + Treatwell push customers to salons; we don't (and won't, per Bet 5).
- **Fitness vertical.** Mindbody's class-booking is mature; we're v2 at earliest.
- **Enterprise depth.** Zenoti's enterprise medspa workflow is mature; we're v3 at earliest.
- **US presence.** All US-rooted competitors have US scale; we're EU-anchored.
- **Maturity on edge cases.** Phorest knows 100,000 edge cases from 10 years of operation; we'll learn ours over time.

These gaps are acknowledged and accepted — narrowing focus per F7 narrowing reflection. Each represents a future bet or an explicit "not."
