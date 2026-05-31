# Sales motion — F9

**Status:** F9 (2026-05-07), OS alignment 2026-05-31.  
**Category pitch:** People-business OS for appointment-led shops — hair is **GTM wedge**, not product ceiling ([`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](../product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md)).  
**Onboarding collateral:** [`OPERATOR-READY-PACK.md`](./OPERATOR-READY-PACK.md) — week-zero checklist + copy-paste templates for policies, leave, running late, team invite.

## Buyer vs user vs influencer per persona

| Persona | Role in buy decision | Implication |
|---|---|---|
| **P1 Founder** | Buyer (signs the contract). | Demo to Founder; sales motion centres on chain rollup, owner-on-holiday handoff, cross-shop reporting. |
| **P2a Owner-with-Mgr** | Buyer + heavy user. | Demo to Owner; bring Manager into pilot decision. |
| **P2b Owner-no-Mgr** | Buyer + only user. | Self-serve viable post-trial; concierge for migration. |
| **P3 Manager** | Influencer (often the *first* champion); not the buyer. | Manager-friendly trial UX; Manager invitation to demo; Manager testimonial materials. |
| **P4 Senior-w-admin** | Influencer post-pilot (the first staff-side promoter once they get scoped power). | Highlight the role in case studies; rare in current incumbents. |
| **P5 Staff** | User; not in buy loop. | UX must respect Staff dignity; no Staff-resentment bug stories. |
| **P6 Receptionist** | Strong influencer (in-shop champion when present); occasionally first to mention Liv. | Receptionist-friendly UX; receptionist referral programme. |
| **P7 Customer** | Indirect influencer (NPS feedback). Never sees the buy decision. | Customer experience must self-evidently elevate the **business** (not generic “salon software”). |

## Motion stages

### Stage 1 — First 10 customers (founder-led, hand-onboarded)

- Founder personally pitches. Founder personally onboards.
- Each customer is a design-partner (see `design-partner-programme.md`).
- Goal: prove the wedge motion (P2b solo Hair English-IE) and unblock the Phorest data export broker.
- Cadence: weekly 30-min calls with each customer.
- Compensation: 50% off year 1 + direct line + influence + first-100 badge.

### Stage 2 — First 50 customers (founder-led, repeatable script)

- Founder still leads sales calls. First sales hire begins shadowing.
- Script repeatable from Stage 1 learnings.
- Onboarding: hybrid concierge/self-serve; concierge for Phorest/Fresha/Booksy migrations; self-serve for greenfield (paper-and-Excel). Hand customers the **operator ready pack** so policy/leave/running-late copy is not blank on day one.
- Cadence: weekly cohort office hours; Slack community.

### Stage 3 — First 200 customers (small sales/CS team, concierge onboarding)

- 1 founder-led closer + 1 SDR + 2 CS/onboarding leads.
- Onboarding fully concierge-default for incumbent migrations; self-serve for greenfield.
- Marketing site + /demo gateway + product-led trial start to carry weight.
- Cadence: monthly cohort retro; quarterly community summit.

### Stage 4 — 200+ (PLG + sales-assisted hybrid)

- Self-serve trial primary; sales-assisted for Studio + Chain tiers (anything ≥ €149/mo).
- Onboarding: concierge as paid add-on; self-serve default.
- Sales team: 1 closer per region; 2 SDRs; 4 CS/onboarding.
- Marketing: content-led + design-partner referral.

## Demo flow

The /demo gateway IS the first-meeting tool. Sales reps start with it.

**Demo sequence (15–20 minutes):**
1. **The Tuesday morning briefing** (P1 or P2a Owner POV). 90 seconds. Sets the tone — Liv is an operator, not a chatbot.
2. **The voice receptionist** (live audio sample). 60 seconds. Sets the wedge.
3. **The cap-bound refund ladder** (P3 Manager POV). 90 seconds. Sets the role hierarchy.
4. **The audit log + "Liv was wrong" surface** (P2a Owner POV). 60 seconds. Sets the trust-amplification posture.
5. **The cross-shop rollup** (P1 Founder POV, only for chain prospects). 90 seconds.
6. **The chair-rental dashboard** (P2b Host POV, only for host prospects). 60 seconds.
7. **Q&A.** 5–10 minutes.
8. **Pilot proposal.** 2 minutes.

Demo deliberately does NOT show: Liv's chat-style inbox (we don't have a chatbot bubble; we have an agent that operates), one-off marketing campaigns (per Bet 5, we don't do these), generic settings pages.

## The contract

- **Standard terms.** EU-anchored; Irish law primary; English law fallback for UK customers.
- **GDPR DPA** included by default; no negotiation needed for SMB.
- **Data residency commitments.** Frankfurt primary; Dublin replica; never out-of-EU.
- **Right-to-be-forgotten flow** referenced and documented.
- **Easy to leave clause.** Day-1 full-fidelity export; annual prepayments refunded pro-rata on cancellation.
- **Service-credit SLA.** SLO breaches per `docs/engineering/observability-and-on-call.md` trigger automatic service credits.
- **Term.** Monthly default; annual prepay optional; 3-year commit only for chains who specifically ask.

## What we never do in sales

- No fear-based marketing ("you're losing €30k/yr to no-shows; we save you that").
- No 10× claims.
- No race-to-the-bottom on price.
- No bait-and-switch pilots.
- No cold-call spam — referrals + content + design-partner network only.
- No competitor-bashing in materials. We name competitors honestly; we describe what we do better and what they do better; we don't disparage.

## Open questions

- Founder-led capacity — at what point does the Founder need to step out of every demo? (Estimate: customer 30–50.)
- SDR vs no-SDR for Stage 3 — is content-led sufficient? (Watch demo-request rate from marketing site.)
