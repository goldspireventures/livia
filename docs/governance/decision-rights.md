# Decision rights

**Status:** v1 (2026-05-07).

Who decides what. Reads with `rfc-process.md`.

## The principle

Decisions go to the person closest to the consequence. Founders don't decide what colour a button should be; designers don't decide whether to enter Germany. Decision rights below are explicit so people know when to escalate and when to act.

## At v1 (small team)

| Decision | Decider | Required RFC? | Decision mode |
|---|---|---|---|
| Architectural change (new ADR) | Head of engineering + founder | Yes | Consensus |
| Brand surface (Liv-mouth copy, voice, refusal posture) | Brand stewards (founder + design lead + content lead) | Yes for permanent change | Consensus |
| Roadmap version commitment (add/move scope between versions) | Founder + head of engineering + head of CS | Yes | Consensus |
| Cancel a planned version | Founder | Yes | Founder-decides; RFC documents reasoning |
| Pricing change | Founder + head of CS | Yes | Consensus |
| Hire / fire | Founder + relevant head | No (separate process) | Consensus |
| Hire-plan composition or order | Founder | Yes | Founder-decides; RFC documents reasoning |
| Policy change (`docs/policy/`) | Founder + counsel | Yes | Consensus + counsel review |
| Legal terms (`docs/legal/`) | Founder + counsel | Yes | Counsel-final |
| Permanent feature flag | Head of engineering | Yes | Single |
| Production deploy | Author + reviewer | No (per release-pipeline) | Single |
| Customer-facing copy on marketing site | Brand stewards | No for tactical; yes for repositioning | Consensus for repositioning |
| Investment in new vertical | Founder + head of CS | Yes | Consensus |
| Investment in new locale | Founder + head of engineering + head of CS | Yes | Consensus |
| New external integration | Head of engineering + founder | Yes | Consensus |
| Public statement on incident | Founder + counsel for SEV-SEC; founder for other SEVs | No (per incident-response.md) | Single (founder); counsel-final on SEC |
| Design-partner-programme additions | Head of CS + founder | No | Single |
| OSS contribution to external project | Author + head of engineering | No (small); yes (substantive) | Single |
| Cancel an external commitment to a customer | Founder | No (rare) | Founder-decides with CS context |
| Brand-of-Liv localisation per market | Brand stewards + per-locale character lead | Yes | Consensus + locale-lead-final |

## Roles defined

- **Founder.** The CEO. Final-authority on strategic and brand decisions.
- **Head of engineering.** Authority on technical execution; veto on technical infeasibility.
- **Head of CS** (Customer Success). Authority on customer commitments + design partners + post-sale.
- **Brand stewards.** Founder + design lead + content lead. Joint authority on brand-of-Livia + brand-of-Liv. Per ADR 0007.
- **Counsel.** External counsel (engaged firm). Final-authority on legal language; advisory elsewhere.
- **Per-locale character lead.** At v2+, the named person responsible for Liv's character in a non-English locale.

## Decision speed targets

- Tactical: same day.
- Single-decider RFC: 3 business days.
- Consensus RFC: 5 business days.
- Founder-decides RFC: 5 business days.
- Strategic (version-shift, vertical-add, locale-add): 2 weeks max.

If a decision exceeds its target, it escalates to founder for unblock.

## What founder doesn't decide (anti-bottleneck)

- Component-level UI design (designers).
- File / function naming (authors + reviewers).
- Refactoring patterns within a package (engineers).
- Eval threshold tweaks within an established framework (eval owner).
- Day-to-day customer comms within established voice + posture (CS).
- Tactical bug priority within an existing release (head of eng + head of CS).

If founder is being pulled into one of the above, that's a process bug — RFC.

## Escalation path

1. Authority-holder per the table.
2. If contested → both authority-holders + founder.
3. If still contested → founder decides + writes a "founder-override" RFC with reasoning.

## Quarterly review

Decision-rights revisited each quarter at the foundation audit. Patterns of escalation indicate misallocated authority.

## At v1.5 / v2 / v3

As the team grows:
- More heads added (Head of design; Head of AI; Head of compliance at v3).
- Some founder-held decisions delegate (locale additions delegate to Head of growth at v2; integration approvals delegate to Head of partnerships at v3).
- Counsel may be brought in-house (v3+).

The principle holds: closest-to-consequence decides; founder reserves strategic + brand + cancellation.

## Open questions

- Should design partners have explicit decision rights on their roadmap inputs? (Currently consultative; revisit if cohort outgrows the cadence.)
- Should the team get a vote on policy changes affecting them (e.g., deployment-window changes)? (Currently no; comment-only.)
