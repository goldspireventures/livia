# Feature Cat-E — Cross-tenant intelligence

**What it is.** Insights derived from aggregating across multiple Livia tenants — "salons like yours saw a 20% no-show spike during the bank holiday weekend; here's what worked." With strict differential-privacy floor (k≥10) per F7 Bet 8 reconciliation.

**Surfaces.** Owner dashboard (insights panel); weekly digest (occasional inclusion when relevant pattern detected).

**Configurations.** Universal — but only meaningful once Livia has ≥10 tenants in a comparable peer-set (vertical × configuration × geography). Until then, surface is empty/disabled.

**Verticals.** Universal.

**Personas.** P1 Founder, P2a Owner-with-Mgr, P2b Owner-no-Mgr.

**Modalities.** Visual; passive (digest).

**Rung.** R3+ (the insight is volunteered without ask; high-trust surface).

**Dependencies.**
- Multi-tenant analytics infrastructure (per F8 ADR on cross-tenant intelligence — the privacy line)
- Differential-privacy aggregation layer
- Peer-set definition (vertical + configuration + geography + size band)
- Tenant opt-in flag (default: opt-IN with k≥10 floor — per F7 reconciliation; sub-k aggregations never surface; opt-out is a one-click action with retention 7 days for re-opt-in grace)

**Complexity.** XL.

**Sub-features.**
- Peer-set membership (auto-computed; tenant can see "you're in a peer-set of 24 salons in Dublin doing hair + beauty under 10 staff").
- Insight generation (anomaly detection + recommendation, only when k≥10 in peer-set).
- Source-of-insight transparency: "this is based on 24 anonymous Dublin hair salons matching yours" — never specific salons named, even to OWN.
- Opt-out at any time; tenant's own data does not contribute anymore (with 7-day retention to allow re-opt-in without data loss; explicit deletion at retention end).
- Per-insight feedback ("this was useful" / "this was not relevant") — feeds training for relevance model.

**Power-user / casual.** Casual default (insight panel auto-shows top 1-3 per week). Power-user can request the full peer-set view (still privacy-respecting; never per-salon).

**Accessibility.**
- Plain-language explainability (per EU AI Act): every insight states peer-set size, methodology, confidence.
- Always reversible (opt-out one click).

**The "in its own league" angle.**
- **No incumbent does this with character.** Mindbody has industry benchmarks; Phorest occasionally publishes aggregate reports. None integrated into the operating surface; none with privacy-as-design.
- **The wedge is the trust posture.** Owners share data with Livia's collective only if Livia is visibly more careful about it than they would be themselves. The k≥10 floor + opt-out grace + transparency-of-source IS the wedge.

## The bet behind this feature

Per F7 Bet 8 (reconciliation): collective intelligence with privacy-by-design is the long-game moat. Year 1: insight quality is modest (sample sizes small). Year 3: every Livia tenant has a peer-set of hundreds; the insight quality compounds. Year 5: cross-tenant intelligence is the reason new salons join — they can't get this anywhere else.

But: this is **the highest-risk surface for trust collapse.** A single privacy incident here destroys the foundation for everything else. F8 ADR on cross-tenant intelligence specifies the architectural safeguards. F9 regulatory-and-legal addresses the EU AI Act + GDPR posture.

**Default is opt-IN** (per F7 reconciliation, after F7-architect rejection of opt-OUT default). Tenants are asked at onboarding with full plain-language explanation; they can decline and still use everything else.
