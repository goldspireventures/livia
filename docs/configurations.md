# Configurations — F1 skeleton

**Status:** F1 (2026-05-07). F3 promotes this into a deep spine doc.

The 13 org-shape configurations Livia could serve. For each: definition, typical persona makeup, typical scale, geography prevalence, competitor incumbent, financial-model peculiarity, data-isolation implication, and Livia's first-pass commitment.

---

## C1 — Solo mobile

**Definition.** One practitioner, no fixed location, travels to client's home or rents space ad-hoc. Common in lash, nails, mobile beauty, mobile pet grooming, mobile PT, sports therapy.

**Persona makeup.** P2b Owner-no-Mgr only; P7 Customer. No staff, no manager, no receptionist.
**Scale.** 1 person; 5-25 bookings/week; €1k-5k/mo gross.
**Geography.** Common Ireland-wide; ~15-20% of beauty/lash/PT.
**Incumbent.** GlossGenius (US import), Vagaro, Square, often pen-and-paper or a Google Sheet.
**Financial model.** Cash + card; tax: sole-trader.
**Data isolation.** N/A — single owner is the tenant; no internal isolation.
**Livia commitment:** **v1 supported (Hair/Beauty mobile only).**

---

## C2 — Solo single-chair-shop

**Definition.** One practitioner with a fixed location (small studio, room rental, single-chair). The "I'm the entire business" archetype. Common in barbering, tattoo, brow bar, single-PT studios.

**Persona makeup.** P2b Owner-no-Mgr only; P7 Customer. No staff.
**Scale.** 1 person; 15-50 bookings/week; €3k-10k/mo gross.
**Geography.** Universal.
**Incumbent.** Square, GlossGenius, Booksy (barber).
**Financial model.** Card-led; commercial lease.
**Data isolation.** N/A.
**Livia commitment:** **v1 critical — the working-owner cell.** Liv IS the team here. R3 from day one (per F7 depth-map).

---

## C3 — Single-shop owner-only (working owner with no staff)

**Definition.** Owner runs the chair AND the business with no employees. Often a transitional state between Solo and Single-shop-with-staff. Distinct from C2 only in having a fixed location with multiple chairs but currently using one.

*Folded into C2 for F1; surfaced separately if F3 needs it.*

---

## C4 — Single-shop owner + staff (no manager)

**Definition.** One location. Owner works the chair AND manages everyone. 2-5 staff. The "I never get a day off" archetype. Common everywhere.

**Persona makeup.** P2b Owner-no-Mgr; P4a Senior STAFF (1-2); P5 Junior STAFF (0-2); occasionally P6 Receptionist part-time; P7 Customer.
**Scale.** 3-6 people; 50-200 bookings/week; €15k-50k/mo gross.
**Geography.** Most common configuration in Ireland.
**Incumbent.** Phorest (IE/UK heartland), Fresha (younger shops), Booksy (barber-led).
**Financial model.** PAYE staff; commission-or-salary; commercial lease.
**Data isolation.** Single tenant; STAFF can only see their own slate (per ADR 0009).
**Livia commitment:** **v1 critical — the heartland cell.**

---

## C5 — Single-shop owner + manager + staff

**Definition.** One location. Owner is hands-off-floor; Manager runs the day-to-day. 5-15 staff. The "I'm building a business, not a job" archetype.

**Persona makeup.** P2a Owner-with-Mgr; P3 Manager; P4a Senior STAFF (2-5); P5 Junior (1-3); P6 Receptionist (1, often).
**Scale.** 6-20 people; 200-600 bookings/week; €40k-150k/mo gross.
**Geography.** Common in Dublin, Cork, Galway; less so in market towns.
**Incumbent.** Phorest dominant; Fresha for newer shops.
**Financial model.** PAYE; commission tiers; manager bonus.
**Data isolation.** Single tenant; persona-asymmetric surfaces (hotel principle).
**Livia commitment:** **v1 critical.**

---

## C6 — Single-shop mature (with senior-with-admin)

**Definition.** As C5 but the Owner has formally promoted a Senior STAFF to Senior-with-admin (P4b) — they have ADMIN-grade authority over a defined subset (their team's rota, their service-line refunds) but remain a working stylist.

**Persona makeup.** P2a Owner-with-Mgr (or P2b for smaller mature shops); P3 Manager; **P4b Senior-with-admin** (1-2); P4a Senior STAFF (2-4); P5 Junior; P6 Receptionist.
**Scale.** 10-25 people; 400-1000 bookings/week; €80k-200k/mo gross.
**Geography.** Established Dublin/Cork salons.
**Incumbent.** Phorest (the Senior-with-admin role doesn't exist as a first-class concept — they share the Owner login, which is the leak ADR 0009 closed).
**Financial model.** As C5 plus the senior-w-admin profit share or admin stipend.
**Data isolation.** Senior-w-admin's authority is *scoped* to their team — the data model needs `staff_admin_designee` per ADR 0010.
**Livia commitment:** **v1 critical** — under-served by Phorest's role model.

---

## C7 — Multi-shop small chain (2-5 shops)

**Definition.** Same brand across 2-5 shops. Owner has Founder identity. Each shop has a Manager.

**Persona makeup.** P1 Founder (multi-shop); P3 Manager (per shop); P4a/b Senior; P5 Junior; P6 Receptionist (per shop); P7 Customer.
**Scale.** 25-100 people; 1000-3000 bookings/week; €200k-600k/mo gross.
**Geography.** Dublin chains common; Cork/Galway emerging; market-town chains rare.
**Incumbent.** Phorest (the chain story is good in their product but has rough edges around per-shop branding and cross-shop reporting).
**Financial model.** PAYE; per-shop P&L; group-level rollup; per-shop manager bonus.
**Data isolation.** Each shop is an independent tenant; Founder has OWNER membership at all (ADR 0010 first-class `currentBusinessId`).
**Livia commitment:** **v1 critical — the Founder cell.**

---

## C8 — Multi-shop mid chain (6-15 shops)

**Definition.** Established regional or country-spanning chain.

**Persona makeup.** P1 Founder; possibly OPS Director (we model as P3 ADMIN at chain-scope, F3 may revisit); P3 Manager per shop; full STAFF stack.
**Scale.** 100-300 people; 3000-10000 bookings/week; €600k-2M/mo gross.
**Geography.** Few in IE; common in UK, DACH, France. Wider EU geography.
**Incumbent.** Phorest, Treatwell, Mindbody (fitness chains), Vagaro.
**Financial model.** Multi-entity; group VAT; complex rollup.
**Data isolation.** As C7; the OPS director question needs an explicit role in F3.
**Livia commitment:** **v2** — larger ops, longer sales cycle.

---

## C9 — Multi-shop large (16+ shops)

**Definition.** True enterprise; often a PE-backed rollup or franchise umbrella.

**Persona makeup.** P1 Founder + corporate ops + per-shop Managers + STAFF.
**Scale.** 300+ people; complex.
**Geography.** Rare in Ireland; common UK/DACH/France/US.
**Incumbent.** Mindbody, Zenoti, Vagaro Pro.
**Financial model.** Enterprise.
**Data isolation.** As C7-C8 with stricter governance.
**Livia commitment:** **v3** — needs enterprise sales motion we don't have at v1.

---

## C10 — Chair-rental model

**Definition.** Host shop rents chair-space to independent stylists who run their own micro-business inside the building. Dominant in barbershop, common in lash/brow, rare in hair-salon/medspa/physio.

**Persona makeup.** Host: P2b Owner (often working as well); Guests: 2-15 chair-rental Seniors (each is effectively a P4a × C2 in their own right). No P5 Junior typically. Receptionist may serve all chairs.
**Scale.** 5-20 chairs; per-chair revenue is per-stylist, not per-shop.
**Geography.** Universal in barbershop (~30-40% of barbershops); common in lash (~25%); rare in salon (~10%).
**Incumbent.** **Almost no one fits.** Phorest assumes employee model. GlossGenius for the individual chair-renter; nothing for the host.
**Financial model.** Host charges weekly chair rent (€100-300); chair-renter keeps 100% of service revenue; sometimes a cut of retail.
**Data isolation.** **Hard problem.** The chair-renter's clients are *theirs*, not the host's. Chair-renter takes them when they leave. Yet the booking system is shared. This is a major data-model decision.
**Livia commitment:** **v1.5 (per F7 sequencing reflection).** Originally v1; honest scoping pushes the chair-rental data model to v1.5 once the heartland ships.

---

## C11 — Franchise

**Definition.** Independent franchisees operate under a master brand with brand standards, royalties, and corporate-controlled marketing. Common in fitness (F45, Anytime, Snap), uncommon in beauty/hair (some chains: Toni & Guy historically).

**Persona makeup.** Franchisor (corporate brand); Franchisee (P2a Owner of the unit); Manager + STAFF.
**Scale.** Per-unit similar to C5; franchisor sees the rollup.
**Geography.** Mostly UK/US/Europe-imported brands.
**Incumbent.** Mindbody (fitness), bespoke franchisor systems.
**Financial model.** Royalty (5-10% of revenue) + brand fund (~2%) + initial fee.
**Data isolation.** Each franchisee is a tenant; franchisor has cross-tenant *rollup* visibility but not per-customer data (defined contractually).
**Livia commitment:** **v2.**

---

## C12 — Partnership

**Definition.** Two-or-more co-owners (often founder + senior practitioner) sharing equity. Common in physio (group practice), allied health, established hair salons.

**Persona makeup.** 2+ Owners (each P2a or P2b depending on involvement); STAFF; sometimes Manager.
**Scale.** Similar to C5/C6.
**Geography.** Common in established Dublin practices.
**Incumbent.** Phorest, Cliniko (physio groups).
**Financial model.** Partner profit distribution; partner vote on big decisions; per-partner P&L by service-line.
**Data isolation.** Partners share the tenant; permissions identical or per-partner-by-agreement.
**Livia commitment:** **v1.5** — bumped from v1 after F7 sequencing reflection.

---

## C13 — Multi-brand portfolio

**Definition.** Same Founder owns *different brands* (e.g., one upmarket salon + one budget barbershop + one wellness spa) — different brand identities, different customer bases, sometimes different verticals.

**Persona makeup.** P1 Founder (multi-business); per-brand Manager; per-brand STAFF; potentially shared finance or comms team.
**Scale.** 2-10 brands; total revenue €500k-5M/mo.
**Geography.** Common in Dublin (the established beauty entrepreneur with three concepts).
**Incumbent.** **Very poorly served.** Each brand needs its own Phorest tenant; cross-brand visibility is manual.
**Financial model.** Multi-entity; group rollup; brand-isolated P&L.
**Data isolation.** **Strict brand-isolation by default** — Customer Mary at "Aurora Studio" must not be exposed at "Aurora Mews" without explicit cross-brand consent (her own + both Owners').
**Livia commitment:** **v1 supported** — the under-served Founder configuration.

---

## Configuration-shape decision summary

| Config | Livia v1 | v2 | v3 | Never |
|---|---|---|---|---|
| Solo mobile | ✓ | | | |
| Solo single-chair | ✓ critical | | | |
| Single-shop owner+staff (no mgr) | ✓ critical | | | |
| Single-shop with mgr | ✓ critical | | | |
| Single-shop mature (sr-w-admin) | ✓ critical | | | |
| Multi-shop small chain (2-5) | ✓ critical | | | |
| Multi-shop mid chain (6-15) | | ✓ | | |
| Multi-shop large (16+) | | | ✓ | |
| Chair-rental | (v1.5) | ✓ | | |
| Franchise | | ✓ | | |
| Partnership | (v1.5) | ✓ | | |
| Multi-brand portfolio | ✓ supported | | | |
