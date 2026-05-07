# Journey — P2b Host Owner × Chair-rental barbershop × Hair

**The cell.** Marcus Brennan. Host of "The Northside Barbershop" — 6 chairs, 4 chair-rental barbers (independent), 2 chairs are Marcus's own (he cuts + employs one apprentice). Currently: paper diary, Facebook DMs, weekly cash from each renter on Friday. Has tried Phorest — it assumed all 6 barbers were employees, which broke the model.

**Why this journey.** Chair-rental is the under-served wedge. No incumbent serves it well. Per F7 sequencing, this is **v1.5** (3-6 mo post-launch) but the journey is mapped now to inform F8 architecture.

## First touch

- Marcus reads about Liv on r/barbershopmanagement: a thread titled "finally a software that gets chair-rental." 30+ upvotes.
- Visits `livia.io/for/chair-rental`. Reads the page slowly — it explicitly addresses the host-vs-renter data model. He's never seen this articulated by a salon-software vendor.
- Books a 45-min concierge call.

## Sign-up & onboarding (concierge — 4 weeks)

- Marcus's tenant: hosts the building (front desk, chair occupancy, rent collection).
- Each chair-rental barber gets their own one-person tenant (their customer list, their calendar, their revenue, their data).
- Renter onboarding is a 1-on-1 conversation with each renter. Marcus introduces; concierge does the technical setup. Each renter signs:
  - Their data is theirs.
  - When they leave the shop, they take their data.
  - The host (Marcus) sees: rent paid/owed, chair occupancy windows, aggregate floor traffic. **Never** the renter's customer list, calendar internals, or revenue.
- Voice number for the shop: provisioned. Calls answered by Liv; Liv routes to the relevant barber (or takes the booking against the right barber's calendar).
- WhatsApp Business sender for the shop: provisioned. Each renter's customer DMs go to their tenant.
- Front-desk tablet kiosk: serves the host's needs (occupancy, walk-in queue) without exposing renter internals.

## First day

- Voice live. First call: a regular of one of the renters (Eoin) calls; Liv recognises the customer (Eoin's tenant), books with Eoin.
- First DM: a new customer DMs the shop's WhatsApp; Liv asks who they'd prefer; routes to the right barber.
- Marcus's host dashboard live: 6 chair occupancy bars; rent status; floor traffic count.

## First week

- 4 renters all visibly happier. Their booking-flow is theirs (customer asks for them by name, gets them; their customers are their own).
- Marcus sees a clean view of what's actually happening at the shop without intruding on what's not his.
- Friday rent collection: instead of cash exchanges, Liv sends each renter a Friday morning summary ("you owe €175 for this week"). Auto-debit option (or manual transfer).
- First "Liv was wrong" — she answered a call from a regular and routed to a barber who happened to be off that day. Liv acknowledged, offered alternative, regular accepted with another barber. Audit logged.

## First month

- Eoin (one of the renters) considers leaving for a different shop. He tests: can he take his customer list? Yes — one-click export. Can he take his Liv setup? He'd need to re-onboard at the new shop, but his customer list is his.
- This is the litmus test of the chair-rental data model. Eoin trusts the system because the test passes.
- (Eoin actually decides to stay — but the option's existence is what makes the trust possible.)

## First quarter

- Marcus's host dashboard becomes the primary tool. Before Liv, his Friday cash collection took 1.5 hours and required a notebook; now it's auto-summarised in 5 minutes.
- One renter goes on holiday for 2 weeks; Liv handles their out-of-office (incoming calls/DMs to their slot get an "[Renter] is off until [date]; would you like another barber, or to wait?").
- First chair-rental rent dispute: a renter claims he wasn't on the chair Tue (Liv has audit-log evidence he checked in). Marcus + renter resolve; Liv's audit is the source-of-truth.

## First year

- The shop adds a 5th renter — the model scales; per-renter onboarding is now ~1 hour (concierge + Marcus jointly).
- Marcus considers opening a second location (configuration graduation to multi-shop chair-rental host).
- Renewal at year-end. Marcus pays without flinching — no other software does what Liv does for chair-rental.

## What's special about this journey

- **The data model IS the product.** The strict isolation between host and renter is what every other vendor fails at.
- **The host's surface is intentionally narrow.** Marcus doesn't see what's not his. This is a feature, not a limitation.
- **Renters' trust depends on the takeaway.** The "you can leave with your data" promise is the foundation.
- **Voice + DM routing** has to be intelligent — same number, multiple barbers' tenants. Liv's per-customer + per-staff resolution is the wedge.

## Lifecycle moments designed for

- **The renter-trust moment (first month).** Renter tests the data-takeaway. Must work cleanly.
- **The first dispute (first quarter).** Audit log is the resolver.
- **The first renter departure (year 1+).** Goodbye flow — renter leaves with data; their slot becomes available; their tenant goes inactive (data retained per their request).
- **The host-side scaling moment (multi-shop chair-rental host).** F5 forward-references this for v2.
